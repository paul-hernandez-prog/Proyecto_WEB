const mongoose = require("mongoose");
const Comment = require("../models/Comment");
const Post = require("../models/Post");

// Crear comentario
const createComment = async (req, res) => {
    try {
        const { postId } = req.params;
        const { contenido } = req.body;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                message: "ID de publicación no válido"
            });
        }

        if (!contenido || contenido.trim() === "") {
            return res.status(400).json({
                message: "El comentario no puede estar vacío"
            });
        }

        const post = await Post.findById(postId);

        if (!post) {
            return res.status(404).json({
                message: "Publicación no encontrada"
            });
        }

        const newComment = new Comment({
            contenido: contenido.trim(),
            autor: req.user.id,
            post: postId
        });

        await newComment.save();

        const populatedComment = await Comment.findById(newComment._id)
            .populate("autor", "nombre apellido correo fotoPerfil role")
            .populate("post", "titulo categoria autor");

        res.status(201).json({
            message: "Comentario creado correctamente",
            comment: populatedComment
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al crear comentario",
            error: error.message
        });
    }
};

// Obtener comentarios de una publicación
const getCommentsByPost = async (req, res) => {
    try {
        const { postId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(postId)) {
            return res.status(400).json({
                message: "ID de publicación no válido"
            });
        }

        const comments = await Comment.find({ post: postId })
            .populate("autor", "nombre apellido correo fotoPerfil role")
            .sort({ createdAt: 1 });

        res.json({
            message: "Comentarios obtenidos correctamente",
            total: comments.length,
            comments
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener comentarios",
            error: error.message
        });
    }
};

// Obtener solo mis comentarios
const getMyComments = async (req, res) => {
    try {
        const comments = await Comment.find({ autor: req.user.id })
            .populate("autor", "nombre apellido correo fotoPerfil role")
            .populate("post", "titulo categoria autor")
            .sort({ createdAt: -1 });

        res.json({
            message: "Mis comentarios obtenidos correctamente",
            total: comments.length,
            comments
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener tus comentarios",
            error: error.message
        });
    }
};

// Actualizar comentario
const updateComment = async (req, res) => {
    try {
        const { id } = req.params;
        const { contenido } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de comentario no válido"
            });
        }

        if (!contenido || contenido.trim() === "") {
            return res.status(400).json({
                message: "El comentario no puede estar vacío"
            });
        }

        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({
                message: "Comentario no encontrado"
            });
        }

        if (comment.autor.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                message: "No tienes permiso para editar este comentario"
            });
        }

        comment.contenido = contenido.trim();

        await comment.save();

        const updatedComment = await Comment.findById(id)
            .populate("autor", "nombre apellido correo fotoPerfil role")
            .populate("post", "titulo categoria autor");

        res.json({
            message: "Comentario actualizado correctamente",
            comment: updatedComment
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar comentario",
            error: error.message
        });
    }
};

// Eliminar comentario
const deleteComment = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de comentario no válido"
            });
        }

        const comment = await Comment.findById(id);

        if (!comment) {
            return res.status(404).json({
                message: "Comentario no encontrado"
            });
        }

        if (comment.autor.toString() !== req.user.id && req.user.role !== "admin") {
            return res.status(403).json({
                message: "No tienes permiso para eliminar este comentario"
            });
        }

        await Comment.findByIdAndDelete(id);

        res.json({
            message: "Comentario eliminado correctamente"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar comentario",
            error: error.message
        });
    }
};

module.exports = {
    createComment,
    getCommentsByPost,
    getMyComments,
    updateComment,
    deleteComment
};