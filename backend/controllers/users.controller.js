const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const generateToken = (user) => { //función para generar el token
    return jwt.sign( //firma de jwt
        {
            id: user._id, //datos que contendra la firma 
            role: user.role
        },
        process.env.JWT_SECRET, //usa la clave secreta
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "2h" //determina la duración
        }
    );
};

// Crear usuario
const createUser = async (req, res) => {
    try {
        const { nombre, apellido, correo, password, role } = req.body; //recibe desde el frontend estos datos

        if (!nombre || !apellido || !correo || !password) { //verifica que esten completos
            return res.status(400).json({
                message: "Nombre, apellido, correo y contraseña son obligatorios"
            });
        }

        const userExists = await User.findOne({ correo }); //checa si el usuario ya existe, osea que no se repita su correo

        if (userExists) { //si ya existia
            return res.status(400).json({
                message: "Ya existe un usuario con ese correo"
            });
        }

        const newUser = new User({ //crea un nuevo objeto newUser
            nombre,
            apellido,
            correo,
            password,
            role
        });

        await newUser.save(); //encripta la contraseña

        const token = generateToken(newUser); //genera un token nuevo

        res.status(201).json({ //manda la respuesta
            message: "Usuario creado correctamente",
            token,
            user: {
                id: newUser._id,
                nombre: newUser.nombre,
                apellido: newUser.apellido,
                correo: newUser.correo,
                role: newUser.role,
                fotoPerfil: newUser.fotoPerfil,
                following: newUser.following || [],
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

        if (!correo || !password) { //verifica que hayan mandado correo y contraseña
            return res.status(400).json({
                message: "Correo y contraseña son obligatorios"
            });
        }

        const user = await User.findOne({ correo }).select("+password"); //para verificar el login es necesario que si se mande la contraseña
                                                                        //desde mongoDB
        if (!user) {
            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });
        }

        const passwordCorrecta = await user.comparePassword(password); //comparamos si la contraseña coincide

        if (!passwordCorrecta) {
            return res.status(401).json({
                message: "Correo o contraseña incorrectos"
            });
        }

        const token = generateToken(user); //generamos el token 

        res.json({
            message: "Login correcto",
            token,
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                role: user.role,
                fotoPerfil: user.fotoPerfil,
                following: user.following || []
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
        const users = await User.find().sort({ createdAt: -1 }); //.find() regresa todos los usuarios, los ordenamos de reciente a antiguo

        res.json({
            message: "Usuarios obtenidos correctamente",
            total: users.length, //devolvemos los usuarios
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
        const { id } = req.params; //el id viene desde la URL

        if (!mongoose.Types.ObjectId.isValid(id)) { //revisa si el ID es valido de mongoDB
            return res.status(400).json({
                message: "ID de usuario no válido"
            });
        }

        const user = await User.findById(id); //lo busca en la BD

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
        const { id } = req.params; //obtiene el ID de la URL
        const { nombre, apellido, correo, password, role, fotoPerfil } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de usuario no válido"
            });
        }

        const user = await User.findById(id).select("+password"); //obtenemos también la contraseña por si la va a utilizar

        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        if (correo && correo !== user.correo) { //si quiere cambiar el correo
            const correoExiste = await User.findOne({ correo });

            if (correoExiste) { //verifica que este disponible
                return res.status(400).json({
                    message: "Ya existe otro usuario con ese correo"
                });
            }

            user.correo = correo;
        }

        if (nombre) user.nombre = nombre;
        if (apellido) user.apellido = apellido;
        if (role) user.role = role; //cambios en general
        if (password) user.password = password;
        if (fotoPerfil !== undefined) user.fotoPerfil = fotoPerfil;  //foto de perfil puede estar vacio

        await user.save(); //por si cambia la contrasaña, para encriptarla de nuevo

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
    try {
        const user = await User.findById(req.user.id).select("-password"); //lo buscamos por id, pero sin la contraseña
                                                                            //es doble seguridad pq no se deberia mandar de todos modos
        if (!user) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        res.json({
            message: "Perfil obtenido correctamente",
            user: {
                id: user._id,
                nombre: user.nombre,
                apellido: user.apellido,
                correo: user.correo,
                role: user.role,
                fotoPerfil: user.fotoPerfil,
                following: user.following || []
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener perfil",
            error: error.message
        });
    }
};

const followUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de usuario no válido"
            });
        }

        if (id === req.user.id) {
            return res.status(400).json({
                message: "No puedes seguirte a ti mismo"
            });
        }

        const userToFollow = await User.findById(id);

        if (!userToFollow) {
            return res.status(404).json({
                message: "Usuario no encontrado"
            });
        }

        const currentUser = await User.findById(req.user.id);

        const alreadyFollowing = currentUser.following.some( //verifica sino lo esta siguiendo
            userId => userId.toString() === id
        );

        if (alreadyFollowing) {
            return res.status(400).json({
                message: "Ya sigues a este usuario"
            });
        }

        currentUser.following.push(id); //lo metemos al arreglo de id's del usuario logueado
        await currentUser.save(); //lo guardamos en la BD

        res.json({
            message: "Ahora sigues a este usuario"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al seguir usuario",
            error: error.message
        });
    }
};

const unfollowUser = async (req, res) => {
    try {
        const { id } = req.params;

        const currentUser = await User.findById(req.user.id);

        currentUser.following = currentUser.following.filter(
            userId => userId.toString() !== id //los filtra para que guarde los ID´s diferentes al que queremos seguir
        );

        await currentUser.save(); //guardamos en la BD

        res.json({
            message: "Dejaste de seguir a este usuario"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al dejar de seguir usuario",
            error: error.message
        });
    }
};

module.exports = {
    createUser,
    loginUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getProfile,
    followUser,
    unfollowUser
};