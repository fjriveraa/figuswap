export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).end();

  const { image, mediaType } = req.body;

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
  const text = data.content?.[0]?.text || "[]";
  try {
    res.json({ stickers: JSON.parse(text.replace(/```json|```/g, "").trim()) });
  } catch {
    const matches = text.match(/[A-Z]{2,3}\s+\d{1,2}/g) || [];
    res.json({ stickers: [...new Set(matches)] });
  }
}
