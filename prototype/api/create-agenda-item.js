// Vercel Serverless Function
// Creates a new page (row) in the Notion "Agenda Items" database.
// Requires the NOTION_TOKEN environment variable to be set in Vercel
// (Project Settings -> Environment Variables).
//
// NOTE: Some Notion databases have column names with invisible/hidden
// characters (stray tabs, extra spaces) that don't show on screen but
// break exact-name matching against the API. To work around this, we
// first fetch the database's real schema and match property names by
// their trimmed/normalized text instead of assuming exact names.

const AGENDA_ITEMS_DB_ID = "3d7d4b6a-ebb1-80b3-9512-e2d2b7e991b3";

function normalize(str) {
  return String(str || "").replace(/\s+/g, " ").trim().toLowerCase();
}

async function getActualPropertyNames(token) {
  const res = await fetch(`https://api.notion.com/v1/databases/${AGENDA_ITEMS_DB_ID}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || "Could not read Agenda Items database schema");
  }
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

  const { item, submittedBy, meeting, comment } = req.body || {};

  if (!item || !item.trim()) {
    return res.status(400).json({ error: "Agenda item title is required" });
  }

  try {
    const schema = await getActualPropertyNames(token);

    const wanted = {
      name: item,
      "submitted by": submittedBy,
      meeting: meeting,
      status: "Pending",
      comment: comment,
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
      properties[titleEntry.actualName] = buildValue("title", item);
    }

    const notionRes = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: AGENDA_ITEMS_DB_ID },
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
