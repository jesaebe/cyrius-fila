import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import RequestTicket from "./pages/RequestTicket";
import CallDesk from "./pages/CallDesk";
import DisplayPanel from "./pages/DisplayPanel";

export default function App() {
  return (
    <BrowserRouter style={{background: "#723EBE"}}>
      {/* <nav style={{ padding: 10, background: "#ddd" }}>
        <Link to="/request">Solicitar Senha</Link> |{" "}
        <Link to="/call">Chamada</Link> |{" "}
        <Link to="/panel">Painel</Link>
      </nav> */}

      <Routes>
        <Route path="/request" element={<RequestTicket />} />
        <Route path="/call" element={<CallDesk />} />
        <Route path="/panel" element={<DisplayPanel />} />
      </Routes>
    </BrowserRouter>
  );
}


// import React, { useEffect, useState } from "react";

// const IP_SERVER = "192.168.25.19"
// const API_BASE = `http://${IP_SERVER}:8010`;

// function App() {
//   const [services, setServices] = useState([]);
//   const [selectedServiceTicket, setSelectedServiceTicket] = useState("");
//   const [selectedType, setSelectedType] = useState("NORMAL");
//   const [lastTicketCreated, setLastTicketCreated] = useState(null);

//   const [selectedServiceCall, setSelectedServiceCall] = useState("");
//   const [currentCalled, setCurrentCalled] = useState(null);
//   const [lastCalledList, setLastCalledList] = useState([]);

//   useEffect(() => {
//     fetch(`${API_BASE}/services`)
//       .then((r) => r.json())
//       .then(setServices)
//       .catch(console.error);
//   }, []);

//   useEffect(() => {
//     // Carregar últimas chamadas na inicialização
//     fetch(`${API_BASE}/tickets/called`)
//       .then((r) => r.json())
//       .then(setLastCalledList)
//       .catch(console.error);

//     // WebSocket para atualizações em tempo real
//     const ws = new WebSocket(`ws://${IP_SERVER}:8010/ws/board`);

//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       if (data.event === "ticket_called") {
//         const ticket = data.ticket;
//         setCurrentCalled(ticket);
//         setLastCalledList((prev) => {
//           const newList = [
//             {
//               id: ticket.id,
//               display_code: ticket.display_code,
//               type: ticket.type,
//               service: ticket.service
//             },
//             ...prev
//           ];
//           return newList.slice(0, 10);
//         });
//       }
//     };

//     // mantemos conexão mandando "ping"
//     const interval = setInterval(() => {
//       if (ws.readyState === WebSocket.OPEN) {
//         ws.send("ping");
//       }
//     }, 30000);

//     return () => {
//       clearInterval(interval);
//       ws.close();
//     };
//   }, []);

//   const handleCreateTicket = async (e) => {
//     e.preventDefault();
//     if (!selectedServiceTicket) return;

//     const res = await fetch(`${API_BASE}/tickets`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         service_id: Number(selectedServiceTicket),
//         type: selectedType
//       })
//     });

//     if (!res.ok) {
//       alert("Erro ao gerar senha");
//       return;
//     }

//     const data = await res.json();
//     setLastTicketCreated(data);
//   };

//   const handleCallNext = async (e) => {
//     e.preventDefault();
//     if (!selectedServiceCall) return;

//     const res = await fetch(`${API_BASE}/attendant/call-next`, {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         service_id: Number(selectedServiceCall)
//       })
//     });

//     if (!res.ok) {
//       alert("Erro ao chamar próxima senha");
//       return;
//     }

//     const data = await res.json();
//     if (!data) {
//       alert("Não há senhas na fila para este serviço.");
//       return;
//     }

//     // currentCalled será atualizado também via WebSocket, mas
//     // atualizamos aqui para resposta imediata do atendente
//     setCurrentCalled(data);
//   };

//   const serviceOptions = services.map((s) => (
//     <option key={s.id} value={s.id}>
//       {s.name} ({s.code})
//     </option>
//   ));

//   return (
//     <div
//       style={{
//         minHeight: "100vh",
//         display: "grid",
//         gridTemplateColumns: "1fr 1fr",
//         gridTemplateRows: "auto 1fr",
//         gap: "16px",
//         padding: "16px",
//         boxSizing: "border-box",
//         fontFamily: "system-ui, sans-serif",
//         background: "#f3f4f6"
//       }}
//     >
//       {/* Geração de senha */}
//       <section
//         style={{
//           gridColumn: "1 / 2",
//           background: "#ffffff",
//           borderRadius: "12px",
//           padding: "16px",
//           boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
//         }}
//       >
//         <h2>Gerar Senha</h2>
//         <form
//           onSubmit={handleCreateTicket}
//           style={{ display: "flex", flexDirection: "column", gap: "8px" }}
//         >
//           <label>
//             Serviço:
//             <select
//               value={selectedServiceTicket}
//               onChange={(e) => setSelectedServiceTicket(e.target.value)}
//               style={{ width: "100%", padding: "6px", marginTop: "4px" }}
//             >
//               <option value="">Selecione um serviço</option>
//               {serviceOptions}
//             </select>
//           </label>

