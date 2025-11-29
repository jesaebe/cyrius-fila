import { useEffect, useState } from "react";
import TicketPrint from "../components/TicketPrint";


// const IP_SERVER = `${import.meta.env.VITE_API_URL}:8010`
const IP_SERVER = `192.168.25.251:8010`
const API_BASE = `http://${IP_SERVER}`;
const NAMES = { NORMAL: 'Normal', PRIORITARIA: 'Prioritária' }


export default function RequestTicket() {
  const [services, setServices] = useState([]);
  const [lastTicketCreated, setLastTicketCreated] = useState(null);
  const [typeTicket, setTypeTicket] = useState(null);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    document.body.style.background = "#DDD";

    fetch(`${API_BASE}/services`).then(res => res.json()).then(setServices);
  }, []);

  const handleCreateTicket = async (id) => {
    if (!id && !type) return;

    const res = await fetch(`${API_BASE}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: id,
        type: typeTicket
      })
    });

    if (!res.ok) {
      alert("Erro ao gerar senha");
      return;
    }

    const data = await res.json();
    setLastTicketCreated(data);
    setPrinting(true);
  };

  const serviceOptions = services.map((s) => (
    <option key={s.id} value={s.id}>
      {s.name} ({s.code})
    </option>
  ));

  return (
    <>{!printing && !typeTicket && (
      <div style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        padding: "16px",
        gap: "2rem",
        boxSizing: "border-box",
      }}>
        <div style={{
          fontSize: "2rem",
          fontWeight: "bold",
          textTransform: "uppercase",
          fontFamily: "'Arial', sans-serif"

        }}>Solicite sua senha</div>
        <button style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "8vw",
          fontWeight: "bold",
          textTransform: "uppercase",
          padding: "2rem",
          borderRadius: "16px",
          border: "none",
          backgroundColor: "#723EBE",
          color: "#FFF",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
          onClick={() => { setTypeTicket('NORMAL') }} >Senha Normal</button>
        <button style={{
          width: "100%",
          height: "100%",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "8vw",
          fontWeight: "bold",
          textTransform: "uppercase",
          padding: "2rem",
          borderRadius: "16px",
          border: "none",
          backgroundColor: "#339324",
          color: "#FFF",
          boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
          cursor: "pointer",
        }}
          onClick={() => { setTypeTicket('PRIORITY') }}>
          Senha Prioritária</button>
      </div>
    )}
      {!printing && typeTicket && (
        <div style={{
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          padding: "16px",
          gap: "2rem",
          boxSizing: "border-box",
        }}>
          <div style={{
            fontSize: "2rem",
            fontWeight: "bold",
            textTransform: "uppercase",
            fontFamily: "'Arial', sans-serif"
          }}>SENHA {typeTicket == 'NORMAL' ? 'NORMAL' : 'PRIORITÁRIA'}</div>
          {services && services.map((s) => (<>
            <button style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "3rem",
              fontWeight: "bold",
              textTransform: "uppercase",
              padding: "2rem",
              borderRadius: "16px",
              border: "none",
              backgroundColor: typeTicket == "NORMAL" ? "#723EBE" : "#339324",
              color: "#FFF",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              cursor: "pointer",
            }}
              onClick={() => handleCreateTicket(s.id)}>
              {s.name}
            </button>
          </>))}
          <button style={{
              width: "100%",
              height: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              fontSize: "3rem",
              fontWeight: "bold",
              textTransform: "uppercase",
              padding: "2rem",
              borderRadius: "16px",
              border: "none",
              backgroundColor: "#9B1C1C",
              color: "#FFF",
              boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
              cursor: "pointer",
            }}
              onClick={() => setTypeTicket(null)}>
              Voltar
            </button>
        </div>
      )}
      {printing && lastTicketCreated && (
        <>
          <TicketPrint ticket={lastTicketCreated} onPrinted={() =>
            setTimeout(() => (setPrinting(false), setTypeTicket(null)), 800)} />
        </>
      )}
    </>
  );
}
