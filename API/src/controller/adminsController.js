    const { PrismaClient, Prisma } = require("@prisma/client");
    const prisma = PrismaClient();
    const bcrypt = require('bcrypt');


    const adminsController = {

        create: async (req, res) => {
            try {

                const { name, email, role, cpf, phone, birthDate, password } = req.body;

                if (!name || !email || !role || !cpf || !phone || !birthDate || !password) {
                    return res.status(400).json({   
                        msg: "All fields are required"
                    });
                };

                // valida role com fallback se Prisma.Role não estiver disponível
                const allowedRoles = Prisma && Prisma.Role ? Object.values(Prisma.Role) : ['INSPECTOR','MAINTAINER','ADMIN'];

                const roleNormalized = role.toUpperCase();

                if (!allowedRoles.includes(roleNormalized)) {
                    return res.status(400).json({ msg: `Invalid role. Allowed values: ${allowedRoles.join(', ')}` });
                }

                const adminCreated = await prisma.employees.create({
                    data: {
                        name,
                        email,
                        role: roleNormalized,
                        cpf,
                        phone,
                        password: await bcrypt.hash(password, 10),
                        birthDate: new Date(birthDate),
                        status: "ACTIVE"
                    }
                });

                const adminCreates = await prisma.admin.create({

                    data: {

                        id: adminCreated.id

                    }

                });


                // 6. Retornar sucesso
                return res.status(201).json({
                    msg: "Admin created successfully",
                    id: adminCreated.id
                });

            } catch (error) {
                if (error.code === 'P2002') {
                    return res.status(400).json({
                        msg: "This email or CPF is already in use."
                    });
                }

                console.log(error);
                return res.status(500).json({
                    msg: "Internal server error",
                    error: error.message
                });
            }
        },


        update: async (req, res) => {
            try {
                const { id } = req.params;
                const { name, cpf, email, phone, birthDate, password, role } = req.body;

                if (!name || !cpf || !email || !phone || !birthDate || !password || !role) {
                    return res.status(400).json({
                        msg: 'All fields (including role) are necessary'
                    });
                }

                const employee = await prisma.employees.findUnique({
                    where: { id: Number(id) }
                });


                if (employee.role.toUpperCase() !== 'ADMIN') {
                    return res.status(403).json({
                        msg: "This rote only can be used to update adimins."
                    });
                }

                await prisma.employees.update({
                    data: {
                        name,
                        cpf,
                        email,
                        phone,
                        birthDate: new Date(birthDate),
                        password: await bcrypt.hash(password, 10),
                        role
                    },
                    where: {
                        id: Number(id)
                    }
                });

                return res.status(200).json({
                    msg: 'Admin updated successfully',
                });
            } catch (error) {
                console.log(error)

                return res.status(500).json({
                    msg: "Internal server error",
                    error: error.message
                })
            }
        },

        delete: async (req, res) => {
            try {
                const { id } = req.params;

                const employee = await prisma.employees.findUnique({
                    where: { id: Number(id) }
                });

                if (employee.role.toUpperCase() !== "ADMIN") {
                    return res.status(403).json({
                        msg: "Only ADMIN employees can be deleted in this route"
                    });
                }

                // Remove registros relacionados
                await prisma.inspector.deleteMany({
                    where: { id: Number(id) }
                });

                await prisma.maintainer.deleteMany({
                    where: { id: Number(id) }
                });

                await prisma.admin.deleteMany({
                    where: { id: Number(id) }
                });

                await prisma.teamMember.deleteMany({
                    where: { personId: Number(id) }
                });


                // Agora pode deletar o funcionário
                await prisma.employees.delete({
                    where: { id: Number(id) }
                });

                return res.status(200).json({
                    msg: "Admin deleted successfully",
                });
            } catch (error) {
                console.log(error)
                return res.status(500).json({
                    msg: "Internal server error"
                })
            }

        },

        getAll: async (req, res) => {
            try {
                const admins = await prisma.admin.findMany();
                return res.status(200).json(admins);
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
                const admin = await prisma.admin.findUnique({
                    where: { id: Number(id) }
                });

                if (!admin) {
                    return res.status(404).json({
                        msg: "Admin not found"
                    });
                }

                return res.status(200).json(admin);
            } catch (error) {
                console.log(error);
                return res.status(500).json({
                    msg: "Internal server error"
                });
            }
        }
    }


    module.exports = adminsController;



    /*
    {
    "name": "Marcos",
    "cpf": "11122233345",
    "email": "marcos@example.com",
    "password": "senhaSegura123",
    "phone": "11 91234-5678",
    "birthDate": "2000-05-10",
    } 
    */