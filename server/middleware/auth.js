var jwt = require('jsonwebtoken');
var SECRET = process.env.JWT_SECRET;
if (!SECRET) {
    if (process.env.NODE_ENV === 'production') {
        console.error('FATAL: JWT_SECRET environment variable is not set');
        process.exit(1);
    }
    SECRET = 'hyaku-ramen-dev-secret';
    console.warn('WARNING: Using default JWT_SECRET for development. Set JWT_SECRET env var for production.');
}

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
