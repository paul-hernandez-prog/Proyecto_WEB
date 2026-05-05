const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
    {
        tipo: {
            type: String,
            enum: ["post", "comment"],
            required: true
        },

        motivo: {
            type: String,
            enum: ["Spam", "Ofensivo", "Información falsa", "Acoso", "Otro"],
            required: true
        },

        descripcion: {
            type: String,
            trim: true,
            default: ""
        },

        estado: {
            type: String,
            enum: ["pendiente", "revisado", "rechazado"],
            default: "pendiente"
        },

        usuario: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            default: null
        },

        comment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Report", reportSchema);