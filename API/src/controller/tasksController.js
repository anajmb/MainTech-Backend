const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const logHistory = async (userId, action, entityId, description, entityType = "Task") => {
    try {
        await prisma.history.create({
            data: {
                userId: Number(userId),
                action: action,
                entityType: entityType,
                entityId: Number(entityId),
                description: description
            }
        });
    } catch (error) {
        // Loga o erro, mas não para a execução principal
        console.error("Falha ao registrar histórico:", error);
    }
};

const tasksController = {
  create: async (req, res) => {
    try {
      const { title, inspectorId, machineId, status, description, expirationDate } = req.body;

      if (!title || !inspectorId) {
        return res.status(400).json({ msg: "Title and inspectorId are required" });
      }

      if (machineId) {
        const existingTask = await prisma.task.findFirst({
          where: {
            machineId: machineId,
            status: {
              not: 'COMPLETED'
            }
          },
        });

        if (existingTask) {
          return res.status(400).json({
            msg: "Não foi possível criar a tarefa: Já existe uma tarefa ativa associada a esta máquina."
          });
        }
      }

      const task = await prisma.task.create({
        data: {
          title,
          inspectorId,
          machineId: machineId || null,
          status: status || "PENDING",
          description,
          expirationDate
        },
      });

      await logHistory(
        inspectorId,
        "Criou Tarefa",
        task.id,
        `Tarefa '${task.title}' criada.`
      );

      return res.status(201).json({ msg: "Task created successfully", id: task.id });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Internal server error", error });
    }
  },


getAll: async (req, res) => {
    try {
      const { status, inspectorId } = req.query;  // ← Adiciona inspectorId

      const whereClause = {};

      if (status) {
        whereClause.status = status;
      }

      if (inspectorId) {
        whereClause.inspectorId = Number(inspectorId);  // ← Filtra por inspector
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
        },
        orderBy: { updateDate: "desc" }  // ← Ordena por data (mais recente primeiro)
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
            gte: now,
            lte: twentyFourHoursFromNow,
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
          expirationDate: 'asc',
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

      const task = await prisma.task.findUnique({ where: { id: Number(id) } });

      await prisma.task.delete({ where: { id: Number(id) } });

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

  completeTask: async (req, res) => {
    try {
      const { id } = req.params;

      const updatedTask = await prisma.task.update({
        where: { id: Number(id) },
        data: {
          status: 'COMPLETED'
        },
      });

      if (updatedTask.inspectorId) {
        await prisma.history.create({
          data: {
            userId: Number(updatedTask.inspectorId),
            action: "Completou uma tarefa",
            entityType: "Modificado",
            entityId: Number(id),
            description: `Tarefa ${updatedTask.title} marcada como COMPLETA`,
          },
        });
      }

      return res.status(200).json({ msg: "Task completed successfully", id: updatedTask.id });

    } catch (error) {
      console.log(error);
      if (error.code === 'P2025') {
        return res.status(404).json({ msg: "Task not found" });
      }
      return res.status(500).json({ msg: "Internal server error", error });
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
        orderBy: { updateDate: "desc" },
      });

      return res.status(200).json(tasks);
    } catch (error) {
      console.log(error);
      return res.status(500).json({ msg: "Internal server error", error });
    }
  },
}

module.exports = tasksController;