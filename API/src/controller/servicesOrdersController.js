const { PrismaClient } = require("@prisma/client");
const { getUnique } = require("./teamController");
const prisma = new PrismaClient();

const servicesOrdersController = {

     create: async (req, res) => {
    try {
      const { machineId, priority, payload, maintainerId } = req.body;

      if (!machineId || !priority || payload === undefined || !maintainerId) {
        return res.status(400).json({
          msg: "MachineId, priority, payload and maintainerId are required",
        });
      }

      const serviceOrder = await prisma.servicesOrders.create({
        data: {
          machineId,
          priority,
          payload: payload || [],
          status: "PENDING",
        },
      });

      // 🔹 Registra no histórico
      await prisma.history.create({
        data: {
          userId: Number(maintainerId),
          action: "Criou uma ordem de serviço",
          entityType: "ServiceOrder",
          entityId: serviceOrder.id,
          description: `Ordem de serviço criada para a máquina ${machineId}`,
        },
      });

      return res.status(201).json({
        msg: "Service order created successfully",
        id: serviceOrder.id,
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Internal server error" });
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

        // Quando tiver relação com o mantenedor, basta ajustar aqui.
        const orders = await prisma.servicesOrders.findMany({
            where: {}, // depois podemos filtrar por mantenedor se houver ligação
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