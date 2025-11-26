const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// Desconectar ao encerrar a aplicação
process.on('SIGINT', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

module.exports = prisma;