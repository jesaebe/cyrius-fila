import { useEffect, useState } from "react";
import TicketPrint from "../components/TicketPrint";


// const IP_SERVER = `${import.meta.env.VITE_API_URL}:8010`
const API_BASE = `${import.meta.env.VITE_API_URL}:8010`;
const NAMES = { NORMAL: 'Normal', PRIORITARIA: 'Prioritária' }


export default function RequestTicket() {
  const [services, setServices] = useState([]);
  const [lastTicketCreated, setLastTicketCreated] = useState(null);
  const [typeTicket, setTypeTicket] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    document.body.style.background = "#DDD";

    fetch(`${API_BASE}/services`).then(res => res.json()).then((data) => {
      console.log(data.filter(d => d.id == 2 || d.id == 3 || d.id == 5));
      data = data.filter(d => d.id == 2 || d.id == 3 || d.id == 5)

      setServices(data);
    });
  }, []);

  const handleCreateTicket = async (id) => {
    if (!id && !typeTicket) return;
    if (creating) return;
    setCreating(true);

    try {
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
      console.log(data);

      setLastTicketCreated(data);
      setPrinting(true);
    } catch (e) {
      console.error("Erro ao gerar senha:", e);
    } finally {
      setCreating(false);
    }
  };

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
          {typeTicket == 'NORMAL' && services && services.map((s) => (<>
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
          {typeTicket != 'NORMAL' && (<>
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
              onClick={() => handleCreateTicket(2)}>
              Certidão Retorno
            </button>
          </>)}
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
