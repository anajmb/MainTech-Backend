<<<<<<< HEAD
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");

let resetCodes = {}; // memória temporária (ideal: banco)

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // use senha de app do Gmail
  },
});

const passwordResetController = {
    
  sendCode: async (req, res) => {
    try {
      const { email } = req.body;
=======
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const crypto = require("crypto");
const sgMail = require("@sendgrid/mail");
const bcrypt = require("bcrypt");

// Configura o SendGrid com a variável do Render
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

let resetCodes = {}; // armazenamento temporário em memória

const passwordResetController = {
  // Enviar código
  sendCode: async (req, res) => {
    try {
      const { email } = req.body;
      if (!email) return res.status(400).json({ msg: "Envie o e-mail." });
>>>>>>> 93d5731be54fa642741a844166432eb539e9e929

      const user = await prisma.employees.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

<<<<<<< HEAD
      const code = crypto.randomInt(100000, 999999).toString();
      resetCodes[email] = code;

      await transporter.sendMail({
        from: `"Gestão de Máquinas" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: "Redefinição de senha",
        text: `Seu código de verificação é: ${code}`,
      });

      res.json({ msg: "Código enviado para o e-mail." });
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Erro ao enviar e-mail." });
    }
  },

  verifyCode: async (req, res) => {
    try {
      const { email, code } = req.body;
      if (resetCodes[email] === code) {
        return res.json({ valid: true });
      }
      res.status(400).json({ valid: false, msg: "Código incorreto." });
    } catch (error) {
      res.status(500).json({ msg: "Erro interno" });
    }
  },

  resetPassword: async (req, res) => {
    try {
      const { email, newPassword } = req.body;
=======
      const code = crypto.randomInt(1000, 9999).toString();
      resetCodes[email] = { code, createdAt: Date.now() };

      const msg = {
        to: email,
        from: process.env.EMAIL_FROM, // vem da variável do Render
        subject: "Redefinição de senha - Código de verificação",
        text: `Seu código de verificação é: ${code}`,
        html: `<p>Seu código de verificação é: <strong>${code}</strong></p>`,
      };

      console.log("🔹 SENDGRID_API_KEY existe?", !!process.env.SENDGRID_API_KEY);
      console.log("🔹 EMAIL_FROM:", process.env.EMAIL_FROM);

      await sgMail.send(msg);
      return res.json({ msg: "Código enviado para o e-mail." });
    } catch (error) {
      console.error("❌ Erro sendCode:", error.response?.body || error);
      return res.status(500).json({ msg: "Erro ao enviar e-mail." });
    }
  },

  // Verificar código
  verifyCode: async (req, res) => {
    try {
      const { email, code } = req.body;
      if (!email || !code) return res.status(400).json({ msg: "Envie email e código." });

      const entry = resetCodes[email];
      if (!entry) return res.status(400).json({ valid: false, msg: "Código expirado ou não gerado." });

      const fifteenMinutes = 15 * 60 * 1000;
      if (Date.now() - entry.createdAt > fifteenMinutes) {
        delete resetCodes[email];
        return res.status(400).json({ valid: false, msg: "Código expirado." });
      }

      if (entry.code === code) return res.json({ valid: true });
      return res.status(400).json({ valid: false, msg: "Código incorreto." });
    } catch (error) {
      console.error("Erro verifyCode:", error);
      return res.status(500).json({ msg: "Erro interno." });
    }
  },

  // Redefinir senha
  resetPassword: async (req, res) => {
    try {
      const { email, newPassword } = req.body;
      if (!email || !newPassword) return res.status(400).json({ msg: "Envie email e nova senha." });
>>>>>>> 93d5731be54fa642741a844166432eb539e9e929

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.employees.update({
        where: { email },
        data: { password: hashed },
      });

      delete resetCodes[email];
<<<<<<< HEAD
      res.json({ msg: "Senha redefinida com sucesso!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Erro ao redefinir senha" });
=======
      return res.json({ msg: "Senha redefinida com sucesso!" });
    } catch (error) {
      console.error("Erro resetPassword:", error);
      return res.status(500).json({ msg: "Erro ao redefinir senha." });
>>>>>>> 93d5731be54fa642741a844166432eb539e9e929
    }
  },
};

<<<<<<< HEAD
module.exports = passwordResetController;
=======
module.exports = passwordResetController;
>>>>>>> 93d5731be54fa642741a844166432eb539e9e929
