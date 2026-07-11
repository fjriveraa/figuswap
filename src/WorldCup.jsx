import { useState, useEffect, useCallback } from "react";
import { getTeamName } from "./i18n";

// Mapeo real de los 16 estadios del Mundial 2026 a su zona horaria IANA — confirmado contra
// el archivo de datos oficial de la API (football.stadiums.json). Esto es lo que permite
// convertir la hora del estadio a la hora real del dispositivo de quien mira, sin adivinar:
// IANA ya sabe, para cada zona, si aplica horario de verano en la fecha exacta del partido
// (ej. México no aplica DST desde 2023, EE.UU./Canadá sí) — por eso no basta con un offset fijo.
const STADIUM_TIMEZONES = {
  "1": "America/Mexico_City",   // Estadio Azteca, Ciudad de México
  "2": "America/Mexico_City",   // Estadio Akron, Guadalajara
  "3": "America/Monterrey",     // Estadio BBVA, Monterrey
  "4": "America/Chicago",       // AT&T Stadium, Dallas
  "5": "America/Chicago",       // NRG Stadium, Houston
  "6": "America/Chicago",       // Arrowhead Stadium, Kansas City
  "7": "America/New_York",      // Mercedes-Benz Stadium, Atlanta
  "8": "America/New_York",      // Hard Rock Stadium, Miami
  "9": "America/New_York",      // Gillette Stadium, Boston
  "10": "America/New_York",     // Lincoln Financial Field, Philadelphia
  "11": "America/New_York",     // MetLife Stadium, Nueva York/Nueva Jersey
  "12": "America/Toronto",      // BMO Field, Toronto
  "13": "America/Vancouver",    // BC Place, Vancouver
  "14": "America/Los_Angeles",  // Lumen Field, Seattle
  "15": "America/Los_Angeles",  // Levi's Stadium, San Francisco Bay Area
  "16": "America/Los_Angeles",  // SoFi Stadium, Los Ángeles
};

// Nombre, ciudad y país de los 16 estadios — datos fijos del torneo (mismos IDs que
// STADIUM_TIMEZONES). Tabla local a propósito: evita una llamada extra a la API en cada
// carga y funciona aunque la API de estadios esté caída.
const STADIUM_INFO = {
  "1":  { name: "Estadio Azteca", city: "Ciudad de México", country: "México" },
  "2":  { name: "Estadio Akron", city: "Guadalajara", country: "México" },
  "3":  { name: "Estadio BBVA", city: "Monterrey", country: "México" },
  "4":  { name: "AT&T Stadium", city: "Dallas", country: "EE. UU." },
  "5":  { name: "NRG Stadium", city: "Houston", country: "EE. UU." },
  "6":  { name: "Arrowhead Stadium", city: "Kansas City", country: "EE. UU." },
  "7":  { name: "Mercedes-Benz Stadium", city: "Atlanta", country: "EE. UU." },
  "8":  { name: "Hard Rock Stadium", city: "Miami", country: "EE. UU." },
  "9":  { name: "Gillette Stadium", city: "Boston", country: "EE. UU." },
  "10": { name: "Lincoln Financial Field", city: "Filadelfia", country: "EE. UU." },
  "11": { name: "MetLife Stadium", city: "Nueva York/Nueva Jersey", country: "EE. UU." },
  "12": { name: "BMO Field", city: "Toronto", country: "Canadá" },
  "13": { name: "BC Place", city: "Vancouver", country: "Canadá" },
  "14": { name: "Lumen Field", city: "Seattle", country: "EE. UU." },
  "15": { name: "Levi's Stadium", city: "San Francisco", country: "EE. UU." },
  "16": { name: "SoFi Stadium", city: "Los Ángeles", country: "EE. UU." },
};

// Calcula el offset (en minutos) de una zona horaria respecto a UTC, para una fecha concreta —
// "para una fecha concreta" es la parte importante: el mismo lugar puede tener offsets distintos
// en junio (verano) vs. diciembre (invierno), y esto lo resuelve solo, usando Intl del navegador.
function getTzOffsetMinutes(date, timeZone) {
  const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
  const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));
  return (tzDate.getTime() - utcDate.getTime()) / 60000;
}

// Convierte "MM/DD/YYYY HH:mm" (hora local del estadio, como la manda la API) a un objeto Date
// con el instante UTC real y correcto. A partir de ahí, cualquier .toLocaleString() del navegador
// ya muestra automáticamente la hora correcta de quien esté mirando, sin más conversión manual.
function stadiumTimeToDate(localDateStr, stadiumId) {
  if (!localDateStr) return null;
  const m = localDateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
  if (!m) return null;
  const [, month, day, year, hour, minute] = m;
  const timeZone = STADIUM_TIMEZONES[String(stadiumId)] || "America/New_York";
  // Paso 1: armar un Date "ingenuo" tratando esos números como si ya fueran UTC — solo para
  // tener un punto de partida con el que calcular el offset correcto de esa fecha específica.
  const naiveUtc = new Date(`${year}-${month}-${day}T${hour}:${minute}:00Z`);
  const offsetMin = getTzOffsetMinutes(naiveUtc, timeZone);
  // Paso 2: restar ese offset — así el resultado es el instante UTC real que corresponde a
  // "esa hora, en esa zona", no en UTC.
  return new Date(naiveUtc.getTime() - offsetMin * 60000);
}

