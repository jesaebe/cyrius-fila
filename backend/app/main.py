import os
from typing import List, Optional
from enum import Enum

from fastapi import (
    FastAPI,
    Depends,
    WebSocket,
    WebSocketDisconnect,
    HTTPException,
    BackgroundTasks,
)
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    DateTime,
    ForeignKey,
    Enum as SAEnum,
    func,
    text,
    case
)
from sqlalchemy.orm import sessionmaker, declarative_base, relationship, Session
from dotenv import load_dotenv

from escpos.printer import Network

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

engine = create_engine(DATABASE_URL, future=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ---------- MODELOS DB ----------


class TicketType(str, Enum):
    NORMAL = "NORMAL"
    PRIORITY = "PRIORITY"


class TicketStatus(str, Enum):
    WAITING = "AGUARDANDO"
    CALLED = "CHAMADO"
    DONE = "ATENDIDO"
    CANCELLED = "CANCELADO"


class Service(Base):
    __tablename__ = "services"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(5), nullable=False, unique=True)  # ex: "A", "B"

    tickets = relationship("Ticket", back_populates="service")


class Counter(Base):
    __tablename__ = "counters"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)
    code = Column(String(10), nullable=False, unique=True)

    tickets_called = relationship("Ticket", back_populates="called_by")


class Ticket(Base):
    __tablename__ = "tickets"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(Integer, nullable=False)  # sequencial por serviço
    display_code = Column(String(10), nullable=False)  # ex: "A001"
    type = Column(SAEnum(TicketType), nullable=False, default=TicketType.NORMAL)
    status = Column(SAEnum(TicketStatus), nullable=False, default=TicketStatus.WAITING)

    created_at = Column(DateTime(timezone=True), server_default=func.now())
    called_at = Column(DateTime(timezone=True), nullable=True)

    service_id = Column(Integer, ForeignKey("services.id"), nullable=False)
    service = relationship("Service", back_populates="tickets")

    called_by_id = Column(Integer, ForeignKey("counters.id"), nullable=True)
    called_by = relationship("Counter", back_populates="tickets_called")


def init_db():
    Base.metadata.create_all(bind=engine)


# ---------- SCHEMAS (Pydantic) ----------


