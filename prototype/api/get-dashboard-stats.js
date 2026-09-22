// Vercel Serverless Function
// Computes real stats and recent activity for the Dashboard, pulled from
// the Meetings, Agenda Items, Follow-ups, and Historical Archive databases.

const MEETINGS_DB_ID = "3d7d4b6a-ebb1-80b0-a628-d7dd8d3f8ac3";
const AGENDA_ITEMS_DB_ID = "3d7d4b6a-ebb1-80b3-9512-e2d2b7e991b3";
const FOLLOWUPS_DB_ID = "3ded4b6a-ebb1-801d-b2b5-e748cc27c138";
const ARCHIVE_DB_ID = "3ded4b6a-ebb1-80fb-8483-fa6ecd2caca5";

function normalize(str) {
  return String(str || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function readText(prop) {
  if (!prop) return "";
  if (prop.type === "title") return (prop.title || []).map((t) => t.plain_text).join("");
  if (prop.type === "rich_text") return (prop.rich_text || []).map((t) => t.plain_text).join("");
  return "";
}

async function getSchema(token, dbId) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}`, {
    headers: { Authorization: `Bearer ${token}`, "Notion-Version": "2022-06-28" },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Could not read schema for ${dbId}`);
  const map = {};
  for (const [actualName, prop] of Object.entries(data.properties || {})) {
    map[normalize(actualName)] = { actualName, type: prop.type };
  }
  return map;
}

async function queryAll(token, dbId, body = {}) {
  const res = await fetch(`https://api.notion.com/v1/databases/${dbId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ page_size: 100, ...body }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || `Query failed for ${dbId}`);
  return data.results || [];
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
    const [meetingsSchema, agendaSchema, followupsSchema, archiveSchema] = await Promise.all([
      getSchema(token, MEETINGS_DB_ID),
      getSchema(token, AGENDA_ITEMS_DB_ID),
      getSchema(token, FOLLOWUPS_DB_ID),
      getSchema(token, ARCHIVE_DB_ID),
    ]);

    const [meetings, agendaItems, followups, archive] = await Promise.all([
      queryAll(token, MEETINGS_DB_ID),
      queryAll(token, AGENDA_ITEMS_DB_ID),
      queryAll(token, FOLLOWUPS_DB_ID),
      queryAll(token, ARCHIVE_DB_ID),
    ]);

    const agendaStatusKey = agendaSchema["status"]?.actualName;
    const pendingApprovals = agendaItems.filter(
      (p) => readText(p.properties[agendaStatusKey]) === "Pending"
    ).length;

    const followupStatusKey = followupsSchema["status"]?.actualName;
    const openFollowups = followups.filter(
      (p) => readText(p.properties[followupStatusKey]) !== "Done"
    ).length;

    const stats = {
      activeMeetings: meetings.length,
      pendingApprovals,
      resolutions: archive.length,
      openFollowups,
    };

    // Build "recent activity" from the most recently created items across all four sources
    const titleOf = (page, schema) => {
      const key = Object.values(schema).find((p) => p.type === "title")?.actualName;
      return key ? readText(page.properties[key]) : "";
    };

    const events = [
      ...meetings.map((p) => ({ text: `Meeting scheduled: ${titleOf(p, meetingsSchema)}`, time: p.created_time })),
      ...agendaItems.map((p) => ({ text: `Agenda item submitted: ${titleOf(p, agendaSchema)}`, time: p.created_time })),
      ...followups.map((p) => ({ text: `Action item added: ${titleOf(p, followupsSchema)}`, time: p.created_time })),
      ...archive.map((p) => ({ text: `Resolution archived: ${titleOf(p, archiveSchema)}`, time: p.created_time })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5);

    return res.status(200).json({ stats, events });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
