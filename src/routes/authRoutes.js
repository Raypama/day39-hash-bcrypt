const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middlewares/auth");

router.post("/login", authController.login);
router.post("/logout", verifyToken, authController.logout);
router.post("/refresh", authController.refresh);
router.get("/check", verifyToken, authController.check);

module.exports = router;
