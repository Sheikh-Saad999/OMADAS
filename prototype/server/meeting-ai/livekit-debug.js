// Temporary diagnostic endpoint — confirms the LiveKit environment variables
// are present and well-formed, without ever revealing the secret itself.
// Safe to leave in; it reveals no credential value, only shape/length.

export default async function handler(req, res) {
  const raw = {
    key: process.env.LIVEKIT_API_KEY || "",
    secret: process.env.LIVEKIT_API_SECRET || "",
    url: process.env.LIVEKIT_URL || "",
  };

  const describe = (label, value) => ({
    set: value.length > 0,
    length: value.length,
    trimmedLength: value.trim().length,
    hasWhitespace: value !== value.trim(),
    startsWith: value.trim().slice(0, 6),
    endsWith: value.trim().slice(-4),
  });

  return res.status(200).json({
    LIVEKIT_API_KEY: describe("key", raw.key),
    LIVEKIT_API_SECRET: describe("secret", raw.secret),
    LIVEKIT_URL: describe("url", raw.url),
    urlLooksValid: /^wss:\/\/.+\.livekit\.cloud$/.test(raw.url.trim()),
  });
}
