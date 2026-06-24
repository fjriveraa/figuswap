06:44:38.488 Running build in Washington, D.C., USA (East) – iad1
06:44:38.489 Build machine configuration: 2 cores, 8 GB
06:44:38.925 Cloning github.com/fjriveraa/figuswap (Branch: main, Commit: 67f8c79)
06:44:40.732 Cloning completed: 1.801s
06:44:40.809 Restored build cache from previous deployment (2vYj2bX3S3BsQhQsPNeqxCtV1d3R)
06:44:41.016 Running "vercel build"
06:44:41.034 Vercel CLI 54.14.0
06:44:41.749 Installing dependencies...
06:44:43.520 
06:44:43.520 up to date in 2s
06:44:43.521 
06:44:43.521 7 packages are looking for funding
06:44:43.521   run `npm fund` for details
06:44:43.552 Running "npm run build"
06:44:43.648 
06:44:43.649 > figuswap@1.0.0 build
06:44:43.649 > vite build
06:44:43.649 
06:44:43.941 vite v4.5.14 building for production...
06:44:43.976 transforming...
06:44:44.472 ✓ 17 modules transformed.
06:44:44.473 ✓ built in 530ms
06:44:44.474 [vite:esbuild] Transform failed with 22 errors:
06:44:44.475 /vercel/path0/src/WorldCup.jsx:3:9: ERROR: The symbol "useState" has already been declared
06:44:44.475 /vercel/path0/src/WorldCup.jsx:3:19: ERROR: The symbol "useEffect" has already been declared
06:44:44.475 /vercel/path0/src/WorldCup.jsx:3:30: ERROR: The symbol "useCallback" has already been declared
06:44:44.475 /vercel/path0/src/WorldCup.jsx:4:9: ERROR: The symbol "getTeamName" has already been declared
06:44:44.476 /vercel/path0/src/WorldCup.jsx:405:6: ERROR: The symbol "STADIUM_TIMEZONES" has already been declared
06:44:44.476 ...
06:44:44.476 file: /vercel/path0/src/WorldCup.jsx:3:9
06:44:44.476 
06:44:44.477 The symbol "useState" has already been declared
06:44:44.477 1  |  import { useState, useEffect, useCallback } from "react";
06:44:44.477 2  |  import { getTeamName } from "./i18n";
06:44:44.477 3  |  import { useState, useEffect, useCallback } from "react";
06:44:44.477    |           ^
06:44:44.477 4  |  import { getTeamName } from "./i18n";
06:44:44.478 5  |  
06:44:44.478 
06:44:44.478 The symbol "useEffect" has already been declared
06:44:44.478 1  |  import { useState, useEffect, useCallback } from "react";
06:44:44.479 2  |  import { getTeamName } from "./i18n";
06:44:44.479 3  |  import { useState, useEffect, useCallback } from "react";
06:44:44.479    |                     ^
06:44:44.479 4  |  import { getTeamName } from "./i18n";
06:44:44.480 5  |  
06:44:44.480 
06:44:44.480 The symbol "useCallback" has already been declared
06:44:44.480 1  |  import { useState, useEffect, useCallback } from "react";
06:44:44.480 2  |  import { getTeamName } from "./i18n";
06:44:44.480 3  |  import { useState, useEffect, useCallback } from "react";
06:44:44.481    |                                ^
06:44:44.481 4  |  import { getTeamName } from "./i18n";
06:44:44.481 5  |  
06:44:44.481 
06:44:44.481 The symbol "getTeamName" has already been declared
06:44:44.481 2  |  import { getTeamName } from "./i18n";
06:44:44.481 3  |  import { useState, useEffect, useCallback } from "react";
06:44:44.482 4  |  import { getTeamName } from "./i18n";
06:44:44.482    |           ^
06:44:44.482 5  |  
06:44:44.482 6  |  // Mapeo real de los 16 estadios del Mundial 2026 a su zona horaria IANA — confirmado contra
06:44:44.482 
06:44:44.482 The symbol "STADIUM_TIMEZONES" has already been declared
06:44:44.482 403|  // IANA ya sabe, para cada zona, si aplica horario de verano en la fecha exacta del partido
06:44:44.483 404|  // (ej. México no aplica DST desde 2023, EE.UU./Canadá sí) — por eso no basta con un offset fijo.
06:44:44.483 405|  const STADIUM_TIMEZONES = {
06:44:44.483    |        ^
06:44:44.483 406|    "1": "America/Mexico_City",   // Estadio Azteca, Ciudad de México
06:44:44.483 407|    "2": "America/Mexico_City",   // Estadio Akron, Guadalajara
06:44:44.483 
06:44:44.483 The symbol "getTzOffsetMinutes" has already been declared
06:44:44.484 425|  // "para una fecha concreta" es la parte importante: el mismo lugar puede tener offsets distintos
06:44:44.484 426|  // en junio (verano) vs. diciembre (invierno), y esto lo resuelve solo, usando Intl del navegador.
06:44:44.484 427|  function getTzOffsetMinutes(date, timeZone) {
06:44:44.484    |           ^
06:44:44.484 428|    const utcDate = new Date(date.toLocaleString("en-US", { timeZone: "UTC" }));
06:44:44.484 429|    const tzDate = new Date(date.toLocaleString("en-US", { timeZone }));
06:44:44.485 
06:44:44.485 The symbol "stadiumTimeToDate" has already been declared
06:44:44.486 434|  // con el instante UTC real y correcto. A partir de ahí, cualquier .toLocaleString() del navegador
06:44:44.486 435|  // ya muestra automáticamente la hora correcta de quien esté mirando, sin más conversión manual.
06:44:44.486 436|  function stadiumTimeToDate(localDateStr, stadiumId) {
06:44:44.486    |           ^
06:44:44.487 437|    if (!localDateStr) return null;
06:44:44.487 438|    const m = localDateStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2})$/);
06:44:44.488 
06:44:44.488 The symbol "LOCALE_BY_LANG" has already been declared
06:44:44.488 449|  }
06:44:44.488 450|  
06:44:44.488 451|  const LOCALE_BY_LANG = { es:"es-ES", en:"en-US", it:"it-IT", fr:"fr-FR", pt:"pt-BR", de:"de-DE", ar:"ar-SA" };
06:44:44.489    |        ^
06:44:44.489 452|  
06:44:44.489 453|  // Formatea un Date real (ya en UTC correcto) en la hora LOCAL del dispositivo que está mirando
06:44:44.489 
06:44:44.490 The symbol "formatViewerDateTime" has already been declared
06:44:44.490 454|  // — sin pasar ninguna opción de timeZone aquí a propósito: al omitirla, el navegador usa la
06:44:44.490 455|  // zona horaria del dispositivo automáticamente, sea cual sea (Honduras, España, Brasil, etc.).
06:44:44.490 456|  function formatViewerDateTime(date, lang) {
06:44:44.491    |           ^
06:44:44.491 457|    if (!date || isNaN(date.getTime())) return null;
06:44:44.492 458|    const locale = LOCALE_BY_LANG[lang] || "es-ES";
06:44:44.492 
06:44:44.492 The symbol "REFRESH_MS" has already been declared
06:44:44.492 467|  // (api/worldcup.js) ya evita golpear la API externa más de una vez cada 30s, así que este
06:44:44.493 468|  // intervalo solo controla qué tan "viva" se siente la pantalla para el usuario.
06:44:44.493 469|  const REFRESH_MS = 45000;
06:44:44.493    |        ^
06:44:44.493 470|  
06:44:44.493 471|  // Acepta que la respuesta venga como array directo o envuelta en {teams:[...]}, {groups:[...]},
06:44:44.493 
06:44:44.494 The symbol "unwrap" has already been declared
06:44:44.496 472|  // {games:[...]} — no tengo forma de probar contra la API real desde aquí, así que esto cubre
06:44:44.496 473|  // las formas más probables sin asumir una sola.
06:44:44.496 474|  function unwrap(json, key) {
06:44:44.497    |           ^
06:44:44.497 475|    if (Array.isArray(json)) return json;
06:44:44.497 476|    if (json && Array.isArray(json[key])) return json[key];
06:44:44.497 
06:44:44.497 The symbol "fetchWorldcup" has already been declared
06:44:44.498 479|  }
06:44:44.498 480|  
06:44:44.498 481|  function fetchWorldcup(type) {
06:44:44.498    |           ^
06:44:44.498 482|    return fetch(`/api/worldcup?type=${type}`).then(async (r) => {
06:44:44.498 483|      const json = await r.json().catch(() => null);
06:44:44.499 
06:44:44.499 The symbol "Flag" has already been declared
06:44:44.499 487|  }
06:44:44.499 488|  
06:44:44.499 489|  function Flag({ team }) {
06:44:44.499    |           ^
06:44:44.500 490|    const [imgFailed, setImgFailed] = useState(false);
06:44:44.500 491|    if (!team || !team.flag || imgFailed) {
06:44:44.500 
06:44:44.500 The symbol "computeTopScorers" has already been declared
06:44:44.500 504|  // Suma goles por jugador a partir de home_scorers/away_scorers de todos los partidos.
06:44:44.501 505|  // Cada entrada del array es un gol individual (si alguien anotó 2, aparece 2 veces en la lista).
06:44:44.501 506|  function computeTopScorers(games) {
06:44:44.501    |           ^
06:44:44.501 507|    const counts = {}; // nombre -> { goals, team }
06:44:44.501 508|    (games || []).forEach((g) => {
06:44:44.502 
06:44:44.502 The symbol "matchStatus" has already been declared
06:44:44.502 525|  }
06:44:44.502 526|  
06:44:44.502 527|  function matchStatus(match) {
06:44:44.503    |           ^
06:44:44.503 528|    const elapsed = String(match.time_elapsed || "").toLowerCase();
06:44:44.506 529|    const finished = String(match.finished || "").toUpperCase() === "TRUE";
06:44:44.512 
06:44:44.513 The symbol "parsePgArray" has already been declared
06:44:44.513 535|  // Convierte el literal de array de Postgres (texto tipo {"a","b"}) en un array real de JS.
06:44:44.513 536|  // Esta API no manda JSON real para home_scorers/away_scorers, manda el texto crudo de Postgres.
06:44:44.513 537|  function parsePgArray(str) {
06:44:44.513    |           ^
06:44:44.514 538|    if (!str || str === "null" || str === "NULL") return [];
06:44:44.514 539|    const inner = String(str).trim().replace(/^\{/, "").replace(/\}$/, "");
06:44:44.514 
06:44:44.514 The symbol "parseScorerName" has already been declared
06:44:44.514 545|  // Extrae el nombre del jugador de un texto tipo "K. Mbappé 90+6'" o "D. Bobadilla 7'(OG)".
06:44:44.515 546|  // Excluye autogoles (OG) — por convención, un autogol no cuenta para la tabla de goleadores.
06:44:44.515 547|  function parseScorerName(entry) {
06:44:44.515    |           ^
06:44:44.515 548|    if (/\(OG\)/i.test(entry)) return null;
06:44:44.515 549|    const m = entry.match(/^(.*?)\s+\d+/);
06:44:44.516 
06:44:44.516 The symbol "getGroupLetter" has already been declared
06:44:44.516 553|  // Resuelve la letra del grupo probando varios nombres de campo posibles a nivel de grupo,
06:44:44.516 554|  // y si ninguno existe, la toma del propio equipo (cada equipo trae su letra en team.groups).
06:44:44.516 555|  function getGroupLetter(group, teamsById) {
06:44:44.516    |           ^
06:44:44.517 556|    return group.group || group.name || group.letter || group.id || group.groupName
06:44:44.517 557|      || teamsById[group.teams?.[0]?.team_id]?.groups || "?";
06:44:44.517 
06:44:44.517 The symbol "MatchRow" has already been declared
06:44:44.517 558|  }
06:44:44.517 559|  
06:44:44.518 560|  function MatchRow({ match, teamsById, lang, t }) {
06:44:44.518    |           ^
06:44:44.518 561|    const home = teamsById[match.home_team_id];
06:44:44.518 562|    const away = teamsById[match.away_team_id];
06:44:44.518 
06:44:44.518 The symbol "GroupTable" has already been declared
06:44:44.518 607|  }
06:44:44.518 608|  
06:44:44.518 609|  function GroupTable({ group, teamsById, games, t, lang }) {
06:44:44.518    |           ^
06:44:44.518 610|    // Misma API, mismo patrón: los números pueden llegar como texto, incluido el string "null".
06:44:44.518 611|    const toNum = v => { const n = Number(v); return Number.isFinite(n) ? n : 0; };
06:44:44.518 
06:44:44.518 Multiple exports with the same name "default"
06:44:44.518 646|  }
06:44:44.518 647|  
06:44:44.519 648|  export default function WorldCup({ lang="es", t }) {
06:44:44.519    |         ^
06:44:44.519 649|    const [subTab, setSubTab] = useState("calendar"); // calendar | table
06:44:44.519 650|    const [teams, setTeams] = useState([]);
06:44:44.519 
06:44:44.519 The symbol "WorldCup" has already been declared
06:44:44.520 646|  }
06:44:44.520 647|  
06:44:44.520 648|  export default function WorldCup({ lang="es", t }) {
06:44:44.520    |                          ^
06:44:44.520 649|    const [subTab, setSubTab] = useState("calendar"); // calendar | table
06:44:44.520 650|    const [teams, setTeams] = useState([]);
06:44:44.520 
06:44:44.522 error during build:
06:44:44.522 Error: Transform failed with 22 errors:
06:44:44.522 /vercel/path0/src/WorldCup.jsx:3:9: ERROR: The symbol "useState" has already been declared
06:44:44.523 /vercel/path0/src/WorldCup.jsx:3:19: ERROR: The symbol "useEffect" has already been declared
06:44:44.523 /vercel/path0/src/WorldCup.jsx:3:30: ERROR: The symbol "useCallback" has already been declared
06:44:44.523 /vercel/path0/src/WorldCup.jsx:4:9: ERROR: The symbol "getTeamName" has already been declared
06:44:44.523 /vercel/path0/src/WorldCup.jsx:405:6: ERROR: The symbol "STADIUM_TIMEZONES" has already been declared
06:44:44.523 ...
06:44:44.523     at failureErrorWithLog (/vercel/path0/node_modules/esbuild/lib/main.js:1649:15)
06:44:44.524     at /vercel/path0/node_modules/esbuild/lib/main.js:847:29
06:44:44.524     at responseCallbacks.<computed> (/vercel/path0/node_modules/esbuild/lib/main.js:703:9)
06:44:44.524     at handleIncomingPacket (/vercel/path0/node_modules/esbuild/lib/main.js:762:9)
06:44:44.524     at Socket.readFromStdout (/vercel/path0/node_modules/esbuild/lib/main.js:679:7)
06:44:44.524     at Socket.emit (node:events:509:28)
06:44:44.524     at addChunk (node:internal/streams/readable:563:12)
06:44:44.524     at readableAddChunkPushByteMode (node:internal/streams/readable:514:3)
06:44:44.525     at Readable.push (node:internal/streams/readable:394:5)
06:44:44.525     at Pipe.onStreamRead (node:internal/stream_base_commons:189:23)
06:44:44.536 Error: Command "npm run build" exited with 1