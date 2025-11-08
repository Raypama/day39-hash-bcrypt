const pool = require("../config/db");

module.exports = {
  // GET all users
  getAll: async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM users");
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("ERROR getAll:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  // GET user by ID
  getById: async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "SELECT * FROM products WHERE id = $1",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR getById:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
},


  // CREATE user
 create: async (req, res) => {
  try {
    const {
      full_name,
      nickname,
      email,
      phone,
      address,
      image,
      birthday
    } = req.body;

    // ✅ Wajib isi
    if (!full_name || !nickname || !email || !phone) {
      return res.status(400).json({
        error: "full_name, nickname, email, dan phone wajib diisi"
      });
    }

    // ✅ Jika string kosong → jadi NULL
    const addressValue = address?.trim() === "" ? null : address;
    const imageValue = image?.trim() === "" ? null : image;

    // ✅ Cek email unique
    const checkEmail = await pool.query(
      "SELECT id FROM users WHERE email = $1",
      [email]
    );
    if (checkEmail.rows.length > 0) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    // ✅ Cek phone unique
    const checkPhone = await pool.query(
      "SELECT id FROM users WHERE phone = $1",
      [phone]
    );
    if (checkPhone.rows.length > 0) {
      return res.status(400).json({ error: "Phone sudah terdaftar" });
    }

    const result = await pool.query(
      `INSERT INTO users 
        (full_name, nickname, email, phone, address, image, birthday, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING *`,
      [
        full_name,
        nickname,
        email,
        phone,
        addressValue,
        imageValue,
        birthday
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error("ERROR create:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
},

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
      birthday
    } = req.body;

    // ✅ Wajib isi
    if (!full_name || !nickname || !email || !phone) {
      return res.status(400).json({
        error: "full_name, nickname, email, dan phone wajib diisi"
      });
    }

    // ✅ Jika string kosong → NULL
    const addressValue = address?.trim() === "" ? null : address;
    const imageValue = image?.trim() === "" ? null : image;

    // ✅ Cek email unique selain milik user ini
    const emailCheck = await pool.query(
      "SELECT id FROM users WHERE email = $1 AND id != $2",
      [email, id]
    );
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ error: "Email sudah dipakai user lain" });
    }

    // ✅ Cek phone unique selain milik user ini
    const phoneCheck = await pool.query(
      "SELECT id FROM users WHERE phone = $1 AND id != $2",
      [phone, id]
    );
    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({ error: "Phone sudah dipakai user lain" });
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
        updated_at = NOW()
       WHERE id = $8
       RETURNING *`,
      [
        full_name,
        nickname,
        email,
        phone,
        addressValue,
        imageValue,
        birthday,
        id
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error("ERROR update:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
},


  // DELETE user
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
  }
};
