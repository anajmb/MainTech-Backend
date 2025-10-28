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
        const { name, description, location, sets, tasks } = req.body;

        if (!name || !description || !location || !sets) {
            return res.status(400).json({
                msg: "Name, description, location and sets are required"
            });
        }

        const qrData = { id, name, description, location };
        const qrCode = await QRCode.toDataURL(JSON.stringify(qrData));

        const machine = await prisma.machine.update({
            where: { id: Number(id) },
            data: {
                name, description, location, qrCode,
                sets: {
                    set: sets?.map(id => ({ id })) || []
                },
                tasks: {
                    set: tasks?.map(id => ({ id })) || []
                }
            }
        });

        return res.status(200).json({
            msg: "Machine updated successfully"
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

            // Validação: checa se a temperatura foi enviada no body
            if (temperature === undefined) {
                return res.status(400).json({
                    msg: "Temperature field is required in the body"
                });
            }

            // Atualiza a máquina no banco de dados
            const updatedMachine = await prisma.machine.update({
                where: { id: Number(id) },
                data: {
                    temperature: parseFloat(temperature),
                    // O campo 'updateDate' será atualizado automaticamente
                    // se você tiver @updatedAt no seu schema.prisma
                }
            });

            return res.status(200).json({
                msg: "Temperature updated successfully",
                machine: updatedMachine
            });

        } catch (error) {
            console.log(error);
            // Checa se a máquina não foi encontrada
            if (error.code === 'P2025') {
                return res.status(404).json({ msg: "Machine not found" });
            }
            return res.status(500).json({
                msg: "Internal server error",
                error: error.message
            });
        }
    },

        delete: async (req, res) => {
            try {
                const { id } = req.params;

                await prisma.machine.delete({
                    where: { id: Number(id) }
                });

                return res.status(200).json({
                    msg: "Machine deleted successfully"
                });

            } catch (error) {

                console.log(error);
                return res.status(500).json({
                    msg: "Internal server error"
                });
            }
        }
}

module.exports = machinesController;