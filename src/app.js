const express = require("express");
const path = require("path");
const cors = require("cors");

const userRoutes = require("./routes/userRoutes");
const productRoutes = require("./routes/productRoutes");

const app = express();

// Enable CORS
app.use(cors());

// JSON parser
app.use(express.json());

// ✅ Serve static frontend
app.use(express.static(path.join(__dirname, "..", "public")));

// API Routes
app.use("/users", userRoutes);
app.use("/products", productRoutes);

module.exports = app;
