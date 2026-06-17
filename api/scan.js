export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  try {
    const { image, mediaType } = req.body;

    if (!image || !mediaType) {
      return res.status(400).json({ error: "Missing image or mediaType", stickers: [] });
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(500).json({ error: "Missing API key", stickers: [] });
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
            { type: "image", source: { type: "base64", media_type: mediaType, data: image } },
            { type: "text", text: `List ALL FIFA World Cup 2026 Panini sticker codes visible in this image. Format: ["RSA 1", "ARG 20"]. Return ONLY a JSON array, nothing else.` }
          ]
        }]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Anthropic error:", JSON.stringify(data));
      return res.status(500).json({ error: data.error?.message || "API error", stickers: [] });
    }

    const text = data.content?.[0]?.text || "[]";
    try {
      res.json({ stickers: JSON.parse(text.replace(/```json|```/g, "").trim()) });
    } catch {
      const matches = text.match(/[A-Z]{2,3}\s+\d{1,2}/g) || [];
      res.json({ stickers: [...new Set(matches)] });
    }

  } catch (err) {
    console.error("Handler error:", err);
    res.status(500).json({ error: err.message, stickers: [] });
  }
}

