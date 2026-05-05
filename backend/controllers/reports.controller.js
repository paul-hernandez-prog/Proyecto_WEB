const mongoose = require("mongoose");
const Report = require("../models/Report");
const Post = require("../models/Post");
const Comment = require("../models/Comment");

// CREATE - Crear reporte
const createReport = async (req, res) => {
    try {
        const { tipo, motivo, descripcion, postId, commentId } = req.body;

        if (!tipo || !["post", "comment"].includes(tipo)) {
            return res.status(400).json({
                message: "Tipo de reporte no válido"
            });
        }

        if (!motivo) {
            return res.status(400).json({
                message: "El motivo del reporte es obligatorio"
            });
        }

        let reportData = {
            tipo,
            motivo,
            descripcion,
            usuario: req.user.id
        };

        if (tipo === "post") {
            if (!mongoose.Types.ObjectId.isValid(postId)) {
                return res.status(400).json({
                    message: "ID de publicación no válido"
                });
            }

            const post = await Post.findById(postId);

            if (!post) {
                return res.status(404).json({
                    message: "Publicación no encontrada"
                });
            }

            const existingReport = await Report.findOne({
                tipo: "post",
                usuario: req.user.id,
                post: postId
            });

            if (existingReport) {
                return res.status(400).json({
                    message: "Ya reportaste esta publicación"
                });
            }

            reportData.post = postId;
        }

        if (tipo === "comment") {
            if (!mongoose.Types.ObjectId.isValid(commentId)) {
                return res.status(400).json({
                    message: "ID de comentario no válido"
                });
            }

            const comment = await Comment.findById(commentId);

            if (!comment) {
                return res.status(404).json({
                    message: "Comentario no encontrado"
                });
            }

            const existingReport = await Report.findOne({
                tipo: "comment",
                usuario: req.user.id,
                comment: commentId
            });

            if (existingReport) {
                return res.status(400).json({
                    message: "Ya reportaste este comentario"
                });
            }

            reportData.comment = commentId;
            reportData.post = comment.post || null;
        }

        const newReport = new Report(reportData);
        await newReport.save();

        res.status(201).json({
            message: "Reporte creado correctamente",
            report: newReport
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al crear reporte",
            error: error.message
        });
    }
};

// READ - Admin obtiene todos los reportes
const getReports = async (req, res) => {
    try {
        const reports = await Report.find()
            .populate("usuario", "nombre apellido correo fotoPerfil role")
            .populate("post", "titulo categoria autor")
            .populate({
                path: "comment",
                select: "contenido autor post",
                populate: {
                    path: "autor",
                    select: "nombre apellido correo fotoPerfil"
                }
            })
            .sort({ createdAt: -1 });

        res.json({
            message: "Reportes obtenidos correctamente",
            total: reports.length,
            reports
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener reportes",
            error: error.message
        });
    }
};

// READ - Usuario obtiene sus propios reportes
const getMyReports = async (req, res) => {
    try {
        const reports = await Report.find({ usuario: req.user.id })
            .populate("post", "titulo categoria")
            .populate("comment", "contenido")
            .sort({ createdAt: -1 });

        res.json({
            message: "Mis reportes obtenidos correctamente",
            total: reports.length,
            reports
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener tus reportes",
            error: error.message
        });
    }
};

// READ - Obtener reporte por ID
const getReportById = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de reporte no válido"
            });
        }

        const report = await Report.findById(id)
            .populate("usuario", "nombre apellido correo fotoPerfil role")
            .populate("post", "titulo categoria autor")
            .populate("comment", "contenido autor post");

        if (!report) {
            return res.status(404).json({
                message: "Reporte no encontrado"
            });
        }

        const isOwner = report.usuario._id.toString() === req.user.id;
        const isAdmin = req.user.role === "admin";

        if (!isOwner && !isAdmin) {
            return res.status(403).json({
                message: "No tienes permiso para ver este reporte"
            });
        }

        res.json({
            message: "Reporte obtenido correctamente",
            report
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener reporte",
            error: error.message
        });
    }
};

// UPDATE - Admin actualiza estado
const updateReport = async (req, res) => {
    try {
        const { id } = req.params;
        const { estado } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de reporte no válido"
            });
        }

        if (!["pendiente", "revisado", "rechazado"].includes(estado)) {
            return res.status(400).json({
                message: "Estado no válido"
            });
        }

        const report = await Report.findById(id);

        if (!report) {
            return res.status(404).json({
                message: "Reporte no encontrado"
            });
        }

        report.estado = estado;
        await report.save();

        res.json({
            message: "Reporte actualizado correctamente",
            report
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al actualizar reporte",
            error: error.message
        });
    }
};

// DELETE - Admin elimina reporte
const deleteReport = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de reporte no válido"
            });
        }

        const report = await Report.findById(id);

        if (!report) {
            return res.status(404).json({
                message: "Reporte no encontrado"
            });
        }

        await Report.findByIdAndDelete(id);

        res.json({
            message: "Reporte eliminado correctamente"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar reporte",
            error: error.message
        });
    }
};

module.exports = {
    createReport,
    getReports,
    getMyReports,
    getReportById,
    updateReport,
    deleteReport
};