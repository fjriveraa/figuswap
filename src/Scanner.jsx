import { useState, useRef, useMemo } from "react";

// ─── ALBUM DATA ───────────────────────────────────────────────────────────────
const ALBUM = {
  FWC:{name:"FIFA World Cup",emoji:"🏆",total:20},
  MEX:{name:"México",emoji:"🇲🇽",total:20},
  RSA:{name:"South Africa",emoji:"🇿🇦",total:20},
  KOR:{name:"Korea Republic",emoji:"🇰🇷",total:20},
  CZE:{name:"Czechia",emoji:"🇨🇿",total:20},
  CAN:{name:"Canada",emoji:"🇨🇦",total:20},
  BIH:{name:"Bosnia-Herzegovina",emoji:"🇧🇦",total:20},
  QAT:{name:"Qatar",emoji:"🇶🇦",total:20},
  SUI:{name:"Switzerland",emoji:"🇨🇭",total:20},
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
  CC:{name:"Coca-Cola",emoji:"🥤",total:14},
  ALG:{name:"Algeria",emoji:"🇩🇿",total:20},
  BRA:{name:"Brazil",emoji:"🇧🇷",total:20},
};

const MY_NEEDED = {
  FWC:[4],MEX:[6,18,19],RSA:[8,17,18],KOR:[1,9,14,18,19],CZE:[3,11,16,17,18,20],
  CAN:[11,15,17,19],BIH:[1,2,5,9,12,17],QAT:[1,7,20],SUI:[4,14,18],
  MAR:[1,4,5,6,11,13,15,16,17,20],HAI:[12,17,18,20],SCO:[1,15,20],
  USA:[1,11,18,19],PAR:[1,7,16],AUS:[2,10,19],TUR:[3,9,13,18,19,20],
  GER:[1,4],CUW:[6,10,15],CIV:[2,8,10,12,17,18,19,20],ECU:[13],
  NED:[3,4,7,8,11,12,18],JPN:[1,5,13],SWE:[1,4],TUN:[14,18],BEL:[5,9],
  EGY:[10],IRN:[2,3,4,5,6,10,11,12,15],NZL:[9,10,14,18],ESP:[15,16,18,20],
  CPV:[3,16,20],KSA:[1,4],URU:[1,7,15],FRA:[4,5,8],SEN:[1],IRQ:[3,8,12,17],
  NOR:[7,15],ARG:[11],AUT:[2,6,13,15,16,19,20],JOR:[7,11,17,20],
  POR:[1,2,4,5,14],COD:[2,5,13],UZB:[8,15,16,17],COL:[5,9,16],
  ENG:[4,9,11,15,16,17,19],CRO:[1,10],GHA:[11,13,14,15,20],PAN:[3,7,13,16],
};

