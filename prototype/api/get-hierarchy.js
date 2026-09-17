// Vercel Serverless Function
// Fetches every node from the "OrgHierarchy" Notion database, for the
// University Hierarchy tree on the "01 · User & Hierarchy" screen.
// Each row has a Name, a Level, and a Parent (referring to another row's Name).

const ORGHIERARCHY_DB_ID = "3d7d4b6a-ebb1-8058-9edd-d880bd9ad470";

function normalize(str) {
  return String(str || "").replace(/\s+/g, " ").trim().toLowerCase();
}

async function getSchema(token) {
  const res = await fetch(`https://api.notion.com/v1/databases/${ORGHIERARCHY_DB_ID}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || "Could not read OrgHierarchy schema");
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
    const titleKey = Object.values(schema).find((p) => p.type === "title")?.actualName;
    const levelKey = schema["level"]?.actualName;
    const parentKey = schema["parent"]?.actualName;

    const notionRes = await fetch(
      `https://api.notion.com/v1/databases/${ORGHIERARCHY_DB_ID}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ page_size: 100 }),
      }
    );

    const data = await notionRes.json();
    if (!notionRes.ok) {
      return res.status(notionRes.status).json({ error: data });
    }

    const nodes = (data.results || []).map((page) => ({
      id: page.id,
      name: titleKey ? readText(page.properties[titleKey]) : "",
      level: levelKey ? readText(page.properties[levelKey]) : "",
      parent: parentKey ? readText(page.properties[parentKey]) : "",
    }));

    return res.status(200).json({ nodes });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
