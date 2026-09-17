// Vercel Serverless Function
// Adds a new entry (row) to the "Historical Archive" Notion database.

const ARCHIVE_DB_ID = "3ded4b6a-ebb1-80fb-8483-fa6ecd2caca5";

function normalize(str) {
  return String(str || "").replace(/\s+/g, " ").trim().toLowerCase();
}

async function getSchema(token) {
  const res = await fetch(`https://api.notion.com/v1/databases/${ARCHIVE_DB_ID}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Could not read Historical Archive schema");
  const map = {};
  for (const [actualName, prop] of Object.entries(data.properties || {})) {
    map[normalize(actualName)] = { actualName, type: prop.type };
  }
  return map;
}

function buildValue(type, value) {
  if (type === "title") {
    return { title: [{ text: { content: String(value || "") } }] };
  }
  return { rich_text: [{ text: { content: String(value || "") } }] };
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "NOTION_TOKEN is not configured on the server" });
  }

  const { meeting, date, resolution } = req.body || {};

  if (!meeting || !meeting.trim()) {
    return res.status(400).json({ error: "Meeting name is required" });
  }

  try {
    const schema = await getSchema(token);

    const wanted = {
      meeting: meeting,
      date: date,
      resolution: resolution,
    };

    const properties = {};
    for (const [normalizedKey, value] of Object.entries(wanted)) {
      const match = schema[normalizedKey];
      if (match) {
        properties[match.actualName] = buildValue(match.type, value);
      }
    }

    const titleEntry = Object.values(schema).find((p) => p.type === "title");
    if (titleEntry && !properties[titleEntry.actualName]) {
      properties[titleEntry.actualName] = buildValue("title", meeting);
    }

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: ARCHIVE_DB_ID },
        properties,
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
