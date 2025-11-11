const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const QRCode = require('qrcode');

const machinesController = {

    create: async (req, res) => {
        try {
            const { name, description, location, sets, tasks } = req.body;

            if (!name || !description || !location || !sets) {
                return res.status(400).json({
                    msg: "Name, description, location and sets are required"
                });
            }

            const setsArray = Array.isArray(sets) ? sets : [sets];
            const tasksArray = tasks ? (Array.isArray(tasks) ? tasks : [tasks]) : [];


            const machineWithoutQr = await prisma.machine.create({
                data: {
                    name,
                    description,
                    location,
                    sets: { connect: setsArray.map(id => ({ id })) },
                    tasks: { connect: tasksArray.map(id => ({ id })) }
                }
            });


            const newId = machineWithoutQr.id;


            const qrData = { id: newId, name, description, location };
            const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));


            const machine = await prisma.machine.update({
                where: { id: newId },
                data: { qrCode: qrCode },
                include: {
                    sets: true,
                    tasks: true
                }
            });

            return res.status(201).json({
                msg: "Machine created successfully",
                machine
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal server error",
                error
            });
        }
    },

    updateTemperature: async (req, res) => {
        try {
            const { id } = req.params;
            const { temperature } = req.body;

            if (temperature === undefined) {
                return res.status(400).json({
                    msg: "Temperature field is required in the body"
                });
            }

            const temp = parseFloat(temperature);

            if (isNaN(temp) || temp < -10 || temp > 100) {
                return res.status(400).json({
                    msg: "Invalid temperature value"
                });
            }

            const updatedMachine = await prisma.machine.update({
                where: { id: Number(id) },
                data: { temperature: temp }
            });

            return res.status(200).json({
                temperature: updatedMachine.temperature
            });

        } catch (error) {
            console.log(error);
            if (error.code === 'P2025') {
                return res.status(404).json({ msg: "Machine not found" });
            }
            return res.status(500).json({
                msg: "Internal server error",
                error: error.message
            });
        }
    },

    getAll: async (req, res) => {
        try {
            const machines = await prisma.machine.findMany({
                include: {
                    sets: {
                        include: {
                            subsets: true
                        }
                    },
                    tasks: true
                }
            });
            return res.status(200).json(machines);

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
            const machine = await prisma.machine.findUnique({
                where: { id: Number(id) },
                include: {
                    sets: {
                        include: {
                            subsets: true
                        }
                    },
                    tasks: true
                }
            });

            if (!machine) {
                return res.status(404).json({
                    msg: "Machine not found"
                });
            }

            return res.status(200).json(machine);

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
    const data = req.body;

    // Verifica se o ID foi enviado
    if (!id) {
      return res.status(400).json({ msg: "Machine ID is required." });
    }

    // Verifica se foi enviado ao menos 1 campo para atualizar
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ msg: "No data provided for update." });
    }

    // Se houver name/description/location, atualiza também o QRCode
    let qrCode = undefined;
    if (data.name || data.description || data.location) {
      const existing = await prisma.machine.findUnique({ where: { id: Number(id) } });
      if (!existing) return res.status(404).json({ msg: "Machine not found." });

      const qrData = {
        id,
        name: data.name || existing.name,
        description: data.description || existing.description,
        location: data.location || existing.location,
      };

      const QRCodeLib = require("qrcode");
      qrCode = await QRCodeLib.toDataURL(JSON.stringify(qrData));
      data.qrCode = qrCode;
    }

    // Se houver sets/tasks, ajusta o formato para o Prisma
    if (data.sets) {
      data.sets = { set: data.sets.map(id => ({ id })) };
    }
    if (data.tasks) {
      data.tasks = { set: data.tasks.map(id => ({ id })) };
    }

    const updatedMachine = await prisma.machine.update({
      where: { id: Number(id) },
      data,
    });

    return res.status(200).json({
      msg: "Machine updated successfully",
      machine: updatedMachine,
    });
  } catch (error) {
    console.error("Erro ao atualizar máquina:", error);
    return res.status(500).json({
      msg: "Internal server error",
      error: error.message,
    });
  }
},

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            const machineId = Number(id);

            await prisma.$transaction([
                prisma.task.deleteMany({
                    where: {
                        machineId: machineId
                    }
                }),
                prisma.machine.delete({
                    where: {
                        id: machineId
                    }
                })
            ]);

            return res.status(200).json({
                msg: "Machine and associated tasks deleted successfully"
            });

        } catch (error) {

            console.log(error);
            if (error.code === 'P2025') {
                return res.status(404).json({
                    msg: "Machine not found"
                });
            }

            return res.status(500).json({
                msg: "Internal server error"
            });
        }
    }
}

module.exports = machinesController;