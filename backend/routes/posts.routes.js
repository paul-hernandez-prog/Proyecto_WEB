const express = require("express");
const router = express.Router();

const {
    createPost,
    getPosts,
    getMyPosts,
    getPostById,
    getFollowingPosts,
    updatePost,
    deletePost,
    toggleLikePost
} = require("../controllers/posts.controller");

const { protect } = require("../middlewares/auth.middleware");

router.get("/", protect, getPosts);
router.get("/me/my-posts", protect, getMyPosts);
router.put("/:id/like", protect, toggleLikePost);
router.get("/following/feed", protect, getFollowingPosts);
router.get("/:id", protect, getPostById);
router.post("/", protect, createPost);
router.put("/:id", protect, updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;