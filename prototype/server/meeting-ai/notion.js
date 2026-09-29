// Small Notion helpers shared by the AI endpoints that write to meeting pages.

export const notionHeaders = (token) => ({
  Authorization: `Bearer ${token}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
});

export function fmt(seconds) {
  const s = Math.max(0, Math.round(seconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const mm = String(m).padStart(h ? 2 : 1, "0");
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

// Notion limits a single rich_text object to 2000 characters.
export function block(type, content, extra = {}) {
  return {
    object: "block",
    type,
    [type]: { rich_text: [{ type: "text", text: { content: String(content).slice(0, 2000) } }], ...extra },
  };
}

// Notion accepts at most 100 child blocks per request.
export async function appendBlocks(token, pageId, blocks) {
  for (let i = 0; i < blocks.length; i += 90) {
    const res = await fetch(`https://api.notion.com/v1/blocks/${pageId}/children`, {
      method: "PATCH",
      headers: notionHeaders(token),
      body: JSON.stringify({ children: blocks.slice(i, i + 90) }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, status: res.status, detail: data?.message };
  }
  return { ok: true };
}

export const stamp = () => new Date().toLocaleString("en-GB", { timeZone: "Asia/Karachi" });
