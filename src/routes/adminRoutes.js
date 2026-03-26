const express = require("express");
const router = express.Router();
const controller = require("../controllers/adminController");
const { authenticate } = require("../middleware/auth");
const { requireRole } = require("../middleware/rbac");
const { validateRequest, schemas } = require("../middleware/validate");

router.use(authenticate, requireRole("admin"));

router.get("/users", controller.listUsers);
router.get("/users/:id", validateRequest({ params: schemas.objectIdParam }), controller.getUser);
router.put("/users/:id", validateRequest({ params: schemas.objectIdParam }), controller.updateUser);
router.delete("/users/:id", validateRequest({ params: schemas.objectIdParam }), controller.deleteUser);

router.post("/products", validateRequest({ body: schemas.productCreate }), controller.createProduct);
router.put(
  "/products/:id",
  validateRequest({ params: schemas.objectIdParam, body: schemas.productUpdate }),
  controller.updateProduct
);
router.delete("/products/:id", validateRequest({ params: schemas.objectIdParam }), controller.deleteProduct);

module.exports = router;
