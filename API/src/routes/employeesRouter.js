const { Router } = require("express");
const employeesController = require("../controller/employeesController");
const { auth, authorize } = require("../middlewares/auth"); // <-- note a desestruturação

const router = Router();

router.post("/preRegister", auth, authorize(["ADMIN"]), employeesController.preRegister);
router.post("/completeRegister", auth, employeesController.completeSetup);
router.post("/login", employeesController.login);
router.get("/get", auth, authorize(["ADMIN"]), employeesController.getAll);
router.get("/getUnique/:id", auth, employeesController.getUnique);
router.put("/update/:id", auth, employeesController.update);
router.delete("/delete/:id", auth, authorize(["ADMIN"]), employeesController.delete);

module.exports = router;
