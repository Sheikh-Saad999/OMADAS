// Creates a temporary Daily.co video room for a live meeting.
// Requires DAILY_API_KEY (from dashboard.daily.co).
//
// Design: the Chair's browser joins this room in "call object" mode (headless,
// our own UI) so it can access every participant's individual audio track for
// transcription. Everyone else just opens the room URL — Daily serves its own
// ready-made call page there (mic/camera controls included), no app needed.

const ROOM_LIFETIME_SECONDS = 4 * 60 * 60; // 4 hours, comfortably covers a long session

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.DAILY_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: "Video meetings are not configured on the server." });
  }

  try {
    const exp = Math.floor(Date.now() / 1000) + ROOM_LIFETIME_SECONDS;
    const dailyRes = await fetch("https://api.daily.co/v1/rooms", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        properties: {
          exp,
          eject_at_room_exp: true,
          enable_chat: true,
          enable_screenshare: true,
          start_video_off: false,
          start_audio_off: false,
        },
      }),
    });
    const data = await dailyRes.json().catch(() => ({}));

    if (!dailyRes.ok) {
      const detail = data?.info || data?.error || "Unknown error";
      if (dailyRes.status === 401) {
        return res.status(502).json({ error: "The video service rejected the API key.", detail });
      }
      return res.status(502).json({ error: "Could not create the video room.", detail });
    }

    return res.status(200).json({ url: data.url, name: data.name, expiresAt: exp * 1000 });
  } catch (err) {
    return res.status(500).json({ error: "Could not create the video room.", detail: err.message });
  }
}
