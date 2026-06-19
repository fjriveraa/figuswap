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
  if (!team) return <span style={{ width: 20, display: "inline-block" }}>🏳️</span>;
  if (team.flag) {
    return <img src={team.flag} alt="" style={{ width: 20, height: 14, objectFit: "cover", borderRadius: 2, flexShrink: 0 }} />;
  }
  return <span style={{ width: 20, display: "inline-block", flexShrink: 0 }}>🏳️</span>;
}

function matchStatus(match) {
  const s = (match.status || "").toLowerCase();
  if (s === "live" || s === "in_progress" || s === "playing") return "live";
  if (match.finished || s === "finished" || s === "ft") return "finished";
  return "scheduled";
}

function MatchRow({ match, teamsById }) {
  const home = teamsById[match.home_team_id];
  const away = teamsById[match.away_team_id];
  const status = matchStatus(match);
  const hasScore = status !== "scheduled";

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 4px", borderBottom: "1px solid #1e2a3a" }}>
      <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
        <Flag team={home} />
        <span style={{ fontSize: 13, color: "#e8eaf6", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {home?.name_en || home?.fifa_code || "Por confirmar"}
        </span>
      </div>

      <div style={{ flexShrink: 0, textAlign: "center", minWidth: 64 }}>
        {hasScore ? (
          <div style={{ fontWeight: 900, fontSize: 16, color: status === "live" ? "#f97316" : "#e8eaf6" }}>
            {match.home_score ?? 0} - {match.away_score ?? 0}
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
          {away?.name_en || away?.fifa_code || "Por confirmar"}
        </span>
        <Flag team={away} />
      </div>
    </div>
  );
}

function GroupTable({ group, teamsById, games }) {
  const rows = (group.teams || []).map((gt) => {
    const played = (games || []).filter(
      (g) =>
        (String(g.home_team_id) === String(gt.team_id) || String(g.away_team_id) === String(gt.team_id)) &&
        matchStatus(g) === "finished"
    ).length;
    const gf = Number(gt.gf || 0);
    const ga = Number(gt.ga || 0);
    return { ...gt, played, gf, ga, gd: gf - ga, pts: Number(gt.pts || 0), team: teamsById[gt.team_id] };
  });
  rows.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf);

  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ fontWeight: 800, color: "#ffd700", fontSize: 13, marginBottom: 6 }}>Grupo {group.group}</div>
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
        {[["calendar", "📅 Partidos"], ["table", "📊 Posiciones"]].map(([key, label]) => (
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

          {subTab === "table" && groups.map((g) => (
            <GroupTable key={g.group} group={g} teamsById={teamsById} games={games} />
          ))}
        </>
      )}
    </div>
  );
}
