// Importa o express
const express = require('express');
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient()

const router = express.Router();

const employeesRouter = require("./employeesRouter");
router.use("/employees", employeesRouter);

const adminsRouter = require("./adminsRouter");
router.use("/admins", adminsRouter);

const teamRouter = require("./teamRouter");
router.use("/team", teamRouter);

const teamMemberRouter = require("./teamMemberRouter");
router.use("/teamMember", teamMemberRouter);

const machinesRouter = require("./machinesRouter");
router.use("/machines", machinesRouter);

const setsRouter = require("./setsRouter");
router.use("/sets", setsRouter);

const subSetsRouter = require("./subSetsRouter");
router.use("/subsets", subSetsRouter);

const tasksRouter = require("./tasksRouter");
router.use("/tasks", tasksRouter);

const passwordRouter = require("./passwordRouter"); 
router.use("/auth", passwordRouter);

const serviceOrdersRouter = require("./serviceOrdersRouter");
router.use("/serviceOrders", serviceOrdersRouter);

module.exports = router;