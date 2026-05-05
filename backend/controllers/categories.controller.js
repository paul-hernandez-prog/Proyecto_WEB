const mongoose = require("mongoose");
const Category = require("../models/Category");
const Post = require("../models/Post");

// READ
const getCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ nombre: 1 });

        res.json({
            message: "Categorías obtenidas correctamente",
            total: categories.length,
            categories
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al obtener categorías",
            error: error.message
        });
    }
};

// CREATE
const createCategory = async (req, res) => {
    try {
        const { nombre, color } = req.body;

        if (!nombre) {
            return res.status(400).json({
                message: "El nombre de la categoría es obligatorio"
            });
        }

        const newCategory = new Category({
            nombre,
            color
        });

        await newCategory.save();

        res.status(201).json({
            message: "Categoría creada correctamente",
            category: newCategory
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Ya existe una categoría con ese nombre"
            });
        }

        res.status(500).json({
            message: "Error al crear categoría",
            error: error.message
        });
    }
};

// UPDATE
const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, color } = req.body;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de categoría no válido"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                message: "Categoría no encontrada"
            });
        }

        const oldName = category.nombre;

        if (nombre !== undefined) category.nombre = nombre;
        if (color !== undefined) category.color = color;

        await category.save();

        if (oldName !== category.nombre) {
            await Post.updateMany(
                { categoria: oldName },
                { categoria: category.nombre }
            );
        }

        res.json({
            message: "Categoría actualizada correctamente",
            category
        });

    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({
                message: "Ya existe una categoría con ese nombre"
            });
        }

        res.status(500).json({
            message: "Error al actualizar categoría",
            error: error.message
        });
    }
};

// DELETE
const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                message: "ID de categoría no válido"
            });
        }

        const category = await Category.findById(id);

        if (!category) {
            return res.status(404).json({
                message: "Categoría no encontrada"
            });
        }

        const postsUsingCategory = await Post.countDocuments({
            categoria: category.nombre
        });

        if (postsUsingCategory > 0) {
            return res.status(400).json({
                message: `No puedes eliminar esta categoría porque tiene ${postsUsingCategory} publicación(es).`
            });
        }

        await Category.findByIdAndDelete(id);

        res.json({
            message: "Categoría eliminada correctamente"
        });

    } catch (error) {
        res.status(500).json({
            message: "Error al eliminar categoría",
            error: error.message
        });
    }
};

module.exports = {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
};