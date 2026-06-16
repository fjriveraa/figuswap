import { useState, useMemo, useEffect } from "react";
import Scanner from "./Scanner.jsx";


// ─── CONFIG ───────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://fythsgiofvodukjzutat.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dGhzZ2lvZnZvZHVranp1dGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTIyMDgsImV4cCI6MjA5NzEyODIwOH0.HaG8yQgc2BzEGnlaNXFWaLZ0c_Oa6CvhwcVjHj99-AY";

// Sticker states
const STATE = {
  missing:  { color: "#ef4444", bg: "#1e0a0a", label: "Me falta",  emoji: "❌" },
  have:     { color: "#22c55e", bg: "#0a1e0a", label: "La tengo",  emoji: "✅" },
  repeated: { color: "#f97316", bg: "#1e0f00", label: "Repetida",  emoji: "🔁" },
  sell:     { color: "#fbbf24", bg: "#1e1500", label: "En venta",  emoji: "💰" },
  trade:    { color: "#60a5fa", bg: "#0a0f1e", label: "Cambio",    emoji: "🔄" },
  auction:  { color: "#a78bfa", bg: "#0f0a1e", label: "Subasta",   emoji: "🔨" },
};

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
};

// Initial state — missing ones from Fernando's list
const buildInitial = () => {
  const needed = {
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
  const result = {};
  Object.entries(ALBUM).forEach(([code, team]) => {
    result[code] = {};
    for (let i = 1; i <= team.total; i++) {
      result[code][i] = {
        state: needed[code]?.includes(i) ? "missing" : "have",
        qty: 1,
        price: 0,
      };
    }
  });
  return result;
};

// Mock chat messages per team
const MOCK_CHATS = {
  ARG: [
    { user: "Carlos M.", emoji: "🇲🇽", msg: "Tengo ARG 20, necesito ARG 11", time: "10:23" },
    { user: "Ana P.", emoji: "🇧🇷", msg: "Yo tengo ARG 11! Te la cambio por MAR 3", time: "10:25" },
    { user: "Pedro H.", emoji: "🇭🇳", msg: "Alguien vende ARG 20?", time: "10:31" },
  ],
  MAR: [
    { user: "Fatima B.", emoji: "🇲🇦", msg: "Tengo varias de MAR repetidas", time: "09:15" },
    { user: "Sophie L.", emoji: "🇫🇷", msg: "Qué números tienes de MAR?", time: "09:18" },
  ],
  FWC: [
    { user: "Kenji T.", emoji: "🇯🇵", msg: "FWC 4 es muy difícil de conseguir!", time: "08:45" },
    { user: "James K.", emoji: "🇬🇧", msg: "Yo la tengo repetida, $3 USD", time: "08:50" },
  ],
};

const WORLD_OPEN = new Date("2026-06-11T16:00:00Z");

function useCountdown() {
  const [t, setT] = useState({d:0,h:0,m:0,s:0});
  useEffect(() => {
    const tick = () => {
      const diff = WORLD_OPEN - Date.now();
      if (diff <= 0) return;
      setT({d:Math.floor(diff/864e5),h:Math.floor((diff%864e5)/36e5),m:Math.floor((diff%36e5)/6e4),s:Math.floor((diff%6e4)/1e3)});
    };
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);
  return t;
}

// ─── STICKER BUTTON ───────────────────────────────────────────────────────────
function StickerCell({ code, num, data, onAction }) {
  const [open, setOpen] = useState(false);
  const st = STATE[data.state];

  return (
    <div style={{ position: "relative" }}>
      {/* Main sticker button */}
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: "100%",
          aspectRatio: "1",
          borderRadius: 10,
          border: `2px solid ${st.color}`,
          background: st.bg,
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          position: "relative",
          transition: "transform 0.1s",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>{st.emoji}</span>
        <span style={{ fontSize: 13, fontWeight: 900, color: st.color }}>{num}</span>
        {data.state === "repeated" && data.qty > 1 && (
          <span style={{ position: "absolute", top: 2, right: 4, fontSize: 9, fontWeight: 800, color: "#f97316" }}>×{data.qty}</span>
        )}
        {data.state === "sell" && data.price > 0 && (
          <span style={{ position: "absolute", bottom: 2, fontSize: 8, color: "#fbbf24", fontWeight: 700 }}>${data.price}</span>
        )}
      </button>

      {/* Action popover */}
      {open && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 200, display: "flex",
          alignItems: "flex-end", justifyContent: "center",
          background: "#000a",
        }} onClick={() => setOpen(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "#111827", borderRadius: "20px 20px 0 0",
              padding: 24, width: "100%", maxWidth: 480,
              border: "1px solid #1e2a3a", borderBottom: "none",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 28 }}>{ALBUM[code]?.emoji}</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: "#fff" }}>
                {ALBUM[code]?.name} <span style={{ color: "#ffd700" }}>#{num}</span>
              </div>
              <div style={{ fontSize: 13, color: "#6b7280", marginTop: 2 }}>
                Estado actual: <span style={{ color: st.color, fontWeight: 700 }}>{st.label}</span>
              </div>
            </div>

            {/* State buttons */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, marginBottom: 16 }}>
              {Object.entries(STATE).map(([key, val]) => (
                <button
                  key={key}
                  onClick={() => { onAction(code, num, key); setOpen(false); }}
                  style={{
                    padding: "10px 6px",
                    borderRadius: 10,
                    border: `1px solid ${data.state === key ? val.color : "#1e2a3a"}`,
                    background: data.state === key ? val.bg : "#0a0f1e",
                    color: data.state === key ? val.color : "#6b7280",
                    fontWeight: 700,
                    fontSize: 12,
                    cursor: "pointer",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 4,
                  }}
                >
                  <span style={{ fontSize: 18 }}>{val.emoji}</span>
                  <span>{val.label}</span>
                </button>
              ))}
            </div>

            {/* Quantity for repeated */}
            {data.state === "repeated" && (
              <div style={{ background: "#0a0f1e", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>¿Cuántas repetidas tienes?</div>
                <div style={{ display: "flex", gap: 8, alignItems: "center", justifyContent: "center" }}>
                  <button onClick={() => onAction(code, num, "repeated", Math.max(1, data.qty - 1))}
                    style={{ width: 36, height: 36, borderRadius: 8, background: "#1e2a3a", border: "1px solid #374151", color: "#fff", fontSize: 18, cursor: "pointer" }}>−</button>
                  <span style={{ fontSize: 24, fontWeight: 900, color: "#f97316", width: 40, textAlign: "center" }}>{data.qty}</span>
                  <button onClick={() => onAction(code, num, "repeated", data.qty + 1)}
                    style={{ width: 36, height: 36, borderRadius: 8, background: "#1e2a3a", border: "1px solid #374151", color: "#fff", fontSize: 18, cursor: "pointer" }}>+</button>
                </div>
              </div>
            )}

            {/* Price for sell/auction */}
            {(data.state === "sell" || data.state === "auction") && (
              <div style={{ background: "#0a0f1e", borderRadius: 10, padding: 12, marginBottom: 12 }}>
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>
                  {data.state === "sell" ? "Precio de venta (USD)" : "Precio inicial subasta (USD)"}
                </div>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span style={{ color: "#6b7280", fontSize: 18 }}>$</span>
                  <input
                    type="number"
                    defaultValue={data.price || 1}
                    min={0.5}
                    step={0.5}
                    onChange={e => onAction(code, num, data.state, data.qty, parseFloat(e.target.value))}
                    style={{ flex: 1, background: "#111827", border: "1px solid #1e2a3a", borderRadius: 8, color: "#ffd700", fontSize: 20, fontWeight: 700, padding: "8px 12px", outline: "none" }}
                  />
                  <span style={{ color: "#6b7280", fontSize: 12 }}>USD</span>
                </div>
              </div>
            )}

            <button onClick={() => setOpen(false)}
              style={{ width: "100%", padding: 12, background: "transparent", border: "1px solid #1e2a3a", borderRadius: 10, color: "#6b7280", fontWeight: 700, cursor: "pointer" }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TEAM SECTION ─────────────────────────────────────────────────────────────
function TeamSection({ code, stickers, onAction, onChat }) {
  const [expanded, setExpanded] = useState(false);
  const team = ALBUM[code];
  const nums = Object.keys(stickers).map(Number);
  const have = nums.filter(n => stickers[n].state !== "missing").length;
  const pct = Math.round(have / team.total * 100);
  const missing = nums.filter(n => stickers[n].state === "missing").length;
  const repeated = nums.filter(n => stickers[n].state === "repeated").length;
  const forSale = nums.filter(n => stickers[n].state === "sell" || stickers[n].state === "auction" || stickers[n].state === "trade").length;
  const complete = pct === 100;

  return (
    <div style={{
      background: complete ? "#052e16" : "#0d1117",
      border: `1px solid ${complete ? "#22c55e" : "#1e2a3a"}`,
      borderRadius: 16, overflow: "hidden", marginBottom: 10,
    }}>
      {/* Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        style={{ width: "100%", padding: "14px 16px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}
      >
        <span style={{ fontSize: 26 }}>{team.emoji}</span>
        <div style={{ flex: 1, textAlign: "left" }}>
          <div style={{ fontWeight: 800, fontSize: 15, color: complete ? "#86efac" : "#e8eaf6" }}>{team.name}</div>
          <div style={{ display: "flex", gap: 8, marginTop: 3, flexWrap: "wrap" }}>
            {missing > 0 && <span style={{ fontSize: 11, color: "#ef4444" }}>❌ {missing}</span>}
            {repeated > 0 && <span style={{ fontSize: 11, color: "#f97316" }}>🔁 {repeated}</span>}
            {forSale > 0 && <span style={{ fontSize: 11, color: "#fbbf24" }}>💰 {forSale}</span>}
            {complete && <span style={{ fontSize: 11, color: "#22c55e", fontWeight: 700 }}>✅ Completo!</span>}
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: complete ? "#22c55e" : pct >= 75 ? "#84cc16" : pct >= 50 ? "#eab308" : "#ef4444" }}>{pct}%</div>
          <div style={{ fontSize: 11, color: "#4a5568" }}>{have}/{team.total}</div>
        </div>
        <span style={{ color: "#4a5568", fontSize: 12 }}>{expanded ? "▲" : "▼"}</span>
      </button>

      {/* Progress bar */}
      <div style={{ height: 3, background: "#1e2a3a", margin: "0 16px" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: complete ? "#22c55e" : "#ffd700", borderRadius: 2, transition: "width 0.3s" }} />
      </div>

      {/* Sticker grid */}
      {expanded && (
        <div style={{ padding: 16 }}>
          {/* Legend */}
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
            {Object.entries(STATE).map(([k, v]) => (
              <span key={k} style={{ fontSize: 10, color: v.color, display: "flex", alignItems: "center", gap: 3 }}>
                {v.emoji} {v.label}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5,1fr)", gap: 6, marginBottom: 14 }}>
            {nums.map(n => (
              <StickerCell key={n} code={code} num={n} data={stickers[n]} onAction={onAction} />
            ))}
          </div>

          {/* Chat button */}
          <button
            onClick={() => onChat(code)}
            style={{ width: "100%", padding: "10px", background: "#0a1a2e", border: "1px solid #1e3a5f", borderRadius: 10, color: "#60a5fa", fontWeight: 700, fontSize: 13, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
          >
            💬 Chat {team.name} · {MOCK_CHATS[code]?.length || 0} mensajes
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CHAT MODAL ───────────────────────────────────────────────────────────────
function ChatModal({ code, user, onClose }) {
  const team = ALBUM[code];
  const [msgs, setMsgs] = useState(MOCK_CHATS[code] || []);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMsgs(m => [...m, { user: user?.split("@")[0] || "Tú", emoji: "🇭🇳", msg: input.trim(), time: new Date().toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"}) }]);
    setInput("");
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "#000c", zIndex: 300, display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ background: "#111827", borderBottom: "1px solid #1e2a3a", padding: "14px 16px", display: "flex", alignItems: "center", gap: 10 }}>
        <button onClick={onClose} style={{ background: "none", border: "none", color: "#6b7280", fontSize: 20, cursor: "pointer" }}>←</button>
        <span style={{ fontSize: 24 }}>{team?.emoji}</span>
        <div>
          <div style={{ fontWeight: 800, color: "#e8eaf6" }}>Chat {team?.name}</div>
          <div style={{ fontSize: 11, color: "#6b7280" }}>{msgs.length} mensajes · coleccionistas globales</div>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: 16, display: "flex", flexDirection: "column", gap: 10, background: "#0a0f1e" }}>
        {msgs.length === 0 && (
          <div style={{ textAlign: "center", color: "#374151", padding: 32 }}>
            <div style={{ fontSize: 32 }}>💬</div>
            <div style={{ marginTop: 8 }}>Sé el primero en escribir</div>
          </div>
        )}
        {msgs.map((m, i) => {
          const isMe = m.user === (user?.split("@")[0] || "Tú");
          return (
            <div key={i} style={{ display: "flex", justifyContent: isMe ? "flex-end" : "flex-start", gap: 8, alignItems: "flex-end" }}>
              {!isMe && <span style={{ fontSize: 20 }}>{m.emoji}</span>}
              <div style={{ maxWidth: "75%" }}>
                {!isMe && <div style={{ fontSize: 10, color: "#6b7280", marginBottom: 3 }}>{m.user}</div>}
                <div style={{
                  padding: "10px 14px",
                  borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                  background: isMe ? "#1e3a5f" : "#111827",
                  border: `1px solid ${isMe ? "#3b82f6" : "#1e2a3a"}`,
                  color: "#e8eaf6",
                  fontSize: 14,
                }}>
                  {m.msg}
                </div>
                <div style={{ fontSize: 10, color: "#374151", marginTop: 2, textAlign: isMe ? "right" : "left" }}>{m.time}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Input */}
      <div style={{ background: "#111827", borderTop: "1px solid #1e2a3a", padding: "12px 16px", display: "flex", gap: 8 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Escribe un mensaje..."
          style={{ flex: 1, background: "#0a0f1e", border: "1px solid #1e2a3a", borderRadius: 20, padding: "10px 16px", color: "#e8eaf6", fontSize: 14, outline: "none" }}
        />
        <button onClick={send} style={{ padding: "10px 18px", background: "linear-gradient(135deg,#3b82f6,#1d4ed8)", border: "none", borderRadius: 20, color: "#fff", fontWeight: 700, cursor: "pointer", fontSize: 16 }}>
          ➤
        </button>
      </div>
    </div>
  );
}

// ─── STATS SUMMARY ────────────────────────────────────────────────────────────
function AlbumStats({ stickers }) {
  const counts = { missing: 0, have: 0, repeated: 0, sell: 0, trade: 0, auction: 0 };
  Object.values(stickers).forEach(team => {
    Object.values(team).forEach(s => { counts[s.state] = (counts[s.state] || 0) + 1; });
  });
  const total = Object.values(ALBUM).reduce((s, t) => s + t.total, 0);
  const pct = Math.round((counts.have + counts.repeated + counts.sell + counts.trade + counts.auction) / total * 100);

  return (
    <div style={{ background: "#0d1117", border: "1px solid #1e2a3a", borderRadius: 16, padding: 16, marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <span style={{ fontWeight: 800, color: "#e8eaf6", fontSize: 15 }}>📋 Mi Álbum FIFA WC 2026</span>
        <span style={{ fontWeight: 900, color: "#ffd700", fontSize: 18 }}>{pct}%</span>
      </div>
      <div style={{ height: 8, background: "#1e2a3a", borderRadius: 4, overflow: "hidden", marginBottom: 12 }}>
        <div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#ffd700,#f59e0b)", borderRadius: 4 }} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 6 }}>
        {[
          ["❌", counts.missing, "#ef4444", "Me faltan"],
          ["✅", counts.have, "#22c55e", "Tengo"],
          ["🔁", counts.repeated, "#f97316", "Repetidas"],
          ["💰", counts.sell, "#fbbf24", "En venta"],
          ["🔄", counts.trade, "#60a5fa", "Cambio"],
          ["🔨", counts.auction, "#a78bfa", "Subasta"],
        ].map(([ic, val, color, label]) => (
          <div key={label} style={{ background: "#0a0f1e", borderRadius: 8, padding: "8px 6px", textAlign: "center" }}>
            <div style={{ fontSize: 16 }}>{ic}</div>
            <div style={{ fontWeight: 900, color, fontSize: 16 }}>{val}</div>
            <div style={{ fontSize: 9, color: "#4a5568", textTransform: "uppercase", letterSpacing: 0.5 }}>{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function FiguSwap() {
  const [stickers, setStickers] = useState(() => {
    try { const s = localStorage.getItem("figuswap_v3"); return s ? JSON.parse(s) : buildInitial(); }
    catch { return buildInitial(); }
  });
  const [page, setPage] = useState("album");
  const [search, setSearch] = useState("");
  const [chat, setChat] = useState(null);
  const [filter, setFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const countdown = useCountdown();

  useEffect(() => {
    try { localStorage.setItem("figuswap_v3", JSON.stringify(stickers)); }
    catch {}
  }, [stickers]);

  const showToast = msg => { setToast(msg); setTimeout(() => setToast(null), 2000); };

  const handleAction = (code, num, state, qty, price) => {
    setStickers(prev => ({
      ...prev,
      [code]: {
        ...prev[code],
        [num]: {
          state,
          qty: qty ?? prev[code][num].qty,
          price: price ?? prev[code][num].price,
        }
      }
    }));
    showToast(`${STATE[state].emoji} ${ALBUM[code].name} #${num} → ${STATE[state].label}`);
  };

  const filtered = useMemo(() => {
    return Object.entries(stickers).filter(([code, teamStickers]) => {
      const team = ALBUM[code];
      const matchSearch = search === "" ||
        team.name.toLowerCase().includes(search.toLowerCase()) ||
        code.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;
      if (filter === "all") return true;
      return Object.values(teamStickers).some(s => s.state === filter);
    });
  }, [stickers, search, filter]);

  const NAV = [["album","📋","Álbum"],["scanner","📸","Escanear"],["marketplace","🏪","Market"],["profile","👤","Perfil"]];


  return (
    <div style={{ minHeight: "100vh", background: "#0a0f1e", color: "#e8eaf6", fontFamily: "'Segoe UI',system-ui,sans-serif", paddingBottom: 72 }}>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg,#0a0f1e,#111827)", borderBottom: "1px solid #1e2a3a", padding: "12px 16px", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: 720, margin: "0 auto", display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontSize: 22 }}>⚽</span>
          <span style={{ fontWeight: 900, fontSize: 18, background: "linear-gradient(90deg,#ffd700,#f59e0b)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>FiguSwap</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
            {[["d","días"],["h","h"],["m","m"]].map(([k,l]) => (
              <div key={k} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 14, fontWeight: 900, color: "#ffd700", fontVariantNumeric: "tabular-nums" }}>{String(countdown[k]||0).padStart(2,"0")}</div>
                <div style={{ fontSize: 8, color: "#4a5568" }}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: 16 }}>

        {/* ALBUM PAGE */}
        {page === "album" && (
          <>
            <AlbumStats stickers={stickers} />

            {/* Search + filter */}
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="🔍  Buscar selección..."
              style={{ width: "100%", boxSizing: "border-box", padding: "11px 14px", borderRadius: 10, border: "1px solid #1e2a3a", background: "#111827", color: "#e8eaf6", fontSize: 14, outline: "none", marginBottom: 10 }} />

            <div style={{ display: "flex", gap: 6, overflowX: "auto", marginBottom: 16, paddingBottom: 4 }}>
              {[["all","Todas"],["missing","❌ Faltan"],["have","✅ Tengo"],["repeated","🔁 Repetidas"],["sell","💰 Venta"],["trade","🔄 Cambio"],["auction","🔨 Subasta"]].map(([v,l]) => (
                <button key={v} onClick={() => setFilter(v)} style={{ padding: "6px 12px", borderRadius: 20, border: "1px solid", whiteSpace: "nowrap", borderColor: filter === v ? "#ffd700" : "#1e2a3a", background: filter === v ? "#ffd700" : "transparent", color: filter === v ? "#0a0f1e" : "#9ca3af", fontWeight: 700, fontSize: 12, cursor: "pointer", flexShrink: 0 }}>
                  {l}
                </button>
              ))}
            </div>

            {filtered.map(([code, teamStickers]) => (
              <TeamSection key={code} code={code} stickers={teamStickers} onAction={handleAction} onChat={setChat} />
            ))}
          </>
        )}

        {/* MARKETPLACE */}
        {page === "scanner" && <Scanner/>}
        {page === "marketplace" && (
          <div>
            <h2 style={{ fontWeight: 900, fontSize: 20, color: "#ffd700", margin: "0 0 4px" }}>🏪 Marketplace</h2>
            <p style={{ color: "#6b7280", fontSize: 13, marginBottom: 16 }}>Figuritas disponibles de otros coleccionistas</p>

            {/* My listings summary */}
            <div style={{ background: "#111827", border: "1px solid #1e2a3a", borderRadius: 14, padding: 16, marginBottom: 16 }}>
              <div style={{ fontWeight: 700, color: "#ffd700", marginBottom: 10 }}>📤 Mis publicaciones</div>
              {(() => {
                const myListings = [];
                Object.entries(stickers).forEach(([code, ts]) => {
                  Object.entries(ts).forEach(([num, s]) => {
                    if (["sell","trade","auction","repeated"].includes(s.state)) {
                      myListings.push({ code, num: parseInt(num), ...s });
                    }
                  });
                });
                if (myListings.length === 0) return <div style={{ color: "#4a5568", fontSize: 13 }}>Ninguna aún. Marca figuritas como 💰 Venta, 🔄 Cambio o 🔨 Subasta en tu álbum.</div>;
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {myListings.slice(0, 20).map((l, i) => (
                      <span key={i} style={{ padding: "4px 10px", borderRadius: 20, background: STATE[l.state].bg, border: `1px solid ${STATE[l.state].color}`, color: STATE[l.state].color, fontSize: 12, fontWeight: 700 }}>
                        {STATE[l.state].emoji} {l.code} #{l.num} {l.price > 0 ? `$${l.price}` : ""}
                      </span>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Mock global listings */}
            <div style={{ fontWeight: 700, color: "#e8eaf6", marginBottom: 10 }}>🌍 Disponibles globalmente</div>
            {[
              {user:"Carlos M.",flag:"🇲🇽",city:"Ciudad de México",team:"ARG",num:11,state:"sell",price:2.00,rating:4.9},
              {user:"Ana P.",flag:"🇧🇷",city:"São Paulo",team:"FRA",num:4,state:"trade",price:0,rating:5.0},
              {user:"Kenji T.",flag:"🇯🇵",city:"Tokio",team:"KOR",num:14,state:"sell",price:1.00,rating:5.0},
              {user:"Sophie L.",flag:"🇫🇷",city:"París",team:"MAR",num:13,state:"auction",price:3.00,rating:4.8},
              {user:"James K.",flag:"🇬🇧",city:"Londres",team:"FWC",num:4,state:"sell",price:5.00,rating:4.5},
            ].map((l, i) => {
              const iNeed = stickers[l.team]?.[l.num]?.state === "missing";
              return (
                <div key={i} style={{ background: iNeed ? "#0c1f3a" : "#111827", border: `1px solid ${iNeed ? "#3b82f6" : "#1e2a3a"}`, borderRadius: 14, padding: 16, marginBottom: 10 }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center", marginBottom: 10 }}>
                    <span style={{ fontSize: 28 }}>{ALBUM[l.team]?.emoji}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: "#e8eaf6" }}>{ALBUM[l.team]?.name} <span style={{ color: "#ffd700" }}>#{l.num}</span></div>
                      <div style={{ fontSize: 12, color: "#6b7280" }}>{l.flag} {l.user} · {l.city} · ⭐{l.rating}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 10, padding: "2px 8px", borderRadius: 10, background: STATE[l.state].bg, color: STATE[l.state].color, fontWeight: 700, border: `1px solid ${STATE[l.state].color}` }}>{STATE[l.state].emoji} {STATE[l.state].label}</div>
                      {l.price > 0 && <div style={{ fontWeight: 900, color: "#22c55e", fontSize: 16, marginTop: 4 }}>${l.price}</div>}
                    </div>
                  </div>
                  {iNeed && <div style={{ fontSize: 11, color: "#60a5fa", marginBottom: 8, fontWeight: 700 }}>⭐ ¡La necesitas!</div>}
                  <div style={{ display: "flex", gap: 8 }}>
                    {l.state !== "trade" && <button style={{ flex: 1, padding: "9px", background: "linear-gradient(135deg,#635bff,#4f46e5)", border: "none", borderRadius: 8, color: "#fff", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>💳 Comprar</button>}
                    {l.state !== "sell" && <button style={{ flex: 1, padding: "9px", background: "#1e3a5f", border: "1px solid #3b82f6", borderRadius: 8, color: "#60a5fa", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>🔄 Cambiar</button>}
                    <button onClick={() => setChat(l.team)} style={{ padding: "9px 12px", background: "#14532d", border: "1px solid #22c55e", borderRadius: 8, color: "#86efac", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>💬</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PROFILE */}
        {page === "profile" && (
          <div>
            <div style={{ background: "linear-gradient(135deg,#1a1040,#0a1a2e)", border: "1px solid #1e2a3a", borderRadius: 16, padding: 24, textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 52, marginBottom: 8 }}>🇭🇳</div>
              <div style={{ fontWeight: 900, fontSize: 20, color: "#fff" }}>Fernando Rivera</div>
              <div style={{ color: "#6b7280", fontSize: 13 }}>Tegucigalpa, Honduras</div>
              <div style={{ marginTop: 16, fontSize: 13, color: "#22c55e", background: "#052e16", padding: "6px 16px", borderRadius: 20, display: "inline-block", fontWeight: 700 }}>
                ✅ Supabase conectado
              </div>
            </div>
            <div style={{ background: "#111827", border: "1px solid #1e2a3a", borderRadius: 14, padding: 16 }}>
              <div style={{ fontWeight: 700, color: "#ffd700", marginBottom: 12 }}>⚙️ Próximos pasos</div>
              {[["Conectar Stripe","stripe.com","⭕"],["Dominio figuswap.com","namecheap.com","⭕"],["Activar pagos reales","vercel + stripe","⭕"]].map(([t,u,ic]) => (
                <div key={t} style={{ display: "flex", gap: 10, padding: "10px 0", borderBottom: "1px solid #1e2a3a", alignItems: "center" }}>
                  <span>{ic}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: "#e8eaf6", fontWeight: 600 }}>{t}</div>
                    <div style={{ fontSize: 11, color: "#4a5568" }}>{u}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{ position: "fixed", bottom: 0, left: 0, right: 0, background: "#0a0f1e", borderTop: "1px solid #1e2a3a", display: "flex", zIndex: 100 }}>
        {NAV.map(([p, ic, l]) => (
          <button key={p} onClick={() => setPage(p)} style={{ flex: 1, padding: "10px 0", background: "none", border: "none", color: page === p ? "#ffd700" : "#4a5568", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
            <span style={{ fontSize: 20 }}>{ic}</span>
            <span style={{ fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{l}</span>
          </button>
        ))}
      </div>

      {/* Chat modal */}
      {chat && <ChatModal code={chat} user="fjriveraa@gmail.com" onClose={() => setChat(null)} />}

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", bottom: 80, left: "50%", transform: "translateX(-50%)", background: "#111827", border: "1px solid #1e2a3a", color: "#e8eaf6", padding: "10px 20px", borderRadius: 24, fontWeight: 700, fontSize: 13, zIndex: 9999, whiteSpace: "nowrap", boxShadow: "0 4px 20px #0008" }}>
          {toast}
        </div>
      )}
    </div>
  );
}
