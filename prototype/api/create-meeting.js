// Vercel Serverless Function
// Creates a new page (row) in the Notion "Meetings" database.
// Requires the NOTION_TOKEN environment variable to be set in Vercel
// (Project Settings -> Environment Variables).
//
// NOTE: Some Notion databases have column names with invisible/hidden
// characters (stray tabs, extra spaces) that don't show on screen but
// break exact-name matching against the API. To work around this, we
// first fetch the database's real schema and match property names by
// their trimmed/normalized text instead of assuming exact names.

const MEETINGS_DB_ID = "3d7d4b6a-ebb1-80b0-a628-d7dd8d3f8ac3";

function normalize(str) {
  return String(str || "").replace(/\s+/g, " ").trim().toLowerCase();
}

async function getActualPropertyNames(token) {
  const res = await fetch(`https://api.notion.com/v1/databases/${MEETINGS_DB_ID}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Could not read Meetings database schema");
  }
  // Build a map from normalized name -> { actualName, type }
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
  // Default: treat as rich_text (covers the common case here)
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

  const { name, type, date, venueMode, chair } = req.body || {};

  if (!name || !name.trim()) {
    return res.status(400).json({ error: "Meeting name is required" });
  }

  try {
    const schema = await getActualPropertyNames(token);

    const wanted = {
      name: name,
      type: type,
      date: date,
      "venue/mode": venueMode,
      chair: chair,
      status: "Scheduled",
    };

    const properties = {};
    for (const [normalizedKey, value] of Object.entries(wanted)) {
      const match = schema[normalizedKey];
      if (match) {
        properties[match.actualName] = buildValue(match.type, value);
      }
    }

    // Make sure the title property is always set even if "name" didn't match above
    const titleEntry = Object.values(schema).find((p) => p.type === "title");
    if (titleEntry && !properties[titleEntry.actualName]) {
      properties[titleEntry.actualName] = buildValue("title", name);
    }

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: MEETINGS_DB_ID },
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
