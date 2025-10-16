const { Router } = require("express");

const employeesController = require("../controller/employeesController");

const router = Router();

router.post("/preRegister", (req, res) => employeesController.preRegister(req, res));

router.post("/completeRegister", (req, res) => employeesController.completeSetup(req, res));

router.post("/login", (req, res) => employeesController.login(req, res));

router.get("/get", (req, res) => employeesController.getAll(req, res));

router.get("/getUnique/:id", (req, res) => employeesController.getUnique(req, res));

router.put("/update/:id", (req, res) => employeesController.update(req, res));

router.delete("/delete/:id", (req, res) => employeesController.delete(req, res));

module.exports = router;

// eu estou arrumando o cadastro dos employees, adicionando o pré registro e o cadastro completo
// preciso atualizar o prisma e depois testar as rotas no insomnia