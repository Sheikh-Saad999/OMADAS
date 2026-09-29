// Appends reviewed minutes + resolution to the body of an existing meeting page.
// Requires NOTION_TOKEN.

import { block, stamp, appendBlocks } from "./notion.js";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "NOTION_TOKEN is not configured on the server" });
  }

  const { pageId, minutes } = req.body || {};
  if (!pageId || !minutes || typeof minutes !== "object") {
    return res.status(400).json({ error: "A meeting and the minutes are required." });
  }

  const list = (v) => (Array.isArray(v) ? v : []);
  const blocks = [block("heading_2", `Minutes of Meeting (draft for sign-off) — ${stamp()}`)];

  if (minutes.summary) blocks.push(block("paragraph", minutes.summary));

  if (list(minutes.discussion).length) {
    blocks.push(block("heading_3", "Discussion"));
    for (const d of minutes.discussion) {
      const item = block("bulleted_list_item", d.topic || "Discussion point");
      const points = list(d.points).map((p) => block("bulleted_list_item", p));
      if (points.length) item.bulleted_list_item.children = points;
      blocks.push(item);
    }
  }

  if (list(minutes.decisions).length) {
    blocks.push(block("heading_3", "Decisions"));
    minutes.decisions.forEach((d) => blocks.push(block("bulleted_list_item", d)));
  }

  if (minutes.resolution) {
    blocks.push(block("heading_3", "Resolution"));
    blocks.push(block("callout", minutes.resolution));
  }

  if (list(minutes.action_items).length) {
    blocks.push(block("heading_3", "Action items"));
    for (const a of minutes.action_items) {
      const meta = [a.owner && `Owner: ${a.owner}`, a.due && `Due: ${a.due}`].filter(Boolean).join(" · ");
      blocks.push(block("to_do", meta ? `${a.item} — ${meta}` : a.item, { checked: false }));
    }
  }

  try {
    const result = await appendBlocks(token, pageId, blocks);
    if (!result.ok) {
      return res.status(result.status).json({
        error: "Could not save the minutes to the meeting record.",
        detail: result.detail,
      });
    }
    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: "Could not save the minutes to the meeting record.", detail: err.message });
  }
}
