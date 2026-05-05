const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
    {
        contenido: {
            type: String,
            required: [true, "El comentario es obligatorio"],
            trim: true,
            maxlength: [1000, "El comentario no puede tener más de 1000 caracteres"]
        },

        autor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },

        post: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post",
            required: true
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Comment", commentSchema);