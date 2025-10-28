const jwt = require("jsonwebtoken");

// Middleware de autenticação
const auth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ msg: "Token não fornecido" });
  }

  const [, token] = authHeader.split(" ");
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;  
    next();
  } catch (err) {
    return res.status(401).json({ msg: "Token inválido ou expirado" });
  }
};

// Middleware de autorização por role
const authorize = (allowedRoles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ msg: "Token não fornecido" });
  if (!allowedRoles.includes(req.user.role)) {
    return res.status(403).json({ msg: "Acesso negado" });
  }
  next();
};

module.exports = { auth, authorize };
