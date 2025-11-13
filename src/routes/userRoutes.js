const express = require("express");
const router = express.Router();
const controller = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");

router.use(authenticate);

router.get("/profile", controller.getProfile);
router.put("/profile", validate(schemas.profileUpdate), controller.updateProfile);
router.delete("/profile", controller.deleteProfile);

module.exports = router;
