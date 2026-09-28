// Vercel Serverless Function
// Appends a transcript to the body of an existing meeting page.
// Uses page content (blocks) instead of a property, so it works even if the
// Meetings database has no "Transcript" column. Requires NOTION_TOKEN.

const NOTION_HEADERS = (token) => ({
  Authorization: `Bearer ${token}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
});

function fmt(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

function textBlock(type, content) {
  // Notion limits a single rich_text object to 2000 characters.
  return {
    object: "block",
    type,
    [type]: { rich_text: [{ type: "text", text: { content: String(content).slice(0, 2000) } }] },
  };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "NOTION_TOKEN is not configured on the server" });
  }

  const { pageId, lines } = req.body || {};
  if (!pageId || !Array.isArray(lines) || lines.length === 0) {
    return res.status(400).json({ error: "A meeting and at least one transcript line are required." });
  }

  const stamp = new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" });
  const blocks = [
    textBlock("heading_2", `AI Transcript — ${stamp}`),
    ...lines.map((l) => {
      const said = l.english && l.original && l.english !== l.original
        ? `${l.english}  (original: ${l.original})`
        : l.english || l.original || "";
      return textBlock("paragraph", `[${fmt(l.start)}] ${l.speaker || "Speaker"}: ${said}`);
    }),
  ];

  try {
    // Notion accepts at most 100 child blocks per request.
    for (let i = 0; i < blocks.length; i += 90) {
      const notionRes = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
        method: "PATCH",
        headers: NOTION_HEADERS(token),
        body: JSON.stringify({ children: blocks.slice(i, i + 90) }),
      });
      const data = await notionRes.json();
      if (!notionRes.ok) {
        return res.status(notionRes.status).json({
          error: "Could not save the transcript to the meeting record.",
          detail: data?.message,
        });
      }
    }
    return res.status(200).json({ success: true, saved: lines.length });
  } catch (err) {
    return res.status(500).json({ error: "Could not save the transcript to the meeting record.", detail: err.message });
  }
}
