import { useState, useEffect, useCallback } from "react";

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

function fetchWorldcup(type) {
  return fetch(`/api/worldcup?type=${type}`).then(async (r) => {
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

function MatchRow({ match, teamsById }) {
  const home = teamsById[match.home_team_id];
  const away = teamsById[match.away_team_id];
  const status = matchStatus(match);
  const hasScore = status !== "scheduled";
  // Fix: home_score/away_score llegan como texto, y algunos partidos futuros mandan el
  // string literal "null" en vez de un null real — Number("null") es NaN, así que se cubre aquí.
  const toScore = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 4px", borderBottom: "1px solid #1e2a3a" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Flag team={home} />
        <span style={{ fontSize: 13, color: "#e8eaf6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {home?.name_en || match.home_team_name_en || match.home_team_label || "Por confirmar"}
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
        {status === "live" && (
          <div style={{ fontSize: 9, fontWeight: 800, color: "#ef4444", marginTop: 2 }}>🔴 EN VIVO</div>
        )}
        {status === "finished" && (
          <div style={{ fontSize: 9, fontWeight: 700, color: "#4a5568", marginTop: 2 }}>FINAL</div>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end", minWidth: 0 }}>
        <span style={{ fontSize: 13, color: "#e8eaf6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textAlign: "right" }}>
          {away?.name_en || match.away_team_name_en || match.away_team_label || "Por confirmar"}
        </span>
        <Flag team={away} />
      </div>
    </div>
  );
}

function GroupTable({ group, teamsById, games }) {
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
        Grupo {getGroupLetter(group, teamsById)}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 28px 28px 28px 28px 32px", gap: 4, fontSize: 10, color: "#4a5568", padding: "0 4px", marginBottom: 4 }}>
        <span>Equipo</span><span style={{ textAlign: "center" }}>PJ</span><span style={{ textAlign: "center" }}>GF</span><span style={{ textAlign: "center" }}>GC</span><span style={{ textAlign: "center" }}>DG</span><span style={{ textAlign: "center" }}>Pts</span>
      </div>
      {rows.map((r, i) => (
        <div key={r.team_id} style={{ display: "grid", gridTemplateColumns: "1fr 28px 28px 28px 28px 32px", gap: 4, alignItems: "center", padding: "6px 4px", background: i < 2 ? "#0a1a0a" : "transparent", borderRadius: 6 }}>
          <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#e8eaf6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <Flag team={r.team} />{r.team?.name_en || r.team?.fifa_code || "—"}
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

export default function WorldCup() {
  const [subTab, setSubTab] = useState("calendar"); // calendar | table
  const [teams, setTeams] = useState([]);
  const [groups, setGroups] = useState([]);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setError(null);
    Promise.all([fetchWorldcup("teams"), fetchWorldcup("groups"), fetchWorldcup("games")])
      .then(([teamsJson, groupsJson, gamesJson]) => {
        setTeams(unwrap(teamsJson, "teams"));
        setGroups(unwrap(groupsJson, "groups"));
        setGames(unwrap(gamesJson, "games"));
      })
      .catch(() => {
        // No tumbamos la pantalla — si ya había datos de una carga anterior, los dejamos
        // visibles y solo avisamos que la actualización falló.
        setError("No se pudo actualizar la información del Mundial. Puede que la API esté caída temporalmente.");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  const teamsById = {};
  teams.forEach((t) => { teamsById[t.id] = t; });
  // Los goleadores solo traen el nombre del equipo (ej. "Argentina"), no su id — este lookup
  // permite encontrar la bandera correspondiente sin tener que cambiar cómo se calculan los goles.
  const teamsByName = {};
  teams.forEach((t) => { if (t.name_en) teamsByName[t.name_en] = t; });

  const sortedGames = [...games].sort((a, b) => new Date(a.local_date) - new Date(b.local_date));
  const gamesByDate = {};
  sortedGames.forEach((g) => {
    const key = g.local_date || "Fecha por confirmar";
    if (!gamesByDate[key]) gamesByDate[key] = [];
    gamesByDate[key].push(g);
  });

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
        {[["calendar", "📅 Partidos"], ["table", "📊 Posiciones"], ["scorers", "⚽ Goleadores"]].map(([key, label]) => (
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
        <div style={{ textAlign: "center", padding: 40, color: "#4a5568" }}>⏳ Cargando datos del Mundial...</div>
      )}

      {!loading && error && games.length === 0 && (
        <div style={{ textAlign: "center", padding: 30, color: "#9ca3af" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>📡</div>
          <div style={{ marginBottom: 12, fontSize: 13 }}>{error}</div>
          <button onClick={() => { setLoading(true); load(); }} style={{ padding: "10px 20px", background: "#1e2a3a", border: "1px solid #374151", borderRadius: 10, color: "#e8eaf6", fontWeight: 700, cursor: "pointer" }}>
            Reintentar
          </button>
        </div>
      )}

      {!loading && games.length > 0 && (
        <>
          {error && (
            <div style={{ background: "#1e1500", border: "1px solid #92400e", borderRadius: 10, padding: "8px 12px", fontSize: 11, color: "#fbbf24", marginBottom: 12 }}>
              ⚠️ {error} Mostrando los últimos datos disponibles.
            </div>
          )}

          {subTab === "calendar" && Object.entries(gamesByDate).map(([date, matches]) => (
            <div key={date} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: "#6b7280", marginBottom: 4, textTransform: "uppercase" }}>{date}</div>
              {matches.map((m) => <MatchRow key={m.id} match={m} teamsById={teamsById} />)}
            </div>
          ))}

          {subTab === "table" && [...groups]
            .sort((a, b) => getGroupLetter(a, teamsById).localeCompare(getGroupLetter(b, teamsById)))
            .map((g, i) => (
              <GroupTable key={g.group || g.teams?.[0]?.team_id || i} group={g} teamsById={teamsById} games={games} />
            ))}

          {subTab === "scorers" && (() => {
            const scorers = computeTopScorers(games).slice(0, 25);
            if (scorers.length === 0) {
              return <div style={{ textAlign: "center", padding: 30, color: "#4a5568", fontSize: 13 }}>Todavía no hay goles registrados.</div>;
            }
            return (
              <div>
                <div style={{ fontSize: 11, color: "#6b7280", marginBottom: 10 }}>
                  ⚠️ Algunos nombres pueden venir mal escritos para selecciones más chicas — es un problema de los datos de origen, no de FiguSwap.
                </div>
                {scorers.map((s, i) => (
                  <div key={s.name + i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 4px", borderBottom: "1px solid #1e2a3a" }}>
                    <span style={{ width: 24, textAlign: "center", fontWeight: 800, color: i < 3 ? "#ffd700" : "#6b7280", fontSize: 13 }}>{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, color: "#e8eaf6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s.name}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <Flag team={teamsByName[s.team]} />
                        <span style={{ fontSize: 10, color: "#6b7280" }}>{s.team || "—"}</span>
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
