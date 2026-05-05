const express = require("express");
const router = express.Router();

const {
    getCategories,
    createCategory,
    updateCategory,
    deleteCategory
} = require("../controllers/categories.controller");

const { protect, adminOnly } = require("../middlewares/auth.middleware");

router.get("/", protect, getCategories);
router.post("/", protect, adminOnly, createCategory);
router.put("/:id", protect, adminOnly, updateCategory);
router.delete("/:id", protect, adminOnly, deleteCategory);

module.exports = router;