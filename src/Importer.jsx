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
  const result = { missing: {}, repeated: {}, quantities: {} };
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

    // Acepta: "MEX: 6, 18, 19" | "🇲🇽 MEX: 6, 18, 19" (emoji antes) | "MEX 8 15 16" (sin dos puntos)
    // "UZB-8" (guion) | "MEX: 8-12" (rango) | "#MEX18 (x1)" (número PEGADO al código, sin separador)
    // Fix: sin la bandera "i" (insensible a mayúsculas) — los códigos reales de selección
    // siempre vienen en MAYÚSCULAS en cualquier formato que hemos visto. Con "i" activado,
    // la palabra "Usa" dentro del título del álbum ("Usa Méx Can 26") se confundía con el
    // código real "USA", generando una entrada falsa "USA: 26" marcada como fuera de rango.
    const validCodes = Object.keys(ALBUM).join("|");
    // Fix: se quitó el \b de CIERRE después del código — un \b exige que lo siguiente sea un
    // carácter "no-palabra", pero un dígito SÍ cuenta como "palabra" en regex. Por eso "MEX18"
    // (número pegado sin espacio, como lo exportan varias apps) nunca hacía match: no hay límite
    // de palabra real entre "X" y "1". El \b de apertura se conserva, para no matchear "XMEX"
    // como si fuera el código MEX dentro de otra palabra más larga.
    const match = line.match(new RegExp(`\\b(${validCodes})\\s*[:\\-–]?\\s*(.*)`));
    if (!match) {
      ignored.push(line);
      continue;
    }

    const code = match[1].toUpperCase();
    const team = ALBUM[code];

    // Fix: "(x4)" / "x4" es la CANTIDAD de esa repetida, no una figurita distinta. Si no se
    // separa antes de buscar números, "#RSA12 (x4)" generaba dos entradas falsas: la #12 real
    // Y una #4 inventada (leída de la cantidad). Se extrae aparte y se quita de la línea antes
    // de buscar el número real de la figurita.
    let rest = match[2] || "";
    let qty = 1;
    const qtyMatch = rest.match(/\(?\s*x\s*(\d+)\s*\)?/i);
    if (qtyMatch) {
      qty = parseInt(qtyMatch[1]) || 1;
      rest = rest.replace(qtyMatch[0], "");
    }

    // Extrae números y rangos directamente del resto de la línea, sin importar el separador usado
    const rawNums = rest;
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
      // Guarda la cantidad real detectada (si la había) para aplicarla luego en buildAlbumFromParsed
      // en vez de asumir siempre 1 — así "x4" se refleja como 4 disponibles, no solo "repetida".
      if (qtyMatch) {
        if (!result.quantities[code]) result.quantities[code] = {};
        for (const n of validNumbers) result.quantities[code][n] = qty;
      }
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
        // Fix: usa la cantidad real detectada en el texto ("x4" → 4 disponibles) cuando existe,
        // en vez de asumir siempre 1 — antes esto se perdía aunque la lista sí la mencionara.
        const realQty = isRepeated ? (parsed.quantities?.[code]?.[i] || 1) : 1;
        album[code][i] = { state: isMissing ? "missing" : "repeated", qty: realQty, price: 0 };
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
// inviteEmail (opcional): si se pasa, el link de invitación usa el mecanismo real de invitación
// (?invite=email), el mismo que ya procesa App.jsx al abrir la app. Antes este link apuntaba a
// una ruta /u/username que nunca existió en la app; con solo el username no había forma de generar
// un link funcional, por eso ahora se prioriza inviteEmail cuando está disponible.
export function generateShareText(stickers, mode = "both", username = "", inviteEmail = "", t = {}) {
  const lines = ["🎴 FiguSwitch — FIFA World Cup 2026"];
  if (username) lines.push(`👤 ${username}`);
  lines.push("");

  if (mode === "missing" || mode === "both") {
    const missingLines = [];
    // Fix: el orden de Object.entries() sobre un álbum cargado desde la base de datos no
    // está garantizado que coincida con el orden de páginas — se ordena explícito aquí,
    // igual que ya se hace en Red para los matches de intercambio.
    Object.entries(stickers).sort((a,b)=>Object.keys(ALBUM).indexOf(a[0])-Object.keys(ALBUM).indexOf(b[0])).forEach(([code, nums]) => {
      const team = ALBUM[code];
      const missing = Object.entries(nums).filter(([,s]) => s.state === "missing").map(([n]) => parseInt(n)).sort((a,b)=>a-b);
      if (missing.length > 0) missingLines.push(`${team?.emoji || ""} ${code}: ${missing.join(", ")}`);
    });
    if (missingLines.length > 0) {
      lines.push(t.shareMissingHeader || "❌ I need:");
      lines.push(...missingLines);
      lines.push("");
    }
  }

  if (mode === "repeated" || mode === "both") {
    const repeatedLines = [];
    Object.entries(stickers).sort((a,b)=>Object.keys(ALBUM).indexOf(a[0])-Object.keys(ALBUM).indexOf(b[0])).forEach(([code, nums]) => {
      const team = ALBUM[code];
      const repeated = Object.entries(nums).filter(([,s]) => s.state === "repeated").map(([n]) => parseInt(n)).sort((a,b)=>a-b);
      if (repeated.length > 0) repeatedLines.push(`${team?.emoji || ""} ${code}: ${repeated.join(", ")}`);
    });
    if (repeatedLines.length > 0) {
      lines.push(t.shareRepeatedHeader || "🔁 I have duplicates:");
      lines.push(...repeatedLines);
      lines.push("");
    }
  }

  lines.push(t.joinFiguswap || "📱 Join me on FiguSwitch:");
  lines.push(inviteEmail ? `${window.location.origin}?invite=${encodeURIComponent(inviteEmail)}` : window.location.origin);
  return lines.join("\n");
}

