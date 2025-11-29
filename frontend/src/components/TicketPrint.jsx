import React, { useEffect, useRef, useState } from "react";

export default function TicketPrint({ ticket, onPrinted }) {
  const printRef = useRef(null);
  const [printed, setPrinted] = useState(false);

  useEffect(() => {
    if (printed) return; // evita segunda impressão

    setPrinted(true);

    setTimeout(() => {
      window.print();
      if (onPrinted) onPrinted();
    }, 300);

  }, [printed, onPrinted]);

  return (
    <div ref={printRef} className="print-ticket">
      <h2 style={{ textAlign: "center", margin: 0 }}>Sua Senha</h2>
      <h1 style={{ 
        fontSize: "5rem", 
        textAlign: "center",
        margin: "10px 0"
      }}>
        {ticket.display_code}
      </h1>
      <div style={{ textAlign: "center" }}>
        <strong>{ticket.service.name}</strong><br />
        {ticket.type === "PRIORITY" ? "PRIORITÁRIA" : "NORMAL"}
      </div>
    </div>
  );
}
