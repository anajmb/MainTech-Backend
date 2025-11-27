const { PrismaClient } = require("@prisma/client")
const prisma = new PrismaClient();

const teamController = {

    create: async (req, res) => {
        try {
            const { name, description, members } = req.body;

            if (!name || !description) {
                return res.status(400).json({ msg: "Nome e descrição são obrigatórios." });
            }

            const existingTeam = await prisma.team.findFirst({
                where: { name: name }
            });

            if (existingTeam) {
                return res.status(400).json({ msg: "Já existe uma equipe com esse nome." });
            }

            let createData = {
                name,
                description
            };

            if (members && Array.isArray(members) && members.length > 0) {
                createData.members = {
                    create: members.map((memberId) => ({
                        personId: Number(memberId)
                    }))
                };
            }

            const team = await prisma.team.create({
                data: createData,
                include: {
                    members: {
                        include: {
                            person: true
                        }
                    }
                }
            });

            return res.status(201).json({ msg: "Equipe criada com sucesso!", team });

        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: "Erro interno do servidor", error });
        }
    },

    getAll: async (req, res) => {
        try {
            const teams = await prisma.team.findMany({
                include: {
                    members: {
                        include: {
                            person: true
                        }
                    }
                }
            });
            return res.status(200).json(teams);
        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: "Erro interno do servidor" });
        }
    },

    getUnique: async (req, res) => {
        try {
            const { id } = req.params;
            const team = await prisma.team.findUnique({
                where: { id: Number(id) },
                include: {
                    members: {
                        include: {
                            person: true
                        }
                    }
                }
            });

            if (!team) return res.status(404).json({ msg: "Equipe não encontrada" });

            return res.status(200).json(team);
        } catch (error) {
            return res.status(500).json({ msg: "Erro interno" });
        }
    },

    getByUser: async (req, res) => {
        try {
            const { userId } = req.params;

            if (!userId) {
                return res.status(400).json({ msg: "User ID is required" });
            }

            const teamMember = await prisma.teamMember.findFirst({
                where: { personId: Number(userId) },
                include: {
                    team: {
                        include: {
                            members: {
                                include: {
                                    person: true,
                                },
                            },
                        },
                    },
                },
            });

            if (!teamMember) {
                return res.status(404).json({ msg: "User is not in any team" });
            }

            return res.status(200).json(teamMember.team);
        } catch (error) {
            console.log(error);
            return res.status(500).json({ msg: "Internal server error" });
        }
    },

    update: async (req, res) => {
        try {
            const { id } = req.params;
            const { name, description } = req.body;

            if (!name || !description) {
                return res.status(400).json({
                    msg: "Name and description are required"
                });
            }

            const team = await prisma.team.update({
                where: { id: Number(id) },
                data: { name, description }
            });

            return res.status(200).json({
                msg: "Team updated successfully",
                team
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal server error"
            });
        }
    },

    delete: async (req, res) => {
        try {
            const { id } = req.params;
            await prisma.team.delete({
                where: { id: Number(id) }
            });

            return res.status(200).json({
                msg: "Team deleted successfully"
            });
        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal server error"
            });
        }
    }
};

module.exports = teamController;