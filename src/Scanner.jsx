import { useState } from "react";
import { getTeamName } from "./i18n";

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

// Orden oficial real del álbum físico Panini (FWC/CC primero, luego grupos A→L) — el ALBUM
// de arriba tiene algunas claves fuera de posición (CC, ALG, BRA al final), así que el orden
// de páginas se define aparte en vez de confiar en Object.keys(ALBUM).
const ALBUM_PAGE_ORDER = [
  "FWC","CC","MEX","RSA","KOR","CZE","CAN","BIH","QAT","SUI","BRA","MAR","HAI","SCO",
  "USA","PAR","AUS","TUR","GER","CUW","CIV","ECU","NED","JPN","SWE","TUN","BEL","EGY",
  "IRN","NZL","ESP","CPV","KSA","URU","FRA","SEN","IRQ","NOR","ARG","ALG","AUT","JOR",
  "POR","COD","UZB","COL","ENG","CRO","GHA","PAN",
];
// Ordena por página del álbum primero, y dentro de la misma selección por número ascendente
// — así, después de escanear, las figuritas quedan en el mismo orden en que las vas a pegar.
function byAlbumPage(a, b) {
  const diff = ALBUM_PAGE_ORDER.indexOf(a.code) - ALBUM_PAGE_ORDER.indexOf(b.code);
  return diff !== 0 ? diff : a.num - b.num;
}

const TRADEABLE_STATES = ["repeated","sell","trade","auction"];

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

// Redimensiona la foto en el cliente antes de mandarla a la API. Claude procesa imágenes a una
// resolución efectiva máxima de ~1568px en el lado largo — mandar una foto de cámara sin comprimir
// (3-8MB típico en iPhone) no mejora la lectura, solo aumenta el riesgo de exceder el límite de
// payload de Vercel y el tiempo de respuesta. Eso es lo más probable detrás del
// FUNCTION_INVOCATION_FAILED: la función se mata a mitad de camino por tardar demasiado, en vez
// de devolver un error controlado. Bonus: el canvas siempre reexporta JPEG real sin importar el
// formato original (HEIC, PNG, etc.), así que esto también resuelve cualquier caso borde de HEIC
// que la normalización del lado del servidor no alcance a cubrir.
const MAX_DIMENSION = 1568;
const JPEG_QUALITY = 0.85;

function resizeImageToDataURL(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        if (width >= height) {
          height = Math.round(height * (MAX_DIMENSION / width));
          width = MAX_DIMENSION;
        } else {
          width = Math.round(width * (MAX_DIMENSION / height));
          height = MAX_DIMENSION;
        }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", JPEG_QUALITY));
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("image_read_error"));
    };
    img.src = objectUrl;
  });
}

