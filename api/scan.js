export default async function handler(req, res) {
  // Fix de seguridad: antes esto era Access-Control-Allow-Origin: "*" sin ninguna
  // validación — cualquier sitio del mundo podía llamar este endpoint directamente y
  // gastar los créditos de Anthropic de esta cuenta sin límite. Ahora solo se acepta
  // el propio dominio de la app, y además se exige sesión válida de Supabase.
  const ALLOWED_ORIGIN = "https://figuswitch.com";
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    // ── Paso 1: exigir sesión real de Supabase ──────────────────────────────
    // El cliente debe mandar el access_token de su sesión (registrada o invitada
    // anónima — Supabase soporta ambas) en el header Authorization. Sin token
    // válido, no se procesa nada — esto es lo que faltaba por completo antes.
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      return res.status(401).json({ error: "Falta autenticación", stickers: [] });
    }
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      console.error("Faltan variables de entorno de Supabase en el servidor");
      return res.status(500).json({ error: "Error de configuración del servidor", stickers: [] });
    }
    const userResp = await fetch(`${process.env.SUPABASE_URL}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY }
    });
    if (!userResp.ok) {
      return res.status(401).json({ error: "Sesión inválida o expirada", stickers: [] });
    }
    const user = await userResp.json();
    const userId = user?.id;
    if (!userId) {
      return res.status(401).json({ error: "Sesión inválida", stickers: [] });
    }

    // ── Paso 2: límite de velocidad por usuario ─────────────────────────────
    // Máximo 20 escaneos por usuario cada 60 minutos. Se guarda en una tabla propia
    // de Supabase (scan_rate_limits) — no en memoria del servidor, porque Vercel
    // puede correr múltiples instancias distintas y la memoria no se comparte entre ellas.
    const SCAN_LIMIT = 20;
    const WINDOW_MINUTES = 60;
    const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60000).toISOString();

    const countResp = await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/scan_rate_limits?user_id=eq.${userId}&created_at=gte.${windowStart}&select=id`,
      { headers: { Authorization: `Bearer ${token}`, apikey: process.env.SUPABASE_ANON_KEY, Prefer: "count=exact" } }
    );
    const countHeader = countResp.headers.get("content-range"); // formato "0-4/5"
    const currentCount = countHeader ? parseInt(countHeader.split("/")[1] || "0") : 0;

    if (currentCount >= SCAN_LIMIT) {
      return res.status(429).json({
        error: `Límite de ${SCAN_LIMIT} escaneos por hora alcanzado. Intenta de nuevo más tarde.`,
        stickers: []
      });
    }

    let { image, mediaType } = req.body;

    if (!image || !mediaType) {
      return res.status(400).json({ error: "Missing image or mediaType", stickers: [] });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Missing API key", stickers: [] });
    }

    // Fix: iPhone envía fotos como image/heic o image/heif que Anthropic no acepta.
    // Forzamos image/jpeg en el mediaType antes de mandar a la API.
    if (mediaType === "image/heic" || mediaType === "image/heif") {
      mediaType = "image/jpeg";
    }
    const SUPPORTED = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!SUPPORTED.includes(mediaType)) {
      mediaType = "image/jpeg";
    }

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-6",
        max_tokens: 1000,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType, data: image }
            },
            {
              type: "text",
              text: `You are analyzing a Panini FIFA World Cup 2026 sticker album photo.

Find ALL sticker codes visible. Codes are 2-3 letters followed by a number 1-20.
Examples: RSA 1, ARG 20, FWC 10, CC 13, MEX 5

IMPORTANT: Also detect Coca-Cola stickers with code CC (CC1 through CC14).
Codes may appear with or without space: "CC13" and "CC 13" are the same.

Return ONLY a JSON array of strings in format ["CODE NUM", ...].
Example: ["RSA 1", "ARG 20", "FWC 10", "CC 13"]
If no stickers visible, return [].`
            }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", JSON.stringify(data));
      return res.status(response.status || 500).json({
        error: data.error?.message || "API error",
        stickers: []
      });
    }

    // Registrar el escaneo DESPUÉS de que Anthropic respondió bien — así un error de
    // la API no cuenta contra el límite del usuario (no es su culpa que haya fallado).
    fetch(`${process.env.SUPABASE_URL}/rest/v1/scan_rate_limits`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        apikey: process.env.SUPABASE_ANON_KEY,
        "Content-Type": "application/json",
        Prefer: "return=minimal"
      },
      body: JSON.stringify({ user_id: userId })
    }).catch(err => console.error("No se pudo registrar el rate limit (no bloqueante):", err));

    const text = data.content?.[0]?.text || "[]";
    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      const normalized = parsed.map(s => {
        const m = String(s).trim().toUpperCase().match(/^([A-Z]{2,3})\s*(\d{1,2})$/);
        if (!m) return null;
        return `${m[1]} ${m[2]}`;
      }).filter(Boolean);
      return res.json({ stickers: normalized });
    } catch {
      const matches = text.match(/\b([A-Z]{2,3})\s*(\d{1,2})\b/g) || [];
      const normalized = [...new Set(matches)].map(m => {
        const parts = m.trim().match(/^([A-Z]{2,3})\s*(\d{1,2})$/);
        return parts ? `${parts[1]} ${parts[2]}` : null;
      }).filter(Boolean);
      return res.json({ stickers: normalized });
    }
  } catch (err) {
    console.error("Handler error:", err);
    return res.status(500).json({ error: err.message, stickers: [] });
  }
}