const LOCALE_BY_LANG = { es:"es-ES", en:"en-US", it:"it-IT", fr:"fr-FR", pt:"pt-BR", de:"de-DE", ar:"ar-SA" };

// Formatea un Date real (ya en UTC correcto) en la hora LOCAL del dispositivo que está mirando
// — sin pasar ninguna opción de timeZone aquí a propósito: al omitirla, el navegador usa la
// zona horaria del dispositivo automáticamente, sea cual sea (Honduras, España, Brasil, etc.).
function formatViewerDateTime(date, lang) {
  if (!date || isNaN(date.getTime())) return null;
  const locale = LOCALE_BY_LANG[lang] || "es-ES";
  return {
    dayLabel: date.toLocaleDateString(locale, { weekday: "short", day: "numeric", month: "short" }),
    timeLabel: date.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" }),
    dayKey: date.toLocaleDateString("en-CA"), // YYYY-MM-DD estable, para agrupar sin ambigüedad
  };
}

// Cada cuánto se vuelve a consultar mientras la pestaña está abierta. La caché del proxy
// (api/worldcup.js) ya evita golpear la API externa más de una vez cada 30s, así que este
// intervalo solo controla qué tan "viva" se siente la pantalla para el usuario.
const REFRESH_MS = 45000;

// Acepta que la respuesta venga como array directo o envuelta en {teams:[...]}, {groups:[...]},
// {games:[...]} — no tengo forma de probar contra la API real desde aquí, así que esto cubre
// las formas más probables sin asumir una sola.
function unwrap(json, key) {
  if (Array.isArray(json)) return json;
  if (json && Array.isArray(json[key])) return json[key];
  if (json && Array.isArray(json.data)) return json.data;
  return [];
}

// Fix (conv. 3): la API no siempre manda el tipo de ronda con el mismo texto exacto —
// se han visto variantes como "quarter-final", "QF", "quarterfinal". Esto las normaliza
// todas a las claves internas (group/r32/r16/qf/sf/third/final) antes de usarlas.
function normalizeType(raw) {
  const s = String(raw || "").toLowerCase().replace(/[\s_-]/g, "");
  if (!s || s.includes("group")) return "group";
  if (s === "r32" || s.includes("32")) return "r32";
  if (s === "r16" || s.includes("16") || s.includes("octavos")) return "r16";
  if (s === "qf" || s.includes("quarter") || s.includes("cuartos")) return "qf";
  if (s === "sf" || s.includes("semi")) return "sf";
  if (s.includes("third") || s.includes("tercer")) return "third";
  if (s.includes("final")) return "final"; // después de semi/third para no capturarlas
  return "group";
}

const LOCAL_CACHE_KEY = "figuswitch_worldcup_cache_v1";

