const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadsPath = path.join(__dirname, "../../uploads");

if (!fs.existsSync(uploadsPath)) {
    fs.mkdirSync(uploadsPath);
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsPath);
    },
    filename: function (req, file, cb) {
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);

        cb(null, uniqueName + extension);
    }
});

const fileFilter = function (req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
        cb(null, true);
    } else {
        cb(new Error("Solo se permiten imágenes o GIFs"), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024
    }
});

module.exports = upload;