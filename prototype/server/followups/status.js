// Vercel Serverless Function
// Updates a Follow-up item's Status property in Notion.

const FOLLOWUPS_DB_ID = "3ded4b6a-ebb1-801d-b2b5-e748cc27c138";

function normalize(str) {
  return String(str || "").replace(/\s+/g, " ").trim().toLowerCase();
}

async function getSchema(token) {
  const res = await fetch(`https://api.notion.com/v1/databases/${FOLLOWUPS_DB_ID}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Could not read Follow-ups schema");
  const map = {};
  for (const [actualName, prop] of Object.entries(data.properties || {})) {
    map[normalize(actualName)] = { actualName, type: prop.type };
  }
  return map;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const token = process.env.NOTION_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "NOTION_TOKEN is not configured on the server" });
  }

  const { pageId, status } = req.body || {};
  if (!pageId || !status) {
    return res.status(400).json({ error: "pageId and status are required" });
  }

  try {
    const schema = await getSchema(token);
    const statusProp = schema["status"];
    if (!statusProp) {
      return res.status(500).json({ error: "Could not find a Status property on Follow-ups" });
    }

    const value =
      statusProp.type === "select"
        ? { select: { name: status } }
        : { rich_text: [{ text: { content: status } }] };

    const notionRes = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        properties: { [statusProp.actualName]: value },
      }),
    });

    const data = await notionRes.json();
    if (!notionRes.ok) {
      return res.status(notionRes.status).json({ error: data });
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
