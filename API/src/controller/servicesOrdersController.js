const { PrismaClient } = require("@prisma/client");
const { getUnique } = require("./teamController"); // (Este import parece não estar sendo usado)
const prisma = new PrismaClient();

const servicesOrdersController = {

    create: async (req, res) => {
        try {
            const { machineId, priority, payload, inspectorId, inspectorName, machineName, location } = req.body;

            if (!machineId || !priority || payload === undefined || !inspectorId || !inspectorName || !machineName || !location) {
                return res.status(400).json({
                    msg: "MachineId, priority, payload, inspectorId, inspectorName, machineName, and location are required"
                });
            }

            const serviceOrder = await prisma.servicesOrders.create({
                data: {
                    machineId: machineId,
                    priority: priority,
                    payload: payload || [],
                    status: 'PENDING',
                    inspectorId: inspectorId,
                    inspectorName: inspectorName,
                    machineName: machineName,
                    location: location
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
            const serviceOrders = await prisma.servicesOrders.findMany({
                select: {
                    id: true,
                    machineId: true,
                    priority: true,
                    payload: true,
                    createdAt: true,
                    updatedAt: true,
                    inspectorId: true,
                    inspectorName: true,
                    machineName: true,
                    location: true
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
                where: { id: Number(id) }
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
    },

    getByManutentor: async (req, res) => {
        try {
            const { id } = req.params;

            const orders = await prisma.servicesOrders.findMany({
                where: {},
                orderBy: { updatedAt: "desc" },
            });

            return res.status(200).json(orders);
        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: "Internal server error", error });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { machineId, priority, payload, inspectorId, inspectorName, status, machineName, location } = req.body;

            const updatedOrder = await prisma.servicesOrders.update({
                where: { id: Number(id) },
                data: { machineId, priority, payload, inspectorId, inspectorName, status, machineName, location },
            });

            await prisma.history.create({
                data: {
                    userId: Number(inspectorId), 
                    action: "Atualizou uma ordem de serviço",
                    entityType: "Modificado",
                    entityId: Number(id),
                    description: `Ordem de serviço ${id} atualizada para status ${status}`
                }
            });

            return res.status(200).json({
                msg: "Service order updated successfully",
                id: updatedOrder.id
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: "Internal server error" });
        }
    },


    delete: async (req, res) => {
        try {
            const { id } = req.params;

            await prisma.servicesOrders.delete({
                where: { id: Number(id) }
            });

            return res.status(200).json({
                msg: "Service order deleted successfully"
            });

        } catch (error) {
            console.log(error);
            if (error.code === 'P2025') { 
                return res.status(404).json({
                    msg: "Service order not found"
                });
            }
            return res.status(500).json({
                msg: "Internal server error"
            });
        }
    },
}

module.exports = servicesOrdersController;