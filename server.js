import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// basic rate limit (simple)
const lastRequests = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const last = lastRequests.get(ip) || 0;
  if (now - last < 1000) return true; // 1 request/sec
  lastRequests.set(ip, now);
  return false;
}

app.get("/user/:userId", async (req, res) => {
  if (isRateLimited(req.ip)) {
    return res.status(429).json({ error: "Rate limited" });
  }

  try {
    const userId = req.params.userId;

    const userRes = await fetch(
      `https://users.roblox.com/v1/users/${userId}`
    );
    const userData = await userRes.json();

    if (!userData.id) {
      return res.status(404).json({ error: "User not found" });
    }

    const friendsRes = await fetch(
      `https://friends.roblox.com/v1/users/${userId}/friends/count`
    );
    const friendsData = await friendsRes.json();

    res.json({
      userId: userData.id,
      username: userData.name,
      displayName: userData.displayName,
      created: userData.created,
      friends: friendsData.count
    });
  } catch (err) {
    res.status(500).json({ error: "Internal error" });
  }
});

app.listen(PORT, () => {
  console.log("Proxy running on port", PORT);
});

app.get("/groups/:userId", async (req, res) => {
  const userId = req.params.userId;

  try {
    const response = await fetch(
      `https://groups.roblox.com/v2/users/${userId}/groups/roles`
    );

    if (!response.ok) {
      return res.status(404).json({ error: "Groups not found" });
    }

    const data = await response.json();

    const groups = data.data.map(entry => ({
      groupId: entry.group.id,
      name: entry.group.name,
      role: entry.role.name,
      image: entry.group.emblemUrl
    }));

    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: "Proxy error" });
  }
});

