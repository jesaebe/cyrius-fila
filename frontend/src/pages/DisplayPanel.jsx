import { useEffect, useState, useRef } from "react";
import dingSoundFile from "../assets/alert.mp3";

// const IP_SERVER = `${import.meta.env.VITE_API_URL}:8010`
const API_BASE = `${import.meta.env.VITE_API_URL}:8010`;
const API_WS = `${import.meta.env.VITE_API_WS}:8010`;

const NAMES = { NORMAL: 'Normal', PRIORITARIA: 'Prioritária' }

export default function DisplayPanel() {
  const [callList, setCallList] = useState([]);
  const [currentCalled, setCurrentCalled] = useState({
    id: 0,
    display_code: "0000",
    type: "",
    service: "",
    called_by: { code: "00" }
  });
  const [lastCalledList, setLastCalledList] = useState([]);

  const dingRef = useRef(null);

  // cria UMA instância do áudio
  useEffect(() => {
    const audio = new Audio(dingSoundFile);
    audio.preload = "auto";
    audio.volume = 1;
    dingRef.current = audio;
  }, []);


  useEffect(() => {
    const speakText = (text) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "pt-BR";
      utterance.rate = 0.9; // velocidade (0.5 mais lento — 1 normal)
      speechSynthesis.speak(utterance);
    };

    document.body.style.background = "#DDD";
    // Carregar últimas chamadas na inicialização
    fetch(`${API_BASE}/tickets/called`)
      .then((r) => r.json())
      .then(setCallList)
      .catch(console.error);

    // WebSocket para atualizações em tempo real
    const ws = new WebSocket(`${API_WS}/ws/board`);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      // const dingSound = new Audio(dingSoundFile);
      // dingSound.volume = 0.9; // ajuste se quiser mais baixo ou alto

      if (data.event === "ticket_called") {
        const ticket = data.ticket;

        // 🔊 Ding dong
        // dingSound.currentTime = 0;
        // dingSound.play().catch(() => { });

        const ding = dingRef.current;
        if (ding) {
          try {
            // garante que sempre comece do início
            ding.pause();
            ding.currentTime = 0;
            const playPromise = ding.play();
            if (playPromise && playPromise.catch) {
              playPromise.catch((err) =>
                console.log("Erro ao tocar som:", err)
              );
            }
          } catch (e) {
            console.log("Erro no áudio:", e);
          }
        }

        //🧠 Transformando código em leitura verbal
        const code = ticket.display_code
          .split("")
          .map((c) => (/[0-9]/.test(c) ? c : `${c}`))
          .join(" ");

        const spokenText = `Senha ${code} — Guichê ${ticket.called_by.code}. ${ticket.type === 'PRIORITY' ? NAMES.PRIORITARIA : ''}`;

        // 👄 Fala a senha
        speakText(spokenText);

        setCurrentCalled(ticket);
        setCallList((prev) => {
          const newList = [
            {
              id: ticket.id,
              display_code: ticket.display_code,
              type: ticket.type,
              service: ticket.service,
              called_by: ticket.called_by
            },
            ...prev
          ];
          console.log(newList.slice(1, 6));
          setLastCalledList(newList.slice(1, 6));
          return newList;
        });
      }
    };

    // mantemos conexão mandando "ping"
    const interval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send("ping");
      }
    }, 30000);

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  return (
    <div
      style={{
        background: "#DDD",
        color: "#000",
        padding: "16px",
      }}
    >
      <h2 style={{ marginTop: 0 }}>Painel de Chamadas</h2>
      {currentCalled && (
        <div
          key={currentCalled.id}
          style={{
            padding: "12px",
            marginBottom: "2rem",
            borderRadius: "10px",
            background:
              currentCalled.type === "PRIORITY" ? "#339324" : "#723EBE",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "10rem"
          }}
        >
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFF",
          }}>
            <div style={{ fontSize: "2.5rem" }}>Senha</div>
            <div style={{ fontSize: "25vw", fontWeight: "bold" }}>
              {currentCalled.display_code}
            </div>
            <div style={{ fontSize: "2.5rem" }}>{currentCalled.service.name}</div>
          </div>

          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFF",
          }}>
            <div style={{ fontSize: "2.5rem" }}>Guichê</div>
            <div style={{ fontSize: "25vw", fontWeight: "bold" }}>
              {currentCalled.called_by.code}
            </div>
            <div style={{ fontSize: "2.5rem" }}>
              {currentCalled.type === "PRIORITY" ? NAMES.PRIORITARIA : NAMES.NORMAL}
            </div>
          </div>
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
          gap: "12px"
        }}
      >
        {lastCalledList.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "12px",
              borderRadius: "10px",
              background:
                t.type === "PRIORITY" ? "#339324" : "rgba(31,41,55,0.9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "2rem",
              color: "#FFF"

            }}
          >
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{ fontSize: "1.2vw" }}>Senha</div>

              <div style={{ fontSize: "4.5vw", fontWeight: "bold" }}>
                {t.display_code}
              </div>
              <div style={{ fontSize: "1.2vw" }}>{t.service.name}</div>
            </div>
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <div style={{ fontSize: "1.2vw" }}>Guichê</div>
              <div style={{ fontSize: "4.5vw", fontWeight: "bold" }}>
                {t.called_by.code}
              </div>
              <div style={{ fontSize: "1.2vw" }}>
                {t.type === "PRIORITY" ? NAMES.PRIORITARIA : NAMES.NORMAL}
              </div>
            </div>
          </div>
        ))}
        {lastCalledList.length === 0 && (
          <div style={{ gridColumn: "1 / -1" }}>Nenhuma senha chamada ainda.</div>
        )}
      </div>
    </div>
  );
}
