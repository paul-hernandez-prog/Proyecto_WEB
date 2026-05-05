const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
    {
        titulo: {
            type: String,
            required: [true, "El título es obligatorio"],
            trim: true,
            maxlength: [100, "El título no puede tener más de 100 caracteres"]
        },

        contenido: {
            type: String,
            required: [true, "El contenido es obligatorio"],
            trim: true,
            maxlength: [2000, "El contenido no puede tener más de 2000 caracteres"]
        },

        categoria: {
            type: String,
            required: [true, "La categoría es obligatoria"],
            trim: true
        },
        imagenUrl: {
            type: String,
            default: "",
            trim: true
        },

        youtubeUrl: {
            type: String,
            default: "",
            trim: true
        },
        youtubeUrl: {
            type: String,
            trim: true,
            default: ""
        },
        autor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        likes: {
            type: [
                {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "User"
                }
            ],
            default: []
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Post", postSchema);