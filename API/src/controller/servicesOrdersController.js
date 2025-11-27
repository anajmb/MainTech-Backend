const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Função auxiliar para registrar o histórico (já que você tem o model History)
const logHistory = async (userId, action, entityId, description) => {
    try {
        await prisma.history.create({
            data: {
                userId: Number(userId),
                action: action,
                entityType: "Modificado", // Ou o tipo apropriado
                entityId: Number(entityId),
                description: description
            }
        });
    } catch (error) {
        // Loga o erro, mas não para a execução principal
        console.error("Falha ao registrar histórico:", error);
    }
};

const servicesOrdersController = {

    create: async (req, res) => {
        try {
            const { machineId, priority, payload, inspectorId, inspectorName, machineName, location } = req.body;

            // Validação (seu código original)
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
                    status: 'PENDING', // Status inicial correto
                    inspectorId: inspectorId,
                    inspectorName: inspectorName,
                    machineName: machineName,
                    location: location
                }
            });


            // Loga a criação
            await logHistory(
                inspectorId,
                "Criou Ordem de Serviço",
                serviceOrder.id,
                `OS #${serviceOrder.id} criada para ${machineName}`
            );

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
            const { role, id: userId } = req.user;

            let whereClause = {};

            if (role === 'INSPECTOR') {
                whereClause = { inspectorId: userId };
            } else if (role === 'MAINTAINER') {

                whereClause = {
                    maintainerId: userId,
                };
            }
            const serviceOrders = await prisma.servicesOrders.findMany({
                where: whereClause,
                select: {
                    id: true,
                    machineId: true,
                    machineName: true,
                    location: true,
                    priority: true,
                    payload: true,
                    createdAt: true,
                    updatedAt: true,
                    inspectorId: true,
                    inspectorName: true,
                    maintainerName: true,
                    status: true
                },
                orderBy: {
                    updatedAt: 'desc'
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

    assignMaintainer: async (req, res) => {
        try {
            const { id } = req.params;
            const { maintainerId, maintainerName } = req.body;
            const adminId = req.user.id;

            if (!maintainerId || !maintainerName) {
                return res.status(400).json({ msg: "maintainerId e maintainerName são obrigatórios" });
            }

            const updatedOrder = await prisma.servicesOrders.update({
                where: { id: Number(id) },
                data: {
                    maintainerId: Number(maintainerId),
                    maintainerName: maintainerName,
                    status: 'ASSIGNED'
                }
            });

            await logHistory(adminId, "Atribuiu OS", updatedOrder.id, `OS #${id} atribuída a ${maintainerName}`);
            return res.status(200).json(updatedOrder);

        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: "Internal server error" });
        }
    },

    submitWork: async (req, res) => {
        try {
            const { id } = req.params;
            const { serviceNotes, materialsUsed } = req.body;
            const maintainerId = req.user.id;

            if (!serviceNotes || !materialsUsed) {
                return res.status(400).json({ msg: "serviceNotes e materialsUsed são obrigatórios" });
            }

            const updatedOrder = await prisma.servicesOrders.update({
                where: { id: Number(id) },
                data: {
                    serviceNotes: serviceNotes,
                    materialsUsed: materialsUsed,
                    status: 'IN_REVIEW'
                }
            });

            await logHistory(maintainerId, "Submeteu Relatório", updatedOrder.id, `Manutenção da OS #${id} submetida para revisão`);
            return res.status(200).json(updatedOrder);

        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: "Internal server error" });
        }
    },

    approveWork: async (req, res) => {
        try {
            const { id } = req.params;
            const adminId = req.user.id;

            const updatedOrder = await prisma.servicesOrders.update({
                where: { id: Number(id) },
                data: {
                    status: 'COMPLETED'
                }
            });

            await logHistory(adminId, "Aprovou OS", updatedOrder.id, `OS #${id} marcada como Concluída`);
            return res.status(200).json(updatedOrder);

        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: "Internal server error" });
        }
    },

    refuseWork: async (req, res) => {
        try {
            const { id } = req.params;
            const adminId = req.user.id; 

            const updatedOrder = await prisma.servicesOrders.update({
                where: { id: Number(id) },
                data: {
                    status: 'ASSIGNED',
                    serviceNotes: null, 
                    materialsUsed: null
                }
            });

            await logHistory(
                adminId,
                "Recusou OS",
                updatedOrder.id,
                `OS #${id} foi recusada e retornou para o manutentor`
            );

            return res.status(200).json(updatedOrder);

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