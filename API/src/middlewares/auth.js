const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ msg: 'Token not provided' });
    }
    const [, token] = authHeader.split(' ');
    try {

        concole.log(token)
        const decoded = jwt.verify(token, "SGNldE5pYW0="); // use sua chave secreta
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ msg: 'Invalid token' });
    }
};