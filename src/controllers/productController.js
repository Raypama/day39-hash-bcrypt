const pool = require("../config/db");


module.exports = {
  getAll: async (req, res) => {
    try {
      const result = await pool.query("SELECT * FROM products");
      res.status(200).json(result.rows);
    } catch (error) {
      console.error("ERROR getAll:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  getById: async (req, res) => {
    try {
      const { id } = req.params;

      const result = await pool.query("SELECT * FROM products WHERE id = $1", [
        id,
      ]);

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      res.json(result.rows[0]);
    } catch (error) {
      console.error("ERROR getById:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  create: async (req, res) => {
    try {
      const {
        name,
        category,
        brand,
        description,
        price,
        stock,
        media,
        rating,
      } = req.body;

      // ✅ Wajib isi
      if (!name || !category || !brand || !price || !stock) {
        return res.status(400).json({
          error: "Name, category, brand, price, and stock must be filled in",
        });
      }

      // ✅ Jika nullable
      const descriptionValue = description?.trim() === "" ? null : description;
      const ratingValue = rating === "" ? null : rating;

      // ✅ Price & stock harus angka
      if (isNaN(price)) {
        return res.status(400).json({ error: "price must be a number" });
      }
      if (isNaN(stock)) {
        return res.status(400).json({ error: "stock must be a number" });
      }

      // ✅ Media harus array → JSON
      let mediaValue = null;

      if (Array.isArray(media)) {
        mediaValue = JSON.stringify(media); // simpan sebagai JSON
      }

      const result = await pool.query(
        `INSERT INTO products
        (name, category, brand, description, price, stock, media, rating, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7::jsonb, $8, NOW(), NOW())
       RETURNING *`,
        [
          name,
          category,
          brand,
          descriptionValue,
          price,
          stock,
          mediaValue,
          ratingValue,
        ]
      );

      // ✅ Parse media sebelum response
      const product = result.rows[0];
      if (typeof product.media === "string") {
        product.media = JSON.parse(product.media);
      }

      res.status(201).json(product);
    } catch (error) {
      console.error("ERROR create product:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },

  update: async (req, res) => {
    try {
      const { id } = req.params;

      const {
        name,
        category,
        brand,
        description,
        price,
        stock,
        media,
        rating,
      } = req.body;

      // ✅ Validasi wajib isi
      if (!name || !category || !brand || !price || !stock) {
        return res.status(400).json({
          error: "Name, category, brand, price, and stock must be filled in",
        });
      }

      // ✅ Jika nullable
      const descriptionValue = description?.trim() === "" ? null : description;
      const ratingValue = rating === "" ? null : rating;

      // ✅ Validasi angka
      if (isNaN(price)) {
        return res.status(400).json({ error: "price must be a number" });
      }
      if (isNaN(stock)) {
        return res.status(400).json({ error: "stock must be a number" });
      }

      // ✅ FIX MEDIA (menerima array atau string JSON)
      let mediaValue = null;

      if (media) {
        try {
          // Jika media = string JSON → parse
          // Jika media = array → lolos
          const parsed = typeof media === "string" ? JSON.parse(media) : media;

          if (Array.isArray(parsed)) {
            mediaValue = JSON.stringify(parsed);
          } else {
            console.log("MEDIA NOT ARRAY:", parsed);
          }
        } catch (err) {
          console.error("MEDIA JSON PARSE ERROR:", err.message);
        }
      }

      const result = await pool.query(
        `UPDATE products SET
        name = $1,
        category = $2,
        brand = $3,
        description = $4,
        price = $5,
        stock = $6,
        media = COALESCE($7::jsonb, media),
        rating = $8,
        updated_at = NOW()
      WHERE id = $9
      RETURNING *`,
        [
          name,
          category,
          brand,
          descriptionValue,
          price,
          stock,
          mediaValue,
          ratingValue,
          id,
        ]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ message: "Product not found" });
      }

      // ✅ media sudah berupa object jika tipe kolomnya JSONB
      const product = result.rows[0];

      res.json(product);
    } catch (error) {
      console.error("ERROR update product:", error.message);
      res.status(500).json({ error: "Internal server error" });
    }
  },
  remove: async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.json({ message: "Product deleted" });
  } catch (error) {
    console.error("ERROR delete product:", error.message);
    res.status(500).json({ error: "Internal server error" });
  }
}

};
