import { useState, useMemo, useEffect } from "react";
import Importer, { ShareModal } from "./Importer.jsx";
import Onboarding from "./Onboarding.jsx";
import Scanner from "./Scanner.jsx";

const SUPABASE_URL = "https://fythsgiofvodukjzutat.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dGhzZ2lvZnZvZHVranp1dGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTIyMDgsImV4cCI6MjA5NzEyODIwOH0.HaG8yQgc2BzEGnlaNXFWaLZ0c_Oa6CvhwcVjHj99-AY";

const STATE = {
  missing:  { color:"#ef4444", bg:"#1e0a0a", label:"Me falta",  emoji:"❌" },
  have:     { color:"#22c55e", bg:"#0a1e0a", label:"La tengo",  emoji:"✅" },
  repeated: { color:"#f97316", bg:"#1e0f00", label:"Repetida",  emoji:"🔁" },
  sell:     { color:"#fbbf24", bg:"#1e1500", label:"En venta",  emoji:"💰" },
  trade:    { color:"#60a5fa", bg:"#0a0f1e", label:"Cambio",    emoji:"🔄" },
  auction:  { color:"#a78bfa", bg:"#0f0a1e", label:"Subasta",   emoji:"🔨" },
};

const ALBUM = {
  FWC:{name:"FIFA World Cup",emoji:"🏆",total:20},MEX:{name:"México",emoji:"🇲🇽",total:20},
  RSA:{name:"South Africa",emoji:"🇿🇦",total:20},KOR:{name:"Korea Republic",emoji:"🇰🇷",total:20},
  CZE:{name:"Czechia",emoji:"🇨🇿",total:20},CAN:{name:"Canada",emoji:"🇨🇦",total:20},
  BIH:{name:"Bosnia-Herzegovina",emoji:"🇧🇦",total:20},QAT:{name:"Qatar",emoji:"🇶🇦",total:20},
  SUI:{name:"Switzerland",emoji:"🇨🇭",total:20},MAR:{name:"Morocco",emoji:"🇲🇦",total:20},
  HAI:{name:"Haiti",emoji:"🇭🇹",total:20},SCO:{name:"Scotland",emoji:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",total:20},
  USA:{name:"USA",emoji:"🇺🇸",total:20},PAR:{name:"Paraguay",emoji:"🇵🇾",total:20},
  AUS:{name:"Australia",emoji:"🇦🇺",total:20},TUR:{name:"Türkiye",emoji:"🇹🇷",total:20},
  GER:{name:"Germany",emoji:"🇩🇪",total:20},CUW:{name:"Curaçao",emoji:"🇨🇼",total:20},
  CIV:{name:"Côte d'Ivoire",emoji:"🇨🇮",total:20},ECU:{name:"Ecuador",emoji:"🇪🇨",total:20},
  NED:{name:"Netherlands",emoji:"🇳🇱",total:20},JPN:{name:"Japan",emoji:"🇯🇵",total:20},
  SWE:{name:"Sweden",emoji:"🇸🇪",total:20},TUN:{name:"Tunisia",emoji:"🇹🇳",total:20},
  BEL:{name:"Belgium",emoji:"🇧🇪",total:20},EGY:{name:"Egypt",emoji:"🇪🇬",total:20},
  IRN:{name:"IR Iran",emoji:"🇮🇷",total:20},NZL:{name:"New Zealand",emoji:"🇳🇿",total:20},
  ESP:{name:"Spain",emoji:"🇪🇸",total:20},CPV:{name:"Cabo Verde",emoji:"🇨🇻",total:20},
  KSA:{name:"Saudi Arabia",emoji:"🇸🇦",total:20},URU:{name:"Uruguay",emoji:"🇺🇾",total:20},
  FRA:{name:"France",emoji:"🇫🇷",total:20},SEN:{name:"Senegal",emoji:"🇸🇳",total:20},
  IRQ:{name:"Iraq",emoji:"🇮🇶",total:20},NOR:{name:"Norway",emoji:"🇳🇴",total:20},
  ARG:{name:"Argentina",emoji:"🇦🇷",total:20},AUT:{name:"Austria",emoji:"🇦🇹",total:20},
  JOR:{name:"Jordan",emoji:"🇯🇴",total:20},POR:{name:"Portugal",emoji:"🇵🇹",total:20},
  COD:{name:"Congo DR",emoji:"🇨🇩",total:20},UZB:{name:"Uzbekistan",emoji:"🇺🇿",total:20},
  COL:{name:"Colombia",emoji:"🇨🇴",total:20},ENG:{name:"England",emoji:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",total:20},
  CRO:{name:"Croatia",emoji:"🇭🇷",total:20},GHA:{name:"Ghana",emoji:"🇬🇭",total:20},
  PAN:{name:"Panama",emoji:"🇵🇦",total:20},CC:{name:"Coca-Cola",emoji:"🥤",total:14},
};

const buildEmpty = () => {
  const r = {};
  Object.entries(ALBUM).forEach(([code,team]) => {
    r[code] = {};
    for(let i=1;i<=team.total;i++) r[code][i]={state:"missing",qty:1,price:0};
  });
  return r;
};

const MOCK_CHATS = {
  ARG:[{user:"Carlos M.",emoji:"🇲🇽",msg:"Tengo ARG 20, necesito ARG 11",time:"10:23"},{user:"Ana P.",emoji:"🇧🇷",msg:"Yo tengo ARG 11!",time:"10:25"}],
  FWC:[{user:"Kenji T.",emoji:"🇯🇵",msg:"FWC 4 es muy difícil!",time:"08:45"},{user:"James K.",emoji:"🇬🇧",msg:"Yo la tengo repetida, $3",time:"08:50"}],
};

const WORLD_OPEN = new Date("2026-06-11T16:00:00Z");
function useCountdown() {
  const [t,setT]=useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{
    const tick=()=>{const diff=WORLD_OPEN-Date.now();if(diff<=0)return;setT({d:Math.floor(diff/864e5),h:Math.floor((diff%864e5)/36e5),m:Math.floor((diff%36e5)/6e4),s:Math.floor((diff%6e4)/1e3)});};
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);
  return t;
}

const sbAuth = {
  async signInWithGoogle() {
    window.location.href=`${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(window.location.origin)}`;
  },
  async signInWithEmail(email,password) {
    const res=await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    return res.json();
  },
  async signUp(email,password) {
    const res=await fetch(`${SUPABASE_URL}/auth/v1/signup`,{method:"POST",headers:{apikey:SUPABASE_KEY,"Content-Type":"application/json"},body:JSON.stringify({email,password})});
    return res.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`,{method:"POST",headers:{apikey:SUPABASE_KEY,Authorization:`Bearer ${token}`}});
  },
  getSessionFromHash() {
    const hash=window.location.hash;
    if(!hash||!hash.includes("access_token"))return null;
    const p=new URLSearchParams(hash.substring(1));
    const token=p.get("access_token");
    if(token){window.location.hash="";return{token,email:p.get("email")||""};}
    return null;
  },
  getStoredSession() { try{const s=localStorage.getItem("figuswap_session");return s?JSON.parse(s):null;}catch{return null;} },
  storeSession(s) { try{localStorage.setItem("figuswap_session",JSON.stringify(s));}catch{} },
  clearSession() { try{localStorage.removeItem("figuswap_session");}catch{} }
};

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({onAuth}) {
  const [mode,setMode]=useState("login");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  const handleEmail=async()=>{
    setLoading(true);setError("");
    try{
      if(mode==="login"){
        const r=await sbAuth.signInWithEmail(email,pass);
        if(r.access_token){const s={token:r.access_token,email:r.user?.email||email};sbAuth.storeSession(s);onAuth(s);}
        else setError(r.error_description||"Email o contraseña incorrectos");
      }else{
        const r=await sbAuth.signUp(email,pass);
        if(r.id||r.user?.id){setMode("login");setError("✅ Cuenta creada. Ya puedes entrar.");}
        else setError(r.error_description||"Error al registrarse");
      }
    }catch{setError("Error de conexión");}
    setLoading(false);
  };

  const inp={width:"100%",boxSizing:"border-box",padding:"12px 14px",borderRadius:10,border:"1px solid #1e2a3a",background:"#0a0f1e",color:"#e8eaf6",fontSize:14,outline:"none",marginBottom:10};

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{fontSize:52,marginBottom:8}}>⚽</div>
      <div style={{fontWeight:900,fontSize:28,background:"linear-gradient(90deg,#ffd700,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>FiguSwap</div>
      <div style={{color:"#6b7280",fontSize:13,marginBottom:28,textAlign:"center"}}>El marketplace global de figuritas FIFA WC 2026™</div>
      <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:16,padding:24,width:"100%",maxWidth:380}}>
        <button onClick={sbAuth.signInWithGoogle} style={{width:"100%",padding:"14px",background:"#fff",border:"1px solid #e5e7eb",borderRadius:10,color:"#1f2937",fontWeight:700,fontSize:15,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginBottom:16}}>
          <svg width="20" height="20" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
          Continuar con Google
        </button>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
          <div style={{flex:1,height:1,background:"#1e2a3a"}}/><span style={{fontSize:12,color:"#4a5568"}}>o con email</span><div style={{flex:1,height:1,background:"#1e2a3a"}}/>
        </div>
        <div style={{display:"flex",gap:8,marginBottom:16}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid",borderColor:mode===m?"#ffd700":"#1e2a3a",background:mode===m?"#ffd700":"transparent",color:mode===m?"#0a0f1e":"#9ca3af",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              {m==="login"?"Entrar":"Registrarse"}
            </button>
          ))}
        </div>
        <input style={inp} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={inp} type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)}/>
        {error&&<div style={{fontSize:12,marginBottom:10,padding:"8px 12px",background:error.startsWith("✅")?"#052e16":"#1e0a0a",borderRadius:8,color:error.startsWith("✅")?"#86efac":"#ef4444"}}>{error}</div>}
        <button onClick={handleEmail} disabled={loading} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,fontSize:15,cursor:"pointer",opacity:loading?0.7:1}}>
          {loading?"⏳ ...":(mode==="login"?"Entrar →":"Crear cuenta →")}
        </button>
      </div>
    </div>
  );
}

// ─── STICKER CELL ─────────────────────────────────────────────────────────────
function StickerCell({code,num,data,onAction}) {
  const [open,setOpen]=useState(false);
  const st=STATE[data.state];
  return (
    <div>
      <button onClick={()=>setOpen(!open)} style={{width:"100%",aspectRatio:"1",borderRadius:10,border:`2px solid ${st.color}`,background:st.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,position:"relative"}}>
        <span style={{fontSize:16,lineHeight:1}}>{st.emoji}</span>
        <span style={{fontSize:12,fontWeight:900,color:st.color}}>{num}</span>
        {data.state==="repeated"&&data.qty>1&&<span style={{position:"absolute",top:2,right:3,fontSize:9,fontWeight:800,color:"#f97316"}}>×{data.qty}</span>}
        {data.state==="sell"&&data.price>0&&<span style={{position:"absolute",bottom:2,fontSize:8,color:"#fbbf24",fontWeight:700}}>${data.price}</span>}
      </button>
      {open&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"#000a"}} onClick={()=>setOpen(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#111827",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:480,border:"1px solid #1e2a3a",borderBottom:"none"}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:26}}>{ALBUM[code]?.emoji}</div>
              <div style={{fontWeight:900,fontSize:17,color:"#fff"}}>{ALBUM[code]?.name} <span style={{color:"#ffd700"}}>#{num}</span></div>
              <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>Estado: <span style={{color:st.color,fontWeight:700}}>{st.label}</span></div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
              {Object.entries(STATE).map(([key,val])=>(
                <button key={key} onClick={()=>{onAction(code,num,key);setOpen(false);}} style={{padding:"10px 6px",borderRadius:10,border:`1px solid ${data.state===key?val.color:"#1e2a3a"}`,background:data.state===key?val.bg:"#0a0f1e",color:data.state===key?val.color:"#6b7280",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <span style={{fontSize:18}}>{val.emoji}</span><span>{val.label}</span>
                </button>
              ))}
            </div>
            {data.state==="repeated"&&(
              <div style={{background:"#0a0f1e",borderRadius:10,padding:12,marginBottom:12}}>
                <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>¿Cuántas tienes?</div>
                <div style={{display:"flex",gap:8,alignItems:"center",justifyContent:"center"}}>
                  <button onClick={()=>onAction(code,num,"repeated",Math.max(1,data.qty-1))} style={{width:36,height:36,borderRadius:8,background:"#1e2a3a",border:"1px solid #374151",color:"#fff",fontSize:18,cursor:"pointer"}}>−</button>
                  <span style={{fontSize:24,fontWeight:900,color:"#f97316",width:40,textAlign:"center"}}>{data.qty}</span>
                  <button onClick={()=>onAction(code,num,"repeated",data.qty+1)} style={{width:36,height:36,borderRadius:8,background:"#1e2a3a",border:"1px solid #374151",color:"#fff",fontSize:18,cursor:"pointer"}}>+</button>
                </div>
              </div>
            )}
            {(data.state==="sell"||data.state==="auction")&&(
              <div style={{background:"#0a0f1e",borderRadius:10,padding:12,marginBottom:12}}>
                <div style={{fontSize:12,color:"#6b7280",marginBottom:8}}>Precio (USD)</div>
                <div style={{display:"flex",gap:8,alignItems:"center"}}>
                  <span style={{color:"#6b7280"}}>$</span>
                  <input type="number" defaultValue={data.price||1} min={0.5} step={0.5} onChange={e=>onAction(code,num,data.state,data.qty,parseFloat(e.target.value))} style={{flex:1,background:"#111827",border:"1px solid #1e2a3a",borderRadius:8,color:"#ffd700",fontSize:20,fontWeight:700,padding:"8px 12px",outline:"none"}}/>
                </div>
              </div>
            )}
            <button onClick={()=>setOpen(false)} style={{width:"100%",padding:12,background:"transparent",border:"1px solid #1e2a3a",borderRadius:10,color:"#6b7280",fontWeight:700,cursor:"pointer"}}>Cerrar</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── TEAM SECTION ─────────────────────────────────────────────────────────────
function TeamSection({code,stickers,onAction,onChat}) {
  const [expanded,setExpanded]=useState(false);
  const team=ALBUM[code];
  const nums=Object.keys(stickers).map(Number);
  const have=nums.filter(n=>stickers[n].state!=="missing").length;
  const pct=Math.round(have/team.total*100);
  const missing=nums.filter(n=>stickers[n].state==="missing").length;
  const repeated=nums.filter(n=>stickers[n].state==="repeated").length;
  const forSale=nums.filter(n=>["sell","auction","trade"].includes(stickers[n].state)).length;
  const complete=pct===100;
  return (
    <div style={{background:complete?"#052e16":"#0d1117",border:`1px solid ${complete?"#22c55e":"#1e2a3a"}`,borderRadius:16,overflow:"hidden",marginBottom:10}}>
      <button onClick={()=>setExpanded(!expanded)} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:26}}>{team.emoji}</span>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontWeight:800,fontSize:15,color:complete?"#86efac":"#e8eaf6"}}>{team.name}</div>
          <div style={{display:"flex",gap:8,marginTop:3,flexWrap:"wrap"}}>
            {missing>0&&<span style={{fontSize:11,color:"#ef4444"}}>❌ {missing}</span>}
            {repeated>0&&<span style={{fontSize:11,color:"#f97316"}}>🔁 {repeated}</span>}
            {forSale>0&&<span style={{fontSize:11,color:"#fbbf24"}}>💰 {forSale}</span>}
            {complete&&<span style={{fontSize:11,color:"#22c55e",fontWeight:700}}>✅ Completo!</span>}
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          <div style={{fontWeight:800,fontSize:16,color:complete?"#22c55e":pct>=75?"#84cc16":pct>=50?"#eab308":"#ef4444"}}>{pct}%</div>
          <div style={{fontSize:11,color:"#4a5568"}}>{have}/{team.total}</div>
        </div>
        <span style={{color:"#4a5568",fontSize:12}}>{expanded?"▲":"▼"}</span>
      </button>
      <div style={{height:3,background:"#1e2a3a",margin:"0 16px"}}>
        <div style={{height:"100%",width:`${pct}%`,background:complete?"#22c55e":"#ffd700",borderRadius:2,transition:"width 0.3s"}}/>
      </div>
      {expanded&&(
        <div style={{padding:16}}>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:12}}>
            {Object.entries(STATE).map(([k,v])=>(<span key={k} style={{fontSize:10,color:v.color,display:"flex",alignItems:"center",gap:3}}>{v.emoji} {v.label}</span>))}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
            {nums.map(n=>(<StickerCell key={n} code={code} num={n} data={stickers[n]} onAction={onAction}/>))}
          </div>
          <button onClick={()=>onChat(code)} style={{width:"100%",padding:"10px",background:"#0a1a2e",border:"1px solid #1e3a5f",borderRadius:10,color:"#60a5fa",fontWeight:700,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
            💬 Chat {team.name} · {MOCK_CHATS[code]?.length||0} mensajes
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CHAT MODAL ───────────────────────────────────────────────────────────────
function ChatModal({code,userEmail,onClose}) {
  const team=ALBUM[code];
  const [msgs,setMsgs]=useState(MOCK_CHATS[code]||[]);
  const [input,setInput]=useState("");
  const send=()=>{
    if(!input.trim())return;
    setMsgs(m=>[...m,{user:userEmail?.split("@")[0]||"Tú",emoji:"⚽",msg:input.trim(),time:new Date().toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}]);
    setInput("");
  };
  return (
    <div style={{position:"fixed",inset:0,background:"#000c",zIndex:300,display:"flex",flexDirection:"column"}}>
      <div style={{background:"#111827",borderBottom:"1px solid #1e2a3a",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>←</button>
        <span style={{fontSize:24}}>{team?.emoji}</span>
        <div><div style={{fontWeight:800,color:"#e8eaf6"}}>Chat {team?.name}</div><div style={{fontSize:11,color:"#6b7280"}}>{msgs.length} mensajes · coleccionistas globales</div></div>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:16,display:"flex",flexDirection:"column",gap:10,background:"#0a0f1e"}}>
        {msgs.length===0&&<div style={{textAlign:"center",color:"#374151",padding:32}}><div style={{fontSize:32}}>💬</div><div style={{marginTop:8}}>Sé el primero en escribir</div></div>}
        {msgs.map((m,i)=>{
          const isMe=m.user===(userEmail?.split("@")[0]||"Tú");
          return (
            <div key={i} style={{display:"flex",justifyContent:isMe?"flex-end":"flex-start",gap:8,alignItems:"flex-end"}}>
              {!isMe&&<span style={{fontSize:18}}>{m.emoji}</span>}
              <div style={{maxWidth:"75%"}}>
                {!isMe&&<div style={{fontSize:10,color:"#6b7280",marginBottom:3}}>{m.user}</div>}
                <div style={{padding:"10px 14px",borderRadius:isMe?"18px 18px 4px 18px":"18px 18px 18px 4px",background:isMe?"#1e3a5f":"#111827",border:`1px solid ${isMe?"#3b82f6":"#1e2a3a"}`,color:"#e8eaf6",fontSize:14}}>{m.msg}</div>
                <div style={{fontSize:10,color:"#374151",marginTop:2,textAlign:isMe?"right":"left"}}>{m.time}</div>
              </div>
            </div>
          );
        })}
      </div>
      <div style={{background:"#111827",borderTop:"1px solid #1e2a3a",padding:"12px 16px",display:"flex",gap:8}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escribe un mensaje..." style={{flex:1,background:"#0a0f1e",border:"1px solid #1e2a3a",borderRadius:20,padding:"10px 16px",color:"#e8eaf6",fontSize:14,outline:"none"}}/>
        <button onClick={send} style={{padding:"10px 18px",background:"linear-gradient(135deg,#3b82f6,#1d4ed8)",border:"none",borderRadius:20,color:"#fff",fontWeight:700,cursor:"pointer",fontSize:16}}>➤</button>
      </div>
    </div>
  );
}

// ─── ALBUM STATS ──────────────────────────────────────────────────────────────
function AlbumStats({stickers,onShare,onImport}) {
  const counts={missing:0,have:0,repeated:0,sell:0,trade:0,auction:0};
  Object.values(stickers).forEach(team=>{Object.values(team).forEach(s=>{counts[s.state]=(counts[s.state]||0)+1;});});
  const total=Object.values(ALBUM).reduce((s,t)=>s+t.total,0);
  const pct=Math.round((counts.have+counts.repeated+counts.sell+counts.trade+counts.auction)/total*100);
  return (
    <div style={{background:"#0d1117",border:"1px solid #1e2a3a",borderRadius:16,padding:16,marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
        <span style={{fontWeight:800,color:"#e8eaf6",fontSize:15}}>📋 Mi Álbum FIFA WC 2026</span>
        <span style={{fontWeight:900,color:"#ffd700",fontSize:18}}>{pct}%</span>
      </div>
      <div style={{height:8,background:"#1e2a3a",borderRadius:4,overflow:"hidden",marginBottom:12}}>
        <div style={{height:"100%",width:`${pct}%`,background:"linear-gradient(90deg,#ffd700,#f59e0b)",borderRadius:4}}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6,marginBottom:12}}>
        {[["❌",counts.missing,"#ef4444","Faltan"],["✅",counts.have,"#22c55e","Tengo"],["🔁",counts.repeated,"#f97316","Repetidas"],["💰",counts.sell,"#fbbf24","En venta"],["🔄",counts.trade,"#60a5fa","Cambio"],["🔨",counts.auction,"#a78bfa","Subasta"]].map(([ic,val,color,label])=>(
          <div key={label} style={{background:"#0a0f1e",borderRadius:8,padding:"8px 6px",textAlign:"center"}}>
            <div style={{fontSize:16}}>{ic}</div>
            <div style={{fontWeight:900,color,fontSize:16}}>{val}</div>
            <div style={{fontSize:9,color:"#4a5568",textTransform:"uppercase"}}>{label}</div>
          </div>
        ))}
      </div>
      <div style={{display:"flex",gap:8}}>
        <button onClick={onShare} style={{flex:1,padding:"9px",background:"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,fontSize:12,cursor:"pointer"}}>
          📤 Compartir lista
        </button>
        <button onClick={onImport} style={{flex:1,padding:"9px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:8,color:"#9ca3af",fontWeight:700,fontSize:12,cursor:"pointer"}}>
          📋 Importar lista
        </button>
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function FiguSwap() {
  const [session,setSession]=useState(null);
  const [page,setPage]=useState("album");
  const [stickers,setStickers]=useState(buildEmpty);
  const [search,setSearch]=useState("");
  const [filter,setFilter]=useState("all");
  const [chat,setChat]=useState(null);
  const [toast,setToast]=useState(null);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [showImporter,setShowImporter]=useState(false);
  const [showShare,setShowShare]=useState(false);
  const countdown=useCountdown();

  useEffect(()=>{
    const fromHash=sbAuth.getSessionFromHash();
    if(fromHash){sbAuth.storeSession(fromHash);setSession(fromHash);return;}
    const stored=sbAuth.getStoredSession();
    if(stored)setSession(stored);
  },[]);

  useEffect(()=>{
    if(!session)return;
    try{
      const key=`figuswap_stickers_${session.email}`;
      const s=localStorage.getItem(key);
      if(s)setStickers(JSON.parse(s));
      else{setStickers(buildEmpty());setShowOnboarding(true);}
    }catch{setStickers(buildEmpty());}
  },[session]);

  useEffect(()=>{
    if(!session)return;
    try{localStorage.setItem(`figuswap_stickers_${session.email}`,JSON.stringify(stickers));}catch{}
  },[stickers,session]);

  const showToast=msg=>{setToast(msg);setTimeout(()=>setToast(null),2000);};

  const handleAction=(code,num,state,qty,price)=>{
    setStickers(prev=>({...prev,[code]:{...prev[code],[num]:{state,qty:qty??prev[code][num].qty,price:price??prev[code][num].price}}}));
    showToast(`${STATE[state].emoji} ${ALBUM[code].name} #${num} → ${STATE[state].label}`);
  };

  const handleOnboardingChoice=(choice)=>{
    setShowOnboarding(false);
    if(choice==="import") setShowImporter(true);
    else if(choice==="scan") setPage("scanner");
  };

  const handleImport=(album)=>{
    setStickers(album);
    showToast("✅ ¡Álbum importado exitosamente!");
  };

  const filtered=useMemo(()=>Object.entries(stickers).filter(([code,ts])=>{
    const team=ALBUM[code];
    const ms=search===""||team.name.toLowerCase().includes(search.toLowerCase())||code.toLowerCase().includes(search.toLowerCase());
    if(!ms)return false;
    if(filter==="all")return true;
    return Object.values(ts).some(s=>s.state===filter);
  }),[stickers,search,filter]);

  const userNeeded=useMemo(()=>{
    const r={};
    Object.entries(stickers).forEach(([code,nums])=>{
      const missing=Object.entries(nums).filter(([,s])=>s.state==="missing").map(([n])=>parseInt(n));
      if(missing.length>0)r[code]=missing;
    });
    return r;
  },[stickers]);

  if(!session) return <AuthPage onAuth={s=>{setSession(s);sbAuth.storeSession(s);}}/>;

  const NAV=[["album","📋","Álbum"],["scanner","📸","Escanear"],["marketplace","🏪","Market"],["profile","👤","Perfil"]];

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",color:"#e8eaf6",fontFamily:"'Segoe UI',system-ui,sans-serif",paddingBottom:72}}>
      {/* Header */}
      <div style={{background:"linear-gradient(135deg,#0a0f1e,#111827)",borderBottom:"1px solid #1e2a3a",padding:"12px 16px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:720,margin:"0 auto",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>⚽</span>
          <span style={{fontWeight:900,fontSize:18,background:"linear-gradient(90deg,#ffd700,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FiguSwap</span>
          <div style={{marginLeft:"auto",display:"flex",gap:12}}>
            {[["d","días"],["h","h"],["m","m"]].map(([k,l])=>(
              <div key={k} style={{textAlign:"center"}}>
                <div style={{fontSize:14,fontWeight:900,color:"#ffd700",fontVariantNumeric:"tabular-nums"}}>{String(countdown[k]||0).padStart(2,"0")}</div>
                <div style={{fontSize:8,color:"#4a5568"}}>{l}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{maxWidth:720,margin:"0 auto",padding:16}}>
        {/* ALBUM */}
        {page==="album"&&(
          <>
            <AlbumStats stickers={stickers} onShare={()=>setShowShare(true)} onImport={()=>setShowImporter(true)}/>
            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Buscar selección..." style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",borderRadius:10,border:"1px solid #1e2a3a",background:"#111827",color:"#e8eaf6",fontSize:14,outline:"none",marginBottom:10}}/>
            <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:16,paddingBottom:4}}>
              {[["all","Todas"],["missing","❌ Faltan"],["have","✅ Tengo"],["repeated","🔁 Repetidas"],["sell","💰 Venta"],["trade","🔄 Cambio"],["auction","🔨 Subasta"]].map(([v,l])=>(
                <button key={v} onClick={()=>setFilter(v)} style={{padding:"6px 12px",borderRadius:20,border:"1px solid",whiteSpace:"nowrap",borderColor:filter===v?"#ffd700":"#1e2a3a",background:filter===v?"#ffd700":"transparent",color:filter===v?"#0a0f1e":"#9ca3af",fontWeight:700,fontSize:12,cursor:"pointer",flexShrink:0}}>{l}</button>
              ))}
            </div>
            {filtered.map(([code,ts])=>(<TeamSection key={code} code={code} stickers={ts} onAction={handleAction} onChat={setChat}/>))}
          </>
        )}

        {/* SCANNER */}
        {page==="scanner"&&<Scanner userNeeded={userNeeded} onUpdateAlbum={(code,num,state)=>handleAction(code,num,state)}/>}

        {/* MARKETPLACE */}
        {page==="marketplace"&&(
          <div>
            <h2 style={{fontWeight:900,fontSize:20,color:"#ffd700",margin:"0 0 4px"}}>🏪 Marketplace Global</h2>
            <p style={{color:"#6b7280",fontSize:13,marginBottom:16}}>Próximamente — figuritas de coleccionistas de todo el mundo</p>
            <div style={{background:"#111827",border:"1px dashed #1e2a3a",borderRadius:14,padding:32,textAlign:"center"}}>
              <div style={{fontSize:40,marginBottom:12}}>🌍</div>
              <div style={{fontWeight:700,color:"#e8eaf6",marginBottom:8}}>Marketplace en construcción</div>
              <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Mientras tanto, comparte tu lista con amigos para coordinar cambios.</div>
              <button onClick={()=>setShowShare(true)} style={{padding:"12px 24px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,fontWeight:800,fontSize:14,cursor:"pointer",color:"#0a0f1e"}}>
                📤 Compartir mi lista
              </button>
            </div>
          </div>
        )}

        {/* PROFILE */}
        {page==="profile"&&(
          <div>
            <div style={{background:"linear-gradient(135deg,#1a1040,#0a1a2e)",border:"1px solid #1e2a3a",borderRadius:16,padding:24,textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>👤</div>
              <div style={{fontWeight:900,fontSize:20,color:"#fff"}}>{session.email?.split("@")[0]}</div>
              <div style={{color:"#6b7280",fontSize:13,marginBottom:12}}>{session.email}</div>
              <div style={{fontSize:13,color:"#22c55e",background:"#052e16",padding:"6px 16px",borderRadius:20,display:"inline-block",fontWeight:700}}>✅ Conectado con Google</div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:16}}>
              <button onClick={()=>setShowShare(true)} style={{flex:1,padding:"13px",background:"#14532d",border:"1px solid #22c55e",borderRadius:12,color:"#86efac",fontWeight:700,cursor:"pointer"}}>📤 Compartir lista</button>
              <button onClick={()=>setShowImporter(true)} style={{flex:1,padding:"13px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:12,color:"#9ca3af",fontWeight:700,cursor:"pointer"}}>📋 Importar lista</button>
            </div>
            <button onClick={async()=>{await sbAuth.signOut(session.token);sbAuth.clearSession();setSession(null);setStickers(buildEmpty());}} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #ef4444",borderRadius:10,color:"#ef4444",fontWeight:700,cursor:"pointer",fontSize:14}}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0f1e",borderTop:"1px solid #1e2a3a",display:"flex",zIndex:100}}>
        {NAV.map(([p,ic,l])=>(
          <button key={p} onClick={()=>setPage(p)} style={{flex:1,padding:"10px 0",background:"none",border:"none",color:page===p?"#ffd700":"#4a5568",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:20}}>{ic}</span>
            <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{l}</span>
          </button>
        ))}
      </div>

      {/* Modals */}
      {showOnboarding&&<Onboarding onChoice={handleOnboardingChoice}/>}
      {showImporter&&<Importer onImport={handleImport} onClose={()=>setShowImporter(false)}/>}
      {showShare&&<ShareModal stickers={stickers} username={session.email?.split("@")[0]} onClose={()=>setShowShare(false)}/>}
      {chat&&<ChatModal code={chat} userEmail={session.email} onClose={()=>setChat(null)}/>}
      {toast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#111827",border:"1px solid #1e2a3a",color:"#e8eaf6",padding:"10px 20px",borderRadius:24,fontWeight:700,fontSize:13,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 4px 20px #0008"}}>{toast}</div>}
    </div>
  );
}
