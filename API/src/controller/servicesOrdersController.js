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
                    updatedAt: true
                    // Se quiser que o getAll retorne os dados do inspetor, adicione aqui:
                    // inspectorId: true,
                    // inspectorName: true
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
                // Se quiser que o getUnique também puxe os dados do inspetor,
                // você pode adicionar um 'include' aqui, se houver a relação.
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
}

module.exports = servicesOrdersController;