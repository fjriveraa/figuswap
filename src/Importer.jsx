import { useState } from "react";

const ALBUM = {
  FWC:{name:"FIFA World Cup",emoji:"🏆",total:20},
  CC:{name:"Coca-Cola",emoji:"🥤",total:14},
  MEX:{name:"México",emoji:"🇲🇽",total:20},
  RSA:{name:"South Africa",emoji:"🇿🇦",total:20},
  KOR:{name:"Korea Republic",emoji:"🇰🇷",total:20},
  CZE:{name:"Czechia",emoji:"🇨🇿",total:20},
  CAN:{name:"Canada",emoji:"🇨🇦",total:20},
  BIH:{name:"Bosnia-Herzegovina",emoji:"🇧🇦",total:20},
  QAT:{name:"Qatar",emoji:"🇶🇦",total:20},
  SUI:{name:"Switzerland",emoji:"🇨🇭",total:20},
  BRA:{name:"Brazil",emoji:"🇧🇷",total:20},
  MAR:{name:"Morocco",emoji:"🇲🇦",total:20},
  HAI:{name:"Haiti",emoji:"🇭🇹",total:20},
  SCO:{name:"Scotland",emoji:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",total:20},
  USA:{name:"USA",emoji:"🇺🇸",total:20},
  PAR:{name:"Paraguay",emoji:"🇵🇾",total:20},
  AUS:{name:"Australia",emoji:"🇦🇺",total:20},
  TUR:{name:"Türkiye",emoji:"🇹🇷",total:20},
  GER:{name:"Germany",emoji:"🇩🇪",total:20},
  CUW:{name:"Curaçao",emoji:"🇨🇼",total:20},
  CIV:{name:"Côte d'Ivoire",emoji:"🇨🇮",total:20},
  ECU:{name:"Ecuador",emoji:"🇪🇨",total:20},
  NED:{name:"Netherlands",emoji:"🇳🇱",total:20},
  JPN:{name:"Japan",emoji:"🇯🇵",total:20},
  SWE:{name:"Sweden",emoji:"🇸🇪",total:20},
  TUN:{name:"Tunisia",emoji:"🇹🇳",total:20},
  BEL:{name:"Belgium",emoji:"🇧🇪",total:20},
  EGY:{name:"Egypt",emoji:"🇪🇬",total:20},
  IRN:{name:"IR Iran",emoji:"🇮🇷",total:20},
  NZL:{name:"New Zealand",emoji:"🇳🇿",total:20},
  ESP:{name:"Spain",emoji:"🇪🇸",total:20},
  CPV:{name:"Cabo Verde",emoji:"🇨🇻",total:20},
  KSA:{name:"Saudi Arabia",emoji:"🇸🇦",total:20},
  URU:{name:"Uruguay",emoji:"🇺🇾",total:20},
  FRA:{name:"France",emoji:"🇫🇷",total:20},
  SEN:{name:"Senegal",emoji:"🇸🇳",total:20},
  IRQ:{name:"Iraq",emoji:"🇮🇶",total:20},
  NOR:{name:"Norway",emoji:"🇳🇴",total:20},
  ARG:{name:"Argentina",emoji:"🇦🇷",total:20},
  ALG:{name:"Algeria",emoji:"🇩🇿",total:20},
  AUT:{name:"Austria",emoji:"🇦🇹",total:20},
  JOR:{name:"Jordan",emoji:"🇯🇴",total:20},
  POR:{name:"Portugal",emoji:"🇵🇹",total:20},
  COD:{name:"Congo DR",emoji:"🇨🇩",total:20},
  UZB:{name:"Uzbekistan",emoji:"🇺🇿",total:20},
  COL:{name:"Colombia",emoji:"🇨🇴",total:20},
  ENG:{name:"England",emoji:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",total:20},
  CRO:{name:"Croatia",emoji:"🇭🇷",total:20},
  GHA:{name:"Ghana",emoji:"🇬🇭",total:20},
  PAN:{name:"Panama",emoji:"🇵🇦",total:20},
};

// ─── PARSER ───────────────────────────────────────────────────────────────────
// Expande "8-12" a [8,9,10,11,12]. Si no es un rango válido, devuelve el número solo si es válido.
function expandRange(token) {
  const rangeMatch = token.match(/^(\d+)\s*-\s*(\d+)$/);
  if (rangeMatch) {
    const start = parseInt(rangeMatch[1]);
    const end = parseInt(rangeMatch[2]);
    if (!isNaN(start) && !isNaN(end) && start <= end && end - start < 100) {
      const nums = [];
      for (let i = start; i <= end; i++) nums.push(i);
      return nums;
    }
    return [];
  }
  const n = parseInt(token);
  return isNaN(n) ? [] : [n];
}

function parseList(text) {
  const result = { missing: {}, repeated: {} };
  const ignored = []; // líneas que no se pudieron interpretar
  const outOfRange = []; // números fuera del rango válido de su selección
  let currentSection = "missing"; // si no hay encabezado explícito, asume faltantes por defecto

  const lines = text.split("\n").map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    const lower = line.toLowerCase();

    // Detectar encabezado de sección
    if (lower.includes("me falt") || lower.includes("faltantes") || lower.includes("needed") || lower.includes("missing")) {
      currentSection = "missing";
      continue;
    }
    if (lower.includes("repetida") || lower.includes("repeated") || lower.includes("doubles") || lower.includes("tengo de más") || lower.includes("disponible")) {
      currentSection = "repeated";
      continue;
    }
    if (lower.includes("descarga") || lower.includes("download") || lower.includes("http") || lower.includes("únete") || lower.includes("join") || lower.startsWith("🎴") || lower.startsWith("👤")) {
      continue;
    }

    // Acepta: "MEX: 6, 18, 19" | "🇲🇽 MEX: 6, 18, 19" (emoji antes) | "MEX 8 15 16" (sin dos puntos) | "UZB-8" (guion) | "MEX: 8-12" (rango)
    const validCodes = Object.keys(ALBUM).join("|");
    const match = line.match(new RegExp(`\\b(${validCodes})\\b\\s*[:\\-–]?\\s*(.*)`, "i"));
    if (!match) {
      ignored.push(line);
      continue;
    }

    const code = match[1].toUpperCase();
    const team = ALBUM[code];

    // Extrae números y rangos directamente del resto de la línea, sin importar el separador usado
    const rawNums = match[2] || "";
    const tokens = rawNums.match(/\d+\s*[-–]\s*\d+|\d+/g) || [];
    const numbers = [];
    for (const token of tokens) {
      const expanded = expandRange(token.replace(/\s+/g, ""));
      numbers.push(...expanded);
    }

    if (numbers.length === 0) {
      ignored.push(line);
      continue;
    }

    // Validar contra el total real de esa selección
    const validNumbers = [];
    for (const n of numbers) {
      if (n > 0 && n <= team.total) validNumbers.push(n);
      else outOfRange.push(`${code} ${n}`);
    }

    if (validNumbers.length > 0) {
      if (!result[currentSection][code]) result[currentSection][code] = [];
      result[currentSection][code].push(...validNumbers);
    }
  }

  // Deduplicar números por selección
  ["missing", "repeated"].forEach(section => {
    Object.keys(result[section]).forEach(code => {
      result[section][code] = [...new Set(result[section][code])].sort((a,b)=>a-b);
    });
  });

  return { ...result, ignored, outOfRange };
}

function buildAlbumFromParsed(parsed, baseAlbum) {
  const album = {};
  Object.entries(ALBUM).forEach(([code, team]) => {
    album[code] = {};
    for (let i = 1; i <= team.total; i++) {
      const isMissing = parsed.missing[code]?.includes(i);
      const isRepeated = parsed.repeated[code]?.includes(i);
      if (isMissing || isRepeated) {
        album[code][i] = { state: isMissing ? "missing" : "repeated", qty: 1, price: 0 };
      } else if (baseAlbum?.[code]?.[i]) {
        // Modo fusionar: lo no mencionado conserva el estado actual del usuario
        album[code][i] = baseAlbum[code][i];
      } else {
        // Modo reemplazar (o sin álbum base): comportamiento original
        album[code][i] = { state: "have", qty: 1, price: 0 };
      }
    }
  });
  return album;
}

// ─── SHARE LIST GENERATOR ─────────────────────────────────────────────────────
export function generateShareText(stickers, mode = "both", username = "") {
  const lines = ["🎴 FiguSwap — FIFA World Cup 2026"];
  if (username) lines.push(`👤 ${username}`);
  lines.push("");

  if (mode === "missing" || mode === "both") {
    const missingLines = [];
    Object.entries(stickers).forEach(([code, nums]) => {
      const team = ALBUM[code];
      const missing = Object.entries(nums).filter(([,s]) => s.state === "missing").map(([n]) => parseInt(n)).sort((a,b)=>a-b);
      if (missing.length > 0) missingLines.push(`${team?.emoji || ""} ${code}: ${missing.join(", ")}`);
    });
    if (missingLines.length > 0) {
      lines.push("❌ Me faltan:");
      lines.push(...missingLines);
      lines.push("");
    }
  }

  if (mode === "repeated" || mode === "both") {
    const repeatedLines = [];
    Object.entries(stickers).forEach(([code, nums]) => {
      const team = ALBUM[code];
      const repeated = Object.entries(nums).filter(([,s]) => s.state === "repeated").map(([n]) => parseInt(n)).sort((a,b)=>a-b);
      if (repeated.length > 0) repeatedLines.push(`${team?.emoji || ""} ${code}: ${repeated.join(", ")}`);
    });
    if (repeatedLines.length > 0) {
      lines.push("🔁 Tengo repetidas:");
      lines.push(...repeatedLines);
      lines.push("");
    }
  }

  lines.push("📱 Únete en FiguSwap:");
  lines.push(`https://figuswap-theta.vercel.app${username ? `/u/${username}` : ""}`);
  return lines.join("\n");
}

// ─── SHARE MODAL ──────────────────────────────────────────────────────────────
export function ShareModal({ stickers, username, onClose }) {
  const [mode, setMode] = useState("both");
  const [copied, setCopied] = useState(false);
  const text = generateShareText(stickers, mode, username);

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div style={{position:"fixed",inset:0,background:"#000b",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"#111827",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:480,border:"1px solid #1e2a3a",borderBottom:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontWeight:900,fontSize:18,color:"#ffd700"}}>📤 Compartir lista</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        {/* Mode selector */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
          {[["both","Faltantes + Repetidas"],["missing","Solo faltantes"],["repeated","Solo repetidas"]].map(([v,l])=>(
            <button key={v} onClick={()=>setMode(v)} style={{padding:"10px 6px",borderRadius:10,border:"1px solid",borderColor:mode===v?"#ffd700":"#1e2a3a",background:mode===v?"#ffd700":"#0a0f1e",color:mode===v?"#0a0f1e":"#9ca3af",fontWeight:700,fontSize:11,cursor:"pointer",textAlign:"center"}}>
              {l}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div style={{background:"#0a0f1e",borderRadius:10,padding:12,marginBottom:16,maxHeight:200,overflowY:"auto",fontSize:12,color:"#9ca3af",fontFamily:"monospace",lineHeight:1.6,whiteSpace:"pre-wrap"}}>
          {text}
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:10}}>
          <button onClick={copy} style={{flex:1,padding:"13px",background:copied?"#22c55e":"#1e2a3a",border:"1px solid",borderColor:copied?"#22c55e":"#374151",borderRadius:10,color:copied?"#fff":"#e8eaf6",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            {copied ? "✅ Copiado!" : "📋 Copiar"}
          </button>
          <button onClick={whatsapp} style={{flex:1,padding:"13px",background:"#14532d",border:"1px solid #22c55e",borderRadius:10,color:"#86efac",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            💬 WhatsApp
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── IMPORTER MAIN ────────────────────────────────────────────────────────────
export default function Importer({ onImport, onClose, currentAlbum }) {
  const [step, setStep] = useState("paste"); // paste | preview | done
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [mergeMode, setMergeMode] = useState("merge"); // merge (seguro, default) | replace

  const handleParse = () => {
    if (!text.trim()) { setError("Pega tu lista primero"); return; }
    const result = parseList(text);
    const totalMissing = Object.values(result.missing).reduce((s,a)=>s+a.length,0);
    const totalRepeated = Object.values(result.repeated).reduce((s,a)=>s+a.length,0);
    if (totalMissing === 0 && totalRepeated === 0) {
      setError("No se detectaron figuritas. Verifica el formato de tu lista.");
      return;
    }
    setParsed({ ...result, totalMissing, totalRepeated });
    setStep("preview");
  };

  const handleImport = () => {
    const album = buildAlbumFromParsed(parsed, mergeMode === "merge" ? currentAlbum : null);
    onImport(album);
    setStep("done");
  };

  const EXAMPLE = `Me faltan
FWC 🏆: 4
MEX 🇲🇽: 6, 18, 19
ARG 🇦🇷: 11

Repetidas
SCO 🏴󠁧󠁢󠁳󠁣󠁴󠁿: 5, 13
MAR 🇲🇦: 3`;

  // ── PASTE STEP ──
  if (step === "paste") return (
    <div style={{position:"fixed",inset:0,background:"#0a0f1e",zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{background:"#111827",borderBottom:"1px solid #1e2a3a",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>←</button>
        <span style={{fontWeight:900,fontSize:16,color:"#ffd700"}}>📋 Importar lista</span>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:16}}>
        <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontWeight:700,color:"#e8eaf6",marginBottom:8}}>¿Cómo funciona?</div>
          {[
            ["1️⃣","Abre tu app actual (figuritas.app u otra)"],
            ["2️⃣","Ve a compartir → copia tu lista de texto"],
            ["3️⃣","Pégala aquí abajo"],
            ["4️⃣","Tu álbum se llena automáticamente ✨"],
          ].map(([ic,txt])=>(
            <div key={ic} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{fontSize:16,flexShrink:0}}>{ic}</span>
              <span style={{color:"#9ca3af",fontSize:13}}>{txt}</span>
            </div>
          ))}
        </div>

        <div style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <span style={{fontWeight:700,color:"#e8eaf6",fontSize:14}}>Pega tu lista aquí:</span>
          <button onClick={()=>setText(EXAMPLE)} style={{fontSize:11,color:"#60a5fa",background:"none",border:"1px solid #1e3a5f",borderRadius:6,padding:"3px 8px",cursor:"pointer"}}>
            Ver ejemplo
          </button>
        </div>

        <textarea
          value={text}
          onChange={e=>{setText(e.target.value);setError("");}}
          placeholder={`Pega aquí tu lista...\n\nEjemplo:\nMe faltan\nFWC 🏆: 4\nMEX 🇲🇽: 6, 18, 19\n\nRepetidas\nSCO 🏴󠁧󠁢󠁳󠁣󠁴󠁿: 5, 13`}
          style={{width:"100%",boxSizing:"border-box",height:220,padding:14,borderRadius:12,border:"1px solid #1e2a3a",background:"#111827",color:"#e8eaf6",fontSize:13,outline:"none",resize:"none",fontFamily:"monospace",lineHeight:1.6}}
        />

        {error && <div style={{color:"#ef4444",fontSize:13,marginTop:8,padding:"8px 12px",background:"#1e0a0a",borderRadius:8}}>{error}</div>}

        <div style={{fontSize:11,color:"#4a5568",marginTop:8}}>
          Compatible con: figuritas.app, Panini Digital, listas de WhatsApp y cualquier formato con códigos de país
        </div>
      </div>

      <div style={{padding:"12px 16px",borderTop:"1px solid #1e2a3a",background:"#111827"}}>
        <button onClick={handleParse} disabled={!text.trim()} style={{width:"100%",padding:"14px",background:text.trim()?"linear-gradient(135deg,#ffd700,#f59e0b)":"#1e2a3a",border:"none",borderRadius:12,color:text.trim()?"#0a0f1e":"#4a5568",fontWeight:900,fontSize:16,cursor:"pointer"}}>
          Analizar lista →
        </button>
      </div>
    </div>
  );

  // ── PREVIEW STEP ──
  if (step === "preview") return (
    <div style={{position:"fixed",inset:0,background:"#0a0f1e",zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{background:"#111827",borderBottom:"1px solid #1e2a3a",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>setStep("paste")} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>←</button>
        <span style={{fontWeight:900,fontSize:16,color:"#ffd700"}}>📋 Vista previa</span>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:16}}>
        {/* Summary */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20}}>
          <div style={{background:"#0a1e0a",border:"1px solid #22c55e",borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:4}}>❌</div>
            <div style={{fontWeight:900,fontSize:28,color:"#22c55e"}}>{parsed.totalMissing}</div>
            <div style={{fontSize:12,color:"#4ade80"}}>figuritas faltantes detectadas</div>
          </div>
          <div style={{background:"#1e0f00",border:"1px solid #f97316",borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:4}}>🔁</div>
            <div style={{fontWeight:900,fontSize:28,color:"#f97316"}}>{parsed.totalRepeated}</div>
            <div style={{fontSize:12,color:"#fb923c"}}>repetidas detectadas</div>
          </div>
        </div>

        {/* Missing preview */}
        {Object.keys(parsed.missing).length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:800,color:"#ef4444",fontSize:14,marginBottom:10}}>❌ Faltantes detectadas</div>
            {Object.entries(parsed.missing).slice(0,8).map(([code,nums])=>{
              const team = ALBUM[code];
              return (
                <div key={code} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#111827",borderRadius:8,marginBottom:6}}>
                  <span style={{fontSize:18}}>{team?.emoji||"🃏"}</span>
                  <span style={{fontWeight:700,color:"#e8eaf6",flex:1,fontSize:13}}>{team?.name||code}</span>
                  <span style={{fontSize:12,color:"#ef4444"}}>{nums.join(", ")}</span>
                </div>
              );
            })}
            {Object.keys(parsed.missing).length > 8 && (
              <div style={{textAlign:"center",color:"#4a5568",fontSize:12,padding:"8px 0"}}>
                +{Object.keys(parsed.missing).length - 8} selecciones más...
              </div>
            )}
          </div>
        )}

        {/* Repeated preview */}
        {Object.keys(parsed.repeated).length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:800,color:"#f97316",fontSize:14,marginBottom:10}}>🔁 Repetidas detectadas</div>
            {Object.entries(parsed.repeated).map(([code,nums])=>{
              const team = ALBUM[code];
              return (
                <div key={code} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 12px",background:"#111827",borderRadius:8,marginBottom:6}}>
                  <span style={{fontSize:18}}>{team?.emoji||"🃏"}</span>
                  <span style={{fontWeight:700,color:"#e8eaf6",flex:1,fontSize:13}}>{team?.name||code}</span>
                  <span style={{fontSize:12,color:"#f97316"}}>{nums.join(", ")}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Líneas no reconocidas o números fuera de rango */}
        {(parsed.ignored?.length > 0 || parsed.outOfRange?.length > 0) && (
          <div style={{background:"#1e1500",border:"1px solid #fbbf24",borderRadius:12,padding:14,marginBottom:16}}>
            <div style={{fontWeight:700,color:"#fbbf24",fontSize:13,marginBottom:8}}>⚠️ Esto no se pudo importar:</div>
            {parsed.ignored?.length > 0 && (
              <div style={{fontSize:12,color:"#fde68a",marginBottom:parsed.outOfRange?.length>0?8:0}}>
                Líneas no reconocidas ({parsed.ignored.length}): {parsed.ignored.slice(0,5).join(" · ")}{parsed.ignored.length>5?"...":""}
              </div>
            )}
            {parsed.outOfRange?.length > 0 && (
              <div style={{fontSize:12,color:"#fde68a"}}>
                Números fuera de rango ({parsed.outOfRange.length}): {parsed.outOfRange.slice(0,8).join(", ")}{parsed.outOfRange.length>8?"...":""}
              </div>
            )}
          </div>
        )}

        {/* Selector de modo: evita borrar el álbum entero por accidente con una lista parcial */}
        <div style={{marginBottom:16}}>
          <div style={{fontWeight:700,color:"#e8eaf6",fontSize:13,marginBottom:8}}>¿Cómo aplicar esta lista?</div>
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <button onClick={()=>setMergeMode("merge")} style={{textAlign:"left",padding:"12px 14px",borderRadius:10,border:"1px solid",borderColor:mergeMode==="merge"?"#22c55e":"#1e2a3a",background:mergeMode==="merge"?"#0a1e0a":"#111827",cursor:"pointer"}}>
              <div style={{fontWeight:700,color:mergeMode==="merge"?"#22c55e":"#e8eaf6",fontSize:13}}>✅ Fusionar con mi álbum actual (recomendado)</div>
              <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>Solo actualiza las figuritas mencionadas en esta lista; el resto de tu álbum no cambia</div>
            </button>
            <button onClick={()=>setMergeMode("replace")} style={{textAlign:"left",padding:"12px 14px",borderRadius:10,border:"1px solid",borderColor:mergeMode==="replace"?"#ef4444":"#1e2a3a",background:mergeMode==="replace"?"#1e0a0a":"#111827",cursor:"pointer"}}>
              <div style={{fontWeight:700,color:mergeMode==="replace"?"#ef4444":"#e8eaf6",fontSize:13}}>🔄 Reemplazar todo mi álbum</div>
              <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>Lo no mencionado en la lista se marcará como "tengo" — usa esto solo si la lista es completa</div>
            </button>
          </div>
        </div>

        {mergeMode==="replace"&&(
          <div style={{background:"#0a1a2e",border:"1px solid #1e3a5f",borderRadius:12,padding:14,fontSize:13,color:"#60a5fa"}}>
            ⚠️ Esto reemplazará tu álbum actual. Las figuritas no mencionadas se marcarán como "tengo".
          </div>
        )}
      </div>

      <div style={{padding:"12px 16px",borderTop:"1px solid #1e2a3a",background:"#111827",display:"flex",gap:10}}>
        <button onClick={()=>setStep("paste")} style={{flex:1,padding:"13px",background:"transparent",border:"1px solid #1e2a3a",borderRadius:12,color:"#6b7280",fontWeight:700,cursor:"pointer"}}>
          Editar
        </button>
        <button onClick={handleImport} style={{flex:2,padding:"13px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:12,color:"#0a0f1e",fontWeight:900,fontSize:15,cursor:"pointer"}}>
          ✅ Importar al álbum
        </button>
      </div>
    </div>
  );

  // ── DONE STEP ──
  return (
    <div style={{position:"fixed",inset:0,background:"#0a0f1e",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{fontSize:64,marginBottom:16}}>🎉</div>
      <div style={{fontWeight:900,fontSize:24,color:"#ffd700",marginBottom:8,textAlign:"center"}}>¡Álbum importado!</div>
      <div style={{color:"#9ca3af",fontSize:15,textAlign:"center",marginBottom:8}}>
        <span style={{color:"#ef4444",fontWeight:700}}>{parsed.totalMissing} faltantes</span> y <span style={{color:"#f97316",fontWeight:700}}>{parsed.totalRepeated} repetidas</span> cargadas.
      </div>
      <div style={{color:"#6b7280",fontSize:13,textAlign:"center",marginBottom:32}}>
        Tu álbum digital está listo en FiguSwap.
      </div>
      <button onClick={onClose} style={{padding:"14px 32px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:14,color:"#0a0f1e",fontWeight:900,fontSize:16,cursor:"pointer"}}>
        Ver mi álbum →
      </button>
    </div>
  );
}