// ─── AI SCANNER ───────────────────────────────────────────────────────────────
async function scanStickersWithAI(base64Image, mediaType) {
  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: base64Image }
          },
          {
            type: "text",
            text: `Analyze this image of FIFA World Cup 2026 Panini stickers. 
            Each sticker has a code like "RSA 1", "ARG 20", "FWC 4", "CAN 18" etc.
            The code format is: COUNTRY_CODE followed by a space and NUMBER.
            
            List ALL sticker codes you can see in the image.
            
            Respond ONLY with a JSON array of strings, no explanation, no markdown, no backticks.
            Example: ["RSA 1", "ARG 20", "FWC 4", "CAN 18"]
            
            If you cannot see any stickers, return: []`
          }
        ]
      }]
    })
  });
  const data = await response.json();
  const text = data.content?.[0]?.text || "[]";
  try {
    const clean = text.replace(/```json|```/g, "").trim();
    return JSON.parse(clean);
  } catch {
    // Try to extract codes manually
    const matches = text.match(/[A-Z]{2,3}\s+\d{1,2}/g) || [];
    return [...new Set(matches)];
  }
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function FiguSwapScanner() {
  const [step, setStep] = useState("upload"); // upload | scanning | results
  const [image, setImage] = useState(null);
  const [imageBase64, setImageBase64] = useState(null);
  const [mediaType, setMediaType] = useState("image/jpeg");
  const [detected, setDetected] = useState([]);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState({});
  const fileRef = useRef();

  const handleFile = (file) => {
    if (!file) return;
    setMediaType(file.type || "image/jpeg");
    const url = URL.createObjectURL(file);
    setImage(url);
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target.result.split(",")[1];
      setImageBase64(base64);
    };
    reader.readAsDataURL(file);
  };

  const scan = async () => {
    if (!imageBase64) return;
    setStep("scanning");
    setError(null);
    try {
      const codes = await scanStickersWithAI(imageBase64, mediaType);
      const parsed = codes.map(c => {
        const parts = c.trim().split(/\s+/);
        const code = parts[0].toUpperCase();
        const num = parseInt(parts[1]);
        if (!code || isNaN(num)) return null;
        const needed = MY_NEEDED[code]?.includes(num);
        const teamExists = ALBUM[code];
        return { code, num, needed: !!needed, teamExists: !!teamExists };
      }).filter(Boolean);
      setDetected(parsed);
      // Auto-select needed ones
      const autoSel = {};
      parsed.forEach((s, i) => { if (s.needed) autoSel[i] = true; });
      setSelected(autoSel);
      setStep("results");
    } catch (e) {
      setError("Error al escanear. Verifica tu conexión e intenta de nuevo.");
      setStep("upload");
    }
  };

  const reset = () => {
    setStep("upload");
    setImage(null);
    setImageBase64(null);
    setDetected([]);
    setSelected({});
    setError(null);
  };

  const needed = detected.filter(s => s.needed);
  const repeated = detected.filter(s => !s.needed);
  const unknown = detected.filter(s => !s.teamExists);

  // ── UPLOAD STEP ──
  if (step === "upload") return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e8eaf6", fontFamily: "'Segoe UI',system-ui,sans-serif", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1e2a3a", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <span style={{ fontSize: 22 }}>⚽</span>
        <span style={{ fontWeight: 900, fontSize: 18, background: "linear-gradient(90deg,#ffd700,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FiguSwap</span>
        <span style={{ marginLeft: 8, fontSize: 13, color: "#6b7280" }}>Escáner IA</span>
      </div>

      <div style={{ flex: 1, padding: 20, display: "flex", flexDirection: "column", maxWidth: 480, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>

        {/* Hero */}
        <div style={{ textAlign: "center", padding: "32px 0 24px" }}>
          <div style={{ fontSize: 64, marginBottom: 12 }}>📸</div>
          <h1 style={{ fontWeight: 900, fontSize: 26, color: "#fff", margin: "0 0 10px", lineHeight: 1.2 }}>Escanea tus figuritas</h1>
          <p style={{ color: "#6b7280", fontSize: 15, margin: 0, lineHeight: 1.5 }}>
            Sube una foto y la IA detecta automáticamente qué figuritas tienes, cuáles necesitas y cuáles son repetidas.
          </p>
        </div>

        {/* How it works */}
        <div style={{ background: "#111827", border: "1px solid #1e2a3a", borderRadius: 16, padding: 20, marginBottom: 24 }}>
          {[
            ["📸", "Toma una foto clara de tus figuritas con los códigos visibles"],
            ["🤖", "La IA lee automáticamente todos los códigos (RSA 1, ARG 20...)"],
            ["✅", "Ve cuáles necesitas pegar, cuáles son repetidas y qué hacer"],
          ].map(([ic, txt], i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < 2 ? 14 : 0 }}>
              <span style={{ fontSize: 24, flexShrink: 0 }}>{ic}</span>
              <span style={{ color: "#9ca3af", fontSize: 14, lineHeight: 1.5 }}>{txt}</span>
            </div>
          ))}
        </div>

        {/* Upload area */}
        {!image ? (
          <div
            onClick={() => fileRef.current?.click()}
            style={{
              border: "2px dashed #1e3a5f",
              borderRadius: 16,
              padding: 40,
              textAlign: "center",
              cursor: "pointer",
              background: "#0f172a",
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>🖼️</div>
            <div style={{ fontWeight: 700, color: "#60a5fa", fontSize: 16, marginBottom: 6 }}>Subir foto</div>
            <div style={{ color: "#4a5568", fontSize: 13 }}>JPG, PNG · Máx 10MB</div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => handleFile(e.target.files[0])} />
          </div>
        ) : (
          <div style={{ marginBottom: 16, position: "relative" }}>
            <img src={image} alt="preview" style={{ width: "100%", borderRadius: 16, border: "2px solid #1e3a5f", display: "block" }} />
            <button onClick={reset} style={{ position: "absolute", top: 10, right: 10, background: "#ef4444", border: "none", borderRadius: 20, color: "#fff", padding: "6px 12px", fontWeight: 700, fontSize: 12, cursor: "pointer" }}>
              ✕ Cambiar
            </button>
          </div>
        )}

        {error && (
          <div style={{ background: "#1e0a0a", border: "1px solid #ef4444", borderRadius: 10, padding: 12, marginBottom: 16, color: "#ef4444", fontSize: 13 }}>
            ⚠️ {error}
          </div>
        )}

        <button
          onClick={image ? scan : () => fileRef.current?.click()}
          style={{
            width: "100%",
            padding: 16,
            background: image ? "linear-gradient(135deg,#ffd700,#f59e0b)" : "#1e2a3a",
            border: "none",
            borderRadius: 14,
            color: image ? "#0a0f1e" : "#4a5568",
            fontWeight: 900,
            fontSize: 16,
            cursor: "pointer",
            marginBottom: 12,
          }}
        >
          {image ? "🤖 Escanear con IA →" : "📸 Elegir foto"}
        </button>

        <div style={{ textAlign: "center", fontSize: 11, color: "#374151" }}>
          Powered by Claude AI · Los códigos deben ser legibles en la foto
        </div>
      </div>
    </div>
  );

  // ── SCANNING STEP ──
  if (step === "scanning") return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 64, marginBottom: 20, animation: "spin 2s linear infinite" }}>🤖</div>
        <div style={{ fontWeight: 900, fontSize: 22, color: "#ffd700", marginBottom: 10 }}>Analizando figuritas...</div>
        <div style={{ color: "#6b7280", fontSize: 14, marginBottom: 32 }}>La IA está leyendo los códigos de tu foto</div>
        {image && <img src={image} alt="" style={{ width: 200, borderRadius: 12, opacity: 0.5, border: "2px solid #1e2a3a" }} />}
        <div style={{ marginTop: 24, display: "flex", gap: 6, justifyContent: "center" }}>
          {[0,1,2].map(i => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: "#ffd700", opacity: 0.3 + i*0.35 }} />
          ))}
        </div>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // ── RESULTS STEP ──
  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e8eaf6", fontFamily: "'Segoe UI',system-ui,sans-serif" }}>
      {/* Header */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1e2a3a", padding: "14px 16px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <button onClick={reset} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 20, cursor: "pointer" }}>←</button>
          <span style={{ fontWeight: 900, fontSize: 16, color: "#ffd700" }}>📸 Resultado del escaneo</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "#6b7280" }}>{detected.length} detectadas</span>
        </div>
      </div>

      <div style={{ padding: 16, maxWidth: 480, margin: "0 auto" }}>

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 20 }}>
          {[
            ["✅", needed.length, "#22c55e", "Pegar"],
            ["🔁", repeated.length, "#f97316", "Repetidas"],
            ["📦", detected.length, "#60a5fa", "Total"],
          ].map(([ic, val, color, label]) => (
            <div key={label} style={{ background: "#111827", border: `1px solid ${color}22`, borderRadius: 12, padding: 14, textAlign: "center" }}>
              <div style={{ fontSize: 24 }}>{ic}</div>
              <div style={{ fontWeight: 900, fontSize: 28, color }}>{val}</div>
              <div style={{ fontSize: 11, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
            </div>
          ))}
        </div>

        {/* Photo thumbnail */}
        {image && (
          <div style={{ marginBottom: 16 }}>
            <img src={image} alt="scanned" style={{ width: "100%", borderRadius: 12, border: "1px solid #1e2a3a", maxHeight: 200, objectFit: "cover" }} />
          </div>
        )}

        {/* NEEDED — pegar */}
        {needed.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#22c55e", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
              ✅ Las que puedes PEGAR ({needed.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {needed.map((s, i) => {
                const team = ALBUM[s.code];
                return (
                  <div key={i} style={{ background: "#052e16", border: "1px solid #22c55e", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontSize: 26 }}>{team?.emoji || "🃏"}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: "#86efac" }}>{team?.name || s.code} <span style={{ color: "#ffd700" }}>#{s.num}</span></div>
                      <div style={{ fontSize: 12, color: "#4ade80" }}>¡Estaba en tu lista de faltantes!</div>
                    </div>
                    <span style={{ fontSize: 24 }}>📌</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* REPEATED */}
        {repeated.length > 0 && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: "#f97316", marginBottom: 10 }}>
              🔁 Repetidas — ¿Qué haces con ellas? ({repeated.length})
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {repeated.map((s, i) => {
                const team = ALBUM[s.code];
                return (
                  <div key={i} style={{ background: "#111827", border: "1px solid #1e2a3a", borderRadius: 12, padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                      <span style={{ fontSize: 20 }}>{team?.emoji || "🃏"}</span>
                      <div style={{ flex: 1 }}>
                        <span style={{ fontWeight: 700, color: "#e8eaf6" }}>{team?.name || s.code} </span>
                        <span style={{ color: "#ffd700", fontWeight: 800 }}>#{s.num}</span>
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button style={{ flex: 1, padding: "7px 6px", background: "#14532d", border: "1px solid #22c55e", borderRadius: 8, color: "#86efac", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                        💰 Vender
                      </button>
                      <button style={{ flex: 1, padding: "7px 6px", background: "#1e3a5f", border: "1px solid #3b82f6", borderRadius: 8, color: "#60a5fa", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                        🔄 Cambiar
                      </button>
                      <button style={{ flex: 1, padding: "7px 6px", background: "#1e1040", border: "1px solid #a78bfa", borderRadius: 8, color: "#a78bfa", fontWeight: 700, fontSize: 11, cursor: "pointer" }}>
                        🔨 Subastar
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Empty state */}
        {detected.length === 0 && (
          <div style={{ textAlign: "center", padding: 40 }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
            <div style={{ fontWeight: 700, color: "#e8eaf6", marginBottom: 6 }}>No se detectaron figuritas</div>
            <div style={{ color: "#6b7280", fontSize: 13, marginBottom: 20 }}>Asegúrate que los códigos sean legibles en la foto</div>
            <button onClick={reset} style={{ padding: "12px 24px", background: "#ffd700", border: "none", borderRadius: 10, fontWeight: 800, fontSize: 14, cursor: "pointer", color: "#0a0f1e" }}>
              Intentar de nuevo
            </button>
          </div>
        )}

        {/* Actions */}
        {detected.length > 0 && (
          <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
            <button onClick={reset} style={{ flex: 1, padding: 14, background: "transparent", border: "1px solid #1e2a3a", borderRadius: 12, color: "#6b7280", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
              📸 Escanear más
            </button>
            <button style={{ flex: 1, padding: 14, background: "linear-gradient(135deg,#ffd700,#f59e0b)", border: "none", borderRadius: 12, color: "#0a0f1e", fontWeight: 900, fontSize: 14, cursor: "pointer" }}>
              ✅ Actualizar álbum
            </button>
          </div>
        )}

        <div style={{ height: 20 }} />
      </div>
    </div>
  );
}
