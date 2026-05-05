const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const connectDB = require("./backend/config/db");
const usersRoutes = require("./backend/routes/users.routes");
const postsRoutes = require("./backend/routes/posts.routes");
const commentsRoutes = require("./backend/routes/comments.routes");
const categoriesRoutes = require("./backend/routes/categories.routes");
const reportsRoutes = require("./backend/routes/reports.routes");

const app = express();

// Conexión a MongoDB
connectDB();

// Middlewares
app.use(cors());
app.use(express.json());

// Rutas del backend
app.use("/api/users", usersRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/reports", reportsRoutes);

// Archivos estáticos del frontend
app.use("/css", express.static(path.join(__dirname, "css")));
app.use("/js", express.static(path.join(__dirname, "js")));

// Servir script.js actual
app.get("/script.js", (req, res) => {
    res.sendFile(path.join(__dirname, "script.js"));
});

// Páginas HTML
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/login.html", (req, res) => {
    res.sendFile(path.join(__dirname, "login.html"));
});

app.get("/foro.html", (req, res) => {
    res.sendFile(path.join(__dirname, "foro.html"));
});

app.get("/perfil.html", (req, res) => {
    res.sendFile(path.join(__dirname, "perfil.html"));
});

app.get("/amigos.html", (req, res) => {
    res.sendFile(path.join(__dirname, "amigos.html"));
});

app.get("/admin.html", (req, res) => {
    res.sendFile(path.join(__dirname, "admin.html"));
});

app.get("/about.html", (req, res) => {
    res.sendFile(path.join(__dirname, "about.html"));
});

// Ruta para comprobar que el backend está vivo
app.get("/api", (req, res) => {
    res.json({
        message: "API funcionando correctamente"
    });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
    res.status(404).json({
        message: "Ruta no encontrada"
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});