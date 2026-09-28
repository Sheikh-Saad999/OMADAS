// Vercel Serverless Function
// Lists recent meetings (id, name, date) so a live session can be linked to one.
// Requires NOTION_TOKEN.

const MEETINGS_DB_ID = "3d7d4b6a-ebb1-80b0-a628-d7dd8d3f8ac3";

function normalize(str) {
  return String(str || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function readText(prop) {
  if (!prop) return "";
  if (prop.type === "title") return (prop.title || []).map((t) => t.plain_text).join("");
  if (prop.type === "rich_text") return (prop.rich_text || []).map((t) => t.plain_text).join("");
  if (prop.type === "select") return prop.select?.name || "";
  if (prop.type === "date") return prop.date?.start || "";
  return "";
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "NOTION_TOKEN is not configured on the server" });
  }

  try {
    const notionRes = await fetch(`https://api.notion.com/v1/databases/${MEETINGS_DB_ID}/query`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        page_size: 50,
        sorts: [{ timestamp: "last_edited_time", direction: "descending" }],
      }),
    });
    const data = await notionRes.json();
    if (!notionRes.ok) {
      return res.status(notionRes.status).json({ error: data });
    }

    const meetings = (data.results || []).map((page) => {
      // Match properties by normalized name (see create-meeting.js for why).
      const byName = {};
      let title = "";
      for (const [actualName, prop] of Object.entries(page.properties || {})) {
        byName[normalize(actualName)] = prop;
        if (prop.type === "title") title = readText(prop);
      }
      return {
        id: page.id,
        name: title || "Untitled meeting",
        date: readText(byName["date"]),
      };
    });

    return res.status(200).json({ meetings });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
