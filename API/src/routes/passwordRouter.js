const { Router } = require("express");
const passwordController = require("../controller/passwordController");
const router = Router();

router.post("/send-code", passwordController.sendCode);
router.post("/verify-code", passwordController.verifyCode);
router.post("/reset-password", passwordController.resetPassword);

module.exports = router;