// Appends a transcript to the body of an existing meeting page.
// Uses page content (blocks) instead of a property, so it works even if the
// Meetings database has no "Transcript" column. Requires NOTION_TOKEN.

import { block, fmt, stamp, appendBlocks } from "./notion.js";

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

  const blocks = [
    block("heading_2", `AI Transcript — ${stamp()}`),
    ...lines.map((l) => {
      const said =
        l.english && l.original && l.english !== l.original
          ? `${l.english}  (original: ${l.original})`
          : l.english || l.original || "";
      return block("paragraph", `[${fmt(l.start)}] ${l.speaker || "Speaker"}: ${said}`);
    }),
  ];

  try {
    const result = await appendBlocks(token, pageId, blocks);
    if (!result.ok) {
      return res.status(result.status).json({
        error: "Could not save the transcript to the meeting record.",
        detail: result.detail,
      });
    }
    return res.status(200).json({ success: true, saved: lines.length });
  } catch (err) {
    return res.status(500).json({ error: "Could not save the transcript to the meeting record.", detail: err.message });
  }
}
