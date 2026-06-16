import { useState, useRef } from "react";

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
  ALG:{name:"Algeria",emoji:"🇩🇿",total:20},BRA:{name:"Brazil",emoji:"🇧🇷",total:20},
};

const RARITY = {
  FWC:{4:5},MAR:{1:4,13:4,20:4},ARG:{11:4},ENG:{19:3},
  CIV:{20:3},TUR:{20:3},CZE:{20:3},IRN:{15:3},
};

function getSuggestedPrice(code, num) {
  const r = RARITY[code]?.[num] || 1;
  if(r>=5) return {price:5.00,label:"💎 Muy escasa",color:"#a78bfa"};
  if(r>=4) return {price:3.00,label:"🔥 Escasa",color:"#f97316"};
  if(r>=3) return {price:2.00,label:"⚡ Demandada",color:"#fbbf24"};
  return {price:1.00,label:"📦 Normal",color:"#60a5fa"};
}

export default function Scanner({ userNeeded={}, onUpdateAlbum }) {
  const [step,setStep]=useState("upload");
  const [image,setImage]=useState(null);
  const [imageBase64,setImageBase64]=useState(null);
  const [mediaType,setMediaType]=useState("image/jpeg");
  const [detected,setDetected]=useState([]);
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(false);
  const [applied,setApplied]=useState({});
  const cameraRef=useRef();
  const galleryRef=useRef();

  const handleFile=(file)=>{
    if(!file)return;
    setMediaType(file.type||"image/jpeg");
    setImage(URL.createObjectURL(file));
    const reader=new FileReader();
    reader.onload=(e)=>setImageBase64(e.target.result.split(",")[1]);
    reader.readAsDataURL(file);
  };

  const scan=async()=>{
    if(!imageBase64)return;
    setLoading(true);setError(null);
    try{
      const res=await fetch("/api/scan",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({image:imageBase64,mediaType})
      });
      if(!res.ok)throw new Error(`HTTP ${res.status}`);
      const data=await res.json();
      const codes=data.stickers||[];
      const parsed=codes.map(c=>{
        const parts=String(c).trim().split(/\s+/);
        const code=parts[0]?.toUpperCase();
        const num=parseInt(parts[1]);
        if(!code||isNaN(num))return null;
        const isNeeded=userNeeded[code]?.includes(num)||false;
        const teamExists=!!ALBUM[code];
        const suggestion=getSuggestedPrice(code,num);
        return{code,num,isNeeded,teamExists,suggestion};
      }).filter(Boolean);
      setDetected(parsed);
      setStep("results");
    }catch(e){
      setError(`Error: ${e.message}`);
    }
    setLoading(false);
  };

  const applyAction=(code,num,action)=>{
    setApplied(prev=>({...prev,[`${code}-${num}`]:action}));
    if(onUpdateAlbum)onUpdateAlbum(code,num,action);
  };

  const reset=()=>{setStep("upload");setImage(null);setImageBase64(null);setDetected([]);setError(null);setApplied({});};

  const needed=detected.filter(s=>s.isNeeded);
  const repeated=detected.filter(s=>!s.isNeeded&&s.teamExists);
  const totalApplied=Object.keys(applied).length;

  // ── UPLOAD ──
  if(step==="upload") return (
    <div style={{padding:16,maxWidth:480,margin:"0 auto"}}>
      <h2 style={{fontWeight:900,fontSize:20,color:"#ffd700",margin:"0 0 4px"}}>📸 Escáner IA</h2>
      <p style={{color:"#6b7280",fontSize:13,marginBottom:20}}>Sube una foto o toma una y la IA detecta tus figuritas automáticamente.</p>

      <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:14,padding:16,marginBottom:20}}>
        {[
          ["📸","Toma foto o elige de tu galería"],
          ["🤖","La IA lee todos los códigos automáticamente"],
          ["💡","Te dice qué pegar, vender o cambiar"],
        ].map(([ic,txt],i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",marginBottom:i<2?12:0}}>
            <span style={{fontSize:22,flexShrink:0}}>{ic}</span>
            <span style={{color:"#9ca3af",fontSize:13,lineHeight:1.5}}>{txt}</span>
          </div>
        ))}
      </div>

      {/* FIX 1: Two buttons — camera + gallery */}
      {!image ? (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          {/* Camera */}
          <button onClick={()=>cameraRef.current?.click()} style={{padding:"20px 10px",background:"#0f172a",border:"2px solid #3b82f6",borderRadius:14,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <span style={{fontSize:32}}>📷</span>
            <span style={{fontWeight:700,color:"#60a5fa",fontSize:14}}>Tomar foto</span>
            <span style={{fontSize:11,color:"#4a5568"}}>Cámara</span>
          </button>
          <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>

          {/* Gallery */}
          <button onClick={()=>galleryRef.current?.click()} style={{padding:"20px 10px",background:"#0f172a",border:"2px solid #ffd700",borderRadius:14,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
            <span style={{fontSize:32}}>🖼️</span>
            <span style={{fontWeight:700,color:"#ffd700",fontSize:14}}>Mi galería</span>
            <span style={{fontSize:11,color:"#4a5568"}}>Fotos guardadas</span>
          </button>
          <input ref={galleryRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleFile(e.target.files[0])}/>
        </div>
      ) : (
        <div style={{marginBottom:16,position:"relative"}}>
          <img src={image} alt="preview" style={{width:"100%",borderRadius:16,border:"2px solid #1e3a5f",display:"block",maxHeight:300,objectFit:"cover"}}/>
          <button onClick={reset} style={{position:"absolute",top:10,right:10,background:"#ef4444",border:"none",borderRadius:20,color:"#fff",padding:"6px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>✕ Cambiar</button>
        </div>
      )}

      {error&&<div style={{background:"#1e0a0a",border:"1px solid #ef4444",borderRadius:10,padding:12,marginBottom:16,color:"#ef4444",fontSize:13}}>⚠️ {error}</div>}

      {image && (
        <button onClick={scan} disabled={loading} style={{width:"100%",padding:16,background:"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:14,color:"#0a0f1e",fontWeight:900,fontSize:16,cursor:"pointer",opacity:loading?0.7:1}}>
          {loading?"🤖 Analizando...":"🤖 Escanear con IA →"}
        </button>
      )}
      {loading&&<div style={{textAlign:"center",marginTop:12,color:"#6b7280",fontSize:13}}>Leyendo códigos... ~5 segundos</div>}
    </div>
  );

  // ── RESULTS ──
  return (
    <div style={{padding:16,maxWidth:480,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
        <button onClick={reset} style={{background:"none",border:"none",color:"#6b7280",fontSize:20,cursor:"pointer",padding:0}}>←</button>
        <h2 style={{fontWeight:900,fontSize:18,color:"#ffd700",margin:0}}>Resultado</h2>
        <span style={{marginLeft:"auto",fontSize:12,color:"#6b7280"}}>{detected.length} detectadas</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
        {[["✅",needed.length,"#22c55e","Pegar"],["🔁",repeated.length,"#f97316","Repetidas"],["📦",detected.length,"#60a5fa","Total"]].map(([ic,val,color,label])=>(
          <div key={label} style={{background:"#111827",border:`1px solid ${color}22`,borderRadius:12,padding:14,textAlign:"center"}}>
            <div style={{fontSize:22}}>{ic}</div>
            <div style={{fontWeight:900,fontSize:26,color}}>{val}</div>
            <div style={{fontSize:11,color:"#6b7280",textTransform:"uppercase"}}>{label}</div>
          </div>
        ))}
      </div>

      {image&&<img src={image} alt="" style={{width:"100%",borderRadius:12,border:"1px solid #1e2a3a",maxHeight:180,objectFit:"cover",marginBottom:16}}/>}

      {totalApplied>0&&(
        <div style={{background:"#052e16",border:"1px solid #22c55e",borderRadius:12,padding:12,marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>✅</span>
          <span style={{color:"#86efac",fontWeight:700,fontSize:14}}>{totalApplied} figurita{totalApplied>1?"s":""} actualizada{totalApplied>1?"s":""}</span>
        </div>
      )}

      {/* NEEDED */}
      {needed.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontWeight:800,fontSize:15,color:"#22c55e",marginBottom:10}}>✅ ¡Las que puedes PEGAR! ({needed.length})</div>
          {needed.map((s,i)=>{
            const team=ALBUM[s.code];
            const key=`${s.code}-${s.num}`;
            const done=applied[key];
            return(
              <div key={i} style={{background:"#052e16",border:"1px solid #22c55e",borderRadius:12,padding:14,marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:26}}>{team?.emoji||"🃏"}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,color:"#86efac"}}>{team?.name||s.code} <span style={{color:"#ffd700"}}>#{s.num}</span></div>
                  <div style={{fontSize:12,color:"#4ade80"}}>¡Estaba en tu lista de faltantes!</div>
                </div>
                {done?<span style={{fontSize:20}}>✅</span>:(
                  <button onClick={()=>applyAction(s.code,s.num,"have")} style={{padding:"8px 14px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>📌 Pegar</button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* REPEATED with suggestions */}
      {repeated.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{fontWeight:800,fontSize:15,color:"#f97316",marginBottom:10}}>🔁 Repetidas — ¿Qué haces? ({repeated.length})</div>
          {repeated.map((s,i)=>{
            const team=ALBUM[s.code];
            const key=`${s.code}-${s.num}`;
            const done=applied[key];
            const{price,label,color}=s.suggestion;
            return(
              <div key={i} style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:12,padding:14,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
                  <span style={{fontSize:24}}>{team?.emoji||"🃏"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,color:"#e8eaf6"}}>{team?.name||s.code} <span style={{color:"#ffd700"}}>#{s.num}</span></div>
                    <div style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:"#1e1500",color,border:`1px solid ${color}`,display:"inline-block",marginTop:3,fontWeight:700}}>
                      {label} · Precio sugerido ${price.toFixed(2)}
                    </div>
                  </div>
                  {done&&<span style={{fontSize:11,color:"#22c55e",fontWeight:700,background:"#052e16",padding:"4px 8px",borderRadius:8}}>✅ {done}</span>}
                </div>
                <div style={{background:"#0a0f1e",borderRadius:8,padding:"8px 10px",marginBottom:10,fontSize:12,color:"#9ca3af"}}>
                  💡 <span style={{color,fontWeight:700}}>IA sugiere:</span> {price>=3?"Escasa — subástala para el mejor precio.":price>=2?"Demandada — véndela o cámbiala pronto.":"Ofrécela en cambio con alguien de tu red."}
                </div>
                {!done&&(
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:6}}>
                    <button onClick={()=>applyAction(s.code,s.num,"sell")} style={{padding:"9px 6px",background:"#14532d",border:"1px solid #22c55e",borderRadius:8,color:"#86efac",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span>💰</span><span>Vender</span><span style={{fontSize:10,color:"#4ade80"}}>${price.toFixed(2)}</span>
                    </button>
                    <button onClick={()=>applyAction(s.code,s.num,"trade")} style={{padding:"9px 6px",background:"#1e3a5f",border:"1px solid #3b82f6",borderRadius:8,color:"#60a5fa",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span>🔄</span><span>Cambiar</span><span style={{fontSize:10,color:"#93c5fd"}}>Con red</span>
                    </button>
                    <button onClick={()=>applyAction(s.code,s.num,"auction")} style={{padding:"9px 6px",background:"#1e1040",border:"1px solid #a78bfa",borderRadius:8,color:"#a78bfa",fontWeight:700,fontSize:11,cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                      <span>🔨</span><span>Subastar</span><span style={{fontSize:10,color:"#c4b5fd"}}>Mejor precio</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {detected.length===0&&(
        <div style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:48,marginBottom:12}}>🔍</div>
          <div style={{fontWeight:700,color:"#e8eaf6",marginBottom:6}}>No se detectaron figuritas</div>
          <div style={{color:"#6b7280",fontSize:13}}>Asegúrate que los códigos sean legibles</div>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginTop:8}}>
        <button onClick={reset} style={{flex:1,padding:14,background:"transparent",border:"1px solid #1e2a3a",borderRadius:12,color:"#6b7280",fontWeight:700,fontSize:14,cursor:"pointer"}}>
          📸 Escanear más
        </button>
      </div>
      <div style={{height:20}}/>
    </div>
  );
}
