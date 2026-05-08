const express = require("express");
const router = express.Router();

const {
    createUser,
    loginUser,
    getUsers,
    getUserById,
    updateUser,
    deleteUser,
    getProfile,
    followUser,
    unfollowUser,
    getFollowingUsers
} = require("../controllers/users.controller");

const {
    protect,
    adminOnly
} = require("../middlewares/auth.middleware");

// Registro y login públicos
router.post("/register", createUser);
router.post("/login", loginUser);

// Ruta para validar token
router.get("/profile", protect, getProfile);
router.get("/me/following", protect, getFollowingUsers);
// CRUD protegido
router.get("/", protect, adminOnly, getUsers);

router.get("/:id", protect, getUserById);
router.post("/", protect, adminOnly, createUser);
router.put("/:id", protect, updateUser);
router.delete("/:id", protect, deleteUser);

router.put("/:id/follow", protect, followUser);
router.put("/:id/unfollow", protect, unfollowUser);

module.exports = router;