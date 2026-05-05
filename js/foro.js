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

document.addEventListener("submit", async function (e) {
    if (!e.target.classList.contains("comment-form")) {
        return;
    }

    e.preventDefault();

    const form = e.target;
    const postId = form.dataset.postId;
    const input = document.getElementById(`comment-input-${postId}`);

    if (!input) {
        alert("No se encontró el input del comentario");
        return;
    }

    const contenido = input.value.trim();

    if (!contenido) {
        alert("El comentario no puede estar vacío");
        return;
    }

    try {
        const response = await fetch(`/api/comments/post/${postId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ contenido })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Error al comentar");
            return;
        }

        input.value = "";
        await loadComments(postId);

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
    }
});

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

    filteredPosts.forEach(post => {
        loadComments(post._id);
    });
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
</div>

<div class="comments-section">
    <h5>Comentarios</h5>

    <div id="comments-${post._id}" class="comment-list">
        <p class="text-muted">Cargando comentarios...</p>
    </div>

    <form class="comment-form" data-post-id="${post._id}">
    <input 
        id="comment-input-${post._id}"
        type="text"
        class="form-control comment-input"
        placeholder="Escribe un comentario..."
        required
    >

    <button type="submit" class="btn btn-outline-secondary btn-sm mt-2">
        <i class="fa-solid fa-comment"></i> Comentar
    </button>
</form>
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

async function loadComments(postId) {
    const commentsContainer = document.getElementById(`comments-${postId}`);

    if (!commentsContainer) {
        return;
    }

    try {
        const response = await fetch(`/api/comments/post/${postId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            commentsContainer.innerHTML = `<p class="text-danger">Error al cargar comentarios</p>`;
            return;
        }

        if (data.comments.length === 0) {
            commentsContainer.innerHTML = `<p class="text-muted">Todavía no hay comentarios.</p>`;
            return;
        }

        commentsContainer.innerHTML = data.comments.map(comment => createCommentCard(comment, postId)).join("");

    } catch (error) {
        console.error(error);
        commentsContainer.innerHTML = `<p class="text-danger">No se pudo conectar con el servidor.</p>`;
    }
}

function createCommentCard(comment, postId) {
    const authorName = `${comment.autor?.nombre || ""} ${comment.autor?.apellido || ""}`.trim();
    const createdDate = new Date(comment.createdAt).toLocaleString("es-MX");

    return `
        <div class="comment">
            <div class="comment-header">
                <strong>${escapeHTML(authorName || "Usuario eliminado")}</strong>
            </div>

            <p>${escapeHTML(comment.contenido)}</p>
            <small class="text-muted">${createdDate}</small>
        </div>
    `;
}

async function createComment(event, postId) {
    event.preventDefault();

    const input = document.getElementById(`comment-input-${postId}`);
    const contenido = input.value.trim();

    if (!contenido) {
        alert("El comentario no puede estar vacío");
        return;
    }

    try {
        const response = await fetch(`/api/comments/post/${postId}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ contenido })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Error al comentar");
            return;
        }

        input.value = "";
        await loadComments(postId);

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
    }
}

async function editComment(commentId, postId) {
    const nuevoContenido = prompt("Edita tu comentario:");

    if (nuevoContenido === null) {
        return;
    }

    if (nuevoContenido.trim() === "") {
        alert("El comentario no puede estar vacío");
        return;
    }

    try {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                contenido: nuevoContenido.trim()
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Error al editar comentario");
            return;
        }

        await loadComments(postId);

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
    }
}

async function deleteComment(commentId, postId) {
    const confirmar = confirm("¿Seguro que quieres eliminar este comentario?");

    if (!confirmar) {
        return;
    }

    try {
        const response = await fetch(`/api/comments/${commentId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Error al eliminar comentario");
            return;
        }

        await loadComments(postId);

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
    }
}