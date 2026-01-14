import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ================= FRIENDS ================= */
app.get("/friends/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const friendsRes = await fetch(
      `https://friends.roblox.com/v1/users/${userId}/friends`
    );

    if (!friendsRes.ok) {
      return res.status(404).json({ error: "Friends not found" });
    }

    const friendsData = await friendsRes.json();

    const friends = [];

    for (const friend of friendsData.data) {
      const userRes = await fetch(
        `https://users.roblox.com/v1/users/${friend.id}`
      );
      const userData = await userRes.json();

      friends.push({
        userId: friend.id,
        username: friend.name,
        displayName: friend.displayName,
        description: userData.description || "",
        created: userData.created
      });
    }

    res.json(friends);
  } catch (err) {
    res.status(500).json({ error: "Proxy error" });
  }
});
/* ================= USER INFO ================= */
app.get("/user/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

    const userRes = await fetch(
      `https://users.roblox.com/v1/users/${userId}`
    );

    if (!userRes.ok) {
      return res.status(404).json({ error: "User not found" });
    }

    const userData = await userRes.json();

    const friendsRes = await fetch(
      `https://friends.roblox.com/v1/users/${userId}/friends/count`
    );
    const friendsData = await friendsRes.json();

    res.json({
      userId: userData.id,
      username: userData.name,
      displayName: userData.displayName,
      description: userData.description || "",
      created: userData.created,
      friends: friendsData.count
    });

  } catch (err) {
    console.error("USER ERROR:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

/* ================= GROUPS ================= */

app.get("/groups/:userId", async (req, res) => {
  try {
    const userId = req.params.userId;

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
    console.error("GROUP ERROR:", err);
    res.status(500).json({ error: "Proxy error" });
  }
});

/* ================= START ================= */

app.listen(PORT, () => {
  console.log("🔥 Roblox Proxy running on port", PORT);
});
