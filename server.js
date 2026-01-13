import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// simple rate limit
const lastRequests = new Map();
function isRateLimited(ip) {
	const now = Date.now();
	const last = lastRequests.get(ip) || 0;
	if (now - last < 1000) return true;
	lastRequests.set(ip, now);
	return false;
}

/* ============================
   USER BY USERNAME (🔥 FIX)
============================ */
app.get("/user/by-username/:username", async (req, res) => {
	if (isRateLimited(req.ip)) {
		return res.status(429).json({ error: "Rate limited" });
	}

	try {
		const username = req.params.username;

		// username -> userId
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
		if (!lookupData.data || !lookupData.data[0]) {
			return res.status(404).json({ error: "User not found" });
		}

		const userId = lookupData.data[0].id;

		// user info
		const userRes = await fetch(
			`https://users.roblox.com/v1/users/${userId}`
		);
		const userData = await userRes.json();

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

/* ============================
   USER BY USERID (UNCHANGED)
============================ */
app.get("/user/:userId", async (req, res) => {
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
	} catch {
		res.status(500).json({ error: "Internal error" });
	}
});

/* ============================
   GROUPS BY USERID (WORKING)
============================ */
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
	} catch {
		res.status(500).json({ error: "Proxy error" });
	}
});

app.listen(PORT, () => {
	console.log("🔥 Roblox Proxy running on port", PORT);
});

