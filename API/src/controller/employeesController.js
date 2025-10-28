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
                    msg: "cpf and password are required"
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
                name: employeeFind.name,
                role: employeeFind.role
            };

            const firstToken = jwt.sign(firstLoad, process.env.JWT_SECRET, {
                expiresIn: '1d'
            });

            if (employeeFind.status === "PENDING_SETUP") {
                return res.status(403).json({
                    firstToken,
                    msg: `Complete your registration to access the system. First Token: ${firstToken}`,
                    id: employeeFind.id,
                    role: employeeFind.role
                });
            }

            if (!employeeFind.password) {
                return res.status(403).json({
                    msg: "You must complete your registration before loging in",
                    id: employeeFind.id,
                    role: employeeFind.role
                });
            }

            const passwordMatch = await bcrypt.compare(password, employeeFind.password);

            if (!passwordMatch) {
                return res.status(401).json({
                    msg: "Invalid password or cpf"
                });
            }

            const payload = {
                id: employeeFind.id,
                email: employeeFind.email,
                name: employeeFind.name,
                role: employeeFind.role,
                status: employeeFind.status
            };

            const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

            return res.status(200).json({
                token,
                user: {
                    id: employeeFind.id,
                    name: employeeFind.name,
                    role: employeeFind.role,
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
            // Pega o CPF e outros dados do body
            const { name, cpf, email, phone, birthDate, password } = req.body;

            // 1. Validar se todos os campos vieram
            if (!name || !cpf || !email || !phone || !birthDate || !password) {
                return res.status(400).json({ msg: "Todos os campos são obrigatórios." });
            }

            // 2. Verificar o CPF (A lógica que você pediu)
            const employee = await prisma.employees.findUnique({
                where: { cpf }
            });

            // CENÁRIO 1: "Não existe pré-cadastro com este CPF"
            if (!employee) {
                return res.status(404).json({
                    msg: "Não existe um pré-cadastro para este CPF. Fale com um administrador."
                });
            }

            // CENÁRIO 2: "Este usuário já foi cadastrado"
            if (employee.status === "ACTIVE") {
                return res.status(409).json({ // 409 (Conflict) é bom para "já existe"
                    msg: "Este CPF já possui um cadastro ativo e não pode ser registrado novamente."
                });
            }
            
            // CENÁRIO 3: Sucesso (Usuário é PENDING_SETUP)
            // Atualiza o usuário com os dados informados
            await prisma.employees.update({
                where: { id: employee.id }, // Usa o ID encontrado
                data: {
                    name,
                    cpf,
                    email,
                    phone,
                    birthDate: new Date(birthDate),
                    password: await bcrypt.hash(password, 10),
                    status: "ACTIVE" // Ativa o usuário
                }
            });

            // Retorna a mensagem de sucesso
            return res.status(200).json({
                msg: "Cadastro feito com sucesso!"
            });

        } catch (error) {
            console.log(error);
            // Captura erro se o email já existir (conflito)
            if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
                return res.status(409).json({ msg: "Este E-mail já está em uso." });
            }
            return res.status(500).json({
                msg: "Internal server error",
                error: error.message
            })
        }
    },
  delete: async (req, res) => {
    try {
        const { id } = req.params;
        const employeeId = Number(id);

        console.log("Deleting employee with ID:", employeeId);
        const employee = await prisma.employees.findUnique({
            where: { id: employeeId }
        });

        if (!employee) {
            return res.status(404).json({ msg: "Employee not found" });
        }

        if (employee.role === "ADMIN") {
            return res.status(403).json({
                msg: "Cannot delete an ADMIN employee in this route"
            });
        }

        if (employee.role === "INSPECTOR") {
            console.log("Deleting tasks for inspector:", employeeId);
            await prisma.task.deleteMany({
                where: { inspectorId: employeeId }
            });
        }

        console.log("Deleting team memberships for employee:", employeeId);
        await prisma.teamMember.deleteMany({
            where: { personId: employeeId }
        });

        console.log("Deleting inspector profile for:", employeeId);
        await prisma.inspector.deleteMany({
            where: { id: employeeId }
        });

        console.log("Deleting maintainer profile for:", employeeId);
        await prisma.maintainer.deleteMany({
            where: { id: employeeId }
        });
        
        console.log("Deleting admin profile for:", employeeId);
        await prisma.admin.deleteMany({
            where: { id: employeeId }
        });

        // 6. Finalmente, deletar o funcionário "pai"
        console.log("Deleting main employee record:", employeeId);
        await prisma.employees.delete({
            where: { id: employeeId }
        });


        return res.status(200).json({
            msg: "Employee deleted successfully",
        });

    } catch (error) {
        // Isso vai imprimir o erro real no seu terminal
        console.log("--- ERROR CAUGHT ON DELETE ---");
        console.log(error); 
        console.log("--- END ERROR ---");

        return res.status(500).json({
            msg: "Internal server error"
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
