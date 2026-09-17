// Vercel Serverless Function
// Fetches Agenda Items from Notion whose Status is "Pending", for the
// Approval Routing screen. Uses the same schema-matching trick as the
// create-* functions to work around hidden characters in column names.

const AGENDA_ITEMS_DB_ID = "3d7d4b6a-ebb1-80b3-9512-e2d2b7e991b3";

function normalize(str) {
  return String(str || "").replace(/\s+/g, " ").trim().toLowerCase();
}

async function getSchema(token) {
  const res = await fetch(`https://api.notion.com/v1/databases/${AGENDA_ITEMS_DB_ID}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Could not read Agenda Items schema");
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
    const statusProp = schema["status"];

    const body = { page_size: 50 };
    if (statusProp && statusProp.type === "rich_text") {
      body.filter = { property: statusProp.actualName, rich_text: { equals: "Pending" } };
    } else if (statusProp && statusProp.type === "select") {
      body.filter = { property: statusProp.actualName, select: { equals: "Pending" } };
    }

    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${AGENDA_ITEMS_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }
    );

    const data = await notionRes.json();
    if (!notionRes.ok) {
      return res.status(notionRes.status).json({ error: data });
    }

    const titleKey = Object.values(schema).find((p) => p.type === "title")?.actualName;
    const byKey = schema["submitted by"]?.actualName;
    const meetingKey = schema["meeting"]?.actualName;
    const commentKey = schema["comment"]?.actualName;

    const items = (data.results || []).map((page) => ({
      id: page.id,
      title: titleKey ? readText(page.properties[titleKey]) : "",
      submittedBy: byKey ? readText(page.properties[byKey]) : "",
      meeting: meetingKey ? readText(page.properties[meetingKey]) : "",
      comment: commentKey ? readText(page.properties[commentKey]) : "",
    }));

    return res.status(200).json({ items });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
