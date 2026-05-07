const token = localStorage.getItem("token");
let user = JSON.parse(localStorage.getItem("user"));

const API_POSTS = window.POSTS_API || "/api/posts";
const DEFAULT_PROFILE_PHOTO = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

let selectedCategory = "Todas";
let allPosts = [];

let allCategories = [];

const COMMENTS_STEP = 2;

let commentsByPost = {};
let visibleCommentsByPost = {};

const categorySidebar = document.getElementById("categorySidebar");
const categorySelect = document.getElementById("categoria");

const postsContainer = document.getElementById("postsContainer");
const searchInput = document.getElementById("searchInput");
const logoutBtn = document.getElementById("logoutBtn");

if (!token || !user) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

async function initPage() {
    await loadProfile();
    await loadCategories();
    await loadPosts();
}

initPage();

async function loadProfile() {
    try {
        const response = await fetch("/api/users/profile", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.log("No se pudo cargar el perfil actualizado");
            return;
        }

        user = data.user;
        localStorage.setItem("user", JSON.stringify(user));

    } catch (error) {
        console.error("Error al cargar perfil:", error);
    }
}

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

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
}

async function loadCategories() {
    try {
        const response = await fetch("/api/categories", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(data.message || "Error al cargar categorías");
            return;
        }

        allCategories = data.categories || [];
        renderCategorySidebar();

    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }
}

function renderCategorySidebar() {
    if (categorySidebar) {
        categorySidebar.innerHTML = `
            <li class="category-filter active" data-category="Todas">Todas</li>
        `;

        allCategories.forEach(category => {
            categorySidebar.innerHTML += `
                <li class="category-filter" data-category="${escapeHTML(category.nombre)}">
                    ${escapeHTML(category.nombre)}
                </li>
            `;
        });

        document.querySelectorAll(".category-filter").forEach(item => {
            item.addEventListener("click", () => {
                document.querySelectorAll(".category-filter").forEach(i => i.classList.remove("active"));
                item.classList.add("active");

                selectedCategory = item.dataset.category;
                renderPosts();
            });
        });
    }

    if (categorySelect) {
        categorySelect.innerHTML = `
            <option value="">Selecciona una categoría</option>
        `;

        allCategories.forEach(category => {
            categorySelect.innerHTML += `
                <option value="${escapeHTML(category.nombre)}">
                    ${escapeHTML(category.nombre)}
                </option>
            `;
        });
    }
}

