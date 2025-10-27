const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const employeesController = {

    //Create a new employee acount
    preRegister: async (req, res) => {
        try {
            const { cpf, name, role } = req.body;

            if (!cpf || !name || !role) {
                return res.status(400).json({
                    msg: "CPF, name and role are required"
                });
            }

            const employeeCreated = await prisma.employees.create({
                data: {
                    cpf,
                    name,
                    role,
                    status: "PENDING_SETUP"
                }
            });

            if (employeeCreated.role === "INSPECTOR") {
                await prisma.inspector.create({
                    data: { id: employeeCreated.id }
                });
            } else if (employeeCreated.role === "MAINTAINER") {
                await prisma.maintainer.create({
                    data: { id: employeeCreated.id }
                });
            } else {
                // Se tiver outros roles, ajuste aqui
                return res.status(400).json({
                    msg: "Role must be either INSPECTOR or MAINTAINER"
                });
            }

            return res.status(201).json({
                msg: "Employee created successfully",
                id: employeeCreated.id
            });

        } catch (error) {
            console.log(error);
            return res.status(500).json({
                msg: "Internal server error",
                error: error.message
            });
        }
    },

    login: async (req, res) => {
        try {

            const { cpf, password } = req.body;

            if (!cpf || !password) {
                return res.status(400).json({
                    msg: "email and password are required"
                });
            }

            const employeeFind = await prisma.employees.findUnique({
                where: { cpf }
            });

            if (!employeeFind) {
                return res.status(404).json({
                    msg: "Employee not found"
                });
            }

            const firstLoad = {
                id: employeeFind.id,
                cpf: employeeFind.cpf,
                name: employeeFind.name
            }

            const firstToken = jwt.sign(firstLoad, "SGNldE5pYW0=", {
                expiresIn: '1d'
            });

            if (employeeFind.status === "PENDING_SETUP") {
                return res.status(403).json({
                    firstToken,
                    msg: `Complete your registration to access the system. First Token: ${firstToken}`,
                    id: employeeFind.id
                });
            }

            if (!employeeFind.password) {
                return res.status(403).json({
                    msg: "You must complete your registration before logging in",
                    id: employeeFind.id
                });
            }

            const passwordMatch = await bcrypt.compare(password, employeeFind.password);

            if (!passwordMatch) {
                return res.status(401).json({
                    msg: "Invalid password or email"
                });
            }

            const payload = {
                id: employeeFind.id,
                email: employeeFind.email,
                name: employeeFind.name,
                role: employeeFind.role,
                status: employeeFind.status
            };

            const token = jwt.sign(payload, "SGNldE5pYW0=", {
                expiresIn: '1d' // Token expiration time
            });

            return res.status(200).json({
                token,
                user: {
                    id: employeeFind.id,
                    name: employeeFind.name,
                    status: employeeFind.status
                },
                id: employeeFind.id,
                msg: "Employee successfully authenticated"
            });

        } catch (error) {

            console.log(error)
            return res.status(500).json({
                msg: "Internal server error",
                error: error.message
            })
        }
    },

    completeSetup: async (req, res) => {
        try {
            const id = req.user.id;

            const { email, phone, birthDate, password } = req.body;

            await prisma.employees.update({
                where: { id: Number(id) },
                data: {
                    email,
                    phone,
                    birthDate: new Date(birthDate),
                    password: await bcrypt.hash(password, 10),
                    status: "ACTIVE"
                }
            });

            return res.status(200).json({
                msg: "Employee setup completed successfully"
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

            if (employee.role === "ADMIN") {
                return res.status(403).json({
                    msg: "Cannot delete an ADMIN employee in this route"
                });
            }

            // Remove registros relacionados
            await prisma.inspector.deleteMany({
                where: { id: Number(id) }
            });

            await prisma.maintainer.deleteMany({
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
                msg: "Employee deleted successfully",
            });
        } catch (error) {
            console.log(error)
            return res.status(500).json({
                msg: "Internal server error"
            })
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

            if (employee.role === "ADMIN") {
                return res.status(403).json({
                    msg: "Cannot update an ADMIN employee in this route"
                });
            }

            if (employee.role !== role) {
                if (employee.role === "INSPECTOR") {

                    await prisma.inspector.deleteMany({
                        where: { id: Number(id) }
                    });

                    await prisma.maintainer.create({
                        data: {
                            id: Number(id)
                        }
                    });

                } else if (employee.role === "MAINTAINER") {

                    await prisma.maintainer.deleteMany({
                        where: { id: Number(id) }
                    });

                    await prisma.inspector.create({
                        data: {
                            id: Number(id)
                        }
                    });
                } 
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
                msg: 'Employee updated successfully',
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
            const employees = await prisma.employees.findMany();

            return res.json(employees)

        } catch (error) {
            console.log("Error searching for employees:", error)
        }
    },

    getUnique: async (req, res) => {
        try {
            const { id } = req.params

            const employee = await prisma.employees.findUnique({
                where: { id: Number(id) }
            })

            if (!employee) {
                return res.status(404).json({ error: "Employee not found" })
            }

            return res.status(200).json(employee)
        } catch (error) {

            console.log("Error searching for employee:", error)
        }
    }
}

module.exports = employeesController;


/*
{
  "name": "Maria Souza",
  "cpf": "98765432100",
  "email": "maria.souza@example.com",
  "phone": "21 98888-7777",
  "birthDate": "1995-03-25",
  "password": "senhaForte456",
  "role": "MAINTAINER"
}
*/
