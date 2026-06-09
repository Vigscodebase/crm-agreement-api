import jwt from 'jsonwebtoken';

/**
 * Rolling JWT Authentication Middleware (7.5 Minute Session)
 */
const auth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ message: 'Session expired. Please log in again.' });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user data to request
        req.user = decoded;

        // =========================================================
        // ROLLING SESSION LOGIC (Bank-style)
        // =========================================================
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        const timeLeft = decoded.exp - currentTime;

        // If the active user's token has less than 5 minutes (300s) left, 
        // seamlessly issue a fresh 7.5-minute token in the response header.
        if (timeLeft > 0 && timeLeft < 300) {
            // Re-sign using the same payload structure your login route uses
            const freshToken = jwt.sign(
                { id: decoded.id, email: decoded.email, role: decoded.role },
                process.env.JWT_SECRET,
                { expiresIn: '7.5m' } // 7.5 minutes
            );

            // Expose custom header to frontend clients
            res.setHeader('Access-Control-Expose-Headers', 'X-Refresh-Token');
            res.setHeader('X-Refresh-Token', freshToken);
        }

        next();
    } catch (err) {
        const message = err.name === 'TokenExpiredError'
            ? 'Your session has expired due to inactivity.'
            : 'Invalid session credentials.';
        return res.status(401).json({ message });
    }
};

export default auth;