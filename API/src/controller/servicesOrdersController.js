const { PrismaClient } = require("@prisma/client");
const { getUnique } = require("./teamController");
const prisma = new PrismaClient();

const servicesOrdersController = {

    create: async (req, res) => {
        try {
            const { machineId, priority, payload } = req.body;

            if (!machineId || !priority || payload === undefined) {
                return res.status(400).json({
                    msg: "MachineId, priority, and payload are required"
                });
            }

            const serviceOrder = await prisma.servicesOrders.create({
                data: {
                    machineId: machineId,
                    priority: priority,
                    payload: payload || [],
                    status: 'PENDING'
                }
            });

            return res.status(201).json({
                msg: "Service order created succesfully",
                id: serviceOrder.id
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal server error"
            });
        }
    },

    getAll: async (req, res) => {
        try {

            const orders = await prisma.servicesOrders.findMany({
                select: {
                    id: true,
                    priority: true,
                    payload: true // Você pode selecionar 'payload' aqui
                }
            });
            
            return res.status(200).json(serviceOrders);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal server error"
            });
        }
    },

    getUnique: async (req, res) => {
        try {
            const { id } = req.params;

            const serviceOrder = await prisma.servicesOrders.findUnique({
                where: { id: Number(id) },
                include: {
                    payload: true
                }
            });

            if (!serviceOrder) {
                return res.status(404).json({
                    msg: "Service order not found"
                });
            }

            return res.status(200).json(serviceOrder);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal server error"
            });
        }
    }
}

module.exports = servicesOrdersController;