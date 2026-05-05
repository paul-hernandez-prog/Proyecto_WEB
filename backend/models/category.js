const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, "El nombre de la categoría es obligatorio"],
            unique: true,
            trim: true
        },

        color: {
            type: String,
            enum: ["primary", "secondary", "success", "danger", "warning", "info", "dark"],
            default: "secondary"
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("Category", categorySchema);