export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    let { image, mediaType } = req.body;

    if (!image || !mediaType) {
      return res.status(400).json({ error: "Missing image or mediaType", stickers: [] });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Missing API key", stickers: [] });
    }

    // Fix: iPhone envía fotos como image/heic o image/heif que Anthropic no acepta.
    // Forzamos image/jpeg en el mediaType antes de mandar a la API.
    // El base64 sigue siendo el mismo — la mayoría de navegadores modernos
    // convierten HEIC a JPEG al leerlo con FileReader, pero el file.type
    // sigue diciendo "image/heic". Esto corrige ese mismatch.
    // Nota: desde que Scanner.jsx redimensiona la foto con canvas antes de mandarla,
    // el cliente ya manda siempre "image/jpeg" real. Esta normalización se deja como
    // respaldo defensivo por si algún día se manda la imagen sin pasar por ese paso.
    if (mediaType === "image/heic" || mediaType === "image/heif") {
      mediaType = "image/jpeg";
    }

    // Fix: también aceptar webp y otros formatos, pero normalizar a jpeg si no es soportado
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
              // Fix: prompt mejorado que acepta códigos sin espacio (CC13, FWC10, ARG11)
              // y menciona explícitamente Coca-Cola para que no se salte esas figuritas.
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
      // Fix: antes esto siempre devolvía 500 sin importar el status real de Anthropic.
      // Un 400 (p.ej. imagen demasiado grande/inválida) o un 429 (rate limit) se reportaban
      // igual que un crash real, lo cual ocultaba la causa exacta del error. Ahora se reenvía
      // el status verdadero para poder distinguir "Claude rechazó la imagen" de "algo se rompió".
      return res.status(response.status || 500).json({
        error: data.error?.message || "API error",
        stickers: []
      });
    }

    const text = data.content?.[0]?.text || "[]";

    try {
      const cleaned = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(cleaned);
      // Normalizar: "CC13" -> "CC 13", "ARG20" -> "ARG 20"
      const normalized = parsed.map(s => {
        const m = String(s).trim().toUpperCase().match(/^([A-Z]{2,3})\s*(\d{1,2})$/);
        if (!m) return null;
        return `${m[1]} ${m[2]}`;
      }).filter(Boolean);
      return res.json({ stickers: normalized });
    } catch {
      // Fallback regex: acepta con o sin espacio entre código y número
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