export default function Scanner({ userNeeded={}, myStickers={}, onUpdateAlbum, lang="es", t, scanToken }) {
  const [step,setStep]=useState("upload");
  const [mode,setMode]=useState("entrada"); // "entrada" = registrar lo que tengo | "salida" = dar de baja lo que entregué en un cambio
  const [image,setImage]=useState(null);
  const [imageBase64,setImageBase64]=useState(null);
  const [mediaType,setMediaType]=useState("image/jpeg");
  const [detected,setDetected]=useState([]);
  const [error,setError]=useState(null);
  const [loading,setLoading]=useState(false);
  const [processingImage,setProcessingImage]=useState(false);
  const [applied,setApplied]=useState({});

  const handleFile=(file)=>{
    if(!file)return;
    setError(null);
    setProcessingImage(true);
    resizeImageToDataURL(file).then(dataUrl=>{
      // El canvas siempre reexporta JPEG real, así que mediaType ya no depende de file.type.
      setMediaType("image/jpeg");
      setImage(dataUrl);
      setImageBase64(dataUrl.split(",")[1]);
    }).catch(()=>{
      setError(t?.photoProcessError || "No se pudo procesar esa foto. Intenta con otra.");
    }).finally(()=>{
      setProcessingImage(false);
    });
  };

  const scan=async()=>{
    if(!imageBase64)return;
    if(!scanToken){
      setError(t?.scanNoSession||"No se pudo verificar tu sesión. Intenta de nuevo en unos segundos.");
      return;
    }
    setLoading(true);setError(null);
    try{
      const res=await fetch("/api/scan",{
        method:"POST",
        headers:{"Content-Type":"application/json",Authorization:`Bearer ${scanToken}`},
        body:JSON.stringify({image:imageBase64,mediaType})
      });
      if(res.status===429){
        const data=await res.json().catch(()=>({}));
        throw new Error(data.error||t?.scanRateLimited||"Alcanzaste el límite de escaneos por hora. Intenta más tarde.");
      }
      if(!res.ok)throw new Error(`Error ${res.status}`);
      const data=await res.json();
      const codes=data.stickers||[];

      const counts={};
      codes.forEach(c=>{
        const key=String(c).trim().toUpperCase();
        counts[key]=(counts[key]||0)+1;
      });

      const parsed=Object.keys(counts).map(c=>{
        const parts=c.split(/\s+/);
        const code=parts[0]?.toUpperCase();
        const num=parseInt(parts[1]);
        if(!code||isNaN(num))return null;
        const teamExists=!!ALBUM[code];
        if(!teamExists)return null;

        // Fix: usar myStickers para clasificar correctamente
        const current=myStickers?.[code]?.[num];
        const currentState=current?.state||"missing";
        const isNeeded=currentState==="missing";
        const isAlreadyTradeable=TRADEABLE_STATES.includes(currentState);
        // Stock real disponible para dar de salida: 0 si está "missing" o "have" (esa es tu
        // única unidad, la del álbum), o la qty registrada si está en cualquier estado tradeable.
        const availableQty=isAlreadyTradeable?(current?.qty||1):0;

        const suggestion=getSuggestedPrice(code,num);
        const quantity=counts[c];
        return{code,num,isNeeded,isAlreadyTradeable,currentState,availableQty,suggestion,quantity,teamExists};
      }).filter(Boolean);

      setDetected(parsed);
      setStep("results");
    }catch(e){
      setError(`${t?.scanError || "Error al escanear"}: ${e.message==="image_read_error"?(t?.imageReadError||e.message):e.message}`);
    }
    setLoading(false);
  };

  // Fix: applyAction ahora pasa qty y price correctamente a handleAction en App.jsx
  const applyAction=(code,num,action,qty=1,price=0,customToast=null)=>{
    setApplied(prev=>({...prev,[`${code}-${num}`]:action}));
    if(onUpdateAlbum) onUpdateAlbum(code,num,action,qty,price,customToast);
  };

  // Fix: botón "Enviar a repetidas" — marca como repeated con qty correcta
  const sendToRepeated=(s,customToast=null)=>{
    const current=myStickers?.[s.code]?.[s.num];
    const currentQty=current?.state==="repeated"?(current.qty||1):0;
    // Si ya tiene unidades como repeated, suma las nuevas
    const newQty=currentQty+s.quantity;
    applyAction(s.code,s.num,"repeated",newQty,0,customToast);
  };

  // Aplicar todo de un golpe — evita tener que tocar t?.paste || "Pegar" o "Repetida" figurita por figurita
  // cuando el escaneo detectó muchas a la vez (ej. un sobre completo o una página). Solo el
  // último de la tanda manda un toast con el resumen total, en vez de 20 avisos pisándose entre sí.
  const applyAllNeeded = () => {
    const toApply = needed.filter(s => !applied[`${s.code}-${s.num}`]);
    if (toApply.length === 0) return;
    toApply.forEach((s, i) => {
      const isLast = i === toApply.length - 1;
      applyAction(s.code, s.num, "have", 1, 0, isLast ? `✅ ${toApply.length} figurita${toApply.length>1?"s":""} pegada${toApply.length>1?"s":""}` : null);
    });
  };

  const applyAllRepeated = () => {
    const toApply = repeated.filter(s => !applied[`${s.code}-${s.num}`]);
    if (toApply.length === 0) return;
    toApply.forEach((s, i) => {
      const isLast = i === toApply.length - 1;
      sendToRepeated(s, isLast ? `🔁 ${toApply.length} figurita${toApply.length>1?"s":""} enviada${toApply.length>1?"s":""} a repetidas` : null);
    });
  };

  // Modo Salida: dar de baja stock que físicamente acabas de entregar en un cambio/venta.
  // Resta s.quantity (lo escaneado) del stock real registrado (availableQty). Si llega a 0,
  // vuelve a "have" — sigues teniendo la unidad de tu álbum, solo se acabaron las de sobra —
  // nunca a "missing", igual que el fix del long-press en el álbum.
  const giveOut=(s)=>{
    const current=myStickers?.[s.code]?.[s.num];
    const currentState=current?.state||"missing";
    const currentQty=s.availableQty;
    const toRemove=Math.min(s.quantity,currentQty);
    const newQty=currentQty-toRemove;
    if(newQty<=0) applyAction(s.code,s.num,"have",1,0);
    else applyAction(s.code,s.num,currentState,newQty,current?.price||0);
  };

  const reset=()=>{
    setStep("upload");setImage(null);
    setImageBase64(null);setDetected([]);
    setError(null);setApplied({});
  };

  const needed=detected.filter(s=>s.isNeeded);
  const repeated=detected.filter(s=>!s.isNeeded&&s.teamExists);
  const totalApplied=Object.keys(applied).length;

  if(step==="upload") return (
    <div style={{padding:16,maxWidth:480,margin:"0 auto"}}>
      <h2 style={{fontWeight:900,fontSize:20,color:"#ffd700",margin:"0 0 4px"}}>{t?.scannerTitle || "📸 Escáner IA"}</h2>
      <p style={{color:"#6b7280",fontSize:13,marginBottom:20}}>
        {t?.scannerSubtitle || "Sube una foto y la IA detecta automáticamente qué figuritas hay."}
      </p>

      <div style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:14,padding:16,marginBottom:20}}>
        {[
          ["1️⃣",t?.stepChoosePhoto || "Elige una foto o toma una nueva"],
          ["2️⃣",t?.stepScanAI || "Toca Escanear con IA"],
          ["3️⃣",t?.stepDecideMode || "Decide si es Entrada (lo que tienes) o Salida (lo que entregaste)"],
        ].map(([ic,txt],i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:i<2?10:0}}>
            <span style={{fontSize:20,flexShrink:0}}>{ic}</span>
            <span style={{color:"#9ca3af",fontSize:13}}>{txt}</span>
          </div>
        ))}
      </div>

      {image && (
        <div style={{marginBottom:16,position:"relative"}}>
          <img src={image} alt="preview" style={{width:"100%",borderRadius:16,border:"2px solid #3b82f6",display:"block",maxHeight:280,objectFit:"cover"}}/>
          <button onClick={reset} style={{position:"absolute",top:10,right:10,background:"rgba(0,0,0,0.7)",border:"none",borderRadius:20,color:"#fff",padding:"6px 12px",fontWeight:700,fontSize:12,cursor:"pointer"}}>
            ✕ {t?.change || "Cambiar"}
          </button>
        </div>
      )}

      {processingImage && (
        <div style={{textAlign:"center",padding:24,color:"#6b7280",fontSize:13}}>{t?.processingPhoto || "⏳ Procesando foto..."}</div>
      )}

      {!image && !processingImage && (
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
          <label style={{display:"block",cursor:"pointer"}}>
            <div style={{padding:"24px 10px",background:"#0f172a",border:"2px solid #3b82f6",borderRadius:14,display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:"pointer"}}>
              <span style={{fontSize:36}}>📷</span>
              <span style={{fontWeight:700,color:"#60a5fa",fontSize:14}}>{t?.takePhoto || "Tomar foto"}</span>
              <span style={{fontSize:11,color:"#4a5568"}}>{t?.openCamera || "Abre la cámara"}</span>
            </div>
            <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}}/>
          </label>

          <label style={{display:"block",cursor:"pointer"}}>
            <div style={{padding:"24px 10px",background:"#0f172a",border:"2px solid #ffd700",borderRadius:14,display:"flex",flexDirection:"column",alignItems:"center",gap:8,cursor:"pointer"}}>
              <span style={{fontSize:36}}>🖼️</span>
              <span style={{fontWeight:700,color:"#ffd700",fontSize:14}}>{t?.gallery || "Mi galería"}</span>
              <span style={{fontSize:11,color:"#4a5568"}}>{t?.savedPhotos || "Fotos guardadas"}</span>
            </div>
            <input type="file" accept="image/*" style={{display:"none"}} onChange={e=>{const f=e.target.files?.[0];if(f)handleFile(f);}}/>
          </label>
        </div>
      )}

      {error&&(
        <div style={{background:"#1e0a0a",border:"1px solid #ef4444",borderRadius:10,padding:12,marginBottom:16,color:"#ef4444",fontSize:13}}>
          ⚠️ {error}
        </div>
      )}

      {image&&(
        <button onClick={scan} disabled={loading} style={{width:"100%",padding:16,background:loading?"#1e2a3a":"linear-gradient(135deg,#ffd700,#f59e0b)",border:"none",borderRadius:14,color:loading?"#6b7280":"#0a0f1e",fontWeight:900,fontSize:16,cursor:loading?"not-allowed":"pointer"}}>
          {loading?(t?.analyzingPhoto || "🤖 Analizando tu foto..."):(t?.scanWithAI || "🤖 Escanear con IA →")}
        </button>
      )}

      {loading&&(
        <div style={{textAlign:"center",marginTop:16,color:"#6b7280",fontSize:13}}>
          {t?.aiReading || "La IA está leyendo los códigos... ~5-10 segundos"}
        </div>
      )}
    </div>
  );

  return (
    <div style={{padding:16,maxWidth:480,margin:"0 auto"}}>
      <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
        <button onClick={reset} style={{background:"none",border:"none",color:"#6b7280",fontSize:22,cursor:"pointer",padding:0,lineHeight:1}}>←</button>
        <h2 style={{fontWeight:900,fontSize:18,color:"#ffd700",margin:0}}>{mode==="salida"?(t?.removeFromStock || "📤 Dar de baja"):(t?.scanResult || "Resultado del escaneo")}</h2>
        <span style={{marginLeft:"auto",fontSize:12,color:"#6b7280"}}>{detected.length} {t?.uniqueCodes || "códigos únicos"}</span>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:16}}>
        <button onClick={()=>setMode("entrada")} style={{padding:"12px 8px",borderRadius:12,border:mode==="entrada"?"2px solid #22c55e":"1px solid #1e2a3a",background:mode==="entrada"?"#052e16":"#111827",color:mode==="entrada"?"#86efac":"#6b7280",fontWeight:800,fontSize:13,cursor:"pointer"}}>
          📥 {t?.entry || "Entrada"}
          <div style={{fontSize:10,fontWeight:500,marginTop:2,opacity:0.8}}>{t?.entryHelp || "Esto es lo que tengo"}</div>
        </button>
        <button onClick={()=>setMode("salida")} style={{padding:"12px 8px",borderRadius:12,border:mode==="salida"?"2px solid #ef4444":"1px solid #1e2a3a",background:mode==="salida"?"#1e0a0a":"#111827",color:mode==="salida"?"#fca5a5":"#6b7280",fontWeight:800,fontSize:13,cursor:"pointer"}}>
          📤 {t?.exit || "Salida"}
          <div style={{fontSize:10,fontWeight:500,marginTop:2,opacity:0.8}}>{t?.exitHelp || "Esto entregué"}</div>
        </button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:8,marginBottom:16}}>
        {(mode==="salida"?[
          ["📤",detected.filter(s=>s.availableQty>0).reduce((sum,s)=>sum+Math.min(s.quantity,s.availableQty),0),"#ef4444",t?.removeFromStock || "Por dar salida"],
          ["⚠️",detected.filter(s=>s.availableQty===0).length,"#f97316",t?.noStock || "Sin stock"],
          ["📦",detected.reduce((sum,s)=>sum+s.quantity,0),"#60a5fa",t?.total || "Total"],
        ]:[
          ["✅",needed.reduce((sum,s)=>sum+s.quantity,0),"#22c55e",t?.paste || "Pegar"],
          ["🔁",repeated.reduce((sum,s)=>sum+s.quantity,0),"#f97316",t?.duplicates || "Repetidas"],
          ["📦",detected.reduce((sum,s)=>sum+s.quantity,0),"#60a5fa",t?.total || "Total"],
        ]).map(([ic,val,color,label])=>(
          <div key={label} style={{background:"#111827",border:`1px solid ${color}33`,borderRadius:12,padding:14,textAlign:"center"}}>
            <div style={{fontSize:22}}>{ic}</div>
            <div style={{fontWeight:900,fontSize:26,color}}>{val}</div>
            <div style={{fontSize:11,color:"#6b7280",textTransform:"uppercase"}}>{label}</div>
          </div>
        ))}
      </div>

      {image&&(
        <img src={image} alt="" style={{width:"100%",borderRadius:12,border:"1px solid #1e2a3a",maxHeight:160,objectFit:"cover",marginBottom:16}}/>
      )}

      {totalApplied>0&&(
        <div style={{background:"#052e16",border:"1px solid #22c55e",borderRadius:12,padding:12,marginBottom:16,display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>✅</span>
          <span style={{color:"#86efac",fontWeight:700,fontSize:14}}>
            {totalApplied} figurita{totalApplied>1?"s":""} {t?.updatedInAlbum || "actualizadas en tu álbum"}
          </span>
        </div>
      )}

      {mode==="salida"&&detected.length>0?(
        <div style={{marginBottom:20}}>
          <div style={{fontWeight:800,fontSize:15,color:"#ef4444",marginBottom:4}}>
            {t?.removeFromStock || "📤 Dar de baja"} ({detected.length})
          </div>
          <div style={{fontSize:12,color:"#6b7280",marginBottom:10}}>
            {t?.removeFromStockHelp || "Esto resta del stock que tenías registrado como disponible (repetida/venta/cambio/subasta)."}
          </div>
          {[...detected].sort(byAlbumPage).map((s,i)=>{
            const team=ALBUM[s.code];
            const key=`${s.code}-${s.num}`;
            const done=applied[key];
            const overScanned=s.quantity>s.availableQty;
            return (
              <div key={i} style={{background:overScanned&&!done?"#1e1500":"#111827",border:overScanned&&!done?"1px solid #f97316":"1px solid #1e2a3a",borderRadius:12,padding:14,marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:24}}>{team?.emoji||"🃏"}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,color:"#e8eaf6"}}>
                    {getTeamName(s.code,lang)||s.code} <span style={{fontSize:11,fontWeight:700,color:"#6b7280"}}>{s.code}</span> <span style={{color:"#ffd700"}}>#{s.num}</span>
                    {s.quantity>1&&<span style={{marginLeft:8,fontSize:11,background:"#ef4444",color:"#fff",padding:"2px 8px",borderRadius:10,fontWeight:700}}>x{s.quantity} {t?.scanned || "escaneadas"}</span>}
                  </div>
                  {s.availableQty>0
                    ? <div style={{fontSize:12,color:"#9ca3af"}}>{t?.youHadAvailable || "Tenías"} {s.availableQty} {t?.availableRegistered || "disponible registrada"}</div>
                    : <div style={{fontSize:12,color:"#fb923c",fontWeight:700}}>{t?.noStockWarning || "⚠️ No tenías esta marcada como disponible — revisa antes de confirmar"}</div>
                  }
                </div>
                {done
                  ? <span style={{fontSize:22}}>✅</span>
                  : s.availableQty>0
                    ? <button onClick={()=>giveOut(s)} style={{padding:"8px 14px",background:"#ef4444",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer",whiteSpace:"nowrap"}}>{t?.giveOut || "📤 Dar salida"}</button>
                    : <span style={{fontSize:11,color:"#4a5568"}}>—</span>
                }
              </div>
            );
          })}
        </div>
      ):(<>
      {needed.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:8}}>
            <div style={{fontWeight:800,fontSize:15,color:"#22c55e"}}>
              {t?.canPaste || "✅ ¡Las que puedes PEGAR!"} ({needed.length})
            </div>
            <button onClick={applyAllNeeded} style={{padding:"6px 12px",background:"#22c55e",border:"none",borderRadius:8,color:"#0a0f1e",fontWeight:800,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>
              {t?.scannerPasteAll || "📌 Pegar todas"}
            </button>
          </div>
          {[...needed].sort(byAlbumPage).map((s,i)=>{
            const team=ALBUM[s.code];
            const key=`${s.code}-${s.num}`;
            const done=applied[key];
            return (
              <div key={i} style={{background:"#052e16",border:"1px solid #22c55e",borderRadius:12,padding:14,marginBottom:8,display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:26}}>{team?.emoji||"🃏"}</span>
                <div style={{flex:1}}>
                  <div style={{fontWeight:800,color:"#86efac"}}>
                    {getTeamName(s.code,lang)||s.code} <span style={{fontSize:11,fontWeight:700,color:"#6b7280"}}>{s.code}</span> <span style={{color:"#ffd700"}}>#{s.num}</span>
                    {s.quantity>1&&<span style={{marginLeft:8,fontSize:11,background:"#22c55e",color:"#0a0f1e",padding:"2px 8px",borderRadius:10,fontWeight:700}}>x{s.quantity}</span>}
                  </div>
                  <div style={{fontSize:12,color:"#4ade80"}}>{t?.detectedAsMissing || "¡Estaba en tu lista de faltantes!"}</div>
                </div>
                {done
                  ? <span style={{fontSize:22}}>✅</span>
                  : <button onClick={()=>applyAction(s.code,s.num,"have",1,0)} style={{padding:"8px 14px",background:"#22c55e",border:"none",borderRadius:8,color:"#fff",fontWeight:700,fontSize:12,cursor:"pointer"}}>📌 Pegar</button>
                }
              </div>
            );
          })}
        </div>
      )}

      {repeated.length>0&&(
        <div style={{marginBottom:20}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10,gap:8}}>
            <div style={{fontWeight:800,fontSize:15,color:"#f97316"}}>
              🔁 {t?.duplicates || "Repetidas"} ({repeated.length})
            </div>
            <button onClick={applyAllRepeated} style={{padding:"6px 12px",background:"#f97316",border:"none",borderRadius:8,color:"#1e0a00",fontWeight:800,fontSize:11,cursor:"pointer",whiteSpace:"nowrap"}}>
              {t?.sendAll || "🔁 Enviar todas"}
            </button>
          </div>
          {[...repeated].sort(byAlbumPage).map((s,i)=>{
            const team=ALBUM[s.code];
            const key=`${s.code}-${s.num}`;
            const done=applied[key];
            const{price,label,color}=s.suggestion;
            const totalValue=(price*s.quantity).toFixed(2);
            return (
              <div key={i} style={{background:"#111827",border:"1px solid #1e2a3a",borderRadius:12,padding:14,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:done?0:10}}>
                  <span style={{fontSize:24}}>{team?.emoji||"🃏"}</span>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:800,color:"#e8eaf6"}}>
                      {getTeamName(s.code,lang)||s.code} <span style={{fontSize:11,fontWeight:700,color:"#6b7280"}}>{s.code}</span> <span style={{color:"#ffd700"}}>#{s.num}</span>
                      {s.quantity>1&&<span style={{marginLeft:8,fontSize:11,background:"#f97316",color:"#fff",padding:"2px 8px",borderRadius:10,fontWeight:700}}>x{s.quantity}</span>}
                    </div>
                    {/* Valor estimado se deja como referencia informativa — venta/subasta en stand-by por ahora */}
                    <span style={{fontSize:11,padding:"2px 8px",borderRadius:10,background:"#0a0f1e",color,border:`1px solid ${color}`,fontWeight:700}}>
                      {t?.estimatedValue || "Valor estimado"} {label} · ${price.toFixed(2)} {t?.each || "c/u"} {s.quantity>1?`· $${totalValue} total`:""}
                    </span>
                  </div>
                  {done&&<span style={{fontSize:11,color:"#22c55e",fontWeight:700,background:"#052e16",padding:"4px 8px",borderRadius:8}}>✅</span>}
                </div>

                {!done&&(
                  <button
                    onClick={()=>sendToRepeated(s)}
                    style={{width:"100%",padding:"10px",background:"#1e1500",border:"2px solid #f97316",borderRadius:8,color:"#f97316",fontWeight:800,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:6}}
                  >
                    <span style={{fontSize:16}}>🔁</span>
                    <span>{t?.markAsRepeated || "Marcar como repetida"}{s.quantity>1?` ×${s.quantity}`:""}</span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      </>)}

      {detected.length===0&&(
        <div style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:48,marginBottom:12}}>🔍</div>
          <div style={{fontWeight:700,color:"#e8eaf6",marginBottom:6}}>{t?.noStickerFound || "No se detectaron figuritas"}</div>
          <div style={{color:"#6b7280",fontSize:13,marginBottom:20}}>{t?.photoTips || "Asegúrate que los códigos sean visibles y la foto esté clara"}</div>
          <button onClick={reset} style={{padding:"12px 24px",background:"#ffd700",border:"none",borderRadius:10,fontWeight:800,fontSize:14,cursor:"pointer",color:"#0a0f1e"}}>
            {t?.tryAgain || "Intentar de nuevo"}
          </button>
        </div>
      )}

      <div style={{display:"flex",gap:10,marginTop:8,paddingBottom:20}}>
        <button onClick={reset} style={{flex:1,padding:14,background:"transparent",border:"1px solid #1e2a3a",borderRadius:12,color:"#6b7280",fontWeight:700,fontSize:14,cursor:"pointer"}}>
          {t?.scannedMore || "📸 Escanear más"}
        </button>
      </div>
    </div>
  );
}
