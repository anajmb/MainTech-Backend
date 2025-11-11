const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const historyController = {
  create: async (req, res) => {
    try {
      const { userId, action, entityType, entityId, description } = req.body;

      if (!userId || !action || !entityType) {
        return res.status(400).json({ msg: "userId, action e entityType são obrigatórios." });
      }

      const history = await prisma.history.create({
        data: { userId, action, entityType, entityId, description },
      });

      return res.status(201).json(history);
    } catch (error) {
      console.error("Erro ao criar histórico:", error);
      return res.status(500).json({ msg: "Erro interno no servidor", error });
    }
  },

  // 🔹 Histórico específico por usuário (inspetor ou manutentor)
  getUserHistory: async (req, res) => {
    try {
      const { id } = req.params;
      const user = await prisma.employee.findUnique({ where: { id: Number(id) } });

      if (!user) {
        return res.status(404).json({ msg: "Usuário não encontrado." });
      }

      let history = [];

      // 🔸 Inspetor → tarefas e QRCodes
      if (user.role === "INSPECTOR") {
        history = await prisma.history.findMany({
          where: {
            userId: Number(id),
            entityType: { in: ["Task", "QRCode"] },
          },
          orderBy: { createdAt: "desc" },
        });
      }

      // 🔸 Manutentor → apenas ServiceOrders criadas/executadas por ele
      else if (user.role === "MAINTAINER") {
        history = await prisma.history.findMany({
          where: {
            userId: Number(id),
            entityType: "ServiceOrder",
          },
          orderBy: { createdAt: "desc" },
        });
      }

      return res.status(200).json(history);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
      return res.status(500).json({ msg: "Erro interno no servidor", error });
    }
  },
};

module.exports = historyController;
