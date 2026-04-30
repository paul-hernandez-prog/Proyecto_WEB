const jwt = require("jsonwebtoken");
const User = require("../models/User");

const protect = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                message: "No autorizado. Token no enviado"
            });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const user = await User.findById(decoded.id);

        if (!user) {
            return res.status(401).json({
                message: "No autorizado. Usuario no encontrado"
            });
        }

        req.user = {
            id: user._id.toString(),
            nombre: user.nombre,
            apellido: user.apellido,
            correo: user.correo,
            role: user.role
        };

        next();

    } catch (error) {
        return res.status(401).json({
            message: "Token inválido o expirado"
        });
    }
};

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }

    return res.status(403).json({
        message: "Acceso denegado. Se requiere rol de administrador"
    });
};

module.exports = {
    protect,
    adminOnly
};