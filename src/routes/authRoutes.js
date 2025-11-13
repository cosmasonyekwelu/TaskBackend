const express = require("express");
const router = express.Router();
const auth = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { validate, schemas } = require("../middleware/validate");

router.post("/register", validate(schemas.register), auth.register);
router.post("/login", validate(schemas.login), auth.login);

router.get("/me", authenticate, auth.getMe);
router.post("/logout", authenticate, auth.logout);
router.post("/logout-all", authenticate, auth.logoutAll);
router.post("/change-password", authenticate, validate(schemas.changePassword), auth.changePassword);

module.exports = router;
