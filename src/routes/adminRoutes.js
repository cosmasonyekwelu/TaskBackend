const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");

const requireAdmin = (req, res, next) =>
  req.user.role === "admin"
    ? next()
    : res.status(403).json({ status: "error", message: "Access denied. Admin privileges required." });

router.use(authenticate, requireAdmin);

router.get("/users", controller.listUsers);
router.get("/users/:id", controller.getUser);
router.put("/users/:id", controller.updateUser);
router.delete("/users/:id", controller.deleteUser);

router.post("/products", controller.createProduct);
router.put("/products/:id", controller.updateProduct);
router.delete("/products/:id", controller.deleteProduct);

module.exports = router;
