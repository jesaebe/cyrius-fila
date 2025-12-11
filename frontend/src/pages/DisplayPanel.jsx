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
  const [voiceEnabled, setVoiceEnabled] = useState(true);

  const dingRef = useRef(null);
  const wsRef = useRef(null);
  const lastSoundTimeRef = useRef(0);
  const lastSpokenKeyRef = useRef(null);

  // cria UMA instância do áudio
  useEffect(() => {
    const audio = new Audio(dingSoundFile);
    audio.preload = "auto";
    audio.volume = 1;
    dingRef.current = audio;
  }, []);

  const voiceEnabledRef = useRef(false);
  useEffect(() => {
    voiceEnabledRef.current = voiceEnabled;
  }, [voiceEnabled])

  const playDing = () => {
    const now = Date.now();
    if (now - lastSoundTimeRef.current < 1000) {
      return;
    }
    lastSoundTimeRef.current = now;

    const audio = dingRef.current;
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      console.log('Tocando');
      
      const p = audio.play();
      if (p && p.catch) {
        p.catch((err) => console.warn("Erro ao tocar som:", err));
      }      
    } catch (e) {
      console.warn("Erro ao tocar audio:", e);
    }
  }

  const speakTicket = (ticket) => {
    if (!voiceEnabledRef.current) return;
    console.log(!("speechSynthesis" in window));
    
    // if (!("speechSynthesis" in window)) return;

    const key = `${ticket.id}-${ticket.display_code}-${ticket.called_by.code}`;
    console.log(lastSpokenKeyRef.current == key);
    
    if (lastSpokenKeyRef.current == key) return;
    lastSpokenKeyRef.current = key;

    const utterance = new SpeechSynthesisUtterance();
    utterance.lang = "pt-BR";
    utterance.rate = 0.9; // velocidade (0.5 mais lento — 1 normal)
    utterance.pitch = 1.0;

    const code = ticket.display_code
      .split("")
      .map((c) => (/[0-9]/.test(c) ? c : `${c}`))
      .join(" ");

    utterance.text = `Senha ${code} — Guichê ${ticket.called_by.code}. ${ticket.type === 'PRIORITY' ? NAMES.PRIORITARIA : ''}`;

    try {
      console.log("Chamando Senha");
      
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("Erro no TTS:", e);
    }

  }

  useEffect(() => {
    document.body.style.background = "#DDD";
    // Carregar últimas chamadas na inicialização
    fetch(`${API_BASE}/tickets/called`)
      .then((r) => r.json())
      .then((data) => {
        setVoiceEnabled(true);
        if (data[0]) {
          setCallList(data);
          setCurrentCalled(data[0]);
          setLastCalledList(data.slice(1, 6));
        }
      })
      .catch(console.error);

    // WebSocket para atualizações em tempo real
    const ws = new WebSocket(`${API_WS}/ws/board`);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.event === "ticket_called") {
        const ticket = data.ticket;

        playDing();
        setTimeout(() => {
          speakTicket(ticket);          
        }, 1000);

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

    ws.onerror = (err) => {
      console.error("WS Error:", e);      
    }

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
