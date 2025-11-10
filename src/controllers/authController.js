const pool = require("../config/db");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

module.exports = {
  login: async (req, res) => {
    try {
      const { email, password } = req.body;

      // 1. Cek user
      const result = await pool.query("SELECT * FROM users WHERE email = $1", [
        email,
      ]);
      const user = result.rows[0];

      if (!user) return res.status(400).json({ error: "Email not found" });

      // 2. Cek password
      const match = await bcrypt.compare(password, user.password);
      if (!match) return res.status(400).json({ error: "Wrong password" });

      // 3. Generate refresh token baru
      const refreshToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      const accessToken = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET,
        { expiresIn: "15m" }
      );

      // ✅ 4. HAPUS refresh token lama milik user ini
      await pool.query("DELETE FROM user_tokens WHERE user_id = $1", [user.id]);

      // ✅ 5. INSERT refresh token baru
      await pool.query(
        `INSERT INTO user_tokens (user_id, refresh_token, expires_at, created_at) 
       VALUES ($1, $2, NOW() + INTERVAL '7 days', NOW())`,
        [user.id, refreshToken]
      );

      // 6. Kirim token
      res.json({
        email: user.email,
        accessToken,
        refreshToken,
      });
    } catch (err) {
      console.error("LOGIN ERROR:", err.message);
      res.status(500).json({ error: "Internal Server Error" });
    }
  },

  logout: async (req, res) => {
    try {
      const bearer = req.headers.authorization;
      if (!bearer) return res.status(401).json({ error: "Token missing" });

      const refreshToken = bearer.split(" ")[1];

      // Hapus token dari DB
      await pool.query("DELETE FROM user_tokens WHERE refresh_token = $1", [
        refreshToken,
      ]);

      res.json({ message: "Logout successful" });
    } catch (error) {
      console.error("LOGOUT ERROR:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  refresh: async (req, res) => {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken)
        return res.status(400).json({ error: "Missing refresh token" });

      // 1. Verify JWT refresh token
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const userId = decoded.userId;

      // 2. Cek apakah refresh token valid di DB
      const q = await pool.query(
        "SELECT * FROM user_tokens WHERE user_id = $1 AND refresh_token = $2",
        [userId, refreshToken]
      );

      if (q.rowCount === 0)
        return res.status(403).json({ error: "Refresh token invalid" });

      // 3. Generate access token baru
      const newAccessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "15m",
      });

      res.json({ accessToken: newAccessToken });
    } catch (err) {
      console.error("REFRESH ERROR:", err.message);
      res.status(401).json({ error: "Invalid refresh token" });
    }
  },

  check: async (req, res) => {
    res.json({ ok: true, userId: req.user.userId });
  },
};
