const mongoose = require("mongoose");
const Post = require("../models/Post");

// Crear publicación
const createPost = async (req, res) => {
    try {
        const { titulo, contenido, categoria, imagenUrl, youtubeUrl } = req.body;

        if (!titulo || !contenido || !categoria) {
            return res.status(400).json({
                message: "Título, contenido y categoría son obligatorios"
            });
        }

        const newPost = new Post({
            titulo,
            contenido,
            categoria,
            imagenUrl,
            youtubeUrl,
            autor: req.user.id
        });

        await newPost.save();

        const populatedPost = await Post.findById(newPost._id).populate(
            "autor",
            "nombre apellido correo fotoPerfil role"
        );

        res.status(201).json({
            message: "Publicación creada correctamente",
            post: populatedPost
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al crear publicación",
            error: error.message
        });
    }
};

// Obtener todas las publicaciones
const getPosts = async (req, res) => {
    try {
        const { search, categoria } = req.query;

        const filter = {};

        if (categoria && categoria !== "Todas") {
            filter.categoria = categoria;
        }

        if (search) {
            filter.$or = [
                { titulo: { $regex: search, $options: "i" } },
                { contenido: { $regex: search, $options: "i" } },
                { categoria: { $regex: search, $options: "i" } }
            ];
        }

        const posts = await Post.find(filter)
            .populate("autor", "nombre apellido correo fotoPerfil role")
            .sort({ createdAt: -1 });

        res.json({
            message: "Publicaciones obtenidas correctamente",
            total: posts.length,
            posts
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener publicaciones",
            error: error.message
        });
    }
};

// Obtener solo mis publicaciones
const getMyPosts = async (req, res) => {
    try {
        const posts = await Post.find({ autor: req.user.id })
            .populate("autor", "nombre apellido correo fotoPerfil role")
            .sort({ createdAt: -1 });

        res.json({
            message: "Mis publicaciones obtenidas correctamente",
            total: posts.length,
            posts
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener tus publicaciones",
            error: error.message
        });
    }
};

// Obtener publicación por ID
const getPostById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de publicación no válido"
            });
        }

        const post = await Post.findById(id).populate(
            "autor",
            "nombre apellido correo fotoPerfil role"
        );

        if (!post) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            });
        }

        res.json({
            message: "Publicación encontrada",
            post
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener publicación",
            error: error.message
        });
    }
};

// Actualizar publicación
const updatePost = async (req, res) => {
    try {
        const { id } = req.params;
        const { titulo, contenido, categoria, imagenUrl, youtubeUrl } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de publicación no válido"
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            });
        }

        if (post.autor.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                message: "No tienes permiso para editar esta publicación"
            });
        }

        if (titulo !== undefined) post.titulo = titulo;
        if (contenido !== undefined) post.contenido = contenido;
        if (categoria !== undefined) post.categoria = categoria;
        if (imagenUrl !== undefined) post.imagenUrl = imagenUrl;
        if (youtubeUrl !== undefined) post.youtubeUrl = youtubeUrl;

        await post.save();

        const updatedPost = await Post.findById(id).populate(
            "autor",
            "nombre apellido correo fotoPerfil role"
        );

        res.json({
            message: "Publicación actualizada correctamente",
            post: updatedPost
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar publicación",
            error: error.message
        });
    }
};

// Eliminar publicación
const deletePost = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de publicación no válido"
            });
        }

        const post = await Post.findById(id);

        if (!post) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            });
        }

        if (post.autor.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                message: "No tienes permiso para eliminar esta publicación"
            });
        }

        await Post.findByIdAndDelete(id);

        res.json({
            message: "Publicación eliminada correctamente"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar publicación",
            error: error.message
        });
    }
};

module.exports = {
    createPost,
    getPosts,
    getMyPosts,
    getPostById,
    updatePost,
    deletePost
};