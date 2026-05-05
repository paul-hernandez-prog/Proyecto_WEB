const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
    {
        nombre: {
            type: String,
            required: [true, "El nombre es obligatorio"],
            trim: true
        },

        apellido: {
            type: String,
            required: [true, "El apellido es obligatorio"],
            trim: true
        },

        correo: {
            type: String,
            required: [true, "El correo es obligatorio"],
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: [true, "La contraseña es obligatoria"],
            minlength: [6, "La contraseña debe tener mínimo 6 caracteres"],
            select: false
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },
        fotoPerfil: {
            type: String,
            default: "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"
        },
        following: {
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

// Antes de guardar, encripta la contraseña si fue modificada
userSchema.pre("save", async function () {
    if (!this.isModified("password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt); // Hace la encriptacion de la contraseña.
});

// Método para comparar contraseña en login
userSchema.methods.comparePassword = async function (passwordIngresada) {
    return await bcrypt.compare(passwordIngresada, this.password);
};

module.exports = mongoose.model("User", userSchema);