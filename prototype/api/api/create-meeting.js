// Vercel Serverless Function
// Creates a new page (row) in the Notion "Meetings" database.
// Requires the NOTION_TOKEN environment variable to be set in Vercel
// (Project Settings -> Environment Variables).

const MEETINGS_DB_ID = "3d7d4b6a-ebb1-80b0-a628-d7dd8d3f8ac3";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "NOTION_TOKEN is not configured on the server" });
  }

  const { name, type, date, venueMode, chair } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Meeting name is required" });
  }

  const text = (value) => ({
    rich_text: [{ text: { content: String(value || "") } }],
  });

  try {
    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: MEETINGS_DB_ID },
        properties: {
          Name: { title: [{ text: { content: name } }] },
          Type: text(type),
          Date: text(date),
          "Venue/Mode": text(venueMode),
          Chair: text(chair),
          Status: text("Scheduled"),
        },
      }),
    });

    const data = await notionRes.json();

    if (!notionRes.ok) {
      // Bubble up Notion's own error message so it's easy to debug
      return res.status(notionRes.status).json({ error: data });
    }

    return res.status(200).json({ success: true, page: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
