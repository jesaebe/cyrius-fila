import { useEffect, useState } from "react";
import { useCounter } from "../hooks/useCounter";
import SelectCounterModal from "../components/SelectCounterModal";

// const IP_SERVER = `${import.meta.env.VITE_API_URL}:8010`
const IP_SERVER = `192.168.25.251:8010`
const API_BASE = `http://${IP_SERVER}`;
const NAMES = { NORMAL: 'Normal', PRIORITARIA: 'Prioritária' }


export default function CallDesk() {
  const counter = useCounter();
  const [selectedCounter, setSelectedCounter] = useState(counter.get());
  const [services, setServices] = useState([]);
  const [selectedServiceCall, setSelectedServiceCall] = useState("");
  const [currentCalled, setCurrentCalled] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE}/services`)
      .then((r) => r.json())
      .then(setServices)
      .catch(console.error);
  }, [selectedCounter]);

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
  };

  const serviceOptions = services.map((s) => (
    <option key={s.id} value={s.id}>
      {s.name} ({s.code})
    </option>
  ));


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
              }} onClick={() => handleCallNext(s.id, 'NORMAL')}>
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
              }} onClick={() => handleCallNext(s.id, 'PRIORITY')}>
                {NAMES.PRIORITARIA}
              </button>
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
            background: "#ecfdf5"
          }}
        >
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
      )}
    </div>
  );
}
