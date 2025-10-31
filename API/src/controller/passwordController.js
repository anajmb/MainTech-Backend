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

      const user = await prisma.employees.findUnique({ where: { email } });
      if (!user) return res.status(404).json({ msg: "Usuário não encontrado" });

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

      const hashed = await bcrypt.hash(newPassword, 10);
      await prisma.employees.update({
        where: { email },
        data: { password: hashed },
      });

      delete resetCodes[email];
      res.json({ msg: "Senha redefinida com sucesso!" });
    } catch (error) {
      console.log(error);
      res.status(500).json({ msg: "Erro ao redefinir senha" });
    }
  },
};

module.exports = passwordResetController;
