import { useEffect, useState } from "react";

const IP_SERVER = "192.168.25.251"
const API_BASE = `http://${IP_SERVER}:8010`;

export default function SelectCounterModal({ onSelect }) {
  const [counters, setCounters] = useState([]);

  useEffect(() => {
    fetch(`${API_BASE}/counters`)
      .then(res => res.json())
      .then(setCounters)
      .catch(err => console.error("Erro ao buscar guichês:", err));
  }, []);

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h2>Selecione seu Guichê</h2>

        {counters.length === 0 && <p>Carregando...</p>}

        {counters.map(counter => (
          <button
            key={counter.id}
            style={styles.button}
            onClick={() => onSelect(counter)}
          >
            {counter.name}
          </button>
        ))}
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(0,0,0,0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999
  },
  modal: {
    background: "#fff",
    padding: "30px",
    borderRadius: "10px",
    textAlign: "center",
    width: "300px"
  },
  button: {
    width: "100%",
    padding: "12px",
    marginTop: "10px",
    borderRadius: "8px",
    border: "none",
    background: "#4f46e5",
    color: "white",
    fontWeight: "bold",
    cursor: "pointer",
    fontSize: "1rem"
  }
};