//           <label>
//             Tipo de senha:
//             <select
//               value={selectedType}
//               onChange={(e) => setSelectedType(e.target.value)}
//               style={{ width: "100%", padding: "6px", marginTop: "4px" }}
//             >
//               <option value="NORMAL">Normal</option>
//               <option value="PRIORITY">Prioritária</option>
//             </select>
//           </label>

//           <button
//             type="submit"
//             style={{
//               marginTop: "8px",
//               padding: "10px",
//               borderRadius: "8px",
//               border: "none",
//               background: "#2563eb",
//               color: "#ffffff",
//               fontWeight: "bold",
//               cursor: "pointer"
//             }}
//           >
//             Gerar
//           </button>
//         </form>

//         {lastTicketCreated && (
//           <div
//             style={{
//               marginTop: "16px",
//               padding: "12px",
//               borderRadius: "8px",
//               background: "#e0f2fe"
//             }}
//           >
//             <strong>Senha gerada:</strong>{" "}
//             <span style={{ fontSize: "1.5rem" }}>
//               {lastTicketCreated.display_code}
//             </span>{" "}
//             ({lastTicketCreated.type === "PRIORITY" ? "Prioritária" : "Normal"}
//             )
//             <br />
//             Serviço: {lastTicketCreated.service.name}
//           </div>
//         )}
//       </section>

//       {/* Painel do atendente */}
//       <section
//         style={{
//           gridColumn: "2 / 3",
//           background: "#ffffff",
//           borderRadius: "12px",
//           padding: "16px",
//           boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
//         }}
//       >
//         <h2>Painel do Atendente</h2>
//         <form
//           onSubmit={handleCallNext}
//           style={{ display: "flex", flexDirection: "column", gap: "8px" }}
//         >
//           <label>
//             Serviço:
//             <select
//               value={selectedServiceCall}
//               onChange={(e) => setSelectedServiceCall(e.target.value)}
//               style={{ width: "100%", padding: "6px", marginTop: "4px" }}
//             >
//               <option value="">Selecione um serviço</option>
//               {serviceOptions}
//             </select>
//           </label>

//           <button
//             type="submit"
//             style={{
//               marginTop: "8px",
//               padding: "10px",
//               borderRadius: "8px",
//               border: "none",
//               background: "#16a34a",
//               color: "#ffffff",
//               fontWeight: "bold",
//               cursor: "pointer"
//             }}
//           >
//             Chamar próxima senha
//           </button>
//         </form>

//         {currentCalled && (
//           <div
//             style={{
//               marginTop: "16px",
//               padding: "12px",
//               borderRadius: "8px",
//               background: "#ecfdf5"
//             }}
//           >
//             <h3>Senha atual chamada</h3>
//             <div style={{ fontSize: "2rem", fontWeight: "bold" }}>
//               {currentCalled.display_code}
//             </div>
//             <div>
//               Serviço: {currentCalled.service.name} ({currentCalled.service.code})
//             </div>
//             <div>
//               Tipo:{" "}
//               {currentCalled.type === "PRIORITY" ? "Prioritária" : "Normal"}
//             </div>
//           </div>
//         )}
//       </section>

//       {/* Painel de TV */}
//       <section
//         style={{
//           gridColumn: "1 / 3",
//           background: "#111827",
//           color: "#f9fafb",
//           borderRadius: "12px",
//           padding: "16px",
//           boxShadow: "0 2px 12px rgba(0,0,0,0.3)"
//         }}
//       >
//         <h2 style={{ marginTop: 0 }}>Painel de Chamadas</h2>
//         <div
//           style={{
//             display: "grid",
//             gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
//             gap: "12px"
//           }}
//         >
//           {lastCalledList.map((t) => (
//             <div
//               key={t.id}
//               style={{
//                 padding: "12px",
//                 borderRadius: "10px",
//                 background:
//                   t.type === "PRIORITY" ? "#9b1c1c" : "rgba(31,41,55,0.9)",
//                 display: "flex",
//                 flexDirection: "column",
//                 alignItems: "center",
//                 justifyContent: "center"
//               }}
//             >
//               <div style={{ fontSize: "1.8rem", fontWeight: "bold" }}>
//                 {t.display_code}
//               </div>
//               <div style={{ fontSize: "0.9rem" }}>{t.service.name}</div>
//               <div style={{ fontSize: "0.8rem", opacity: 0.8 }}>
//                 {t.type === "PRIORITY" ? "Prioritária" : "Normal"}
//               </div>
//             </div>
//           ))}
//           {lastCalledList.length === 0 && (
//             <div style={{ gridColumn: "1 / -1" }}>Nenhuma senha chamada ainda.</div>
//           )}
//         </div>
//       </section>
//     </div>
//   );
// }

// export default App;
