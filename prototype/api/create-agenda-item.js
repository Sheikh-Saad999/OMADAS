// Vercel Serverless Function
// Creates a new page (row) in the Notion "Agenda Items" database.
// Requires the NOTION_TOKEN environment variable to be set in Vercel
// (Project Settings -> Environment Variables).

const AGENDA_ITEMS_DB_ID = "3d7d4b6a-ebb1-80b3-9512-e2d2b7e991b3";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "NOTION_TOKEN is not configured on the server" });
  }

  const { item, submittedBy, meeting, comment } = req.body || {};

  if (!item || !item.trim()) {
    return res.status(400).json({ error: "Agenda item title is required" });
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
        parent: { database_id: AGENDA_ITEMS_DB_ID },
        properties: {
          Name: { title: [{ text: { content: item } }] },
          "Submitted By": text(submittedBy),
          Meeting: text(meeting),
          Status: text("Pending"),
          Comment: text(comment),
        },
      }),
    });

    const data = await notionRes.json();

    if (!notionRes.ok) {
      return res.status(notionRes.status).json({ error: data });
    }

    return res.status(200).json({ success: true, page: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
