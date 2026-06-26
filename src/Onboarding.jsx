import { useState } from "react";

export default function Onboarding({ onChoice, t }) {
  const [step, setStep] = useState("choice"); // choice | importing

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      {/* Logo */}
      <div style={{textAlign:"center",marginBottom:40}}>
        <div style={{fontSize:60,marginBottom:8}}>⚽</div>
        <div style={{fontWeight:900,fontSize:30,background:"linear-gradient(90deg,#ffd700,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:6}}>FiguSwitch</div>
        <div style={{color:"#6b7280",fontSize:14}}>{t?.onbSubtitle || "FIFA World Cup 2026™ · El marketplace de figuritas"}</div>
      </div>

      {/* Options */}
      <div style={{width:"100%",maxWidth:400,display:"flex",flexDirection:"column",gap:12}}>

        {/* Import from list */}
        <button
          onClick={()=>onChoice("import")}
          style={{width:"100%",padding:"20px 20px",background:"#111827",border:"2px solid #ffd700",borderRadius:16,cursor:"pointer",textAlign:"left",display:"flex",gap:16,alignItems:"center"}}
        >
          <div style={{fontSize:40,flexShrink:0}}>📋</div>
          <div>
            <div style={{fontWeight:900,fontSize:16,color:"#ffd700",marginBottom:4}}>{t?.onbImportTitle || "Importar mi lista"}</div>
            <div style={{fontSize:13,color:"#9ca3af",lineHeight:1.4}}>{t?.onbImportText || "Tengo una lista de otra app. La importo en segundos."}</div>
            <div style={{fontSize:11,color:"#22c55e",marginTop:6,fontWeight:700}}>{t?.recommended || "⚡ Recomendado — 10 segundos"}</div>
          </div>
        </button>

        {/* Scan photos */}
        <button
          onClick={()=>onChoice("scan")}
          style={{width:"100%",padding:"20px 20px",background:"#111827",border:"2px solid #3b82f6",borderRadius:16,cursor:"pointer",textAlign:"left",display:"flex",gap:16,alignItems:"center"}}
        >
          <div style={{fontSize:40,flexShrink:0}}>📸</div>
          <div>
            <div style={{fontWeight:900,fontSize:16,color:"#60a5fa",marginBottom:4}}>{t?.onbScanTitle || "Subir fotos"}</div>
            <div style={{fontSize:13,color:"#9ca3af",lineHeight:1.4}}>{t?.onbScanText || "Fotografío mis figuritas y la IA detecta automáticamente qué tengo."}</div>
            <div style={{fontSize:11,color:"#60a5fa",marginTop:6,fontWeight:700}}>{t?.withAI || "🤖 Con inteligencia artificial"}</div>
          </div>
        </button>

        {/* Start from scratch */}
        <button
          onClick={()=>onChoice("manual")}
          style={{width:"100%",padding:"20px 20px",background:"#111827",border:"2px solid #1e2a3a",borderRadius:16,cursor:"pointer",textAlign:"left",display:"flex",gap:16,alignItems:"center"}}
        >
          <div style={{fontSize:40,flexShrink:0}}>✏️</div>
          <div>
            <div style={{fontWeight:900,fontSize:16,color:"#9ca3af",marginBottom:4}}>{t?.onbManualTitle || "Empezar desde cero"}</div>
            <div style={{fontSize:13,color:"#6b7280",lineHeight:1.4}}>{t?.onbManualText || "Marco manualmente cada figurita que tengo o me falta."}</div>
          </div>
        </button>
      </div>

      <div style={{marginTop:24,fontSize:11,color:"#374151",textAlign:"center"}}>
        {t?.onbFooter || "Puedes cambiar o agregar más figuritas en cualquier momento"}
      </div>
    </div>
  );
}
