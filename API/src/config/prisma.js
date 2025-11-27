const { PrismaClient } = require("@prisma/client");

let prisma;

function getPrismaClient() {
  if (!prisma) {
    prisma = new PrismaClient({
      log: [
        { level: 'error', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
      ],
      errorFormat: 'pretty',
    });

    // Listener para desconexão inesperada
    prisma.$on('error', (e) => {
      console.error('Prisma error:', e);
      prisma = null; // Force reconnect on next call
    });
  }

  return prisma;
}

// Desconectar ao encerrar
process.on('SIGINT', async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (prisma) {
    await prisma.$disconnect();
  }
  process.exit(0);
});

module.exports = {
  getPrismaClient,
  get prisma() {
    return getPrismaClient();
  },
};