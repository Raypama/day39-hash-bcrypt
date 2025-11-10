require("dotenv").config();
const cron = require("node-cron");
const app = require("./app");
const pool = require("./config/db");

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log("Server running on port", PORT));

cron.schedule("*/5 * * * *", async () => {
  try {
    await pool.query("DELETE FROM user_tokens WHERE expires_at <= NOW()");
    console.log("✅ Cleaned expired tokens");
  } catch (err) {
    console.error("Cleanup error:", err.message);
  }
});
