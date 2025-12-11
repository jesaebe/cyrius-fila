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
    <div ref={printRef} className="print-ticket" style={{opacity: 1}}>
      <div style={{ textAlign: "center", fontSize: '.8rem', margin: 0 }}>1º Cartório de Registro de Imóveis e Hipotecas de Vitória da Conquista</div>      
      <h1 style={{ 
        fontSize: "5rem", 
        textAlign: "center",
        margin: 0
      }}>
        {ticket.display_code}
      </h1>
      <div style={{ textAlign: "center", marinBottom: '5px' }}>
        <strong>{ticket.service.name}</strong><br />
        {ticket.type === "PRIORITY" ? "PRIORITÁRIA" : "NORMAL"}
      </div>
      <div style={{ textAlign: "center", fontSize: '.8rem', margin: 0 }}>{new Date(ticket.created_at).toLocaleString('pt-BR', { dateStyle: "short", timeStyle: 'medium' }).replace(',','')}</div>
    </div>
  );
}
