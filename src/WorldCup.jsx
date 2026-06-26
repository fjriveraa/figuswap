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

function fetchWorldcup(type, signal) {
  return fetch(`/api/worldcup?type=${type}`, { signal }).then(async (r) => {
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
// Suma goles por jugador a partir de home_scorers/away_scorers de todos los partidos.
// Cada entrada del array es un gol individual (si alguien anotó 2, aparece 2 veces en la lista).
function computeTopScorers(games) {
  const counts = {}; // nombre -> { goals, team }
  (games || []).forEach((g) => {
    const homeTeam = g.home_team_name_en;
    const awayTeam = g.away_team_name_en;
    parsePgArray(g.home_scorers).forEach((entry) => {
      const name = parseScorerName(entry);
      if (!name) return;
      if (!counts[name]) counts[name] = { name, goals: 0, team: homeTeam };
      counts[name].goals++;
    });
    parsePgArray(g.away_scorers).forEach((entry) => {
      const name = parseScorerName(entry);
      if (!name) return;
      if (!counts[name]) counts[name] = { name, goals: 0, team: awayTeam };
      counts[name].goals++;
    });
  });
  return Object.values(counts).sort((a, b) => b.goals - a.goals);
}

function matchStatus(match) {
  const elapsed = String(match.time_elapsed || "").toLowerCase();
  const finished = String(match.finished || "").toUpperCase() === "TRUE";
  if (finished || elapsed === "finished" || elapsed === "ft") return "finished";
  if (elapsed === "notstarted" || elapsed === "") return "scheduled";
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

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 4px", borderBottom: "1px solid #1e2a3a" }}>
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
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback((signal) => {
    setError(null);
    Promise.all([fetchWorldcup("teams",signal), fetchWorldcup("groups",signal), fetchWorldcup("games",signal)])
      .then(([teamsJson, groupsJson, gamesJson]) => {
        setTeams(unwrap(teamsJson, "teams"));
        setGroups(unwrap(groupsJson, "groups"));
        setGames(unwrap(gamesJson, "games"));
      })
      .catch((err) => {
        // Fix: si la petición se canceló (cambiaste de pestaña, o llegó la siguiente carga
        // antes de que terminara la anterior), no es un error real — no hay que mostrar
        // "API caída" ni tocar el estado de un componente que quizás ya no esté en pantalla.
        if (err?.name === "AbortError") return;
        setError(t?.worldcupError || "No se pudo actualizar la información del Mundial. Puede que la API esté caída temporalmente.");
      })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
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

  const sortedGames = [...games].sort((a, b) => {
    const da = stadiumTimeToDate(a.local_date, a.stadium_id);
    const db = stadiumTimeToDate(b.local_date, b.stadium_id);
    if (!da || !db) return 0;
    return da - db;
  });
  const gamesByDate = {};
  const dateLabels = {};
  sortedGames.forEach((g) => {
    const viewerDate = stadiumTimeToDate(g.local_date, g.stadium_id);
    const viewerTime = formatViewerDateTime(viewerDate, lang);
    // Si no se pudo convertir (fecha "por confirmar" o formato inesperado), se agrupa aparte
    // en vez de perder el partido — mejor mostrarlo sin fecha que no mostrarlo.
    const key = viewerTime?.dayKey || (t?.toBeConfirmed || "Fecha por confirmar");
    if (!gamesByDate[key]) gamesByDate[key] = [];
    gamesByDate[key].push(g);
    if (viewerTime) dateLabels[key] = viewerTime.dayLabel;
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

          {subTab === "calendar" && (
            <>
              <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 12 }}>
                🕐 {t?.viewerTimeNotice || "Los horarios ya están convertidos a la hora de tu dispositivo."}
              </div>
              {Object.entries(gamesByDate).map(([date, matches]) => (
                <div key={date} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 4, textTransform: "uppercase" }}>{dateLabels[date] || date}</div>
                  {matches.map((m) => <MatchRow key={m.id} match={m} teamsById={teamsById} lang={lang} t={t} />)}
                </div>
              ))}
            </>
          )}

          {subTab === "table" && [...groups]
            .sort((a, b) => getGroupLetter(a, teamsById).localeCompare(getGroupLetter(b, teamsById)))
            .map((g, i) => (
              <GroupTable key={g.group || g.teams?.[0]?.team_id || i} group={g} teamsById={teamsById} games={games} t={t} lang={lang} />
            ))}

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
