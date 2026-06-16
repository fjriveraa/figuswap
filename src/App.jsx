import { useState, useMemo, useEffect, useCallback, useRef } from "react";
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

const WORLD_FINAL = new Date("2026-07-19T20:00:00Z");
function useCountdown() {
  const [t,setT]=useState({d:0,h:0,m:0,s:0});
  useEffect(()=>{
    const tick=()=>{const diff=WORLD_FINAL-Date.now();if(diff<=0)return;setT({d:Math.floor(diff/864e5),h:Math.floor((diff%864e5)/36e5),m:Math.floor((diff%36e5)/6e4),s:Math.floor((diff%6e4)/1e3)});};
    tick();const id=setInterval(tick,1000);return()=>clearInterval(id);
  },[]);
  return t;
}

// ─── SUPABASE DB ──────────────────────────────────────────────────────────────
const db = {
  h: { apikey:SUPABASE_KEY, Authorization:`Bearer ${SUPABASE_KEY}`, "Content-Type":"application/json" },

  async saveAlbum(email, stickers, username) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/albums`, {
        method:"POST",
        headers:{...this.h, Prefer:"resolution=merge-duplicates,return=minimal"},
        body:JSON.stringify({user_email:email, username:username||email.split("@")[0], stickers, updated_at:new Date().toISOString()})
      });
    } catch {}
  },

  async getAlbum(email) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/albums?user_email=eq.${encodeURIComponent(email)}&select=*`, {headers:this.h});
      const data = await res.json();
      return data?.[0]||null;
    } catch { return null; }
  },

  async sendRequest(fromEmail, toEmail) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method:"POST",
        headers:{...this.h, Prefer:"resolution=ignore-duplicates,return=minimal"},
        body:JSON.stringify({user_email:fromEmail, contact_email:toEmail, status:"pending"})
      });
      return res.ok;
    } catch { return false; }
  },

  async acceptRequest(myEmail, requesterEmail) {
    try {
      // Update their request to accepted
      await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(requesterEmail)}&contact_email=eq.${encodeURIComponent(myEmail)}`, {
        method:"PATCH", headers:{...this.h, Prefer:"return=minimal"}, body:JSON.stringify({status:"accepted"})
      });
      // Create my side accepted
      await fetch(`${SUPABASE_URL}/rest/v1/contacts`, {
        method:"POST",
        headers:{...this.h, Prefer:"resolution=merge-duplicates,return=minimal"},
        body:JSON.stringify({user_email:myEmail, contact_email:requesterEmail, status:"accepted"})
      });
      return true;
    } catch { return false; }
  },

  async rejectRequest(myEmail, requesterEmail) {
    try {
      await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(requesterEmail)}&contact_email=eq.${encodeURIComponent(myEmail)}`, {
        method:"PATCH", headers:{...this.h, Prefer:"return=minimal"}, body:JSON.stringify({status:"rejected"})
      });
      return true;
    } catch { return false; }
  },

  async getPendingRequests(myEmail) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?contact_email=eq.${encodeURIComponent(myEmail)}&status=eq.pending&select=user_email,created_at`, {headers:this.h});
      return await res.json()||[];
    } catch { return []; }
  },

  async getAcceptedContacts(myEmail) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(myEmail)}&status=eq.accepted&select=contact_email`, {headers:this.h});
      const data = await res.json();
      return data?.map(d=>d.contact_email)||[];
    } catch { return []; }
  },

  async getContactAlbums(contacts) {
    if(!contacts.length) return [];
    try {
      const emails = contacts.map(e=>`"${e}"`).join(",");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/albums?user_email=in.(${emails})&select=user_email,username,stickers,updated_at`, {headers:this.h});
      return await res.json()||[];
    } catch { return []; }
  },

  async getMyRequests(myEmail) {
    try {
      const res = await fetch(`${SUPABASE_URL}/rest/v1/contacts?user_email=eq.${encodeURIComponent(myEmail)}&select=contact_email,status`, {headers:this.h});
      return await res.json()||[];
    } catch { return []; }
  }
};

// ─── AUTH ─────────────────────────────────────────────────────────────────────
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
  const inp={width:"100%",boxSizing:"border-box",padding:"12px 14px",borderRadius:10,border:"1px solid #1e2a3a",background:"#0a0f1e",color:"#e8eaf6",fontSize:14,outline:"none",marginBottom:10};
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

// ─── STICKER CELL — TAP TO CYCLE ─────────────────────────────────────────────
function StickerCell({code,num,data,onAction}) {
  const pressTimer = useRef(null);
  const [pressing,setPressing]=useState(false);

  const handleTap = () => {
    if(pressing) return;
    // Cycle: missing → have → repeated(+1) → repeated(+1)...
    if(data.state === "missing") {
      onAction(code, num, "have", 1, 0);
    } else if(data.state === "have") {
      onAction(code, num, "repeated", 1, 0);
    } else if(data.state === "repeated") {
      onAction(code, num, "repeated", data.qty + 1, 0);
    } else {
      // sell/trade/auction — open modal instead
      setOpen(true);
    }
  };

  const handleLongPress = () => {
    // Long press = subtract 1
    if(data.state === "repeated") {
      const newQty = data.qty - 1;
      if(newQty <= 0) onAction(code, num, "missing", 1, 0);
      else onAction(code, num, "repeated", newQty, 0);
    } else if(data.state === "have") {
      onAction(code, num, "missing", 1, 0);
    }
  };

  const onPressStart = () => {
    pressTimer.current = setTimeout(() => {
      setPressing(true);
      handleLongPress();
      setTimeout(() => setPressing(false), 300);
    }, 500);
  };

  const onPressEnd = () => {
    if(pressTimer.current) clearTimeout(pressTimer.current);
  };

  const [open,setOpen]=useState(false);
  const st=STATE[data.state];

  return (
    <div>
      <button
        onClick={handleTap}
        onMouseDown={onPressStart}
        onMouseUp={onPressEnd}
        onTouchStart={onPressStart}
        onTouchEnd={onPressEnd}
        onContextMenu={e=>{e.preventDefault();setOpen(true);}}
        style={{width:"100%",aspectRatio:"1",borderRadius:10,border:`2px solid ${st.color}`,background:pressing?"#333":st.bg,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2,position:"relative",transition:"background 0.1s"}}
      >
        <span style={{fontSize:16,lineHeight:1}}>{st.emoji}</span>
        <span style={{fontSize:12,fontWeight:900,color:st.color}}>{num}</span>
        {data.state==="repeated"&&<span style={{position:"absolute",top:2,right:3,fontSize:9,fontWeight:800,color:"#f97316",background:"#1e0f00",borderRadius:4,padding:"0 2px"}}>×{data.qty}</span>}
        {data.state==="sell"&&data.price>0&&<span style={{position:"absolute",bottom:2,fontSize:8,color:"#fbbf24",fontWeight:700}}>${data.price}</span>}
      </button>

      {/* Long press hint */}
      {(data.state==="repeated"||data.state==="have")&&(
        <div style={{fontSize:8,color:"#374151",textAlign:"center",marginTop:1}}>mantén=restar</div>
      )}

      {/* Full modal for sell/trade/auction */}
      {open&&(
        <div style={{position:"fixed",inset:0,zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center",background:"#000a"}} onClick={()=>setOpen(false)}>
          <div onClick={e=>e.stopPropagation()} style={{background:"#111827",borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxWidth:480,border:"1px solid #1e2a3a",borderBottom:"none"}}>
            <div style={{textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:26}}>{ALBUM[code]?.emoji}</div>
              <div style={{fontWeight:900,fontSize:17,color:"#fff"}}>{ALBUM[code]?.name} <span style={{color:"#ffd700"}}>#{num}</span></div>
              <div style={{fontSize:12,color:"#6b7280",marginTop:4}}>Toca para cambiar estado</div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
              {Object.entries(STATE).map(([key,val])=>(
                <button key={key} onClick={()=>{onAction(code,num,key);setOpen(false);}} style={{padding:"10px 6px",borderRadius:10,border:`1px solid ${data.state===key?val.color:"#1e2a3a"}`,background:data.state===key?val.bg:"#0a0f1e",color:data.state===key?val.color:"#6b7280",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                  <span style={{fontSize:18}}>{val.emoji}</span><span>{val.label}</span>
                </button>
              ))}
            </div>
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
function TeamSection({code,stickers,tab,onAction,onChat}) {
  const [expanded,setExpanded]=useState(false);
  const team=ALBUM[code];
  const allNums=Object.keys(stickers).map(Number);
  const visibleNums=tab==="missing"?allNums.filter(n=>stickers[n].state==="missing"):tab==="repeated"?allNums.filter(n=>stickers[n].state==="repeated"):allNums;
  if(visibleNums.length===0)return null;
  const have=allNums.filter(n=>stickers[n].state!=="missing").length;
  const pct=Math.round(have/team.total*100);
  const complete=pct===100;
  return (
    <div style={{background:complete?"#052e16":"#0d1117",border:`1px solid ${complete?"#22c55e":"#1e2a3a"}`,borderRadius:16,overflow:"hidden",marginBottom:10}}>
      <button onClick={()=>setExpanded(!expanded)} style={{width:"100%",padding:"14px 16px",background:"none",border:"none",cursor:"pointer",display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:26}}>{team.emoji}</span>
        <div style={{flex:1,textAlign:"left"}}>
          <div style={{fontWeight:800,fontSize:15,color:complete?"#86efac":"#e8eaf6"}}>{team.name}</div>
          <div style={{fontSize:12,color:"#6b7280",marginTop:2}}>
            {tab==="missing"&&`❌ ${visibleNums.length} faltantes`}
            {tab==="repeated"&&`🔁 ${visibleNums.length} repetidas`}
            {tab==="all"&&`${have}/${team.total} · ❌${allNums.filter(n=>stickers[n].state==="missing").length} 🔁${allNums.filter(n=>stickers[n].state==="repeated").length}`}
            {complete&&" ✅ Completo"}
          </div>
        </div>
        <div style={{fontWeight:800,fontSize:15,color:complete?"#22c55e":pct>=75?"#84cc16":pct>=50?"#eab308":"#ef4444"}}>{pct}%</div>
        <span style={{color:"#4a5568",fontSize:12}}>{expanded?"▲":"▼"}</span>
      </button>
      <div style={{height:3,background:"#1e2a3a",margin:"0 16px"}}>
        <div style={{height:"100%",width:`${pct}%`,background:complete?"#22c55e":"#ffd700",borderRadius:2}}/>
      </div>
      {expanded&&(
        <div style={{padding:16}}>
          {(tab==="missing"||tab==="repeated")&&(
            <div style={{fontSize:11,color:"#4a5568",marginBottom:10}}>
              {tab==="missing"?"👆 Toca para marcar como ✅ tengo":"👆 Toca para sumar repetidas · Mantén para restar"}
            </div>
          )}
          {tab==="all"&&<div style={{fontSize:11,color:"#4a5568",marginBottom:10}}>👆 Toca para ciclar estado · Mantén para restar</div>}
          <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
            {visibleNums.map(n=>(<StickerCell key={n} code={code} num={n} data={stickers[n]} onAction={onAction}/>))}
          </div>
          <button onClick={()=>onChat(code)} style={{width:"100%",padding:"10px",background:"#0a1a2e",border:"1px solid #1e3a5f",borderRadius:10,color:"#60a5fa",fontWeight:700,fontSize:13,cursor:"pointer"}}>
            💬 Chat {team.name}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── CONTACTS PAGE ────────────────────────────────────────────────────────────
function ContactsPage({myEmail,myStickers,onClose}) {
  const [pending,setPending]=useState([]);
  const [contacts,setContacts]=useState([]);
  const [contactAlbums,setContactAlbums]=useState([]);
  const [myRequests,setMyRequests]=useState([]);
  const [loading,setLoading]=useState(true);
  const [addEmail,setAddEmail]=useState("");
  const [adding,setAdding]=useState(false);
  const [selected,setSelected]=useState(null);
  const [copied,setCopied]=useState(false);
  const [actionMsg,setActionMsg]=useState("");

  const myLink=`${window.location.origin}?invite=${encodeURIComponent(myEmail)}`;

  const load=useCallback(async()=>{
    setLoading(true);
    const [pend,accepted,myReqs]=await Promise.all([
      db.getPendingRequests(myEmail),
      db.getAcceptedContacts(myEmail),
      db.getMyRequests(myEmail),
    ]);
    setPending(pend);
    setContacts(accepted);
    setMyRequests(myReqs);
    if(accepted.length>0||pend.length>0){
      const allEmails=[...accepted,...pend.map(p=>p.user_email)];
      const albums=await db.getContactAlbums(allEmails);
      setContactAlbums(albums);
    }
    setLoading(false);
  },[myEmail]);

  useEffect(()=>{load();},[load]);

  const showMsg=(msg)=>{setActionMsg(msg);setTimeout(()=>setActionMsg(""),2500);};

  const copyLink=()=>{navigator.clipboard.writeText(myLink).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);});};
  const shareWhatsApp=()=>{
    const text=`¡Únete a mi red en FiguSwap para intercambiar figuritas del Mundial 2026! ⚽🎴\n\nMi link: ${myLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");
  };

  const sendRequest=async()=>{
    if(!addEmail.trim()||addEmail===myEmail)return;
    setAdding(true);
    const ok=await db.sendRequest(myEmail,addEmail.trim());
    if(ok)showMsg(`✅ Solicitud enviada a ${addEmail.split("@")[0]}`);
    else showMsg("⚠️ Error al enviar solicitud");
    setAddEmail("");
    await load();
    setAdding(false);
  };

  const acceptReq=async(requesterEmail)=>{
    await db.acceptRequest(myEmail,requesterEmail);
    showMsg(`✅ ¡Conectado con ${requesterEmail.split("@")[0]}!`);
    await load();
  };

  const rejectReq=async(requesterEmail)=>{
    await db.rejectRequest(myEmail,requesterEmail);
    showMsg("Solicitud rechazada");
    await load();
  };

  const getMatches=(friendStickers)=>{
    if(!friendStickers)return{iHave:[],theyHave:[]};
    const iHave=[],theyHave=[];
    Object.entries(myStickers).forEach(([code,nums])=>{
      Object.entries(nums).forEach(([num,s])=>{
        const n=parseInt(num);
        if((s.state==="repeated"||s.state==="sell"||s.state==="trade")&&friendStickers[code]?.[n]?.state==="missing") iHave.push({code,num:n,myState:s.state});
        if(s.state==="missing"&&(friendStickers[code]?.[n]?.state==="repeated"||friendStickers[code]?.[n]?.state==="sell"||friendStickers[code]?.[n]?.state==="trade")) theyHave.push({code,num:n,theirState:friendStickers[code][n].state});
      });
    });
    return{iHave,theyHave};
  };

  const getRepeatedCount=(st)=>{
    if(!st)return 0;
    return Object.values(st).reduce((s,team)=>s+Object.values(team).filter(x=>["repeated","sell","trade"].includes(x.state)).length,0);
  };

  return (
    <div style={{position:"fixed",inset:0,background:"#0a0f1e",zIndex:500,display:"flex",flexDirection:"column"}}>
      <div style={{background:"#111827",borderBottom:"1px solid #1e2a3a",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
        <button onClick={onClose} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>←</button>
        <span style={{fontWeight:900,fontSize:16,color:"#ffd700"}}>👥 Mi Red</span>
        {pending.length>0&&<span style={{background:"#ef4444",color:"#fff",fontSize:11,fontWeight:800,borderRadius:20,padding:"2px 8px"}}>{pending.length} nueva{pending.length>1?"s":""}</span>}
        <span style={{marginLeft:"auto",fontSize:12,color:"#6b7280"}}>{contacts.length} amigos</span>
      </div>

      {actionMsg&&<div style={{background:"#052e16",borderBottom:"1px solid #22c55e",padding:"10px 16px",fontSize:13,color:"#86efac",fontWeight:700}}>{actionMsg}</div>}

      <div style={{flex:1,overflowY:"auto",padding:16}}>

        {/* SOLICITUDES PENDIENTES */}
        {pending.length>0&&(
          <div style={{marginBottom:20}}>
            <div style={{fontWeight:800,color:"#ffd700",fontSize:15,marginBottom:12}}>🔔 Solicitudes pendientes ({pending.length})</div>
            {pending.map((req,i)=>{
              const requesterAlbum=contactAlbums.find(a=>a.user_email===req.user_email);
              const matches=requesterAlbum?getMatches(requesterAlbum.stickers):{iHave:[],theyHave:[]};
              const repeatedCount=getRepeatedCount(requesterAlbum?.stickers);
              return (
                <div key={i} style={{background:"#111827",border:"2px solid #ffd700",borderRadius:14,padding:16,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:12}}>
                    <div style={{width:48,height:48,borderRadius:"50%",background:"linear-gradient(135deg,#ffd700,#f59e0b)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#0a0f1e",fontSize:22,flexShrink:0}}>
                      {req.user_email[0].toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:900,color:"#ffd700",fontSize:16}}>{req.user_email.split("@")[0]}</div>
                      <div style={{fontSize:12,color:"#6b7280"}}>{req.user_email}</div>
                      <div style={{fontSize:12,color:"#f97316",marginTop:3}}>
                        🔁 {repeatedCount} disponibles para intercambio
                        {matches.theyHave.length>0&&<span style={{color:"#22c55e"}}> · {matches.theyHave.length} que tú necesitas ⭐</span>}
                      </div>
                    </div>
                  </div>

                  {matches.theyHave.length>0&&(
                    <div style={{background:"#0a1a0a",border:"1px solid #22c55e",borderRadius:10,padding:"10px 12px",marginBottom:12}}>
                      <div style={{fontSize:12,color:"#4ade80",fontWeight:700,marginBottom:6}}>⭐ Tiene estas que tú necesitas:</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
                        {matches.theyHave.slice(0,10).map((s,j)=>(
                          <span key={j} style={{fontSize:11,padding:"3px 8px",borderRadius:12,background:"#052e16",color:"#22c55e",border:"1px solid #22c55e"}}>{s.code} #{s.num}</span>
                        ))}
                        {matches.theyHave.length>10&&<span style={{fontSize:11,color:"#6b7280"}}>+{matches.theyHave.length-10} más</span>}
                      </div>
                    </div>
                  )}

                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <button onClick={()=>rejectReq(req.user_email)} style={{padding:"13px",background:"transparent",border:"1px solid #ef4444",borderRadius:10,color:"#ef4444",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                      ❌ Rechazar
                    </button>
                    <button onClick={()=>acceptReq(req.user_email)} style={{padding:"13px",background:"linear-gradient(135deg,#22c55e,#16a34a)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:14,cursor:"pointer"}}>
                      ✅ Aceptar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MI LINK */}
        <div style={{background:"#111827",border:"1px solid #1e3a5f",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontWeight:800,color:"#60a5fa",marginBottom:4}}>🔗 Invitar amigos</div>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:10}}>Al abrir tu link verán tus repetidas y podrán enviarte solicitud de conexión</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={copyLink} style={{flex:1,padding:"11px",background:copied?"#22c55e":"#1e2a3a",border:"1px solid",borderColor:copied?"#22c55e":"#374151",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              {copied?"✅ Copiado!":"📋 Copiar link"}
            </button>
            <button onClick={shareWhatsApp} style={{flex:1,padding:"11px",background:"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,fontSize:13,cursor:"pointer"}}>
              💬 WhatsApp
            </button>
          </div>
        </div>

        {/* AGREGAR POR EMAIL */}
        <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:14,padding:16,marginBottom:16}}>
          <div style={{fontWeight:700,color:"#e8eaf6",marginBottom:8}}>➕ Enviar solicitud por email</div>
          <div style={{display:"flex",gap:8}}>
            <input value={addEmail} onChange={e=>setAddEmail(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendRequest()} placeholder="email@ejemplo.com" inputMode="email" style={{flex:1,padding:"10px 14px",borderRadius:8,border:"1px solid #1e2a3a",background:"#0a0f1e",color:"#e8eaf6",fontSize:13,outline:"none"}}/>
            <button onClick={sendRequest} disabled={adding||!addEmail.trim()} style={{padding:"10px 18px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:8,color:"#0a0f1e",fontWeight:800,cursor:"pointer",fontSize:16,opacity:(adding||!addEmail.trim())?0.5:1}}>
              {adding?"⏳":"→"}
            </button>
          </div>
          {myRequests.filter(r=>r.status==="pending").length>0&&(
            <div style={{marginTop:10,fontSize:12,color:"#6b7280"}}>
              📤 Enviadas a: {myRequests.filter(r=>r.status==="pending").map(r=>r.contact_email.split("@")[0]).join(", ")}
            </div>
          )}
        </div>

        {/* AMIGOS */}
        {loading&&<div style={{textAlign:"center",padding:32,color:"#6b7280"}}>⏳ Cargando red...</div>}

        {!loading&&contacts.length>0&&(
          <>
            <div style={{fontWeight:800,color:"#e8eaf6",fontSize:15,marginBottom:12}}>✅ Mis amigos ({contacts.length})</div>
            {contacts.map((email,i)=>{
              const album=contactAlbums.find(a=>a.user_email===email);
              const matches=album?getMatches(album.stickers):{iHave:[],theyHave:[]};
              const totalMatches=matches.iHave.length+matches.theyHave.length;
              const repeatedCount=getRepeatedCount(album?.stickers);
              return (
                <div key={i} style={{background:"#111827",border:`1px solid ${totalMatches>0?"#22c55e":"#1e2a3a"}`,borderRadius:14,padding:16,marginBottom:12}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                    <div style={{width:44,height:44,borderRadius:"50%",background:"linear-gradient(135deg,#22c55e,#16a34a)",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,color:"#fff",fontSize:20,flexShrink:0}}>
                      {email[0].toUpperCase()}
                    </div>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:800,color:"#e8eaf6",fontSize:15}}>{album?.username||email.split("@")[0]}</div>
                      <div style={{fontSize:11,color:"#4a5568"}}>{email}</div>
                      {album&&<div style={{fontSize:11,color:"#6b7280",marginTop:2}}>🔁 {repeatedCount} disponibles · actualizado {new Date(album.updated_at).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</div>}
                    </div>
                    {totalMatches>0&&<span style={{fontSize:12,color:"#ffd700",background:"#1e1500",padding:"4px 10px",borderRadius:20,fontWeight:800}}>🎯 {totalMatches}</span>}
                  </div>

                  {album&&(
                    <>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
                        <div style={{background:"#052e16",borderRadius:10,padding:"12px",textAlign:"center"}}>
                          <div style={{fontSize:11,color:"#4ade80",marginBottom:2}}>Yo tengo para ellos</div>
                          <div style={{fontWeight:900,color:"#22c55e",fontSize:24}}>{matches.iHave.length}</div>
                          <div style={{fontSize:10,color:"#6b7280"}}>de sus faltantes</div>
                        </div>
                        <div style={{background:"#1e0f00",borderRadius:10,padding:"12px",textAlign:"center"}}>
                          <div style={{fontSize:11,color:"#fb923c",marginBottom:2}}>Ellos tienen para mí</div>
                          <div style={{fontWeight:900,color:"#f97316",fontSize:24}}>{matches.theyHave.length}</div>
                          <div style={{fontSize:10,color:"#6b7280"}}>de mis faltantes</div>
                        </div>
                      </div>

                      {totalMatches>0&&(
                        <button onClick={()=>setSelected(selected===email?null:email)} style={{width:"100%",padding:"10px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,fontSize:13,cursor:"pointer",marginBottom:8}}>
                          🎯 {selected===email?"Ocultar":"Ver"} listado completo de matches
                        </button>
                      )}

                      {selected===email&&(
                        <div style={{background:"#0a0f1e",borderRadius:12,padding:14}}>
                          {matches.theyHave.length>0&&(
                            <div style={{marginBottom:14}}>
                              <div style={{fontSize:13,color:"#f97316",fontWeight:800,marginBottom:8}}>🔁 {album?.username||email.split("@")[0]} tiene lo que tú necesitas:</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {matches.theyHave.map((s,j)=>(
                                  <span key={j} style={{fontSize:12,padding:"4px 10px",borderRadius:12,background:"#1e0f00",color:"#f97316",border:"1px solid #f97316",fontWeight:700}}>{s.code} #{s.num}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          {matches.iHave.length>0&&(
                            <div style={{marginBottom:14}}>
                              <div style={{fontSize:13,color:"#22c55e",fontWeight:800,marginBottom:8}}>✅ Tú tienes lo que {album?.username||email.split("@")[0]} necesita:</div>
                              <div style={{display:"flex",flexWrap:"wrap",gap:5}}>
                                {matches.iHave.map((s,j)=>(
                                  <span key={j} style={{fontSize:12,padding:"4px 10px",borderRadius:12,background:"#052e16",color:"#22c55e",border:"1px solid #22c55e",fontWeight:700}}>{s.code} #{s.num}</span>
                                ))}
                              </div>
                            </div>
                          )}
                          <button onClick={()=>{
                            const name=album?.username||email.split("@")[0];
                            const text=`Hola ${name}! 👋\n\nVi en FiguSwap que podemos intercambiar:\n✅ Yo tengo ${matches.iHave.length} que tú necesitas:\n${matches.iHave.slice(0,5).map(s=>`${s.code} #${s.num}`).join(", ")}${matches.iHave.length>5?`... y ${matches.iHave.length-5} más`:""}\n\n🔁 Tú tienes ${matches.theyHave.length} que yo necesito:\n${matches.theyHave.slice(0,5).map(s=>`${s.code} #${s.num}`).join(", ")}${matches.theyHave.length>5?`... y ${matches.theyHave.length-5} más`:""}\n\n¿Coordinamos? ⚽🎴`;
                            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");
                          }} style={{width:"100%",padding:"12px",background:"#14532d",border:"1px solid #22c55e",borderRadius:10,color:"#86efac",fontWeight:700,fontSize:14,cursor:"pointer"}}>
                            💬 Coordinar intercambio por WhatsApp
                          </button>
                        </div>
                      )}
                    </>
                  )}

                  {!album&&<div style={{fontSize:12,color:"#6b7280",textAlign:"center",padding:"8px 0"}}>{email.split("@")[0]} aún no ha llenado su álbum</div>}
                </div>
              );
            })}
          </>
        )}

        {!loading&&contacts.length===0&&pending.length===0&&(
          <div style={{textAlign:"center",padding:40,color:"#4a5568"}}>
            <div style={{fontSize:48,marginBottom:12}}>👥</div>
            <div style={{fontWeight:700,marginBottom:6,color:"#6b7280"}}>Sin conexiones aún</div>
            <div style={{fontSize:13}}>Comparte tu link o envía una solicitud para conectarte</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function FiguSwap() {
  const [session,setSession]=useState(null);
  const [page,setPage]=useState("album");
  const [albumTab,setAlbumTab]=useState("all");
  const [stickers,setStickers]=useState(buildEmpty);
  const [search,setSearch]=useState("");
  const [chat,setChat]=useState(null);
  const [toast,setToast]=useState(null);
  const [showOnboarding,setShowOnboarding]=useState(false);
  const [showImporter,setShowImporter]=useState(false);
  const [showShare,setShowShare]=useState(false);
  const [pendingCount,setPendingCount]=useState(0);
  const [saving,setSaving]=useState(false);
  const countdown=useCountdown();

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const inviter=params.get("invite");
    if(inviter)localStorage.setItem("figuswap_pending_invite",inviter);
    const fromHash=sbAuth.getSessionFromHash();
    if(fromHash){sbAuth.storeSession(fromHash);setSession(fromHash);return;}
    const stored=sbAuth.getStoredSession();
    if(stored)setSession(stored);
  },[]);

  useEffect(()=>{
    if(!session)return;
    const pending=localStorage.getItem("figuswap_pending_invite");
    if(pending&&pending!==session.email){
      db.sendRequest(pending,session.email).then(()=>{
        localStorage.removeItem("figuswap_pending_invite");
        showToastMsg(`✅ Solicitud enviada a ${pending.split("@")[0]}`);
      });
    }
    // Load from Supabase (cloud first)
    db.getAlbum(session.email).then(data=>{
      if(data?.stickers&&Object.keys(data.stickers).length>0){
        setStickers(data.stickers);
      } else {
        try{
          const local=localStorage.getItem(`figuswap_stickers_${session.email}`);
          if(local){
            const parsed=JSON.parse(local);
            setStickers(parsed);
            db.saveAlbum(session.email,parsed,session.email.split("@")[0]);
          } else {
            setShowOnboarding(true);
          }
        }catch{setShowOnboarding(true);}
      }
    });
    db.getPendingRequests(session.email).then(r=>setPendingCount(r.length));
  },[session]);

  // Auto-save to Supabase
  useEffect(()=>{
    if(!session)return;
    const timer=setTimeout(async()=>{
      setSaving(true);
      await db.saveAlbum(session.email,stickers,session.email.split("@")[0]);
      setSaving(false);
    },1500);
    return()=>clearTimeout(timer);
  },[stickers,session]);

  const showToastMsg=msg=>{setToast(msg);setTimeout(()=>setToast(null),2500);};

  const handleAction=(code,num,state,qty,price)=>{
    setStickers(prev=>({
      ...prev,
      [code]:{
        ...prev[code],
        [num]:{
          state,
          qty:qty!==undefined?qty:prev[code][num].qty,
          price:price!==undefined?price:prev[code][num].price
        }
      }
    }));
    showToastMsg(`${STATE[state].emoji} ${ALBUM[code].name} #${num} → ${STATE[state].label}${state==="repeated"&&qty>1?` ×${qty}`:""}`);
  };

  // Fix: filter considers tab when checking if team has visible stickers
  const filtered=useMemo(()=>Object.entries(stickers).filter(([code,ts])=>{
    const team=ALBUM[code];
    const matchSearch=search===""||team.name.toLowerCase().includes(search.toLowerCase())||code.toLowerCase().includes(search.toLowerCase());
    if(!matchSearch)return false;
    if(albumTab==="missing")return Object.values(ts).some(s=>s.state==="missing");
    if(albumTab==="repeated")return Object.values(ts).some(s=>s.state==="repeated");
    return true;
  }),[stickers,search,albumTab]);

  const albumStats=useMemo(()=>{
    const counts={missing:0,have:0,repeated:0,sell:0,trade:0,auction:0};
    Object.values(stickers).forEach(team=>{Object.values(team).forEach(s=>{counts[s.state]=(counts[s.state]||0)+1;});});
    const total=Object.values(ALBUM).reduce((s,t)=>s+t.total,0);
    const pct=Math.round((counts.have+counts.repeated+counts.sell+counts.trade+counts.auction)/total*100);
    return{...counts,total,pct};
  },[stickers]);

  const userNeeded=useMemo(()=>{
    const r={};
    Object.entries(stickers).forEach(([code,nums])=>{
      const missing=Object.entries(nums).filter(([,s])=>s.state==="missing").map(([n])=>parseInt(n));
      if(missing.length>0)r[code]=missing;
    });
    return r;
  },[stickers]);

  if(!session)return <AuthPage onAuth={s=>{setSession(s);sbAuth.storeSession(s);}}/>;

  const NAV=[["album","📋","Álbum"],["scanner","📸","Escanear"],["contacts","👥","Red"],["profile","👤","Perfil"]];

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",color:"#e8eaf6",fontFamily:"'Segoe UI',system-ui,sans-serif",paddingBottom:72}}>
      <div style={{background:"linear-gradient(135deg,#0a0f1e,#111827)",borderBottom:"1px solid #1e2a3a",padding:"12px 16px",position:"sticky",top:0,zIndex:100}}>
        <div style={{maxWidth:720,margin:"0 auto",display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:22}}>⚽</span>
          <span style={{fontWeight:900,fontSize:18,background:"linear-gradient(90deg,#ffd700,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>FiguSwap</span>
          {saving&&<span style={{fontSize:10,color:"#4a5568",marginLeft:2}}>💾</span>}
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
        {page==="album"&&(
          <>
            <div style={{background:"#0d1117",border:"1px solid #1e2a3a",borderRadius:14,padding:14,marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
                <span style={{fontWeight:800,color:"#e8eaf6",fontSize:14}}>📋 Mi Álbum FIFA WC 2026</span>
                <span style={{fontWeight:900,color:"#ffd700",fontSize:16}}>{albumStats.pct}%</span>
              </div>
              <div style={{height:6,background:"#1e2a3a",borderRadius:3,overflow:"hidden",marginBottom:10}}>
                <div style={{height:"100%",width:`${albumStats.pct}%`,background:"linear-gradient(90deg,#ffd700,#f59e0b)",borderRadius:3}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#6b7280",marginBottom:12}}>
                <span>❌ {albumStats.missing} faltan</span>
                <span>✅ {albumStats.have} tengo</span>
                <span>🔁 {albumStats.repeated} repetidas</span>
              </div>
              <div style={{display:"flex",gap:8}}>
                <button onClick={()=>setShowShare(true)} style={{flex:1,padding:"8px",background:"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,fontSize:12,cursor:"pointer"}}>📤 Compartir</button>
                <button onClick={()=>setShowImporter(true)} style={{flex:1,padding:"8px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:8,color:"#9ca3af",fontWeight:700,fontSize:12,cursor:"pointer"}}>📋 Importar</button>
              </div>
            </div>

            <div style={{display:"flex",background:"#111827",borderRadius:12,padding:4,marginBottom:12,border:"1px solid #1e2a3a"}}>
              {[["all","Todas"],["missing","Me faltan"],["repeated","Repetidas"]].map(([v,l])=>(
                <button key={v} onClick={()=>{setAlbumTab(v);setSearch("");}} style={{flex:1,padding:"10px 4px",borderRadius:9,border:"none",background:albumTab===v?"#ffd700":"transparent",color:albumTab===v?"#0a0f1e":"#6b7280",fontWeight:albumTab===v?800:600,fontSize:13,cursor:"pointer"}}>
                  {l}
                  {v==="missing"&&albumStats.missing>0&&<span style={{fontSize:9,marginLeft:3,background:"#ef4444",color:"#fff",borderRadius:10,padding:"1px 4px"}}>{albumStats.missing}</span>}
                  {v==="repeated"&&albumStats.repeated>0&&<span style={{fontSize:9,marginLeft:3,background:"#f97316",color:"#fff",borderRadius:10,padding:"1px 4px"}}>{albumStats.repeated}</span>}
                </button>
              ))}
            </div>

            <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`🔍 Buscar ${albumTab==="missing"?"faltantes":albumTab==="repeated"?"repetidas":"selección"}...`} style={{width:"100%",boxSizing:"border-box",padding:"10px 14px",borderRadius:10,border:"1px solid #1e2a3a",background:"#111827",color:"#e8eaf6",fontSize:14,outline:"none",marginBottom:12}}/>

            {filtered.length===0&&(
              <div style={{textAlign:"center",padding:40,color:"#4a5568"}}>
                <div style={{fontSize:40,marginBottom:12}}>{albumTab==="missing"?"🎉":albumTab==="repeated"?"🔁":"🔍"}</div>
                <div style={{fontWeight:700,color:"#6b7280"}}>
                  {search?`No se encontró "${search}" en ${albumTab==="missing"?"faltantes":albumTab==="repeated"?"repetidas":"el álbum"}`:albumTab==="missing"?"¡No te falta ninguna!":albumTab==="repeated"?"No tienes repetidas aún":"Sin resultados"}
                </div>
              </div>
            )}

            {filtered.map(([code,ts])=>(<TeamSection key={code} code={code} stickers={ts} tab={albumTab} onAction={handleAction} onChat={setChat}/>))}
          </>
        )}

        {page==="scanner"&&<Scanner userNeeded={userNeeded} onUpdateAlbum={(code,num,state)=>handleAction(code,num,state)}/>}

        {page==="contacts"&&<ContactsPage myEmail={session.email} myStickers={stickers} onClose={()=>{setPage("album");db.getPendingRequests(session.email).then(r=>setPendingCount(r.length));}}/>}

        {page==="profile"&&(
          <div>
            <div style={{background:"linear-gradient(135deg,#1a1040,#0a1a2e)",border:"1px solid #1e2a3a",borderRadius:16,padding:24,textAlign:"center",marginBottom:16}}>
              <div style={{fontSize:48,marginBottom:8}}>👤</div>
              <div style={{fontWeight:900,fontSize:20,color:"#fff"}}>{session.email?.split("@")[0]}</div>
              <div style={{color:"#6b7280",fontSize:13,marginBottom:16}}>{session.email}</div>
              <div style={{display:"flex",gap:12,justifyContent:"center"}}>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#ffd700"}}>{albumStats.pct}%</div><div style={{fontSize:11,color:"#6b7280"}}>álbum</div></div>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#ef4444"}}>{albumStats.missing}</div><div style={{fontSize:11,color:"#6b7280"}}>faltan</div></div>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#22c55e"}}>{albumStats.have}</div><div style={{fontSize:11,color:"#6b7280"}}>tengo</div></div>
                <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:22,color:"#f97316"}}>{albumStats.repeated}</div><div style={{fontSize:11,color:"#6b7280"}}>repetidas</div></div>
              </div>
            </div>
            <div style={{display:"flex",gap:10,marginBottom:12}}>
              <button onClick={()=>setShowShare(true)} style={{flex:1,padding:"13px",background:"#14532d",border:"1px solid #22c55e",borderRadius:12,color:"#86efac",fontWeight:700,cursor:"pointer"}}>📤 Compartir lista</button>
              <button onClick={()=>setShowImporter(true)} style={{flex:1,padding:"13px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:12,color:"#9ca3af",fontWeight:700,cursor:"pointer"}}>📋 Importar lista</button>
            </div>
            <button onClick={()=>setPage("contacts")} style={{width:"100%",padding:"14px",background:"#0a1a2e",border:"1px solid #3b82f6",borderRadius:12,color:"#60a5fa",fontWeight:700,cursor:"pointer",marginBottom:12,display:"flex",alignItems:"center",justifyContent:"center",gap:8}}>
              👥 Mi Red de contactos
              {pendingCount>0&&<span style={{background:"#ef4444",color:"#fff",fontSize:11,fontWeight:800,borderRadius:20,padding:"2px 8px"}}>{pendingCount} nueva{pendingCount>1?"s":""}</span>}
            </button>
            <button onClick={async()=>{await sbAuth.signOut(session.token);sbAuth.clearSession();setSession(null);setStickers(buildEmpty());}} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #ef4444",borderRadius:10,color:"#ef4444",fontWeight:700,cursor:"pointer"}}>
              Cerrar sesión
            </button>
          </div>
        )}
      </div>

      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0f1e",borderTop:"1px solid #1e2a3a",display:"flex",zIndex:100}}>
        {NAV.map(([p,ic,l])=>(
          <button key={p} onClick={()=>setPage(p)} style={{flex:1,padding:"10px 0",background:"none",border:"none",color:page===p?"#ffd700":"#4a5568",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2,position:"relative"}}>
            <span style={{fontSize:20}}>{ic}</span>
            <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase"}}>{l}</span>
            {p==="contacts"&&pendingCount>0&&<span style={{position:"absolute",top:4,right:"18%",background:"#ef4444",color:"#fff",fontSize:9,fontWeight:800,borderRadius:10,padding:"1px 5px"}}>{pendingCount}</span>}
          </button>
        ))}
      </div>

      {showOnboarding&&<Onboarding onChoice={choice=>{setShowOnboarding(false);if(choice==="import")setShowImporter(true);else if(choice==="scan")setPage("scanner");}}/>}
      {showImporter&&<Importer onImport={s=>{setStickers(s);showToastMsg("✅ ¡Álbum importado!");}} onClose={()=>setShowImporter(false)}/>}
      {showShare&&<ShareModal stickers={stickers} username={session.email?.split("@")[0]} onClose={()=>setShowShare(false)}/>}
      {chat&&(
        <div style={{position:"fixed",inset:0,background:"#000c",zIndex:300,display:"flex",flexDirection:"column"}}>
          <div style={{background:"#111827",borderBottom:"1px solid #1e2a3a",padding:"14px 16px",display:"flex",alignItems:"center",gap:10}}>
            <button onClick={()=>setChat(null)} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer"}}>←</button>
            <span style={{fontSize:24}}>{ALBUM[chat]?.emoji}</span>
            <div style={{fontWeight:800,color:"#e8eaf6"}}>Chat {ALBUM[chat]?.name}</div>
          </div>
          <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",background:"#0a0f1e",color:"#4a5568",fontSize:14}}>
            💬 Chat próximamente
          </div>
        </div>
      )}
      {toast&&<div style={{position:"fixed",bottom:80,left:"50%",transform:"translateX(-50%)",background:"#111827",border:"1px solid #1e2a3a",color:"#e8eaf6",padding:"10px 20px",borderRadius:24,fontWeight:700,fontSize:13,zIndex:9999,whiteSpace:"nowrap",boxShadow:"0 4px 20px #0008"}}>{toast}</div>}
    </div>
  );
}
