// Proxy hacia la API gratuita y no oficial del Mundial 2026 (worldcup26.ir).
// Por qué un proxy y no llamar directo desde el navegador:
// 1) El token de autenticación de esa API vive en una variable de entorno del servidor
//    (WORLDCUP_API_TOKEN), nunca expuesto en el bundle del cliente.
// 2) Cache-Control en el edge de Vercel evita golpear la API gratuita en cada visita —
//    importante porque es un proyecto pequeño de un solo desarrollador, no oficial,
//    y puede ser lento o caerse si recibe demasiado tráfico.
// 3) Si la API externa falla, devolvemos un error controlado en JSON en vez de que
//    el front-end reciba HTML de error o un timeout crudo.

// Confirmado en vivo: el servicio corre en HTTP plano, puerto 3050 — no HTTPS/443 como se asumió
// originalmente (de ahí el error SSL al probar con curl). Una llamada servidor-a-servidor desde
// Vercel a un endpoint HTTP no tiene problema de "mixed content" (eso solo aplica a fetch desde
// el navegador en una página HTTPS); aquí estamos en el lado del servidor, así que está bien.
const BASE_URL = "http://worldcup26.ir:3050";

const ENDPOINTS = {
  teams: "/get/teams",
  groups: "/get/groups",
  games: "/get/games",
  stadiums: "/get/stadiums",
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Método no permitido" });

  const type = req.query?.type;
  const path = ENDPOINTS[type];
  if (!path) {
    return res.status(400).json({ error: "type inválido. Usa teams, groups, games o stadiums.", data: [] });
  }

  if (!process.env.WORLDCUP_API_TOKEN) {
    return res.status(500).json({ error: "Falta configurar WORLDCUP_API_TOKEN en Vercel", data: [] });
  }

  try {
    const upstream = await fetch(`${BASE_URL}${path}`, {
      headers: { Authorization: `Bearer ${process.env.WORLDCUP_API_TOKEN}` },
    });

    const text = await upstream.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      // La API externa respondió algo que no es JSON (ej. una página de error HTML).
      return res.status(502).json({ error: "La API del Mundial respondió algo inesperado", data: [] });
    }

    if (!upstream.ok) {
      // Token vencido (84 días) u otro error de la API externa — lo reportamos tal cual,
      // sin disfrazarlo de 500 genérico, para poder diagnosticarlo rápido.
      return res.status(upstream.status).json({
        error: data?.message || "Error de la API del Mundial",
        data: [],
      });
    }

    // Mejora de velocidad: caché ampliada de 30s a 90s "fresco", hasta 5min servido viejo
    // mientras revalida. El marcador de un partido no cambia cada 30s en la práctica —
    // esto reduce cuántas veces se golpea el servidor externo (lento, gratuito, no oficial)
    // sin que el usuario note diferencia real de "qué tan en vivo" se siente.
    res.setHeader("Cache-Control", "s-maxage=90, stale-while-revalidate=300");
    return res.status(200).json(data);
  } catch (err) {
    return res.status(502).json({ error: "No se pudo conectar con la API del Mundial. Intenta más tarde.", data: [] });
  }
}
