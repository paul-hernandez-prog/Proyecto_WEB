const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => {
    return jwt.sign(
        {
            id: user._id,
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "2h"
        }
    );
};

// Crear usuario
const createUser = async (req, res) => {
    try {
        const { nombre, apellido, correo, password, role } = req.body;

        if (!nombre || !apellido || !correo || !password) {
            return res.status(400).json({
                message: "Nombre, apellido, correo y contraseña son obligatorios"
            });
        }

        const userExists = await User.findOne({ correo });

        if (userExists) {
            return res.status(400).json({
                message: "Ya existe un usuario con ese correo"
            });
        }

        const newUser = new User({
            nombre,
            apellido,
            correo,
            password,
            role
        });

        await newUser.save();

        const token = generateToken(newUser);

        res.status(201).json({
            message: "Usuario creado correctamente",
            token,
            user: {
                id: newUser._id,
                nombre: newUser.nombre,
                apellido: newUser.apellido,
                correo: newUser.correo,
                role: newUser.role,
                fotoPerfil: newUser.fotoPerfil,
                createdAt: newUser.createdAt
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al crear usuario",
            error: error.message
        });
    }
};

// Login
const loginUser = async (req, res) => {
    try {
        const { correo, password } = req.body;

        if (!correo || !password) {
            return res.status(400).json({
                message: "Correo y contraseña son obligatorios"
            });
        }

        const user = await User.findOne({ correo }).select("+password");

        if (!user) {
            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });
        }

        const passwordCorrecta = await user.comparePassword(password);

        if (!passwordCorrecta) {
            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });
        }

        const token = generateToken(user);

        res.json({
            message: "Login correcto",
            token,
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                role: user.role,
                fotoPerfil: user.fotoPerfil
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al iniciar sesión",
            error: error.message
        });
    }
};

// Obtener todos los usuarios
const getUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        res.json({
            message: "Usuarios obtenidos correctamente",
            total: users.length,
            users
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener usuarios",
            error: error.message
        });
    }
};

// Obtener usuario por ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de usuario no válido"
            });
        }

        const user = await User.findById(id);

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        res.json({
            message: "Usuario encontrado",
            user
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener usuario",
            error: error.message
        });
    }
};

// Actualizar usuario
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, apellido, correo, password, role, fotoPerfil } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de usuario no válido"
            });
        }

        const user = await User.findById(id).select("+password");

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        if (correo && correo !== user.correo) {
            const correoExiste = await User.findOne({ correo });

            if (correoExiste) {
                return res.status(400).json({
                    message: "Ya existe otro usuario con ese correo"
                });
            }

            user.correo = correo;
        }

        if (nombre) user.nombre = nombre;
        if (apellido) user.apellido = apellido;
        if (role) user.role = role;
        if (password) user.password = password;
        if (fotoPerfil !== undefined) user.fotoPerfil = fotoPerfil; 

        await user.save();

        res.json({
            message: "Usuario actualizado correctamente",
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                role: user.role,
                fotoPerfil: user.fotoPerfil,
                updatedAt: user.updatedAt
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar usuario",
            error: error.message
        });
    }
};

// Eliminar usuario
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const userToDelete = await User.findById(id);

        if (!userToDelete) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        // Si NO es admin y quiere eliminar a otro usuario, no lo dejamos
        if (req.user.role !== "admin" && req.user.id !== id) {
            return res.status(403).json({
                message: "No tienes permiso para eliminar este usuario"
            });
        }

        await User.findByIdAndDelete(id);

        res.json({
            message: "Usuario eliminado correctamente"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar usuario",
            error: error.message
        });
    }
};

const getProfile = async (req, res) => {
    res.json({
        message: "Token válido",
        user: req.user
    });
};

module.exports = {
    createUser,
    loginUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getProfile
};