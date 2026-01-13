import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

/* ================= USER BY USERNAME ================= */

app.get("/user/by-username/:username", async (req, res) => {
  try {
    const username = req.params.username;

    // STEP 1: username → userId
    const lookupRes = await fetch(
      "https://users.roblox.com/v1/usernames/users",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          usernames: [username],
          excludeBannedUsers: true
        })
      }
    );

    const lookupData = await lookupRes.json();
    const user = lookupData.data?.[0];

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const userId = user.id;

    // STEP 2: user info
    const userRes = await fetch(
      `https://users.roblox.com/v1/users/${userId}`
    );
    const userData = await userRes.json();

    // STEP 3: friend count
    const friendsRes = await fetch(
      `https://friends.roblox.com/v1/users/${userId}/friends/count`
    );
    const friendsData = await friendsRes.json();

    res.json({
      userId: userId,
      username: userData.name,
      displayName: userData.displayName,
      created: userData.created,
      friends: friendsData.count
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Proxy error" });
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
    res.status(500).json({ error: "Proxy error" });
  }
});

app.listen(PORT, () => {
  console.log("🔥 Roblox Proxy running on port", PORT);
});
