// Vercel Serverless Function
// Fetches all Follow-up action items from Notion for the Follow-up Tracker screen.

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

function readText(prop) {
  if (!prop) return "";
  if (prop.type === "title") return (prop.title || []).map((t) => t.plain_text).join("");
  if (prop.type === "rich_text") return (prop.rich_text || []).map((t) => t.plain_text).join("");
  if (prop.type === "select") return prop.select?.name || "";
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
    const schema = await getSchema(token);

    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${FOLLOWUPS_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 50 }),
      }
    );

    const data = await notionRes.json();
    if (!notionRes.ok) {
      return res.status(notionRes.status).json({ error: data });
    }

    const titleKey = Object.values(schema).find((p) => p.type === "title")?.actualName;
    const ownerKey = schema["owner"]?.actualName;
    const dueKey = schema["due date"]?.actualName;
    const statusKey = schema["status"]?.actualName;
    const meetingKey = schema["meeting"]?.actualName;

    const items = (data.results || []).map((page) => ({
      id: page.id,
      item: titleKey ? readText(page.properties[titleKey]) : "",
      owner: ownerKey ? readText(page.properties[ownerKey]) : "",
      due: dueKey ? readText(page.properties[dueKey]) : "",
      status: statusKey ? readText(page.properties[statusKey]) || "Pending" : "Pending",
      meeting: meetingKey ? readText(page.properties[meetingKey]) : "",
    }));

    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
