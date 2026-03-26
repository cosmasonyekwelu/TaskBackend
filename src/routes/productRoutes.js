const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");
const { authenticate } = require("../middleware/auth");
const { validateRequest, schemas } = require("../middleware/validate");

router.get("/", validateRequest({ query: schemas.productsQuery }), controller.getProducts);
router.get("/:id", validateRequest({ params: schemas.objectIdParam }), controller.getProduct);
router.post("/", authenticate, validateRequest({ body: schemas.productCreate }), controller.createProduct);
router.put(
  "/:id",
  authenticate,
  validateRequest({ params: schemas.objectIdParam, body: schemas.productUpdate }),
  controller.updateProduct
);
router.delete("/:id", authenticate, validateRequest({ params: schemas.objectIdParam }), controller.deleteProduct);

module.exports = router;
