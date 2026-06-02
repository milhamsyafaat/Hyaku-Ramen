var jwt = require('jsonwebtoken');
var SECRET = process.env.JWT_SECRET || 'hyaku-ramen-secret-2024';

function authMiddleware(req, res, next) {
    var header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    var token = header.split(' ')[1];
    try {
        var decoded = jwt.verify(token, SECRET);
        req.admin = decoded;
        next();
    } catch (e) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

module.exports = { authMiddleware, SECRET };
