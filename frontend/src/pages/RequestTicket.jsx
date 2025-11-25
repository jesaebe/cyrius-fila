import { useEffect, useState } from "react";

// const IP_SERVER = `${import.meta.env.VITE_API_URL}:8010`
const IP_SERVER = `192.168.25.251:8010`
const API_BASE = `http://${IP_SERVER}`;
const NAMES = { NORMAL: 'Normal', PRIORITARIA: 'Prioritária' }


export default function RequestTicket() {
  const [services, setServices] = useState([]);
  const [lastTicketCreated, setLastTicketCreated] = useState(null);

  useEffect(() => {
    document.body.style.background = "#DDD";

    fetch(`${API_BASE}/services`).then(res => res.json()).then(setServices);
  }, []);

  const handleCreateTicket = async (id, type) => {    
    if (!id && !type) return;

    const res = await fetch(`${API_BASE}/tickets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: id,
        type: type
      })
    });

    if (!res.ok) {
      alert("Erro ao gerar senha");
      return;
    }

    const data = await res.json();
    setLastTicketCreated(data);
  };

  const serviceOptions = services.map((s) => (
    <option key={s.id} value={s.id}>
      {s.name} ({s.code})
    </option>
  ));

  return (
    <div
      style={{
        borderRadius: "12px",
        background: "#ffffff",
        padding: "16px",
        boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
      }}
    >
      <h2>Gerar Senha</h2>
      {services && (
        services.map((s) => (
          <><div key={s.id} style={{
            marginBottom: "20px",
          }}>
            <div style={{
              fontSize: "1.5rem",
              fontWeight: "bold",
            }}>{s.name}</div>

            <div style={{
              display: "flex",
              gap: "1rem",
            }}>
              <button style={{
                marginTop: "8px",
                padding: "10px",
                borderRadius: "8px",
                border: "none",
                background: "#723EBE",
                color: "#ffffff",
                fontWeight: "bold",
                cursor: "pointer",
                fontSize: "2rem",
                width: "100%",
              }} onClick={() => handleCreateTicket(s.id, 'NORMAL')}>
                {NAMES.NORMAL}
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
              }} onClick={() => handleCreateTicket(s.id, 'PRIORITY')}>
                {NAMES.PRIORITARIA}
              </button>
            </div>
          </div>
          </>
        ))
      )}

      {lastTicketCreated && (
        <div
          style={{
            marginTop: "16px",
            padding: "12px",
            borderRadius: "8px",
            background: "#e0f2fe"
          }}
        >
          <strong>Senha gerada:</strong>{" "}
          <span style={{ fontSize: "1.5rem" }}>
            {lastTicketCreated.display_code}
          {" "}
          ({lastTicketCreated.type === "PRIORITY" ? "Prioritária" : "Normal"}
          )</span>
          <br />
          <strong>Serviço:</strong> {lastTicketCreated.service.name}
        </div>
      )}
    </div>
  );
}
