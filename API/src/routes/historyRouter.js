const { Router } = require("express");
const historyController = require("../controller/historyController");

const router = Router();

router.post("/create", (req, res) => historyController.create(req, res));
router.get("/get/user/:id", (req, res) => historyController.getUserHistory(req, res));

module.exports = router;