// ─── TEXTO RESUMIDO PARA ESTADO DE WHATSAPP ──────────────────────────────────
// El Estado de WhatsApp tiene un límite real de 700 caracteres para texto — la lista completa
// por selección (generateShareText) lo supera fácilmente apenas el álbum tiene varias decenas
// de repetidas. Esta versión usa solo totales + el link, así que siempre cabe sin importar
// cuántas selecciones tenga el usuario.
export function generateStatusText(stickers, username = "", inviteEmail = "", t = {}) {
  let missingTotal = 0, repeatedTotal = 0;
  Object.values(stickers).forEach(nums => {
    Object.values(nums).forEach(s => {
      if (s.state === "missing") missingTotal++;
      else if (["repeated","sell","trade","auction"].includes(s.state)) repeatedTotal++;
    });
  });
  const link = inviteEmail
    ? `${window.location.origin}?invite=${encodeURIComponent(inviteEmail)}`
    : window.location.origin;
  return [
    "🎴 FiguSwitch — FIFA World Cup 2026",
    username ? `👤 ${username}` : "",
    "",
    (t.statusHaveRepeated ? t.statusHaveRepeated(repeatedTotal) : `🔁 I have ${repeatedTotal} duplicates available for trade or sale`),
    (t.statusMissing ? t.statusMissing(missingTotal) : `❌ I need ${missingTotal}`),
    "",
    t.statusViewList || "View my full list and connect with me:",
    link
  ].filter(Boolean).join("\n");
}

