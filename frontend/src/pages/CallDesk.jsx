import { useEffect, useState } from "react";
import { useCounter } from "../hooks/useCounter";
import SelectCounterModal from "../components/SelectCounterModal";

// const IP_SERVER = `${import.meta.env.VITE_API_URL}:8010`

const API_BASE = `${import.meta.env.VITE_API_URL}:8010`;
const NAMES = { NORMAL: 'Normal', PRIORITARIA: 'Prioritária' }


export default function CallDesk() {
  const counter = useCounter();
  const [selectedCounter, setSelectedCounter] = useState(counter.get());
  const [services, setServices] = useState([]);
  const [selectedServiceCall, setSelectedServiceCall] = useState("");
  const [currentCalled, setCurrentCalled] = useState(null);

  useEffect(() => {
    loadTickets();
  }, [selectedCounter]);
  
  const loadTickets = () => {    
    fetch(`${API_BASE}/services-ticket`)
      .then((r) => r.json())
      .then(setServices)
      .catch(console.error);
  }
  const handleCallNext = async (id, type) => {
    const res = await fetch(`${API_BASE}/attendant/call-next`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: id,
        counter_id: selectedCounter.id,
        type: type
      })
    });

    if (!res.ok) {
      alert("Erro ao chamar próxima senha");
      return;
    }

    const data = await res.json();
    if (!data) {
      alert("Não há senhas na fila para este serviço.");
      return;
    }

    // currentCalled será atualizado também via WebSocket, mas
    // atualizamos aqui para resposta imediata do atendente
    setCurrentCalled(data);
    loadTickets();
  };

  const callAgainTicket = async (ticketId) => {
    await fetch(`${API_BASE}/attendant/repeat/${ticketId}`, {
      method: "POST"
    });
  }

  const cancelTicket = async (ticketId) => {
    const res = await fetch(`${API_BASE}/attendant/cancel/${ticketId}`, {
      method: "PUT"
    });

    if (res.status == 204){
      alert("Senha Cancelada com sucesso!");
      setCurrentCalled(null);
      return
    }
  }

  return (

    <div
      style={{
        gridColumn: "2 / 3",
        background: "#ffffff",
        borderRadius: "12px",
        padding: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}
    >
      <h2>Painel do Atendente</h2>
      {!selectedCounter && (
        <SelectCounterModal onSelect={(c) => { counter.set(c); setSelectedCounter(c); }} />
      )}
      <div style={{
        display: "flex",
        gap: "1rem",
      }}>
        <div style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          width: "100%",
        }}>{NAMES.NORMAL}</div>
        <div style={{
          fontSize: "1.5rem",
          fontWeight: "bold",
          width: "100%",
        }}>{NAMES.PRIORITARIA}</div>
      </div>
      {services && (
        services.map((s) => (
          <><div key={s.id} style={{
            marginBottom: "20px",
          }}>

            <div style={{
              display: "flex",
              gap: "1rem",
            }}>

              {s.tickets.map((t) => (
                <button style={{
                  marginTop: "8px",
                  padding: "10px",
                  borderRadius: "8px",
                  border: "none",
                  background: t.type == "NORMAL" ? "#723EBE" : "#339324",
                  color: "#ffffff",
                  fontWeight: "bold",
                  cursor: "pointer",
                  fontSize: "2rem",
                  width: "100%",
                }} onClick={() => handleCallNext(s.id, t.type)}>
                  {s.name} ({t.total_ticket})
                </button>
              ))}
            </div>
          </div>
          </>
        ))
      )}

      {currentCalled && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "8px",
            background: "#ecfdf5",
            display: "flex"
          }}
        >
          <div style={{ width: "100%" }}>
            <h3>Senha atual chamada</h3>
            <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
              {currentCalled.display_code}
            </div>
            <div>
              Serviço: {currentCalled.service.name} ({currentCalled.service.code})
            </div>
            <div>
              Tipo:{" "}
              {currentCalled.type === "PRIORITY" ? NAMES.PRIORITARIA : NAMES.NORMAL}
            </div>
          </div>
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1rem" }}>
            <button style={{
              marginTop: "8px",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: "#245a93",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "2rem",
              width: "100%",
            }} onClick={() => callAgainTicket(currentCalled.id)}>
              Chamar Novamente
            </button>
            <button style={{
              marginTop: "8px",
              padding: "10px",
              borderRadius: "8px",
              border: "none",
              background: "#9B1C1C",
              color: "#ffffff",
              fontWeight: "bold",
              cursor: "pointer",
              fontSize: "2rem",
              width: "100%",
            }} onClick={() => cancelTicket(currentCalled.id)}>            
              Cancelar Senha
            </button>

          </div>
        </div>
      )}
    </div>
  );
}
