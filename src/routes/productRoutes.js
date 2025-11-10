const express = require("express");
const router = express.Router();
const productController = require("../controllers/productController");
const { verifyToken } = require("../middlewares/auth");

router.get("/",verifyToken, productController.getAll);
router.get("/:id",verifyToken, productController.getById);
/* 3 routes dibawah diatur pake verify admin untuk kedepan nya */
router.post("/",verifyToken, productController.create);
router.put("/:id",verifyToken, productController.update);
router.delete("/:id",verifyToken, productController.remove);


module.exports = router;
