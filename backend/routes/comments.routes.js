const express = require("express");
const router = express.Router();

const {
    createComment,
    getCommentsByPost,
    getMyComments,
    updateComment,
    deleteComment
} = require("../controllers/comments.controller");

const { protect } = require("../middlewares/auth.middleware");

router.get("/me/my-comments", protect, getMyComments);
router.get("/post/:postId", protect, getCommentsByPost);
router.post("/post/:postId", protect, createComment);
router.put("/:id", protect, updateComment);
router.delete("/:id", protect, deleteComment);

module.exports = router;