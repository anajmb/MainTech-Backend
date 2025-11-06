require("dotenv").config(); // <- importante no topo
const express = require('express');
const routes = require('./routes/routes');
const { PrismaClient } = require("@prisma/client");
const cors = require("cors");

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());
app.use(routes);

app.get('/', (req, res) => {
  res.send('Servidor Rodando');
});

app.get("/env-test", (req, res) => {
  res.json({
    sendgridKey: process.env.SENDGRID_API_KEY ? "OK" : "MISSING",
    emailFrom: process.env.EMAIL_FROM || "NOT SET",
  });
});


const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