async function loadPosts() {
    try {
        postsContainer.innerHTML = createLoader("Cargando publicaciones...");

        const response = await fetch(API_POSTS, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            postsContainer.innerHTML = `
                <p class="empty-message">
                    ${data.message || "Error al cargar publicaciones"}
                </p>
            `;

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

function isFollowingUser(authorId) {
    if (!user.following) {
        return false;
    }

    return user.following.some(id => id.toString() === authorId.toString());
}

function isPostLiked(post) {
    if (!post.likes) {
        return false;
    }

    return post.likes.some(id => id.toString() === user.id.toString());
}

function createPostCard(post) {
    const authorName = getAuthorName(post);
    const authorPhoto = post.autor?.fotoPerfil || DEFAULT_PROFILE_PHOTO;
    const createdDate = new Date(post.createdAt).toLocaleString("es-MX");

    const authorId = post.autor?._id;
    const isFollowing = authorId ? isFollowingUser(authorId) : false;

    const isLiked = isPostLiked(post);
    const likesCount = post.likes ? post.likes.length : 0;


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

            <div class="post-content rich-content">
                ${post.contenido || ""}

                ${post.imagenUrl ? `
                    <img class="content-image" src="${escapeHTML(post.imagenUrl)}" alt="Imagen de publicación">
                ` : ""}

                ${post.youtubeUrl ? createYouTubeIframe(post.youtubeUrl) : ""}
            </div>

            <div class="post-actions">
        <button 
            class="btn ${isLiked ? "btn-primary" : "btn-outline-primary"} btn-sm"
            onclick="toggleLikePost('${post._id}')"
        >
            <i class="fa-solid fa-thumbs-up"></i>
            ${isLiked ? "Liked" : "Like"} ${likesCount}
        </button>

        <button 
            type="button"
            class="btn btn-outline-warning btn-sm"
            onclick="openReportModal('post', '${post._id}')"
        >
            <i class="fa-solid fa-flag"></i> Reportar
        </button>

    ${authorId && authorId !== user.id ? `
        <button 
            class="btn ${isFollowing ? "btn-success" : "btn-outline-success"} btn-sm"
            onclick="toggleFollowUser('${authorId}')"
        >
            <i class="fa-solid ${isFollowing ? "fa-user-check" : "fa-user-plus"}"></i>
            ${isFollowing ? "Siguiendo" : "Seguir"}
        </button>
    ` : ""}

</div>

<div class="comments-section">
    <h5>Comentarios</h5>

    <div id="comments-${post._id}" class="comments-list">
        <p class="text-muted">Cargando comentarios...</p>
    </div>

    <div id="commentsMore-${post._id}" class="comments-more-box"></div>

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

function getCategoryBadge(categoryName) {
    if (!allCategories) {
        return "bg-secondary";
    }

    const category = allCategories.find(c => c.nombre === categoryName);

    if (!category) {
        return "bg-secondary";
    }

    if (category.color === "warning" || category.color === "info") {
        return `bg-${category.color} text-dark`;
    }

    return `bg-${category.color}`;
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
    const commentsMoreContainer = document.getElementById(`commentsMore-${postId}`);

    if (!commentsContainer) {
        return;
    }

    try {
        commentsContainer.innerHTML = `<p class="text-muted">Cargando comentarios...</p>`;

        if (commentsMoreContainer) {
            commentsMoreContainer.innerHTML = "";
        }

        const response = await fetch(`/api/comments/post/${postId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            commentsContainer.innerHTML = `
                <p class="text-danger">
                    ${data.message || "Error al cargar comentarios"}
                </p>
            `;
            return;
        }

        commentsByPost[postId] = data.comments || [];
        visibleCommentsByPost[postId] = COMMENTS_STEP;

        renderComments(postId);

    } catch (error) {
        console.error(error);
        commentsContainer.innerHTML = `
            <p class="text-danger">
                No se pudieron cargar los comentarios.
            </p>
        `;
    }
}

function renderComments(postId) {
    const commentsContainer = document.getElementById(`comments-${postId}`);
    const commentsMoreContainer = document.getElementById(`commentsMore-${postId}`);

    if (!commentsContainer) {
        return;
    }

    const comments = commentsByPost[postId] || [];
    const visibleCount = visibleCommentsByPost[postId] || COMMENTS_STEP;

    if (comments.length === 0) {
        commentsContainer.innerHTML = `
            <p class="text-muted">No hay comentarios todavía.</p>
        `;

        if (commentsMoreContainer) {
            commentsMoreContainer.innerHTML = "";
        }

        return;
    }

    const visibleComments = comments.slice(0, visibleCount);

    commentsContainer.innerHTML = visibleComments
        .map(comment => createCommentCard(comment, postId))
        .join("");

    const remainingComments = comments.length - visibleCount;

    if (!commentsMoreContainer) {
        return;
    }

    if (remainingComments > 0) {
        commentsMoreContainer.innerHTML = `
            <button 
                type="button"
                class="btn btn-outline-primary btn-sm mt-2"
                onclick="showMoreComments('${postId}')"
            >
                Mostrar más
            </button>
        `;
    } else {
        commentsMoreContainer.innerHTML = "";
    }
}

function showMoreComments(postId) {
    const comments = commentsByPost[postId] || [];

    visibleCommentsByPost[postId] = Math.min(
        (visibleCommentsByPost[postId] || COMMENTS_STEP) + COMMENTS_STEP,
        comments.length
    );

    renderComments(postId);
}

window.showMoreComments = showMoreComments;

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

async function toggleFollowUser(userId) {
    try {
        const alreadyFollowing = isFollowingUser(userId);

        const url = alreadyFollowing
            ? `/api/users/${userId}/unfollow`
            : `/api/users/${userId}/follow`;

        const response = await fetch(url, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Error al actualizar seguimiento");
            return;
        }

        if (!user.following) {
            user.following = [];
        }

        if (alreadyFollowing) {
            user.following = user.following.filter(id => id.toString() !== userId.toString());
        } else {
            user.following.push(userId);
        }

        localStorage.setItem("user", JSON.stringify(user));

        if (API_POSTS.includes("/following/feed")) {
            await loadPosts();
        } else {
            renderPosts();
        }

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
    }
}

async function toggleLikePost(postId) {
    try {
        const response = await fetch(`/api/posts/${postId}/like`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Error al actualizar like");
            return;
        }

        allPosts = allPosts.map(post => {
            if (post._id === postId) {
                return data.post;
            }

            return post;
        });

        renderPosts();

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
    }
}

function getYouTubeVideoId(url) {
    if (!url) {
        return null;
    }

    try {
        const parsedUrl = new URL(url);

        if (parsedUrl.hostname.includes("youtu.be")) {
            return parsedUrl.pathname.slice(1);
        }

        if (parsedUrl.hostname.includes("youtube.com")) {
            if (parsedUrl.pathname === "/watch") {
                return parsedUrl.searchParams.get("v");
            }

            if (parsedUrl.pathname.startsWith("/shorts/")) {
                return parsedUrl.pathname.split("/shorts/")[1];
            }

            if (parsedUrl.pathname.startsWith("/embed/")) {
                return parsedUrl.pathname.split("/embed/")[1];
            }
        }

        return null;

    } catch (error) {
        return null;
    }
}

function createYouTubeIframe(url) {
    const videoId = getYouTubeVideoId(url);

    if (!videoId) {
        return "";
    }

    return `
        <div class="youtube-container">
            <iframe 
                src="https://www.youtube.com/embed/${videoId}"
                title="Video de YouTube"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowfullscreen>
            </iframe>
        </div>
    `;
}

const reportForm = document.getElementById("reportForm");

function openReportModal(tipo, targetId) {
    const reportTipo = document.getElementById("reportTipo");
    const reportPostId = document.getElementById("reportPostId");
    const reportCommentId = document.getElementById("reportCommentId");
    const reportMotivo = document.getElementById("reportMotivo");
    const reportDescripcion = document.getElementById("reportDescripcion");

    if (!reportTipo || !reportPostId || !reportCommentId) {
        alert("No se encontró el formulario de reporte");
        return;
    }

    reportTipo.value = tipo;
    reportMotivo.value = "";
    reportDescripcion.value = "";

    if (tipo === "post") {
        reportPostId.value = targetId;
        reportCommentId.value = "";
    }

    if (tipo === "comment") {
        reportPostId.value = "";
        reportCommentId.value = targetId;
    }

    const modal = new bootstrap.Modal(document.getElementById("reportModal"));
    modal.show();
}

if (reportForm && reportForm.dataset.listenerAdded !== "true") {
    reportForm.dataset.listenerAdded = "true";

    reportForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const tipo = document.getElementById("reportTipo").value;
        const postId = document.getElementById("reportPostId").value;
        const commentId = document.getElementById("reportCommentId").value;
        const motivo = document.getElementById("reportMotivo").value;
        const descripcion = document.getElementById("reportDescripcion").value.trim();

        const reportData = {
            tipo,
            motivo,
            descripcion
        };

        if (tipo === "post") {
            reportData.postId = postId;
        }

        if (tipo === "comment") {
            reportData.commentId = commentId;
        }

        try {
            const response = await fetch("/api/reports", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(reportData)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al crear reporte");
                return;
            }

            alert("Reporte enviado correctamente");

            const modal = bootstrap.Modal.getInstance(document.getElementById("reportModal"));
            if (modal) modal.hide();

            reportForm.reset();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        }
    });
}

window.openReportModal = openReportModal;