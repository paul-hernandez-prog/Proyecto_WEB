const express = require("express");
const router = express.Router();
const upload = require("../middlewares/upload.middleware");

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
router.post("/", protect, upload.single("imagen"), createPost);
router.put("/:id", protect, upload.single("imagen"), updatePost);
router.delete("/:id", protect, deletePost);

module.exports = router;