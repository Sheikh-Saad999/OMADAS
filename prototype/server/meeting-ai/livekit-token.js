// Mints a LiveKit access token for one participant joining one room.
// Requires LIVEKIT_API_KEY, LIVEKIT_API_SECRET and LIVEKIT_URL (from a
// LiveKit Cloud project: cloud.livekit.io -> Settings -> Keys, and the
// project's wss:// URL shown on the project overview page).
//
// Anyone who calls this with a room name gets a token for it (matches the
// "share a link, anyone with the link can join" model the Chair asked for).
// Rooms are created automatically by LiveKit the moment the first
// participant joins — nothing needs to be pre-created.

import { AccessToken } from "livekit-server-sdk";

const TOKEN_TTL = "6h";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = (process.env.LIVEKIT_API_KEY || "").trim();
  const apiSecret = (process.env.LIVEKIT_API_SECRET || "").trim();
  const url = (process.env.LIVEKIT_URL || "").trim();
  if (!apiKey || !apiSecret || !url) {
    return res.status(500).json({ error: "Video meetings are not configured on the server." });
  }

  const { room, name } = req.body || {};
  const roomName = String(room || "").trim();
  const participantName = String(name || "").trim().slice(0, 60);
  if (!roomName || !participantName) {
    return res.status(400).json({ error: "A room and a name are required." });
  }

  try {
    // identity must be unique per connection; two tabs with the same name would
    // otherwise collide and disconnect each other.
    const identity = `${participantName}-${Math.random().toString(36).slice(2, 8)}`;
    const at = new AccessToken(apiKey, apiSecret, { identity, name: participantName, ttl: TOKEN_TTL });
    at.addGrant({ roomJoin: true, room: roomName, canPublish: true, canSubscribe: true });
    const token = await at.toJwt();
    return res.status(200).json({ token, url, room: roomName });
  } catch (err) {
    return res.status(500).json({ error: "Could not create a meeting token.", detail: err.message });
  }
}
