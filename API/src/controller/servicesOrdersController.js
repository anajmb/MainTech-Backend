const { PrismaClient } = require("@prisma/client");
const { getUnique } = require("./teamController");
const prisma = new PrismaClient();

const servicesOrdersController = {

    create: async (req, res) => {
        try {
            // --- MUDANÇA 1: Ler os novos campos do req.body ---
            const { machineId, priority, payload, inspectorId, inspectorName } = req.body;

            // --- MUDANÇA 2: Adicionar os novos campos na validação ---
            if (!machineId || !priority || payload === undefined || !inspectorId || !inspectorName) {
                return res.status(400).json({
                    msg: "MachineId, priority, payload, inspectorId, and inspectorName are required"
                });
            }

            const serviceOrder = await prisma.servicesOrders.create({
                data: {
                    machineId: machineId,
                    priority: priority,
                    payload: payload || [],
                    status: 'PENDING',
                    // --- MUDANÇA 3: Salvar os novos campos no banco ---
                    inspectorId: inspectorId,
                    inspectorName: inspectorName
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
                    // --- ADICIONE ESTAS DUAS LINHAS ---
                    inspectorId: true,
                    inspectorName: true
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
                // --- REMOVA O BLOCO 'include' DAQUI ---
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
            const { machineId, priority, payload, inspectorId, inspectorName, status } = req.body;

            const updatedOrder = await prisma.servicesOrders.update({
                where: { id: Number(id) },
                data: { machineId, priority, payload, inspectorId, inspectorName, status },
            });

            // 🔹 Registra atualização no histórico
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
}

module.exports = servicesOrdersController;