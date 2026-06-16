import { useState, useEffect, useMemo } from "react";

// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────────
const SUPABASE_URL = "https://fythsgiofvodukjzutat.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ5dGhzZ2lvZnZvZHVranp1dGF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE1NTIyMDgsImV4cCI6MjA5NzEyODIwOH0.HaG8yQgc2BzEGnlaNXFWaLZ0c_Oa6CvhwcVjHj99-AY";

const sb = {
  async query(table, options = {}) {
    let url = `${SUPABASE_URL}/rest/v1/${table}`;
    const params = new URLSearchParams();
    if (options.select) params.set("select", options.select);
    if (options.filter) Object.entries(options.filter).forEach(([k, v]) => params.set(k, `eq.${v}`));
    if (options.order) params.set("order", options.order);
    if (options.limit) params.set("limit", options.limit);
    if (params.toString()) url += "?" + params.toString();
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json" }
    });
    return res.json();
  },
  async insert(table, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async update(table, id, data) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
      method: "PATCH",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  async signUp(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  async signIn(email, password) {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    return res.json();
  },
  async signOut(token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${token}` }
    });
  }
};

// ─── ALBUM DATA ───────────────────────────────────────────────────────────────
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

const COUNTRY_MODES = {
  "Honduras":"local","Guatemala":"local","El Salvador":"local","Nicaragua":"local",
  "Costa Rica":"local","Panamá":"local","Bolivia":"local","Paraguay":"local",
  "México":"regional","Brasil":"regional","Argentina":"regional","Colombia":"regional",
  "Chile":"regional","Perú":"regional","Ecuador":"regional",
  "USA":"global","Canada":"global","España":"global","Reino Unido":"global",
  "Alemania":"global","Francia":"global","Italia":"global","Australia":"global",
  "Japón":"global","Corea del Sur":"global",
};

const MODE_COLORS = {local:"#f59e0b",regional:"#3b82f6",global:"#22c55e"};
const MODE_LABELS = {local:"🔴 Local",regional:"🟡 Regional",global:"🟢 Global"};

// Mock listings for marketplace demo
const MOCK_LISTINGS = [
  {id:1,user:"Carlos M.",avatar:"🇲🇽",city:"Ciudad de México",country:"México",team:"ARG",num:11,mode:"sell",price:2.00,rating:4.9,trades:34,wa:"50012345678"},
  {id:2,user:"Ana P.",avatar:"🇧🇷",city:"São Paulo",country:"Brasil",team:"FRA",num:4,mode:"both",price:1.50,rating:5.0,trades:67,wa:"5511999999999"},
  {id:3,user:"Luca R.",avatar:"🇮🇹",city:"Roma",country:"Italia",team:"ENG",num:9,mode:"trade",price:0,rating:4.7,trades:12,wa:"393331234567"},
  {id:4,user:"Sophie L.",avatar:"🇫🇷",city:"París",country:"Francia",team:"MAR",num:13,mode:"sell",price:3.00,rating:4.8,trades:28,wa:"33612345678"},
  {id:5,user:"Kenji T.",avatar:"🇯🇵",city:"Tokio",country:"Japón",team:"KOR",num:14,mode:"both",price:1.00,rating:5.0,trades:89,wa:"819012345678"},
  {id:6,user:"Pedro H.",avatar:"🇭🇳",city:"Tegucigalpa",country:"Honduras",team:"CZE",num:16,mode:"sell",price:1.50,rating:4.6,trades:5,wa:"50498765432"},
  {id:7,user:"Maria G.",avatar:"🇦🇷",city:"Buenos Aires",country:"Argentina",team:"ESP",num:18,mode:"trade",price:0,rating:4.9,trades:41,wa:"5491112345678"},
  {id:8,user:"James K.",avatar:"🇬🇧",city:"Londres",country:"Reino Unido",team:"NED",num:7,mode:"sell",price:2.50,rating:4.5,trades:19,wa:"447911123456"},
];

const MOCK_AUCTIONS = [
  {id:"a1",seller:"FiguMaster",avatar:"🇧🇷",team:"ARG",num:20,startPrice:1.00,currentPrice:4.75,bids:12,endsIn:7240,minIncrement:0.25},
  {id:"a2",seller:"ColeccionHN",avatar:"🇭🇳",team:"FWC",num:4,startPrice:2.00,currentPrice:8.50,bids:21,endsIn:3600,minIncrement:0.50},
  {id:"a3",seller:"StickerPro",avatar:"🇪🇸",team:"MAR",num:1,startPrice:0.50,currentPrice:2.25,bids:5,endsIn:86400,minIncrement:0.25},
];

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

// ─── UTILS ────────────────────────────────────────────────────────────────────
const WORLD_OPEN = new Date("2026-06-11T16:00:00Z");
function useCountdown(target) {
  const [t, setT] = useState({});
  useEffect(() => {
    const tick = () => {
      const diff = target - Date.now();
      if (diff <= 0) return setT({d:0,h:0,m:0,s:0});
      setT({d:Math.floor(diff/864e5),h:Math.floor((diff%864e5)/36e5),m:Math.floor((diff%36e5)/6e4),s:Math.floor((diff%6e4)/1e3)});
    };
    tick(); const id = setInterval(tick,1000); return ()=>clearInterval(id);
  },[]);
  return t;
}

function useAuctionTimer(endsIn) {
  const [secs, setSecs] = useState(endsIn);
  useEffect(() => {
    const id = setInterval(() => setSecs(s => Math.max(0, s-1)), 1000);
    return () => clearInterval(id);
  }, []);
  const h = Math.floor(secs/3600), m = Math.floor((secs%3600)/60), s = secs%60;
  const urgent = secs < 300;
  return { display: `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}`, urgent };
}

const pctColor = p => p===100?"#22c55e":p>=75?"#84cc16":p>=50?"#eab308":p>=25?"#f97316":"#ef4444";

// ─── COMPONENTS ───────────────────────────────────────────────────────────────
function Toast({msg,onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,2500);return()=>clearTimeout(t);},[]);
  return <div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",background:"#22c55e",color:"#fff",padding:"10px 22px",borderRadius:24,fontWeight:700,fontSize:14,zIndex:9999,boxShadow:"0 4px 20px #0006",whiteSpace:"nowrap"}}>{msg}</div>;
}

function AuctionCard({auction, myNeeded, onBid}) {
  const timer = useAuctionTimer(auction.endsIn);
  const team = ALBUM[auction.team];
  const isNeeded = myNeeded[auction.team]?.includes(auction.num);
  return (
    <div style={{background:isNeeded?"linear-gradient(135deg,#0c1f3a,#0f2a4a)":"#111827",border:`1px solid ${isNeeded?"#f59e0b":"#1e2a3a"}`,borderRadius:14,padding:16,position:"relative"}}>
      {isNeeded && <div style={{position:"absolute",top:10,right:10,background:"#f59e0b",color:"#000",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20}}>⭐ La necesito</div>}
      <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
        <span style={{fontSize:32}}>{team?.emoji}</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:15,color:"#e8eaf6"}}>{team?.name} <span style={{color:"#ffd700"}}>#{auction.num}</span></div>
          <div style={{fontSize:12,color:"#6b7280"}}>por {auction.avatar} {auction.seller}</div>
        </div>
      </div>
      <div style={{background:"#0a0f1e",borderRadius:10,padding:12,marginBottom:12}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:"#6b7280"}}>Puja actual</div>
            <div style={{fontSize:22,fontWeight:900,color:"#22c55e"}}>${auction.currentPrice.toFixed(2)}</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:"#6b7280"}}>{auction.bids} pujas</div>
            <div style={{fontSize:13,color:"#9ca3af"}}>min +${auction.minIncrement}</div>
          </div>
          <div style={{textAlign:"center"}}>
            <div style={{fontSize:11,color:"#6b7280"}}>Termina en</div>
            <div style={{fontSize:16,fontWeight:900,color:timer.urgent?"#ef4444":"#ffd700",fontVariantNumeric:"tabular-nums"}}>{timer.display}</div>
          </div>
        </div>
      </div>
      <button onClick={()=>onBid(auction)} style={{width:"100%",padding:"11px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,fontSize:14,cursor:"pointer"}}>
        🔨 Pujar ${(auction.currentPrice + auction.minIncrement).toFixed(2)}
      </button>
    </div>
  );
}

function ListingCard({listing, myNeeded, onBuy, onTrade, onContact}) {
  const team = ALBUM[listing.team];
  const isNeeded = myNeeded[listing.team]?.includes(listing.num);
  const countryMode = COUNTRY_MODES[listing.country] || "local";
  return (
    <div style={{background:isNeeded?"linear-gradient(135deg,#0c1f3a,#0f2a4a)":"#111827",border:`1px solid ${isNeeded?"#3b82f6":"#1e2a3a"}`,borderRadius:14,padding:16,position:"relative"}}>
      {isNeeded && <div style={{position:"absolute",top:10,right:10,background:"#3b82f6",color:"#fff",fontSize:10,fontWeight:800,padding:"2px 8px",borderRadius:20}}>⭐ La necesito</div>}
      <div style={{display:"flex",gap:10,alignItems:"center",marginBottom:10}}>
        <span style={{fontSize:28}}>{team?.emoji}</span>
        <div style={{flex:1}}>
          <div style={{fontWeight:800,fontSize:15,color:"#e8eaf6"}}>{team?.name} <span style={{color:"#ffd700"}}>#{listing.num}</span></div>
          <div style={{display:"flex",gap:6,alignItems:"center",marginTop:2}}>
            <span style={{fontSize:10,padding:"1px 6px",borderRadius:10,background:MODE_COLORS[countryMode]+"22",color:MODE_COLORS[countryMode],fontWeight:700}}>{MODE_LABELS[countryMode]}</span>
            <span style={{fontSize:11,color:"#6b7280"}}>{listing.city}</span>
          </div>
        </div>
        <div style={{textAlign:"right"}}>
          {listing.mode!=="trade" && <div style={{fontWeight:800,color:"#22c55e",fontSize:18}}>${listing.price.toFixed(2)}</div>}
          {listing.mode==="trade" && <div style={{fontWeight:700,color:"#3b82f6",fontSize:14}}>🔄 Cambio</div>}
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:12}}>
        <span style={{fontSize:18}}>{listing.avatar}</span>
        <div style={{flex:1}}>
          <span style={{fontSize:13,fontWeight:600,color:"#d1d5db"}}>{listing.user}</span>
          <span style={{fontSize:11,color:"#6b7280",marginLeft:8}}>⭐{listing.rating} · {listing.trades} cambios</span>
        </div>
      </div>
      <div style={{display:"flex",gap:8}}>
        {listing.mode!=="trade" && (
          <button onClick={()=>onBuy(listing)} style={{flex:1,padding:"9px",background:"linear-gradient(135deg,#635bff,#4f46e5)",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"}}>💳 Comprar</button>
        )}
        {listing.mode!=="sell" && (
          <button onClick={()=>onTrade(listing)} style={{flex:1,padding:"9px",background:"#1e3a5f",border:"1px solid #3b82f6",borderRadius:8,color:"#60a5fa",fontWeight:700,fontSize:13,cursor:"pointer"}}>🔄 Cambiar</button>
        )}
        <button onClick={()=>onContact(listing)} style={{padding:"9px 14px",background:"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,fontSize:13,cursor:"pointer"}}>💬</button>
      </div>
    </div>
  );
}

function CheckoutModal({listing, onClose, onConfirm}) {
  const team = ALBUM[listing.team];
  const fee = +(listing.price * 0.1).toFixed(2);
  const total = +(listing.price + fee).toFixed(2);
  return (
    <div style={{position:"fixed",inset:0,background:"#000b",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#111827",border:"1px solid #1e3a5f",borderRadius:16,padding:24,width:"100%",maxWidth:380}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <span style={{fontWeight:800,fontSize:18,color:"#ffd700"}}>💳 Comprar figurita</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#9ca3af",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:"#1e2a3a",borderRadius:12,padding:14,marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:32}}>{team?.emoji}</span>
          <div>
            <div style={{fontWeight:700,color:"#e8eaf6"}}>{team?.name} #{listing.num}</div>
            <div style={{fontSize:12,color:"#9ca3af"}}>{listing.user} · {listing.city}</div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:20}}>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:14,color:"#9ca3af"}}>
            <span>Figurita</span><span style={{color:"#e8eaf6"}}>${listing.price.toFixed(2)}</span>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:14,color:"#9ca3af"}}>
            <span>Comisión FiguSwap (10%)</span><span style={{color:"#fbbf24"}}>${fee.toFixed(2)}</span>
          </div>
          <div style={{height:1,background:"#1e3a5f",margin:"4px 0"}}/>
          <div style={{display:"flex",justifyContent:"space-between",fontWeight:800,fontSize:16}}>
            <span style={{color:"#e8eaf6"}}>Total</span>
            <span style={{color:"#22c55e"}}>${total.toFixed(2)} USD</span>
          </div>
        </div>
        <button onClick={onConfirm} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#635bff,#4f46e5)",border:"none",borderRadius:10,color:"#fff",fontWeight:800,fontSize:15,cursor:"pointer",marginBottom:8}}>
          💳 Pagar con Stripe
        </button>
        <div style={{textAlign:"center",fontSize:11,color:"#4a5568"}}>🔒 Pago seguro · Stripe · SSL</div>
        <div style={{textAlign:"center",fontSize:11,color:"#374151",marginTop:4}}>⚠️ Conecta Stripe para activar pagos reales</div>
      </div>
    </div>
  );
}

function BidModal({auction, onClose, onConfirm}) {
  const team = ALBUM[auction.team];
  const nextBid = +(auction.currentPrice + auction.minIncrement).toFixed(2);
  const [amount, setAmount] = useState(nextBid);
  return (
    <div style={{position:"fixed",inset:0,background:"#000b",zIndex:999,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <div style={{background:"#111827",border:"1px solid #1e3a5f",borderRadius:16,padding:24,width:"100%",maxWidth:380}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:16}}>
          <span style={{fontWeight:800,fontSize:18,color:"#ffd700"}}>🔨 Hacer puja</span>
          <button onClick={onClose} style={{background:"none",border:"none",color:"#9ca3af",fontSize:20,cursor:"pointer"}}>✕</button>
        </div>
        <div style={{background:"#1e2a3a",borderRadius:12,padding:14,marginBottom:16,display:"flex",gap:12,alignItems:"center"}}>
          <span style={{fontSize:32}}>{team?.emoji}</span>
          <div>
            <div style={{fontWeight:700,color:"#e8eaf6"}}>{team?.name} #{auction.num}</div>
            <div style={{fontSize:12,color:"#9ca3af"}}>Puja actual: <span style={{color:"#22c55e",fontWeight:700}}>${auction.currentPrice.toFixed(2)}</span></div>
          </div>
        </div>
        <div style={{marginBottom:16}}>
          <div style={{fontSize:13,color:"#9ca3af",marginBottom:6}}>Tu puja (mínimo ${nextBid.toFixed(2)})</div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>setAmount(a=>Math.max(nextBid,+(a-0.25).toFixed(2)))} style={{padding:"10px 16px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:8,color:"#e8eaf6",fontSize:18,cursor:"pointer"}}>−</button>
            <div style={{flex:1,textAlign:"center",padding:"10px",background:"#1e2a3a",borderRadius:8,fontSize:22,fontWeight:900,color:"#ffd700"}}>${amount.toFixed(2)}</div>
            <button onClick={()=>setAmount(a=>+(a+0.25).toFixed(2))} style={{padding:"10px 16px",background:"#1e2a3a",border:"1px solid #374151",borderRadius:8,color:"#e8eaf6",fontSize:18,cursor:"pointer"}}>+</button>
          </div>
        </div>
        <button onClick={()=>onConfirm(amount)} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,fontSize:15,cursor:"pointer"}}>
          🔨 Confirmar puja ${amount.toFixed(2)}
        </button>
        <div style={{textAlign:"center",fontSize:11,color:"#4a5568",marginTop:8}}>Si ganas, se cobra automáticamente</div>
      </div>
    </div>
  );
}

// ─── AUTH PAGE ────────────────────────────────────────────────────────────────
function AuthPage({onAuth}) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [country, setCountry] = useState("Honduras");
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    setLoading(true); setError("");
    try {
      if (mode === "login") {
        const r = await sb.signIn(email, pass);
        if (r.access_token) onAuth(r.user, r.access_token);
        else setError(r.error_description || "Error al iniciar sesión");
      } else {
        const r = await sb.signUp(email, pass);
        if (r.id) {
          await sb.insert("profiles", {id:r.id, full_name:name, country, city, username:email.split("@")[0]});
          const r2 = await sb.signIn(email, pass);
          if (r2.access_token) onAuth(r2.user, r2.access_token);
          else setError("Cuenta creada. Verifica tu email y entra.");
        } else setError(r.error_description || "Error al registrarse");
      }
    } catch(e) { setError("Error de conexión"); }
    setLoading(false);
  };

  const inp = {width:"100%",boxSizing:"border-box",padding:"12px 14px",borderRadius:10,border:"1px solid #1e2a3a",background:"#0a0f1e",color:"#e8eaf6",fontSize:14,outline:"none",marginBottom:10};

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{fontSize:48,marginBottom:8}}>⚽</div>
      <div style={{fontWeight:900,fontSize:28,background:"linear-gradient(90deg,#ffd700,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",marginBottom:4}}>FiguSwap</div>
      <div style={{color:"#6b7280",fontSize:13,marginBottom:32,textAlign:"center"}}>El marketplace global de figuritas FIFA WC 2026™</div>
      <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:16,padding:24,width:"100%",maxWidth:380}}>
        <div style={{display:"flex",gap:8,marginBottom:20}}>
          {["login","register"].map(m=>(
            <button key={m} onClick={()=>setMode(m)} style={{flex:1,padding:"10px",borderRadius:10,border:"1px solid",borderColor:mode===m?"#ffd700":"#1e2a3a",background:mode===m?"#ffd700":"transparent",color:mode===m?"#0a0f1e":"#9ca3af",fontWeight:700,fontSize:14,cursor:"pointer"}}>
              {m==="login"?"Entrar":"Registrarse"}
            </button>
          ))}
        </div>
        {mode==="register" && <>
          <input style={inp} placeholder="Nombre completo" value={name} onChange={e=>setName(e.target.value)}/>
          <select style={{...inp,marginBottom:10}} value={country} onChange={e=>setCountry(e.target.value)}>
            {Object.keys(COUNTRY_MODES).map(c=><option key={c}>{c}</option>)}
          </select>
          <input style={inp} placeholder="Ciudad" value={city} onChange={e=>setCity(e.target.value)}/>
        </>}
        <input style={inp} type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <input style={inp} type="password" placeholder="Contraseña" value={pass} onChange={e=>setPass(e.target.value)}/>
        {error && <div style={{color:"#ef4444",fontSize:12,marginBottom:10,padding:"8px 12px",background:"#1e0a0a",borderRadius:8}}>{error}</div>}
        <button onClick={handle} disabled={loading} style={{width:"100%",padding:"14px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,color:"#0a0f1e",fontWeight:800,fontSize:15,cursor:"pointer",opacity:loading?0.7:1}}>
          {loading?"⏳ Procesando...":(mode==="login"?"Entrar →":"Crear cuenta →")}
        </button>
        <div style={{textAlign:"center",marginTop:12,fontSize:12,color:"#4a5568"}}>
          Al registrarte aceptas los términos de servicio de FiguSwap
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function FiguSwap() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [page, setPage] = useState("home");
  const [tab, setTab] = useState("marketplace"); // marketplace | auctions
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [toast, setToast] = useState(null);
  const [checkout, setCheckout] = useState(null);
  const [bidModal, setBidModal] = useState(null);
  const [albumView, setAlbumView] = useState("needed");
  const [myNeeded, setMyNeeded] = useState(MY_NEEDED);
  const countdown = useCountdown(WORLD_OPEN);

  const showToast = msg => setToast(msg);

  const albumStats = useMemo(() => {
    const total = Object.values(ALBUM).reduce((s,t)=>s+t.total,0);
    const missing = Object.values(myNeeded).reduce((s,a)=>s+a.length,0);
    const have = total - missing;
    return {total,missing,have,pct:Math.round(have/total*100)};
  },[myNeeded]);

  const filtered = useMemo(() => MOCK_LISTINGS.filter(l => {
    const team = ALBUM[l.team];
    const ms = search===""||team?.name.toLowerCase().includes(search.toLowerCase())||l.team.toLowerCase().includes(search.toLowerCase())||String(l.num).includes(search);
    const mm = modeFilter==="all"||l.mode===modeFilter||(modeFilter!=="trade"&&l.mode==="both");
    return ms && mm;
  }),[search,modeFilter]);

  const handleContact = l => {
    const team = ALBUM[l.team];
    window.open(`https://wa.me/${l.wa}?text=${encodeURIComponent(`Hola ${l.user}! Vi en FiguSwap que tienes ${team.name} #${l.num}. ¿Podemos coordinar?`)}`, "_blank");
    showToast("💬 Abriendo WhatsApp...");
  };

  if (!user) return <AuthPage onAuth={(u,t)=>{setUser(u);setToken(t);}}/>;

  // ── PAGES ──
  const HomePage = () => (
    <div>
      <div style={{background:"linear-gradient(160deg,#0a0f1e,#1a1040,#0a1a2e)",padding:"40px 16px 32px",textAlign:"center",borderBottom:"1px solid #1e2a3a"}}>
        <div style={{fontSize:44,marginBottom:6}}>⚽</div>
        <h1 style={{fontSize:28,fontWeight:900,color:"#fff",margin:"0 0 6px",lineHeight:1.1}}>Completa tu álbum.</h1>
        <p style={{fontSize:14,color:"#9ca3af",maxWidth:400,margin:"0 auto 20px"}}>Compra, vende, cambia y subasta figuritas con coleccionistas del mundo entero.</p>
        <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap"}}>
          <button onClick={()=>setPage("marketplace")} style={{padding:"11px 22px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,fontWeight:800,fontSize:14,cursor:"pointer",color:"#0a0f1e"}}>🏪 Marketplace</button>
          <button onClick={()=>setPage("auctions")} style={{padding:"11px 22px",background:"transparent",border:"1px solid #ffd700",borderRadius:10,fontWeight:700,fontSize:14,cursor:"pointer",color:"#ffd700"}}>🔨 Subastas</button>
        </div>
      </div>
      <div style={{background:"#0f172a",padding:"16px",textAlign:"center",borderBottom:"1px solid #1e2a3a"}}>
        <div style={{fontSize:11,color:"#6b7280",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>⏱ Cuenta regresiva al Mundial</div>
        <div style={{display:"flex",gap:16,justifyContent:"center"}}>
          {[["d","días"],["h","horas"],["m","min"],["s","seg"]].map(([k,l])=>(
            <div key={k} style={{textAlign:"center"}}>
              <div style={{fontSize:26,fontWeight:900,color:"#ffd700",fontVariantNumeric:"tabular-nums"}}>{String(countdown[k]||0).padStart(2,"0")}</div>
              <div style={{fontSize:10,color:"#6b7280"}}>{l}</div>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(2,1fr)",gap:1,background:"#1e2a3a",borderBottom:"1px solid #1e2a3a"}}>
        {[["👥","2,847","Coleccionistas"],["🃏","14,320","Figuritas"],["🔨","234","Subastas activas"],["🌍","67","Países"]].map(([ic,v,l])=>(
          <div key={l} style={{background:"#0a0f1e",padding:"16px",textAlign:"center"}}>
            <div style={{fontSize:20}}>{ic}</div>
            <div style={{fontSize:20,fontWeight:900,color:"#ffd700"}}>{v}</div>
            <div style={{fontSize:11,color:"#6b7280"}}>{l}</div>
          </div>
        ))}
      </div>
      <div style={{maxWidth:720,margin:"0 auto",padding:16}}>
        <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:14,padding:18,marginBottom:16}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
            <span style={{fontWeight:700,color:"#e8eaf6"}}>📋 Mi álbum</span>
            <span style={{fontWeight:800,color:pctColor(albumStats.pct)}}>{albumStats.pct}%</span>
          </div>
          <div style={{height:8,background:"#1e2a3a",borderRadius:4,overflow:"hidden",marginBottom:10}}>
            <div style={{height:"100%",width:`${albumStats.pct}%`,background:"linear-gradient(90deg,#ffd700,#f59e0b)",borderRadius:4,transition:"width 0.3s"}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"#6b7280"}}>
            <span>✅ {albumStats.have} tengo</span><span>❌ {albumStats.missing} me faltan</span>
          </div>
        </div>
        <div style={{fontWeight:800,fontSize:15,color:"#e8eaf6",marginBottom:10}}>🔥 Disponibles ahora</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {MOCK_LISTINGS.slice(0,3).map(l=>(
            <ListingCard key={l.id} listing={l} myNeeded={myNeeded} onBuy={setCheckout} onTrade={()=>showToast("🔄 Solicitud enviada")} onContact={handleContact}/>
          ))}
        </div>
        <div style={{fontWeight:800,fontSize:15,color:"#e8eaf6",margin:"16px 0 10px"}}>🔨 Subastas activas</div>
        <div style={{display:"flex",flexDirection:"column",gap:10}}>
          {MOCK_AUCTIONS.slice(0,2).map(a=>(
            <AuctionCard key={a.id} auction={a} myNeeded={myNeeded} onBid={setBidModal}/>
          ))}
        </div>
      </div>
    </div>
  );

  const MarketplacePage = () => (
    <div style={{maxWidth:720,margin:"0 auto",padding:16}}>
      <h2 style={{fontWeight:900,fontSize:20,color:"#ffd700",margin:"0 0 4px"}}>🏪 Marketplace</h2>
      <p style={{color:"#6b7280",fontSize:13,margin:"0 0 12px"}}>{filtered.length} figuritas disponibles</p>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍  Buscar país, código o número..." style={{width:"100%",boxSizing:"border-box",padding:"11px 14px",borderRadius:10,border:"1px solid #1e2a3a",background:"#111827",color:"#e8eaf6",fontSize:14,outline:"none",marginBottom:10}}/>
      <div style={{display:"flex",gap:6,marginBottom:16,flexWrap:"wrap"}}>
        {[["all","Todos"],["sell","En venta"],["trade","Para cambio"],["both","Ambos"]].map(([v,l])=>(
          <button key={v} onClick={()=>setModeFilter(v)} style={{padding:"6px 14px",borderRadius:20,border:"1px solid",borderColor:modeFilter===v?"#ffd700":"#1e2a3a",background:modeFilter===v?"#ffd700":"transparent",color:modeFilter===v?"#0a0f1e":"#9ca3af",fontWeight:700,fontSize:12,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {filtered.map(l=>(
          <ListingCard key={l.id} listing={l} myNeeded={myNeeded} onBuy={setCheckout} onTrade={()=>showToast("🔄 Solicitud enviada")} onContact={handleContact}/>
        ))}
      </div>
    </div>
  );

  const AuctionsPage = () => (
    <div style={{maxWidth:720,margin:"0 auto",padding:16}}>
      <h2 style={{fontWeight:900,fontSize:20,color:"#ffd700",margin:"0 0 4px"}}>🔨 Subastas</h2>
      <p style={{color:"#6b7280",fontSize:13,margin:"0 0 16px"}}>{MOCK_AUCTIONS.length} subastas activas ahora mismo</p>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {MOCK_AUCTIONS.map(a=>(
          <AuctionCard key={a.id} auction={a} myNeeded={myNeeded} onBid={setBidModal}/>
        ))}
      </div>
      <div style={{marginTop:20,background:"#111827",border:"1px dashed #1e2a3a",borderRadius:14,padding:20,textAlign:"center"}}>
        <div style={{fontSize:32,marginBottom:8}}>🔨</div>
        <div style={{fontWeight:700,color:"#e8eaf6",marginBottom:4}}>¿Tienes figuritas raras?</div>
        <div style={{fontSize:13,color:"#6b7280",marginBottom:16}}>Ponlas en subasta y obtén el mejor precio</div>
        <button onClick={()=>showToast("🔨 Función disponible pronto — conecta Supabase")} style={{padding:"11px 22px",background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:10,fontWeight:800,fontSize:14,cursor:"pointer",color:"#0a0f1e"}}>+ Crear subasta</button>
      </div>
    </div>
  );

  const AlbumPage = () => (
    <div style={{maxWidth:720,margin:"0 auto",padding:16}}>
      <h2 style={{fontWeight:900,fontSize:20,color:"#ffd700",margin:"0 0 4px"}}>📋 Mi Álbum</h2>
      <div style={{display:"flex",gap:6,marginBottom:16}}>
        {[["needed","❌ Me faltan"],["repeated","🔄 Repetidas"]].map(([v,l])=>(
          <button key={v} onClick={()=>setAlbumView(v)} style={{padding:"7px 16px",borderRadius:20,border:"1px solid",borderColor:albumView===v?"#ffd700":"#1e2a3a",background:albumView===v?"#ffd700":"transparent",color:albumView===v?"#0a0f1e":"#9ca3af",fontWeight:700,fontSize:13,cursor:"pointer"}}>{l}</button>
        ))}
      </div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {Object.entries(myNeeded).filter(([,a])=>a.length>0).map(([code,nums])=>{
          const team = ALBUM[code];
          return (
            <div key={code} style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:12,padding:"12px 14px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
                <span style={{fontSize:20}}>{team?.emoji}</span>
                <span style={{fontWeight:700,color:"#e8eaf6",fontSize:14}}>{team?.name}</span>
                <span style={{marginLeft:"auto",fontSize:12,color:"#6b7280"}}>{nums.length} faltantes</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {nums.map(n=>(
                  <button key={n} onClick={()=>{
                    setMyNeeded(prev=>({...prev,[code]:prev[code].filter(x=>x!==n)}));
                    showToast(`✅ ${code} #${n} pegada`);
                  }} style={{width:32,height:32,borderRadius:6,background:"#1e2a3a",color:"#ef4444",fontWeight:700,fontSize:12,border:"1px solid #ef4444",cursor:"pointer"}}>
                    {n}
                  </button>
                ))}
              </div>
              <div style={{fontSize:10,color:"#374151",marginTop:6}}>Toca un número para marcarlo como pegado ✅</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const ProfilePage = () => (
    <div style={{maxWidth:720,margin:"0 auto",padding:16}}>
      <div style={{background:"linear-gradient(135deg,#1a1040,#0a1a2e)",border:"1px solid #1e2a3a",borderRadius:16,padding:24,marginBottom:16,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:8}}>🇭🇳</div>
        <div style={{fontWeight:900,fontSize:20,color:"#fff"}}>{user?.email?.split("@")[0]}</div>
        <div style={{color:"#6b7280",fontSize:13,marginBottom:16}}>{user?.email}</div>
        <div style={{display:"flex",justifyContent:"center",gap:24}}>
          <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:20,color:"#ffd700"}}>0</div><div style={{fontSize:11,color:"#6b7280"}}>intercambios</div></div>
          <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:20,color:"#22c55e"}}>5.0⭐</div><div style={{fontSize:11,color:"#6b7280"}}>valoración</div></div>
          <div style={{textAlign:"center"}}><div style={{fontWeight:900,fontSize:20,color:"#3b82f6"}}>{albumStats.pct}%</div><div style={{fontSize:11,color:"#6b7280"}}>álbum</div></div>
        </div>
      </div>
      <div style={{background:"#111827",border:"1px solid #22c55e22",borderRadius:14,padding:16,marginBottom:12}}>
        <div style={{fontWeight:700,color:"#22c55e",marginBottom:10}}>✅ Supabase conectado</div>
        <div style={{fontSize:13,color:"#6b7280"}}>Base de datos activa en:</div>
        <div style={{fontSize:12,color:"#86efac",fontFamily:"monospace",marginTop:4}}>fythsgiofvodukjzutat.supabase.co</div>
      </div>
      <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:14,padding:16,marginBottom:12}}>
        <div style={{fontWeight:700,color:"#ffd700",marginBottom:10}}>⚙️ Pendiente</div>
        {[["Conectar Stripe","stripe.com"],["Deploy en Vercel","vercel.com"],["Dominio propio","figuswaP.com"]].map(([t,u])=>(
          <div key={t} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:"1px solid #1e2a3a",fontSize:13}}>
            <span style={{color:"#e8eaf6"}}>⭕ {t}</span><span style={{color:"#4a5568"}}>{u}</span>
          </div>
        ))}
      </div>
      <button onClick={async()=>{await sb.signOut(token);setUser(null);setToken(null);}} style={{width:"100%",padding:"12px",background:"transparent",border:"1px solid #ef4444",borderRadius:10,color:"#ef4444",fontWeight:700,cursor:"pointer"}}>
        Cerrar sesión
      </button>
    </div>
  );

  const NAV = [["home","🏠","Inicio"],["marketplace","🏪","Market"],["auctions","🔨","Subastas"],["album","📋","Álbum"],["profile","👤","Perfil"]];

  return (
    <div style={{minHeight:"100vh",background:"#0a0f1e",color:"#e8eaf6",fontFamily:"'Segoe UI',system-ui,sans-serif",paddingBottom:64}}>
      <div style={{position:"sticky",top:0,zIndex:100,background:"#0a0f1e",borderBottom:"1px solid #1e2a3a"}}>
        <div style={{maxWidth:720,margin:"0 auto",padding:"0 16px",display:"flex",alignItems:"center",height:50}}>
          <span style={{fontWeight:900,fontSize:18,background:"linear-gradient(90deg,#ffd700,#f59e0b)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>⚽ FiguSwap</span>
          <span style={{marginLeft:"auto",fontSize:11,color:"#6b7280"}}>{user?.email?.split("@")[0]}</span>
        </div>
      </div>
      {page==="home" && <HomePage/>}
      {page==="marketplace" && <MarketplacePage/>}
      {page==="auctions" && <AuctionsPage/>}
      {page==="album" && <AlbumPage/>}
      {page==="profile" && <ProfilePage/>}
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0a0f1e",borderTop:"1px solid #1e2a3a",display:"flex",zIndex:100}}>
        {NAV.map(([p,ic,l])=>(
          <button key={p} onClick={()=>setPage(p)} style={{flex:1,padding:"8px 0",background:"none",border:"none",color:page===p?"#ffd700":"#4a5568",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>
            <span style={{fontSize:18}}>{ic}</span>
            <span style={{fontSize:9,fontWeight:700,textTransform:"uppercase",letterSpacing:0.5}}>{l}</span>
          </button>
        ))}
      </div>
      {checkout && <CheckoutModal listing={checkout} onClose={()=>setCheckout(null)} onConfirm={()=>{setCheckout(null);showToast("✅ Pago procesado — conecta Stripe para activar");}}/>}
      {bidModal && <BidModal auction={bidModal} onClose={()=>setBidModal(null)} onConfirm={amt=>{setBidModal(null);showToast(`🔨 Puja de $${amt.toFixed(2)} registrada`);}}/>}
      {toast && <Toast msg={toast} onClose={()=>setToast(null)}/>}
    </div>
  );
}
