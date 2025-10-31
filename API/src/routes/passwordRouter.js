const { Router } = require("express");
const passwordController = require("../controller/passwordController");
const router = Router();

router.post("/send-code", passwordResetController.sendCode);
router.post("/verify-code", passwordResetController.verifyCode);
router.post("/reset-password", passwordResetController.resetPassword);

module.exports = router;