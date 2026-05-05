const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

const API_POSTS = "/api/posts";
const DEFAULT_PROFILE_PHOTO = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

let selectedCategory = "Todas";
let allPosts = [];

const postsContainer = document.getElementById("postsContainer");
const searchInput = document.getElementById("searchInput");
const logoutBtn = document.getElementById("logoutBtn");

if (!token || !user) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

loadPosts();

if (searchInput) {
    searchInput.addEventListener("input", () => {
        renderPosts();
    });
}

document.querySelectorAll(".category-filter").forEach(item => {
    item.addEventListener("click", () => {
        document.querySelectorAll(".category-filter").forEach(i => i.classList.remove("active"));
        item.classList.add("active");

        selectedCategory = item.dataset.category;
        renderPosts();
    });
});

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
}

async function loadPosts() {
    try {
        const response = await fetch(API_POSTS, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Error al cargar publicaciones");

            if (response.status === 401) {
                localStorage.clear();
                window.location.href = "login.html";
            }

            return;
        }

        allPosts = data.posts;
        renderPosts();

    } catch (error) {
        console.error(error);
        postsContainer.innerHTML = `<p class="empty-message">No se pudo conectar con el servidor.</p>`;
    }
}

function renderPosts() {
    const searchText = searchInput ? searchInput.value.toLowerCase().trim() : "";

    const filteredPosts = allPosts.filter(post => {
        const matchesCategory = selectedCategory === "Todas" || post.categoria === selectedCategory;

        const matchesSearch =
            post.titulo.toLowerCase().includes(searchText) ||
            post.contenido.toLowerCase().includes(searchText) ||
            post.categoria.toLowerCase().includes(searchText) ||
            getAuthorName(post).toLowerCase().includes(searchText);

        return matchesCategory && matchesSearch;
    });

    if (filteredPosts.length === 0) {
        postsContainer.innerHTML = `<p class="empty-message">No hay publicaciones para mostrar.</p>`;
        return;
    }

    postsContainer.innerHTML = filteredPosts.map(post => createPostCard(post)).join("");
}

function createPostCard(post) {
    const authorName = getAuthorName(post);
    const authorPhoto = post.autor?.fotoPerfil || DEFAULT_PROFILE_PHOTO;
    const createdDate = new Date(post.createdAt).toLocaleString("es-MX");

    return `
        <div class="post-card">

            <div class="post-header">
                <h4 class="post-title">${escapeHTML(post.titulo)}</h4>
            </div>

            <div class="post-meta">
                <div>
                    <img src="${escapeHTML(authorPhoto)}" class="profile-image">
                    <span><strong>Autor:</strong> ${escapeHTML(authorName)}</span>
                </div>

                <span class="badge ${getCategoryBadge(post.categoria)}">
                    ${escapeHTML(post.categoria)}
                </span>
            </div>

            <small class="text-muted">Publicado: ${createdDate}</small>

            <div class="post-content">
                <p>${escapeHTML(post.contenido)}</p>

                ${post.imagenUrl ? `
                    <img class="content-image" src="${escapeHTML(post.imagenUrl)}" alt="Imagen de publicación">
                ` : ""}

                ${post.youtubeUrl ? `
                    <div class="mt-2">
                        <a href="${escapeHTML(post.youtubeUrl)}" target="_blank" class="btn btn-outline-danger btn-sm">
                            <i class="fa-brands fa-youtube"></i> Ver video
                        </a>
                    </div>
                ` : ""}
            </div>

            <div class="post-actions">
                <button class="btn btn-outline-primary btn-sm" disabled>
                    <i class="fa-solid fa-thumbs-up"></i> Like
                </button>

                <button class="btn btn-outline-secondary btn-sm" disabled>
                    <i class="fa-solid fa-comment"></i> Comentar
                </button>
            </div>

            <div class="comments-section">
                <h5>Comentarios</h5>
                <p class="text-muted">Los comentarios se agregarán después.</p>
            </div>

        </div>
    `;
}

function getAuthorName(post) {
    if (!post.autor) {
        return "Usuario eliminado";
    }

    return `${post.autor.nombre || ""} ${post.autor.apellido || ""}`.trim();
}

function getCategoryBadge(category) {
    if (category === "Software") return "bg-danger";
    if (category === "Sistemas") return "bg-warning text-dark";
    if (category === "Ciberseguridad") return "bg-primary";
    if (category === "IA") return "bg-success";
    return "bg-secondary";
}

function escapeHTML(text) {
    if (!text) {
        return "";
    }

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}