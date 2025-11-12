const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const tasksController = {
    create: async (req, res) => {
    try {
      const { title, inspectorId, machineId, status, description, expirationDate } = req.body;

      if (!title || !inspectorId) {
        return res.status(400).json({ msg: "Title and inspectorId are required" });
      }

      const task = await prisma.task.create({
        data: { title, inspectorId, machineId: machineId || null, status: status || "PENDING", description, expirationDate },
      });

      return res.status(201).json({ msg: "Task created successfully", id: task.id });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Internal server error", error });
    }
  },
    getAll: async (req, res) => {
        try {
            const { status } = req.query;

            const whereClause = {};

            if (status) {
                whereClause.status = status; 
            }

            const tasks = await prisma.task.findMany({
                where: whereClause, 
                include: {
                    inspector: {
                        include: {
                            person: true
                        }
                    },
                    machine: true,
                }
            });

            return res.status(200).json(tasks);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal server error",
                error
            });
        }
    },
   getExpiringSoon: async (req, res) => {
        try {
            const now = new Date();
            const twentyFourHoursFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

            const tasks = await prisma.task.findMany({
                where: {
                    expirationDate: {
                        gte: now, // gte = Greater Than or Equal (maior ou igual a agora)
                        lte: twentyFourHoursFromNow, // lte = Less Than or Equal (menor ou igual a daqui a 24h)
                    },
                },
                include: {
                    inspector: {
                        include: {
                            person: true
                        }
                    },
                    machine: true,
                },
                orderBy: {
                    expirationDate: 'asc', // Ordena as tarefas mais urgentes primeiro
                },
            });

            return res.status(200).json(tasks);

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal server error",
                error
            });
        }
    },
    getUnique: async (req, res) => {
        try {
            const { id } = req.params;

            const task = await prisma.task.findUnique({
                where: { id: parseInt(id) },
                include: {
                    inspector: {
                        include: {
                            person: true
                        }
                    },
                    machine: true
                },
            })

            return res.status(200).json(task);
        } catch (error) {

            console.log(error);
            return res.status(500).json({
                msg: "Internal server error"
            });
        }
    },
   update: async (req, res) => {
    try {
      const { id } = req.params;
      const { title, inspectorId, machineId, status, description, expirationDate } = req.body;

      if (!title || !inspectorId) {
        return res.status(400).json({ msg: "Title and inspectorId are required" });
      }

      const updatedTask = await prisma.task.update({
        where: { id: Number(id) },
        data: { title, inspectorId, machineId: machineId || null, status, description, expirationDate },
      });

      // 🔹 Registra no histórico
      await prisma.history.create({
        data: {
          userId: Number(inspectorId),
          action: "Atualizou uma tarefa",
          entityType: "Modificado",
          entityId: Number(id),
          description: `Tarefa ${title} atualizada para status ${status}`,
        },
      });

      return res.status(200).json({ msg: "Task updated successfully", id: updatedTask.id });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Internal server error", error });
    }
  },
      delete: async (req, res) => {
    try {
      const { id } = req.params;

      // Busca antes de deletar, pra saber o título e inspetor
      const task = await prisma.task.findUnique({ where: { id: Number(id) } });

      await prisma.task.delete({ where: { id: Number(id) } });

      // 🔹 Registra no histórico
      if (task) {
        await prisma.history.create({
          data: {
            userId: Number(task.inspectorId),
            action: "Deletou uma tarefa",
            entityType: "Task",
            entityId: task.id,
            description: `Tarefa ${task.title} foi deletada`,
          },
        });
      }

      return res.status(200).json({ msg: "Task deleted successfully" });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Internal server error" });
    }
    }, 

    getByInspetor: async (req, res) => {
    try {
        const { id } = req.params;

        const tasks = await prisma.task.findMany({
            where: { inspectorId: Number(id) },
            include: {
                machine: true,
            },
            orderBy: { updateDate: "desc" }, // últimas primeiro
        });

        return res.status(200).json(tasks);
    } catch (error) {
        console.log(error);
        return res.status(500).json({ msg: "Internal server error", error });
    }
},
}

module.exports = tasksController;