function loadLocalCache() {
  try {
    const raw = localStorage.getItem(LOCAL_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}
function saveLocalCache(data) {
  try { localStorage.setItem(LOCAL_CACHE_KEY, JSON.stringify(data)); } catch { /* localStorage lleno o bloqueado: no es crítico, se sigue sin caché */ }
}

function fetchWorldcup(type, signal) {
  // Fix (conv. 3): cache-busting — algunos navegadores/CDN cachean la respuesta del proxy
  // más de la cuenta; el timestamp fuerza que cada consulta sea única. La caché real de 30s
  // sigue viviendo en el servidor (api/worldcup.js), así que esto no aumenta el costo.
  // El cache-bust usa una ventana de 90s (igual a s-maxage del servidor) en vez de
  // Date.now() puro — así el navegador SÍ puede reusar la respuesta cacheada del edge
  // dentro de esa ventana, en lugar de forzar una llamada nueva cada vez sin necesidad.
  return fetch(`/api/worldcup?type=${type}&t=${Math.floor(Date.now()/90000)}`, { signal }).then(async (r) => {
    const json = await r.json().catch(() => null);
    if (!r.ok || !json) throw new Error(json?.error || "Error al cargar datos del Mundial");
    return json;
  });
}

function Flag({ team }) {
  const [imgFailed, setImgFailed] = useState(false);
  if (!team || !team.flag || imgFailed) {
    return <span style={{ width: 20, display: "inline-block", flexShrink: 0 }}>🏳️</span>;
  }
  // Fix: antes solo se revisaba si team.flag existía como dato, pero si la URL existe y la
  // imagen falla al cargar (link roto, CORS, etc.), el navegador mostraba un ícono de imagen
  // rota en vez de la bandera de respaldo. onError ahora cambia al emoji si eso pasa.
  return <img src={team.flag} alt="" onError={() => setImgFailed(true)} style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />;
}

// Fix: esta API manda finished como texto "TRUE"/"FALSE" (string), no booleano real.
// "FALSE" es un string no vacío, así que `if(match.finished)` lo trataba como verdadero —
// eso hacía que TODOS los partidos contaran como finalizados, inflando "PJ" en la tabla.
// Tampoco existe un campo "status": el indicador real de en vivo/no-empezado es time_elapsed.
// Fix (conv. 3): la API manda el mismo jugador escrito distinto según el partido
// ("K. Mbappé" en uno, "Kylian Mbappé" en otro) — agrupar por nombre exacto lo duplicaba.
// La clave normaliza: sin acentos, minúsculas, APELLIDO + INICIAL del nombre + equipo.
// Así "K. Mbappé" y "Kylian Mbappé" (mismo equipo) colapsan en una sola entrada.
function scorerKey(name, team) {
  const clean = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/\./g, "").trim();
  const parts = clean.split(/\s+/);
  if (parts.length === 0) return clean + "|" + (team || "");
  const last = parts[parts.length - 1];
  const initial = parts[0][0] || "";
  return `${last}|${initial}|${team || ""}`;
}

// Fix (conv. 3): la API a veces manda nombres corruptos (ej. "Dnil Mvnvz" — sin vocales).
// Heurística: si alguna palabra de 4+ letras no tiene NINGUNA vocal, el nombre es basura.
function isCorruptedName(name) {
  const words = name.split(/\s+/).filter(w => w.length >= 4);
  return words.some(w => !/[aeiouáéíóúàèìòùäëïöü]/i.test(w));
}

// ============================================================================
// CORRECCIÓN TEMPORAL — nombres corruptos EN LA FUENTE (worldcup26.ir)
// Verificado contra el JSON crudo del endpoint: los nombres YA llegan así de
// la API (ej. juego 35 trae "Kvdi Khakpv" junto a "Brian Brobbey" correcto).
// La API es de origen iraní y algunos nombres pasan por una transliteración
// persa de ida y vuelta que destroza las vocales (en persa "و" es v/o/u:
// "Cody Gakpo" → "Kvdi Khakpv"). Es inconsistente incluso para el mismo
// jugador: el juego 22 trae "H. Kane" correcto y el 67 trae "Hri Kin".
// Este diccionario corrige los casos identificados ANTES del filtro de
// corruptos (si no, el filtro oculta goles reales, ej. "Nvnv Mndz").
// Fácil de eliminar cuando el proveedor corrija: borrar este bloque y las
// 2 líneas fixScorerName() en computeTopScorers.
// ============================================================================
const SCORER_NAME_FIXES = {
  // Confirmados por Fernando:
  "Kvdi Khakpv": "Cody Gakpo",
  "Jvlian Kviinvnz": "Julián Quiñones",
  "Jvlian Kviiivnvz": "Julián Quiñones", // variante vista en pantalla
  "Jvd Blingham": "Jude Bellingham",
  "Hri Kin": "Harry Kane",
  "Jvhan Mnzambi": "Johan Manzambi",
  // Identificados sin ambigüedad en el JSON (nombre corrupto + selección coinciden con un solo jugador real):
  "Rvbn Vargas": "Rubén Vargas",           // Suiza — llega correcto en el juego 54 y corrupto en el 26
  "Aldvr Shvmvrvdvf": "Eldor Shomurodov",  // Uzbekistán — el filtro le ocultaba el gol
  "Jivani Lv Slsv": "Giovani Lo Celso",    // Argentina
  "Dnil Mvnvz": "Daniel Muñoz",            // Colombia
  "Lviiz Diaz": "Luis Díaz",               // Colombia
  "Nvnv Mndz": "Nuno Mendes",              // Portugal — el filtro le ocultaba el gol
  "Dniz Avndav": "Deniz Undav",            // Alemania
  "Nikvlas Ph Ph": "Nicolas Pépé",         // Costa de Marfil
  "Paph Gviih": "Pape Gueye",              // Senegal
  "Mvsi Altmari": "Musa Al-Taamari",       // Jordania
  "Hazm Mstvri": "Hazem Mastouri",         // Túnez
  "Fistvn Mail": "Fiston Mayele",          // RD Congo
  "Rvmanv Ashmid": "Romano Schmid",        // Austria
  "Gvnzalv Plata": "Gonzalo Plata",        // Ecuador
  "Nilsvn Angvlv": "Nilson Angulo",        // Ecuador
};
function fixScorerName(name) {
  return SCORER_NAME_FIXES[name] || name;
}

// Suma goles por jugador a partir de home_scorers/away_scorers de todos los partidos.
// Cada entrada del array es un gol individual (si alguien anotó 2, aparece 2 veces en la lista).
function computeTopScorers(games) {
  const counts = {}; // scorerKey -> { name, goals, team }
  (games || []).forEach((g) => {
    const homeTeam = g.home_team_name_en;
    const awayTeam = g.away_team_name_en;
    parsePgArray(g.home_scorers).forEach((entry) => {
      // El orden importa: corregir PRIMERO (diccionario), filtrar DESPUÉS —
      // al revés, el filtro descartaría goles reales de nombres corregibles.
      const name = fixScorerName(parseScorerName(entry));
      if (!name || isCorruptedName(name)) return;
      const key = scorerKey(name, homeTeam);
      if (!counts[key]) counts[key] = { name, goals: 0, team: homeTeam };
      // Preferir la variante más larga del nombre como display ("Kylian Mbappé" > "K. Mbappé")
      if (name.length > counts[key].name.length) counts[key].name = name;
      counts[key].goals++;
    });
    parsePgArray(g.away_scorers).forEach((entry) => {
      const name = fixScorerName(parseScorerName(entry));
      if (!name || isCorruptedName(name)) return;
      const key = scorerKey(name, awayTeam);
      if (!counts[key]) counts[key] = { name, goals: 0, team: awayTeam };
      if (name.length > counts[key].name.length) counts[key].name = name;
      counts[key].goals++;
    });
  });
  return Object.values(counts).sort((a, b) => b.goals - a.goals);
}

function matchStatus(match) {
  const elapsed = String(match.time_elapsed || "").toLowerCase();
  const finished = String(match.finished || "").toUpperCase() === "TRUE";
  if (finished || elapsed === "finished" || elapsed === "ft") return "finished";
  if (elapsed === "notstarted" || elapsed === "") return "scheduled";
  // Fix: salvaguarda contra la API marcando un partido como "live" horas antes de su hora
  // real de inicio (confirmado con Noruega-Inglaterra del 11 de julio: la API decía "live"
  // con el kickoff real todavía a 9 horas de distancia). Si la hora de inicio calculada
  // (ya convertida correctamente a hora del estadio) todavía no llega -con 10 min de
  // margen por si acaso-, no se le cree ciegamente a la API y se muestra como programado.
  const kickoff = stadiumTimeToDate(match.local_date, match.stadium_id);
  if (kickoff && (kickoff.getTime() - Date.now()) > 10 * 60000) {
    return "scheduled";
  }
  return "live"; // cualquier otro valor de time_elapsed (ej. "45'", "ht") = en curso
}

// Convierte el literal de array de Postgres (texto tipo {"a","b"}) en un array real de JS.
// Esta API no manda JSON real para home_scorers/away_scorers, manda el texto crudo de Postgres.
function parsePgArray(str) {
  if (!str || str === "null" || str === "NULL") return [];
  const inner = String(str).trim().replace(/^\{/, "").replace(/\}$/, "");
  if (!inner) return [];
  const matches = inner.match(/"((?:[^"\\]|\\.)*)"/g) || [];
  return matches.map(m => m.slice(1, -1).replace(/\\"/g, '"').trim());
}

// Extrae el nombre del jugador de un texto tipo "K. Mbappé 90+6'" o "D. Bobadilla 7'(OG)".
// Excluye autogoles (OG) — por convención, un autogol no cuenta para la tabla de goleadores.
function parseScorerName(entry) {
  if (/\(OG\)/i.test(entry)) return null;
  const m = entry.match(/^(.*?)\s+\d+/);
  return m ? m[1].trim() : entry.trim();
}

// Resuelve la letra del grupo probando varios nombres de campo posibles a nivel de grupo,
// y si ninguno existe, la toma del propio equipo (cada equipo trae su letra en team.groups).
function getGroupLetter(group, teamsById) {
  return group.group || group.name || group.letter || group.id || group.groupName
    || teamsById[group.teams?.[0]?.team_id]?.groups || "?";
}

function MatchRow({ match, teamsById, lang, t }) {
  const home = teamsById[match.home_team_id];
  const away = teamsById[match.away_team_id];
  const status = matchStatus(match);
  const hasScore = status !== "scheduled";
  // Fix: home_score/away_score llegan como texto, y algunos partidos futuros mandan el
  // string literal "null" en vez de un null real — Number("null") es NaN, así que se cubre aquí.
  const toScore = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const viewerDate = stadiumTimeToDate(match.local_date, match.stadium_id);
  const viewerTime = formatViewerDateTime(viewerDate, lang);
  const stadium = STADIUM_INFO[String(match.stadium_id)];

  return (
    <div style={{ padding: "12px 4px 8px", borderBottom: "1px solid #1e2a3a" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Flag team={home} />
        <span style={{ fontSize: 13, color: "#e8eaf6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {(home?.fifa_code&&getTeamName(home.fifa_code,lang)) || home?.name_en || match.home_team_name_en || match.home_team_label || (t?.toBeConfirmed||"Por confirmar")}
        </span>
      </div>

      <div style={{ flexShrink: 0, textAlign: "center", minWidth: 64 }}>
        {hasScore ? (
          <div style={{ fontWeight: 900, fontSize: 16, color: status === "live" ? "#f97316" : "#e8eaf6" }}>
            {toScore(match.home_score)} - {toScore(match.away_score)}
          </div>
        ) : (
          <div style={{ fontSize: 12, color: "#4a5568", fontWeight: 700 }}>vs</div>
        )}
        {!hasScore && viewerTime && (
          <div style={{ fontSize: 10, color: "#6b7280", marginTop: 2 }}>{viewerTime.timeLabel}</div>
        )}
        {status === "live" && (
          <div style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", marginTop: 2 }}>🔴 EN VIVO</div>
        )}
        {status === "finished" && (
          <div style={{ fontSize: 9, fontWeight: 700, color: "#4a5568", marginTop: 2 }}>FINAL</div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", minWidth: 0 }}>
        <span style={{ fontSize: 13, color: "#e8eaf6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
          {(away?.fifa_code&&getTeamName(away.fifa_code,lang)) || away?.name_en || match.away_team_name_en || match.away_team_label || (t?.toBeConfirmed||"Por confirmar")}
        </span>
        <Flag team={away} />
      </div>
      </div>
      {stadium && (
        <div style={{ fontSize: 9, color: "#4a5568", textAlign: "center", marginTop: 6 }}>
          🏟️ {stadium.name} · {stadium.city}, {stadium.country}
        </div>
      )}
    </div>
  );
}

function GroupTable({ group, teamsById, games, t, lang }) {
  // Misma API, mismo patrón: los números pueden llegar como texto, incluido el string "null".
  const toNum = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
  const rows = (group.teams || []).map((gt) => {
    const played = (games || []).filter(
      (g) =>
        (String(g.home_team_id) === String(gt.team_id) || String(g.away_team_id) === String(gt.team_id)) &&
        matchStatus(g) === "finished"
    ).length;
    const gf = toNum(gt.gf);
    const ga = toNum(gt.ga);
    return { ...gt, played, gf, ga, gd: gf - ga, pts: toNum(gt.pts), team: teamsById[gt.team_id] };
  });
  rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 800, color: "#ffd700", fontSize: 13, marginBottom: 6 }}>
        {t?.group || "Grupo"} {getGroupLetter(group, teamsById)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 28px 28px 28px 28px 32px", gap: 4, fontSize: 10, color: "#4a5568", padding: "0 4px", marginBottom: 4 }}>
        <span>{t?.team || "Equipo"}</span><span style={{ textAlign: "center" }}>{t?.played || "PJ"}</span><span style={{ textAlign: "center" }}>{t?.goalsFor || "GF"}</span><span style={{ textAlign: "center" }}>{t?.goalsAgainst || "GC"}</span><span style={{ textAlign: "center" }}>{t?.goalDifference || "DG"}</span><span style={{ textAlign: "center" }}>{t?.points || "Pts"}</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.team_id} style={{ display: "grid", gridTemplateColumns: "1fr 28px 28px 28px 28px 32px", gap: 4, alignItems: "center", padding: "6px 4px", background: i < 2 ? "#0a1a0a" : "transparent", borderRadius: 6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#e8eaf6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <Flag team={r.team} />{(r.team?.fifa_code&&getTeamName(r.team.fifa_code,lang)) || r.team?.name_en || r.team?.fifa_code || "—"}
          </span>
          <span style={{ textAlign: "center", fontSize: 12, color: "#9ca3af" }}>{r.played}</span>
          <span style={{ textAlign: "center", fontSize: 12, color: "#9ca3af" }}>{r.gf}</span>
          <span style={{ textAlign: "center", fontSize: 12, color: "#9ca3af" }}>{r.ga}</span>
          <span style={{ textAlign: "center", fontSize: 12, color: "#9ca3af" }}>{r.gd > 0 ? `+${r.gd}` : r.gd}</span>
          <span style={{ textAlign: "center", fontSize: 13, fontWeight: 800, color: "#ffd700" }}>{r.pts}</span>
        </div>
      ))}
    </div>
  );
}

export default function WorldCup({ lang="es", t }) {
  const [subTab, setSubTab] = useState("calendar"); // calendar | table
  // null = automático (la fase más reciente abierta, las anteriores colapsadas);
  // una vez que el usuario toca alguna, se vuelve control manual completo.
  const [expandedStages, setExpandedStages] = useState(null);
  // Mismo patrón para el calendario: días ya jugados por completo arrancan colapsados,
  // el día en curso y los futuros arrancan abiertos. Un toque en la fecha alterna cada uno.
  const [expandedDays, setExpandedDays] = useState({});
  // null = automático (solo la última etapa —la actual— abierta, las anteriores colapsadas);
  // en cuanto el usuario toca alguna, pasa a control manual, igual que en Posiciones.
  const [expandedCalendarStages, setExpandedCalendarStages] = useState(null);
  // Mejora de velocidad: si hay una respuesta guardada de una visita anterior, se muestra
  // de inmediato (sin pantalla de "Cargando...") mientras la actualización real viaja detrás.
  const cached = typeof window !== "undefined" ? loadLocalCache() : null;
  const [teams, setTeams] = useState(cached?.teams || []);
  const [groups, setGroups] = useState(cached?.groups || []);
  const [games, setGames] = useState(cached?.games || []);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState(null);

  const load = useCallback((signal) => {
    setError(null);
    // Mejora de velocidad: antes se esperaba Promise.all() de las 3 llamadas juntas — si
    // "teams" tardaba, "games" (lo que la gente realmente quiere ver primero) esperaba con
    // ella aunque ya hubiera llegado. Ahora cada endpoint actualiza su estado apenas responde,
    // de forma independiente — Partidos puede aparecer sin esperar a Equipos ni Grupos.
    let pending = 3;
    let anyError = false;
    const done = () => { pending--; if (pending === 0 && !signal?.aborted) setLoading(false); };
    const onFail = (err) => {
      if (err?.name === "AbortError") return;
      anyError = true;
      setError(t?.worldcupError || "No se pudo actualizar la información del Mundial. Puede que la API esté caída temporalmente.");
      done();
    };

    fetchWorldcup("games", signal).then(json => {
      const parsed = unwrap(json, "games");
      setGames(parsed);
      if (!anyError) saveLocalCache({ ...loadLocalCache(), games: parsed });
      done();
    }).catch(onFail);

    fetchWorldcup("groups", signal).then(json => {
      const parsed = unwrap(json, "groups");
      setGroups(parsed);
      if (!anyError) saveLocalCache({ ...loadLocalCache(), groups: parsed });
      done();
    }).catch(onFail);

    fetchWorldcup("teams", signal).then(json => {
      const parsed = unwrap(json, "teams");
      setTeams(parsed);
      if (!anyError) saveLocalCache({ ...loadLocalCache(), teams: parsed });
      done();
    }).catch(onFail);
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    const id = setInterval(() => load(controller.signal), REFRESH_MS);
    return () => { clearInterval(id); controller.abort(); };
  }, [load]);

  const teamsById = {};
  teams.forEach((t) => { teamsById[t.id] = t; });
  // Los goleadores solo traen el nombre del equipo (ej. "Argentina"), no su id — este lookup
  // permite encontrar la bandera correspondiente sin tener que cambiar cómo se calculan los goles.
  const teamsByName = {};
  teams.forEach((t) => { if (t.name_en) teamsByName[t.name_en] = t; });

  // Mapea el campo "type" real de la API a la etiqueta de etapa que se muestra como encabezado.
  // El orden aquí también define el orden cronológico esperado del torneo, de grupos a la final.
  const STAGE_LABELS = {
    group:  { emoji: "🔵", key: "stageGroup",  fallback: "Fase de grupos" },
    r32:    { emoji: "🔹", key: "stageR32",    fallback: "Dieciseisavos de final" },
    r16:    { emoji: "🔹", key: "stageR16",    fallback: "Octavos de final" },
    qf:     { emoji: "🔹", key: "stageQF",     fallback: "Cuartos de final" },
    sf:     { emoji: "🔹", key: "stageSF",     fallback: "Semifinales" },
    third:  { emoji: "🥉", key: "stageThird",  fallback: "Partido por el tercer lugar" },
    final:  { emoji: "🏆", key: "stageFinal",  fallback: "Final" },
  };

  const sortedGames = [...games].sort((a, b) => {
    const da = stadiumTimeToDate(a.local_date, a.stadium_id);
    const db = stadiumTimeToDate(b.local_date, b.stadium_id);
    if (!da || !db) return 0;
    return da - db;
  });
  const gamesByDate = {};
  const dateLabels = {};
  // Agrupa los días DENTRO de cada etapa (en vez de solo marcar dónde cambia) — así cada
  // etapa se puede colapsar/expandir como sección completa, no solo día por día.
  const stageSections = []; // [{ stage, label, dayKeys: [...] }]
  let lastStage = null;
  sortedGames.forEach((g) => {
    const viewerDate = stadiumTimeToDate(g.local_date, g.stadium_id);
    const viewerTime = formatViewerDateTime(viewerDate, lang);
    // Si no se pudo convertir (fecha "por confirmar" o formato inesperado), se agrupa aparte
    // en vez de perder el partido — mejor mostrarlo sin fecha que no mostrarlo.
    const key = viewerTime?.dayKey || (t?.toBeConfirmed || "Fecha por confirmar");
    if (!gamesByDate[key]) gamesByDate[key] = [];
    gamesByDate[key].push(g);
    if (viewerTime) dateLabels[key] = viewerTime.dayLabel;
    const stage = normalizeType(g.type);
    if (stage !== lastStage) {
      stageSections.push({ stage, label: STAGE_LABELS[stage], dayKeys: [key] });
      lastStage = stage;
    } else {
      const current = stageSections[stageSections.length - 1];
      if (!current.dayKeys.includes(key)) current.dayKeys.push(key);
    }
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["calendar", t?.matches || "📅 Partidos"], ["table", t?.standings || "📊 Posiciones"], ["scorers", t?.topScorers || "⚽ Goleadores"]].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setSubTab(key)}
            style={{ flex: 1, padding: "10px 0", borderRadius: 10, border: subTab === key ? "1px solid #ffd700" : "1px solid #1e2a3a", background: subTab === key ? "#1a1500" : "#111827", color: subTab === key ? "#ffd700" : "#6b7280", fontWeight: 700, fontSize: 13, cursor: "pointer" }}
          >
            {label}
          </button>
        ))}
      </div>

      {loading && (
        <div style={{ textAlign: "center", padding: 40, color: "#4a5568" }}>{t?.loadingWorldcup || "⏳ Cargando datos del Mundial..."}</div>
      )}

      {!loading && error && games.length === 0 && (
        <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📡</div>
          <div style={{ marginBottom: 12, fontSize: 13 }}>{error}</div>
          <button onClick={() => { setLoading(true); load(); }} style={{ padding: "10px 20px", background: "#1e2a3a", border: "1px solid #374151", borderRadius: 10, color: "#e8eaf6", fontWeight: 700, cursor: "pointer" }}>
            {t?.retry || "Reintentar"}
          </button>
        </div>
      )}

      {!loading && games.length > 0 && (
        <>
          {error && (
            <div style={{ background: "#1e1500", border: "1px solid #92400e", borderRadius: 10, padding: "8px 12px", fontSize: 11, color: "#fbbf24", marginBottom: 12 }}>
              ⚠️ {error} {t?.showingCached || "Mostrando los últimos datos disponibles."}
            </div>
          )}

          {subTab === "calendar" && (() => {
            // Por defecto: cada etapa se abre sola si TODAVÍA tiene partidos sin jugar —
            // sin importar su posición cronológica. Antes se abría solo "la última etapa"
            // por índice, lo cual abría la Final aunque no se hubiera jugado nada de las
            // rondas anteriores. Una etapa se colapsa sola únicamente cuando ya se completó
            // por entero (todos sus partidos con marcador final).
            const autoOpen = {};
            stageSections.forEach((section, idx) => {
              const matches = section.dayKeys.flatMap(k => gamesByDate[k] || []);
              const allFinished = matches.length > 0 && matches.every(m => matchStatus(m) === "finished");
              autoOpen[idx] = !allFinished;
            });
            const openStages = expandedCalendarStages || autoOpen;
            const toggleStage = (idx) => setExpandedCalendarStages({ ...openStages, [idx]: !openStages[idx] });

            return (
              <>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>
                  🕐 {t?.viewerTimeNotice || "Los horarios ya están convertidos a la hora de tu dispositivo."}
                </div>
                {stageSections.map((section, idx) => {
                  const isStageOpen = !!openStages[idx];
                  const allDayMatches = section.dayKeys.flatMap(k => gamesByDate[k] || []);
                  const played = allDayMatches.filter(m => matchStatus(m) === "finished").length;
                  const hasLiveInStage = allDayMatches.some(m => matchStatus(m) === "live");
                  return (
                    <div key={idx} style={{ marginBottom: 12, background: "#0d1117", border: `1px solid ${hasLiveInStage ? "#f97316" : isStageOpen ? "#ffd700" : "#1e2a3a"}`, borderRadius: 14, overflow: "hidden" }}>
                      <button onClick={() => toggleStage(idx)} style={{ width: "100%", padding: "13px 16px", background: isStageOpen ? "#1a1500" : "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 18 }}>{section.label?.emoji}</span>
                        <span style={{ flex: 1, textAlign: "left", fontWeight: 900, fontSize: 14, color: hasLiveInStage ? "#f97316" : "#ffd700" }}>
                          {t?.[section.label?.key] || section.label?.fallback}{hasLiveInStage ? " · 🔴" : ""}
                        </span>
                        <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>{played}/{allDayMatches.length}</span>
                        <span style={{ color: "#4a5568", fontSize: 12 }}>{isStageOpen ? "▲" : "▼"}</span>
                      </button>
                      {isStageOpen && (
                        <div style={{ padding: "0 16px 10px" }}>
                          {section.dayKeys.map((date) => {
                            const matches = gamesByDate[date] || [];
                            const allFinished = matches.every(m => matchStatus(m) === "finished");
                            const hasLive = matches.some(m => matchStatus(m) === "live");
                            // Default: días 100% jugados colapsados; el resto (hoy/futuro/en vivo) abiertos.
                            const isOpen = expandedDays[date] !== undefined ? expandedDays[date] : !allFinished;
                            const toggleDay = () => setExpandedDays({ ...expandedDays, [date]: !isOpen });
                            return (
                              <div key={date} style={{ marginTop: 10, background: "#111827", border: `1px solid ${hasLive ? "#f97316" : isOpen ? "#2a3a52" : "#1e2a3a"}`, borderRadius: 12, overflow: "hidden" }}>
                                <button onClick={toggleDay} style={{ width: "100%", padding: "11px 14px", background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 8 }}>
                                  <span style={{ flex: 1, textAlign: "left", fontSize: 12, fontWeight: 800, color: hasLive ? "#f97316" : "#9ca3af", textTransform: "uppercase" }}>
                                    {dateLabels[date] || date}{hasLive ? " · 🔴" : ""}
                                  </span>
                                  <span style={{ fontSize: 11, color: "#4a5568", fontWeight: 700 }}>{matches.length}</span>
                                  <span style={{ color: "#4a5568", fontSize: 11 }}>{isOpen ? "▲" : "▼"}</span>
                                </button>
                                {isOpen && (
                                  <div style={{ padding: "0 14px 8px" }}>
                                    {matches.map((m) => <MatchRow key={m.id} match={m} teamsById={teamsById} lang={lang} t={t} />)}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            );
          })()}

          {subTab === "table" && (() => {
            // Partidos de eliminatorias (todo lo que no es fase de grupos), agrupados por
            // ronda real — reutiliza MatchRow y STAGE_LABELS, así se ve y se traduce igual
            // que en Partidos, sin duplicar lógica ni estilos.
            const knockoutOrder = ["r32", "r16", "qf", "sf", "third", "final"];
            const knockoutByType = {};
            games.forEach((g) => {
              const stage = normalizeType(g.type);
              if (stage !== "group") {
                if (!knockoutByType[stage]) knockoutByType[stage] = [];
                knockoutByType[stage].push(g);
              }
            });
            // Fix (conv. 3): dentro de cada ronda, los partidos van en orden cronológico real
            // (por fecha/hora del estadio), no en el orden arbitrario en que la API los liste.
            Object.values(knockoutByType).forEach(list => list.sort((a, b) => {
              const da = stadiumTimeToDate(a.local_date, a.stadium_id);
              const db = stadiumTimeToDate(b.local_date, b.stadium_id);
              if (!da || !db) return 0;
              return da - db;
            }));
            const hasKnockouts = Object.keys(knockoutByType).length > 0;
            const stagesWithGames = knockoutOrder.filter(type => knockoutByType[type]?.length);
            // Por defecto: cada fase se abre sola si TODAVÍA tiene partidos sin jugar — sin
            // importar su posición en el orden del torneo (mismo criterio que en Partidos).
            // Se colapsa sola únicamente cuando ya se completó por entero.
            const autoExpanded = {};
            stagesWithGames.forEach(type => {
              const matches = knockoutByType[type];
              const allFinished = matches.every(m => matchStatus(m) === "finished");
              autoExpanded[type] = !allFinished;
            });
            const openStages = expandedStages || autoExpanded;
            const toggleStage = (type) => setExpandedStages({ ...openStages, [type]: !openStages[type] });

            return (
              <>
                {hasKnockouts && (
                  <div style={{ marginBottom: 24 }}>
                    {stagesWithGames.map(type => {
                      const isOpen = !!openStages[type];
                      const matches = knockoutByType[type];
                      const played = matches.filter(m => matchStatus(m) === "finished").length;
                      return (
                        <div key={type} style={{ marginBottom: 10, background: "#0d1117", border: `1px solid ${isOpen ? "#ffd700" : "#1e2a3a"}`, borderRadius: 14, overflow: "hidden" }}>
                          <button onClick={() => toggleStage(type)} style={{ width: "100%", padding: "13px 16px", background: isOpen ? "#1a1500" : "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10 }}>
                            <span style={{ fontSize: 18 }}>{STAGE_LABELS[type]?.emoji}</span>
                            <span style={{ flex: 1, textAlign: "left", fontWeight: 900, fontSize: 14, color: "#ffd700" }}>
                              {t?.[STAGE_LABELS[type]?.key] || STAGE_LABELS[type]?.fallback}
                            </span>
                            <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>{played}/{matches.length}</span>
                            <span style={{ color: "#4a5568", fontSize: 12 }}>{isOpen ? "▲" : "▼"}</span>
                          </button>
                          {isOpen && (
                            <div style={{ padding: "0 16px 10px" }}>
                              {matches.map(m => <MatchRow key={m.id} match={m} teamsById={teamsById} lang={lang} t={t} />)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", margin: "20px 0 10px", paddingTop: 12, borderTop: "1px solid #1e2a3a", textTransform: "uppercase" }}>
                      {t?.stageGroup || "Fase de grupos"} — {t?.finalStandings || "resultados finales"}
                    </div>
                  </div>
                )}
                {[...groups]
                  .sort((a, b) => getGroupLetter(a, teamsById).localeCompare(getGroupLetter(b, teamsById)))
                  .map((g, i) => (
                    <GroupTable key={g.group || g.teams?.[0]?.team_id || i} group={g} teamsById={teamsById} games={games} t={t} lang={lang} />
                  ))}
              </>
            );
          })()}

          {subTab === "scorers" && (() => {
            const scorers = computeTopScorers(games).slice(0, 25);
            if (scorers.length === 0) {
              return <div style={{ textAlign: "center", padding: 30, color: "#4a5568", fontSize: 13 }}>{t?.noGoalsYet || "Todavía no hay goles registrados."}</div>;
            }
            return (
              <div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>
                  {t?.sourceDataWarning || "⚠️ Algunos nombres pueden venir mal escritos para selecciones más chicas — es un problema de los datos de origen, no de FiguSwitch."}
                </div>
                {scorers.map((s, i) => (
                  <div key={s.name + i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: "1px solid #1e2a3a" }}>
                    <span style={{ width: 24, textAlign: "center", fontWeight: 800, color: i < 3 ? "#ffd700" : "#6b7280", fontSize: 13 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#e8eaf6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Flag team={teamsByName[s.team]} />
                        <span style={{ fontSize: 10, color: "#6b7280" }}>{(teamsByName[s.team]?.fifa_code&&getTeamName(teamsByName[s.team].fifa_code,lang)) || s.team || "—"}</span>
                      </div>
                    </div>
                    <span style={{ fontWeight: 900, fontSize: 16, color: "#ffd700" }}>{s.goals}</span>
                  </div>
                ))}
              </div>
            );
          })()}
        </>
      )}
    </div>
  );
}
