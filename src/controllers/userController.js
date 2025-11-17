const pool = require("../config/db");
const bcrypt = require("bcrypt");

module.exports = {
  // ✅ GET all users (password disembunyikan)
  getAll: async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM users");

      const users = result.rows.map((u) => ({
        ...u,
        password: "********",
      }));

      // res.status(200).json(result.rows);
      res.status(200).json(users);
    } catch (error) {
      console.error("ERROR getAll:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // ✅ GET by ID (password disembunyikan)
  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query("SELECT * FROM users WHERE id = $1", [
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = result.rows[0];
      user.password = "********";

      res.json(user);
    } catch (error) {
      console.error("ERROR getById:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // ✅ CREATE (password hashed)
  create: async (req, res) => {
    try {
      const {
        full_name = "",
        nickname = "",
        email = "",
        phone = "",
        address = "",
        image = "",
        birthday = "",
        password = "",
      } = req.body;

      if (!full_name || !nickname || !email || !phone || !password) {
        return res.status(400).json({
          error: "full_name, nickname, email, phone, dan password is required",
        });
      }

      const addressValue = address?.trim() === "" ? null : address;
      const imageValue = image?.trim() === "" ? null : image;
      const birthdayValue = !birthday || birthday.trim() === "" ? null : birthday;


      const checkEmail = await pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );
      if (checkEmail.rows.length > 0) {
        return res.status(400).json({ error: "Email is already registered" });
      }

      const checkPhone = await pool.query(
        "SELECT id FROM users WHERE phone = $1",
        [phone]
      );
      if (checkPhone.rows.length > 0) {
        return res.status(400).json({ error: "Phone is already registered" });
      }

      // ✅ Hash password dulu
      const hashedPassword = await bcrypt.hash(password, 10);
      console.log(hashedPassword);

      const result = await pool.query(
        `INSERT INTO users 
        (full_name, nickname, email, phone, address, image, birthday, password, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *`,
        [
          full_name,
          nickname,
          email,
          phone,
          addressValue,
          imageValue,
          birthday,
          hashedPassword,
        ]
      );

      const user = result.rows[0];
      user.password = "********";

      res.status(201).json(user);
    } catch (error) {
      console.error("ERROR create:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // ✅ UPDATE (hash password kalau diisi)
  update: async (req, res) => {
    try {
      const { id } = req.params;

      const {
        full_name,
        nickname,
        email,
        phone,
        address,
        image,
        birthday,
        password,
      } = req.body;

      if (!full_name || !nickname || !email || !phone) {
        return res.status(400).json({
          error: "full_name, nickname, email, dan phone is required",
        });
      }

      const addressValue = address?.trim() === "" ? null : address;
      const imageValue = image?.trim() === "" ? null : image;

      const emailCheck = await pool.query(
        "SELECT id FROM users WHERE email = $1 AND id != $2",
        [email, id]
      );
      if (emailCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Email has been used by another user" });
      }

      const phoneCheck = await pool.query(
        "SELECT id FROM users WHERE phone = $1 AND id != $2",
        [phone, id]
      );
      if (phoneCheck.rows.length > 0) {
        return res
          .status(400)
          .json({ error: "Phone has been used by another user" });
      }

      // ✅ Hash password kalau user isi password baru
      let hashedPassword = null;
      if (password?.trim() !== "") {
        hashedPassword = await bcrypt.hash(password, 10);
      }

      const result = await pool.query(
        `UPDATE users SET
          full_name = $1,
          nickname = $2,
          email = $3,
          phone = $4,
          address = $5,
          image = $6,
          birthday = $7,
          password = COALESCE($8, password),
          updated_at = NOW()
        WHERE id = $9
        RETURNING *`,
        [
          full_name,
          nickname,
          email,
          phone,
          addressValue,
          imageValue,
          birthday,
          hashedPassword,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      const user = result.rows[0];
      user.password = "********";

      res.json(user);
    } catch (error) {
      console.error("ERROR update:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // ✅ DELETE
  remove: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query(
        "DELETE FROM users WHERE id = $1 RETURNING *",
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ message: "User deleted" });
    } catch (error) {
      console.error("ERROR delete:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },
};