class ServiceOut(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True

class ServiceTicketCount(BaseModel):    
    type: TicketType
    total_ticket: int
    class Config:
        from_attributes = True

class ServiceTicketOut(BaseModel):
    id: int
    name: str
    code: str
    tickets: Optional[List[ServiceTicketCount]] = None

    class Config:
        from_attributes = True


class CounterOut(BaseModel):
    id: int
    name: str
    code: str

    class Config:
        from_attributes = True


class TicketCreate(BaseModel):
    service_id: int
    type: TicketType


class TicketOut(BaseModel):
    id: int
    number: int
    display_code: str
    type: TicketType
    status: TicketStatus
    service: ServiceOut
    called_by: Optional[CounterOut] = None

    class Config:
        from_attributes = True


class CallNextIn(BaseModel):
    service_id: int
    counter_id: int
    type: str


# ---------- DEPENDÊNCIA DB ----------


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# ---------- GESTOR DE WEBSOCKET ----------


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        to_remove = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                to_remove.append(connection)
        for c in to_remove:
            self.disconnect(c)


manager = ConnectionManager()

# ---------- APP ----------

app = FastAPI(title="Fila de Atendimento")

origins = os.getenv("BACKEND_CORS_ORIGINS", "*")
if origins == "*":
    allow_origins = ["*"]
else:
    allow_origins = [o.strip() for o in origins.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    init_db()
    # Cria serviços padrão se não existirem
    with SessionLocal() as db:
        if db.query(Service).count() == 0:
            services = [
                Service(name="Atendimento Geral", code="A"),
                Service(name="Caixa", code="C"),
                Service(name="Informações", code="I"),
            ]
            db.add_all(services)
            db.commit()

        if db.query(Counter).count() == 0:
            counters = [
                Counter(name="Guichê 01", code="01"),
                Counter(name="Guichê 02", code="02"),
                Counter(name="Guichê 03", code="03"),
                Counter(name="Guichê 04", code="04"),
                Counter(name="Guichê 05", code="05"),
            ]
            db.add_all(counters)
            db.commit()


# ---------- ENDPOINTS REST ----------


@app.get("/services", response_model=List[ServiceOut])
def list_services(db: Session = Depends(get_db)):
    return db.query(Service).order_by(Service.name).all()

@app.get("/services-ticket", response_model=List[ServiceTicketOut])
def list_services_ticket(db: Session = Depends(get_db)):

    # retorna contagem agrupada por serviço e tipo
    counts = (
        db.query(
            Ticket.service_id,
            Ticket.type,            
            func.count().label("total")
        )
        .filter(Ticket.status == TicketStatus.WAITING, func.date(Ticket.created_at) == func.current_date(),)
        .group_by(Ticket.service_id, Ticket.type)
        .all()
    )

    # transforma em dicionário para fácil acesso
    service_map = {}
    for service_id, type, total in counts:
        service_map.setdefault(service_id, {})[type] = total

    # Agora monta saída final
    services = db.query(Service).order_by(Service.name).all()
    result = []

    for s in services:
        normal = service_map.get(s.id, {}).get(TicketType.NORMAL, 0)
        priority = service_map.get(s.id, {}).get(TicketType.PRIORITY, 0)

        result.append(
            ServiceTicketOut(
                id=s.id,
                name=s.name,
                code=s.code,
                tickets=[
                    ServiceTicketCount(type=TicketType.NORMAL, total_ticket=normal),
                    ServiceTicketCount(type=TicketType.PRIORITY, total_ticket=priority),
                ]
            )
        )

    return result

@app.get("/counters", response_model=List[CounterOut])
def list_counters(db: Session = Depends(get_db)):
    return db.query(Counter).order_by(Counter.name).all()


@app.post("/tickets", response_model=TicketOut)
def create_ticket(payload: TicketCreate, db: Session = Depends(get_db)):
    service = db.query(Service).filter(Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    # Busca o último número para o serviço
    last_number = (
        db.query(func.max(Ticket.number))
        .filter(
            Ticket.service_id == service.id,
            func.date(Ticket.created_at) == func.current_date())
        .scalar()
    )
    next_number = (last_number or 0) + 1
    display_code = f"{service.code}{next_number:03d}"

    ticket = Ticket(
        number=next_number,
        display_code=display_code,
        type=payload.type,
        status=TicketStatus.WAITING,
        service_id=service.id,
    )
    db.add(ticket)
    db.commit()
    db.refresh(ticket)

    return ticket


@app.get("/tickets/called", response_model=List[TicketOut])
def list_last_called(limit: int = 6, db: Session = Depends(get_db)):
    tickets = (
        db.query(Ticket)
        .filter(Ticket.status == TicketStatus.CALLED, func.date(Ticket.created_at) == func.current_date())
        .order_by(Ticket.called_at.desc())
        .limit(limit)
        .all()
    )
    return tickets


@app.post("/attendant/call-next", response_model=Optional[TicketOut])
def call_next(
    payload: CallNextIn,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    service = db.query(Service).filter(Service.id == payload.service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Serviço não encontrado")

    # PRIORITY primeiro, depois NORMAL, respeitando a ordem de chegada
    next_ticket = (
        db.query(Ticket)
        .filter(
            Ticket.service_id == service.id,
            Ticket.status == TicketStatus.WAITING,
            Ticket.type == payload.type,
            func.date(Ticket.created_at) == func.current_date()
        ).first()
    )

    if not next_ticket:
        return None

    next_ticket.status = TicketStatus.CALLED
    next_ticket.called_at = func.now()
    next_ticket.called_by_id = payload.counter_id
    db.commit()
    db.refresh(next_ticket)

    # Notifica os painéis conectados
    message = {
        "event": "ticket_called",
        "ticket": {
            "id": next_ticket.id,
            "display_code": next_ticket.display_code,
            "type": next_ticket.type.value,
            "service": {
                "id": next_ticket.service.id,
                "name": next_ticket.service.name,
                "code": next_ticket.service.code,
            },
            "called_by": {
                "id": next_ticket.called_by.id,
                "name": next_ticket.called_by.name,
                "code": next_ticket.called_by.code,
            },
        },
    }

    background_tasks.add_task(manager.broadcast, message)

    return next_ticket

@app.post("/attendant/repeat/{ticket_id}", response_model=TicketOut)
def repeat_call(ticket_id: int, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Senha não encontrada")

    if ticket.status != TicketStatus.CALLED:
        raise HTTPException(
            status_code=400,
            detail="Só é possível repetir uma senha já chamada."
        )

    # Atualiza timestamp para registrar nova chamada
    ticket.called_at = func.now()
    db.commit()
    db.refresh(ticket)

    # Envia atualização ao painel via websocket  

    message = {
        "event": "ticket_called",
        "ticket": {
            "id": ticket.id,
            "display_code": ticket.display_code,
            "type": ticket.type.value,
            "service": {
                "id": ticket.service.id,
                "name": ticket.service.name,
                "code": ticket.service.code,
            },
            "called_by": {
                "id": ticket.called_by.id,
                "name": ticket.called_by.name,
                "code": ticket.called_by.code,
            },
        },
    }

    background_tasks.add_task(manager.broadcast, message)

    return ticket

@app.put("/attendant/cancel/{ticket_id}", status_code=204)
def cancel_ticket(ticket_id: int, db: Session = Depends(get_db)):
    ticket = db.query(Ticket).filter(Ticket.id == ticket_id).first()

    if not ticket:
        raise HTTPException(status_code=404, detail="Senha não encontrada")
    
    # Atualiza timestamp para registrar o cancelamento
    ticket.status = TicketStatus.CANCELLED
    ticket.called_at = func.now()
    db.commit()
    db.refresh(ticket)


# ---------- WEBSOCKET PARA PAINEL ----------


@app.websocket("/ws/board")
async def websocket_board(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            # mantemos a conexão viva (se quiser no futuro receber mensagens do painel)
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


# ------------ PRINTER---------------- #
PRINTER_IP = "192.168.25.200"  # alterar para o seu IP
PRINTER_PORT = 9100

printer = Network(PRINTER_IP, PRINTER_PORT)

def print_ticket(display_code, service_name, priority=False):
    try:
        printer.set(align="center")
        printer.set(width=2, height=1, custom_size=True)
        printer.text("SENHA\n")
        printer.set(width=5, height=2,custom_size=True)
        printer.text(f"{display_code}\n\n")

        printer.set(width=1, height=1, custom_size=True)
        printer.text(f"{service_name}\n")

        if priority:
            printer.text("*** PRIORITÁRIA ***\n")

        printer.text("\n---------------------\n")
        printer.cut()
        
    except Exception as e:
        print("Erro ao imprimir:", e)

@app.post("/print")
def print_api(ticket: TicketOut):
    print_ticket(
        ticket.display_code,
        ticket.service.name,
        ticket.type == "PRIORITY"
    )
    return {"status": "printed"}
