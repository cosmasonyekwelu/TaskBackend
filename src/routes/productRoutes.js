const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");
const { authenticate } = require("../middleware/auth");

router.get("/", controller.getProducts);
router.get("/:id", controller.getProduct);
router.post("/", authenticate, controller.createProduct);
router.put("/:id", authenticate, controller.updateProduct);
router.delete("/:id", authenticate, controller.deleteProduct);

module.exports = router;
