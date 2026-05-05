const express = require("express");
const router = express.Router();

const {
    createReport,
    getReports,
    getMyReports,
    getReportById,
    updateReport,
    deleteReport
} = require("../controllers/reports.controller");

const { protect } = require("../middlewares/auth.middleware");

const adminOnly = (req, res, next) => {
    if (req.user && req.user.role === "admin") {
        return next();
    }

    return res.status(403).json({
        message: "Acceso denegado. Solo administradores."
    });
};

router.post("/", protect, createReport);

router.get("/", protect, adminOnly, getReports);
router.get("/me", protect, getMyReports);
router.get("/:id", protect, getReportById);

router.put("/:id", protect, adminOnly, updateReport);
router.delete("/:id", protect, adminOnly, deleteReport);

module.exports = router;