// ─── SHARE MODAL ──────────────────────────────────────────────────────────────
export function ShareModal({ stickers, username, inviteEmail, onClose, t }) {
  const [mode, setMode] = useState("both");
  const [copied, setCopied] = useState(false);
  const [copiedStatus, setCopiedStatus] = useState(false);
  const text = generateShareText(stickers, mode, username, inviteEmail, t);
  const statusText = generateStatusText(stickers, username, inviteEmail, t);
  const STATUS_LIMIT = 700;
  const tooLongForStatus = text.length > STATUS_LIMIT;

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const copyStatus = () => {
    navigator.clipboard.writeText(statusText).then(() => {
      setCopiedStatus(true);
      setTimeout(() => setCopiedStatus(false), 2000);
    });
  };

  const whatsapp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  return (
    <div style={{position:"fixed",inset:0,background:"#000b",zIndex:400,display:"flex",alignItems:"flex-end",justifyContent:"center"}}>
      <div style={{background:"#111827",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:480,border:"1px solid #1e2a3a",borderBottom:"none"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
          <span style={{fontWeight:900,fontSize:18,color:"#ffd700"}}>{t?.shareList || "📤 Compartir lista"}</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>

        {/* Mode selector */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
          {[["both",t?.shareBoth || "Faltantes + Repetidas"],["missing",t?.shareMissingOnly || "Solo faltantes"],["repeated",t?.shareRepeatedOnly || "Solo repetidas"]].map(([v,l])=>(
            <button key={v} onClick={()=>setMode(v)} style={{padding:"10px 6px",borderRadius:10,border:"1px solid",borderColor:mode===v?"#ffd700":"#1e2a3a",background:mode===v?"#ffd700":"#0a0f1e",color:mode===v?"#0a0f1e":"#9ca3af",fontWeight:700,fontSize:11,cursor:"pointer",textAlign:"center"}}>
              {l}
            </button>
          ))}
        </div>

        {/* Preview */}
        <div style={{background:"#0a0f1e",borderRadius:10,padding:12,marginBottom:8,maxHeight:200,overflowY:"auto",fontSize:12,color:"#9ca3af",fontFamily:"monospace",lineHeight:1.6,whiteSpace:"pre-wrap"}}>
          {text}
        </div>
        <div style={{fontSize:11,color:tooLongForStatus?"#f97316":"#4a5568",marginBottom:16}}>
          {text.length} {t?.chars || "caracteres"}{tooLongForStatus?` — ${t?.tooLongStatus || "muy largo para el Estado de WhatsApp (límite 700)"}`:""}
        </div>

        {/* Actions */}
        <div style={{display:"flex",gap:10}}>
          <button onClick={copy} style={{flex:1,padding:"13px",background:copied?"#22c55e":"#1e2a3a",border:"1px solid",borderColor:copied?"#22c55e":"#374151",borderRadius:10,color:copied?"#fff":"#e8eaf6",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            {copied ? (t?.copied || "✅ Copiado!") : (t?.copy || "📋 Copiar")}
          </button>
          <button onClick={whatsapp} style={{flex:1,padding:"13px",background:"#14532d",border:"1px solid #22c55e",borderRadius:10,color:"#86efac",fontWeight:700,fontSize:14,cursor:"pointer"}}>
            💬 WhatsApp
          </button>
        </div>

        {/* Resumen para Estado: el Estado de WhatsApp corta el texto en 700 caracteres,
            así que la lista completa de arriba casi nunca cabe. Esto da un resumen garantizado corto. */}
        <div style={{marginTop:16,paddingTop:16,borderTop:"1px solid #1e2a3a"}}>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>
            {t?.whatsappStatusHelp || "¿Lo vas a poner en tu Estado de WhatsApp? Ahí el límite es 700 caracteres — usa este resumen corto en vez de la lista completa:"}
          </div>
          <button onClick={copyStatus} style={{width:"100%",padding:"12px",background:copiedStatus?"#22c55e":"#1e2a3a",border:"1px solid",borderColor:copiedStatus?"#22c55e":"#374151",borderRadius:10,color:copiedStatus?"#fff":"#e8eaf6",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            {copiedStatus ? (t?.copied || "✅ Copiado!") : `${t?.copyStatusSummary || "📲 Copiar resumen para Estado"} (${statusText.length} ${t?.chars || "caracteres"})`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── IMPORTER MAIN ────────────────────────────────────────────────────────────
export default function Importer({ onImport, onClose, currentAlbum, lang="es", t }) {
  // Detecta si esto es una primera importación (álbum vacío o casi vacío). En ese caso, "fusionar"
  // y "reemplazar" no son una elección real — fusionar contra un álbum 100% "me falta" deja todo
  // en "me falta", mientras que lo correcto para una primera carga es que lo no mencionado se
  // marque como "tengo" (igual que hace "reemplazar"). Por eso, para álbum vacío, usamos
  // reemplazar automáticamente y ni mostramos el selector — la elección solo tiene sentido real
  // una vez que ya hay datos previos que sí valga la pena preservar.
  const isFreshAlbum = !currentAlbum || Object.values(currentAlbum).every(
    team => Object.values(team || {}).every(s => !s || s.state === "missing")
  );
  const [step, setStep] = useState("paste"); // paste | preview | done
  const [text, setText] = useState("");
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState("");
  const [mergeMode, setMergeMode] = useState("merge"); // merge (seguro, default) | replace

  const handleParse = () => {
    if (!text.trim()) { setError(t?.pasteFirst || "Pega tu lista primero"); return; }
    const result = parseList(text);
    const totalMissing = Object.values(result.missing).reduce((s,a)=>s+a.length,0);
    const totalRepeated = Object.values(result.repeated).reduce((s,a)=>s+a.length,0);
    if (totalMissing === 0 && totalRepeated === 0) {
      setError(t?.noStickersDetected || "No se detectaron figuritas. Verifica el formato de tu lista.");
      return;
    }
    setParsed({ ...result, totalMissing, totalRepeated });
    setStep("preview");
  };

  const handleImport = () => {
    // Modo efectivo: si es la primera importación (álbum vacío), siempre se comporta como
    // "reemplazar" — ver la nota junto a isFreshAlbum más arriba sobre por qué eso es lo correcto.
    const effectiveMode = isFreshAlbum ? "replace" : mergeMode;

    // Guarda de seguridad: en modo "fusionar", si por alguna razón no llegó el álbum base
    // (currentAlbum undefined/null), buildAlbumFromParsed caería sin darse cuenta al mismo
    // comportamiento de "reemplazar todo" — porque sin base, todo lo no mencionado se marca
    // como "have". Eso traicionaría la elección explícita del usuario. Mejor avisar y cancelar.
    // En modo "reemplazar" no aplica: ahí se pasa null a propósito.
    if (effectiveMode === "merge" && !currentAlbum) {
      setError(t?.importSafetyError || "No se pudo cargar tu álbum actual. Cierra y vuelve a abrir el importador para evitar perder datos por accidente.");
      setStep("paste");
      return;
    }
    const album = buildAlbumFromParsed(parsed, effectiveMode === "merge" ? currentAlbum : null);
    onImport(album);
    setStep("done");
  };

  const EXAMPLE = `${t?.missing || "Me faltan"}
FWC 🏆: 4
MEX 🇲🇽: 6, 18, 19
ARG 🇦🇷: 11

${t?.repeated || "Repetidas"}
SCO 🏴󠁧󠁢󠁳󠁣󠁴󠁿: 5, 13
MAR 🇲🇦: 3`;

  // ── PASTE STEP ──
  if (step === "paste") return (
    <div style={{position:"fixed",inset:0,background:"#0a0f1e",zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{background:"#111827",borderBottom:"1px solid #1e2a3a",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>←</button>
        <span style={{fontWeight:900,fontSize:16,color:"#ffd700"}}>{t?.importTitle || "📋 Importar lista"}</span>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:16}}>
        <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontWeight:700,color:"#e8eaf6",marginBottom:8}}>{t?.howItWorks || "¿Cómo funciona?"}</div>
          {[
            ["1️⃣",t?.importStep1 || "Abre tu app actual"],
            ["2️⃣",t?.importStep2 || "Ve a compartir → copia tu lista de texto"],
            ["3️⃣",t?.importStep3 || "Pégala aquí abajo"],
            ["4️⃣",t?.importStep4 || "Tu álbum se llena automáticamente ✨"],
          ].map(([ic,txt])=>(
            <div key={ic} style={{display:"flex",gap:10,marginBottom:8,alignItems:"flex-start"}}>
              <span style={{fontSize:16,flexShrink:0}}>{ic}</span>
              <span style={{color:"#9ca3af",fontSize:13}}>{txt}</span>
            </div>
          ))}
        </div>

        <div style={{marginBottom:8,display:"flex",justifyContent:"space-between",alignItems:"center",gap:8}}>
          <span style={{fontWeight:700,color:"#e8eaf6",fontSize:14}}>{t?.pasteListHere || "Pega tu lista aquí:"}</span>
          <div style={{display:"flex",gap:8,flexShrink:0}}>
            <button
              onClick={async()=>{
                try{
                  const clip=await navigator.clipboard.readText();
                  if(clip&&clip.trim()){setText(clip);setError("");}
                  else setError(t?.clipboardEmpty || "El portapapeles está vacío. Copia tu lista primero.");
                }catch{
                  setError(t?.clipboardError || "No se pudo leer el portapapeles automáticamente. Mantén presionado el cuadro de abajo y selecciona \"Pegar\".");
                }
              }}
              style={{fontSize:11,color:"#86efac",background:"none",border:"1px solid #14532d",borderRadius:6,padding:"3px 8px",cursor:"pointer",whiteSpace:"nowrap"}}
            >
              {t?.pasteAll || "📋 Pegar todo"}
            </button>
            <button onClick={()=>setText(EXAMPLE)} style={{fontSize:11,color:"#60a5fa",background:"none",border:"1px solid #1e3a5f",borderRadius:6,padding:"3px 8px",cursor:"pointer",whiteSpace:"nowrap"}}>
              {t?.seeExample || "Ver ejemplo"}
            </button>
          </div>
        </div>

        <textarea
          value={text}
          onChange={e=>{setText(e.target.value);setError("");}}
          placeholder={`Pega aquí tu lista...\n\nEjemplo:\nMe faltan\nFWC 🏆: 4\nMEX 🇲🇽: 6, 18, 19\n\nRepetidas\nSCO 🏴󠁧󠁢󠁳󠁣󠁴󠁿: 5, 13`}
          style={{width:"100%",boxSizing:"border-box",height:220,padding:14,borderRadius:12,border:"1px solid #1e2a3a",background:"#111827",color:"#e8eaf6",fontSize:13,outline:"none",resize:"none",fontFamily:"monospace",lineHeight:1.6}}
        />

        {error && <div style={{color:"#ef4444",fontSize:13,marginTop:8,padding:"8px 12px",background:"#1e0a0a",borderRadius:8}}>{error}</div>}

        <div style={{fontSize:11,color:"#4a5568",marginTop:8}}>
          {t?.compatibleWith || "Compatible con: Panini Digital, listas de WhatsApp y cualquier formato con códigos de país"}
        </div>
      </div>

      <div style={{padding:"12px 16px",borderTop:"1px solid #1e2a3a",background:"#111827"}}>
        <button onClick={handleParse} disabled={!text.trim()} style={{width:"100%",padding:"14px",background:text.trim()?"linear-gradient(135deg,#ffd700,#f59e0b)":"#1e2a3a",border:"none",borderRadius:12,color:text.trim()?"#0a0f1e":"#4a5568",fontWeight:900,fontSize:16,cursor:"pointer"}}>
          {t?.analyzeList || "Analizar lista →"}
        </button>
      </div>
    </div>
  );

  // ── PREVIEW STEP ──
  if (step === "preview") return (
    <div style={{position:"fixed",inset:0,background:"#0a0f1e",zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{background:"#111827",borderBottom:"1px solid #1e2a3a",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={()=>setStep("paste")} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>←</button>
        <span style={{fontWeight:900,fontSize:16,color:"#ffd700"}}>{t?.preview || "📋 Vista previa"}</span>
      </div>

      <div style={{flex:1,overflowY:"auto",padding:16}}>
        {/* Summary */}
        <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:10,marginBottom:20}}>
          <div style={{background:"#0a1e0a",border:"1px solid #22c55e",borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:4}}>❌</div>
            <div style={{fontWeight:900,fontSize:28,color:"#22c55e"}}>{parsed.totalMissing}</div>
            <div style={{fontSize:12,color:"#4ade80"}}>{t?.missingDetected || "figuritas faltantes detectadas"}</div>
          </div>
          <div style={{background:"#1e0f00",border:"1px solid #f97316",borderRadius:12,padding:16,textAlign:"center"}}>
            <div style={{fontSize:28,marginBottom:4}}>🔁</div>
            <div style={{fontWeight:900,fontSize:28,color:"#f97316"}}>{parsed.totalRepeated}</div>
            <div style={{fontSize:12,color:"#fb923c"}}>{t?.repeatedDetected || "repetidas detectadas"}</div>
          </div>
        </div>

        {/* Missing preview */}
        {Object.keys(parsed.missing).length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:800,color:"#ef4444",fontSize:14,marginBottom:10}}>{t?.missingDetectedTitle || "❌ Faltantes detectadas"}</div>
            {/* Fix: antes esto recorría en el orden en que aparecían en el texto pegado
                (a menudo alfabético, según cómo lo exportó la otra app) — ahora respeta
                el orden real de páginas del álbum físico, igual que en el resto de la app. */}
            {Object.entries(parsed.missing).sort((a,b)=>Object.keys(ALBUM).indexOf(a[0])-Object.keys(ALBUM).indexOf(b[0])).slice(0,8).map(([code,nums])=>{
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
                +{Object.keys(parsed.missing).length - 8} {t?.moreSelections || "selecciones más"}...
              </div>
            )}
          </div>
        )}

        {/* Repeated preview */}
        {Object.keys(parsed.repeated).length > 0 && (
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:800,color:"#f97316",fontSize:14,marginBottom:10}}>🔁 {t?.repeatedDetected || "Repetidas detectadas"}</div>
            {Object.entries(parsed.repeated).sort((a,b)=>Object.keys(ALBUM).indexOf(a[0])-Object.keys(ALBUM).indexOf(b[0])).map(([code,nums])=>{
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
            <div style={{fontWeight:700,color:"#fbbf24",fontSize:13,marginBottom:8}}>{t?.notImported || "⚠️ Esto no se pudo importar:"}</div>
            {parsed.ignored?.length > 0 && (
              <div style={{fontSize:12,color:"#fde68a",marginBottom:parsed.outOfRange?.length>0?8:0}}>
                {t?.ignoredLines || "Líneas no reconocidas"} ({parsed.ignored.length}): {parsed.ignored.slice(0,5).join(" · ")}{parsed.ignored.length>5?"...":""}
              </div>
            )}
            {parsed.outOfRange?.length > 0 && (
              <div style={{fontSize:12,color:"#fde68a"}}>
                {t?.outOfRangeNumbers || "Números fuera de rango"} ({parsed.outOfRange.length}): {parsed.outOfRange.slice(0,8).join(", ")}{parsed.outOfRange.length>8?"...":""}
              </div>
            )}
          </div>
        )}

        {/* Selector de modo: solo tiene sentido real si ya hay algo en el álbum que preservar.
            En una primera importación (álbum vacío), fusionar y reemplazar no son una elección
            real — se aplica directo, sin el selector que solo generaría confusión. */}
        {isFreshAlbum ? (
          <div style={{background:"#0a1e0a",border:"1px solid #22c55e",borderRadius:12,padding:14,fontSize:13,color:"#86efac",marginBottom:16}}>
            {t?.firstImportHelp || "✅ Como es tu primera importación, esta lista se aplica directo a tu álbum — todo lo no mencionado se marcará como \"tengo\"."}
          </div>
        ) : (
          <div style={{marginBottom:16}}>
            <div style={{fontWeight:700,color:"#e8eaf6",fontSize:13,marginBottom:8}}>{t?.howApplyList || "¿Cómo aplicar esta lista?"}</div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <button onClick={()=>setMergeMode("merge")} style={{textAlign:"left",padding:"12px 14px",borderRadius:10,border:"1px solid",borderColor:mergeMode==="merge"?"#22c55e":"#1e2a3a",background:mergeMode==="merge"?"#0a1e0a":"#111827",cursor:"pointer"}}>
                <div style={{fontWeight:700,color:mergeMode==="merge"?"#22c55e":"#e8eaf6",fontSize:13}}>{t?.mergeAlbum || "✅ Fusionar con mi álbum actual (recomendado)"}</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{t?.mergeAlbumHelp || "Solo actualiza las figuritas mencionadas en esta lista; el resto de tu álbum no cambia"}</div>
              </button>
              <button onClick={()=>setMergeMode("replace")} style={{textAlign:"left",padding:"12px 14px",borderRadius:10,border:"1px solid",borderColor:mergeMode==="replace"?"#ef4444":"#1e2a3a",background:mergeMode==="replace"?"#1e0a0a":"#111827",cursor:"pointer"}}>
                <div style={{fontWeight:700,color:mergeMode==="replace"?"#ef4444":"#e8eaf6",fontSize:13}}>{t?.replaceAlbum || "🔄 Reemplazar todo mi álbum"}</div>
                <div style={{fontSize:11,color:"#6b7280",marginTop:2}}>{t?.replaceAlbumHelp || "Lo no mencionado en la lista se marcará como \"tengo\" — usa esto solo si la lista es completa"}</div>
              </button>
            </div>
          </div>
        )}

        {!isFreshAlbum && mergeMode==="replace"&&(
          <div style={{background:"#0a1a2e",border:"1px solid #1e3a5f",borderRadius:12,padding:14,fontSize:13,color:"#60a5fa"}}>
            {t?.replaceWarning || "⚠️ Esto reemplazará tu álbum actual. Las figuritas no mencionadas se marcarán como \"tengo\"."}
          </div>
        )}
      </div>

      <div style={{padding:"12px 16px",borderTop:"1px solid #1e2a3a",background:"#111827",display:"flex",gap:10}}>
        <button onClick={()=>setStep("paste")} style={{flex:1,padding:"13px",background:"transparent",border:"1px solid #1e2a3a",borderRadius:12,color:"#6b7280",fontWeight:700,cursor:"pointer"}}>
          {t?.edit || "Editar"}
        </button>
        <button onClick={handleImport} style={{flex:2,padding:"13px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:12,color:"#0a0f1e",fontWeight:900,fontSize:15,cursor:"pointer"}}>
          {t?.importToAlbum || "✅ Importar al álbum"}
        </button>
      </div>
    </div>
  );

  // ── DONE STEP ──
  return (
    <div style={{position:"fixed",inset:0,background:"#0a0f1e",zIndex:500,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{fontSize:64,marginBottom:16}}>🎉</div>
      <div style={{fontWeight:900,fontSize:24,color:"#ffd700",marginBottom:8,textAlign:"center"}}>{t?.importedAlbumTitle || "¡Álbum importado!"}</div>
      <div style={{color:"#9ca3af",fontSize:15,textAlign:"center",marginBottom:8}}>
        <span style={{color:"#ef4444",fontWeight:700}}>{parsed.totalMissing} {t?.scopeMissing || "faltantes"}</span> y <span style={{color:"#f97316",fontWeight:700}}>{parsed.totalRepeated} {t?.scopeRepeated || "repetidas"}</span> {t?.loaded || "cargadas"}.
      </div>
      <div style={{color:"#6b7280",fontSize:13,textAlign:"center",marginBottom:32}}>
        {t?.albumReady || "Tu álbum digital está listo en FiguSwitch."}
      </div>
      <button onClick={onClose} style={{padding:"14px 32px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:14,color:"#0a0f1e",fontWeight:900,fontSize:16,cursor:"pointer"}}>
        {t?.viewMyAlbum || "Ver mi álbum →"}
      </button>
    </div>
  );
}
