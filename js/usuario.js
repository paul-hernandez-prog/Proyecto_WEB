const token = localStorage.getItem("token");
const loggedUser = JSON.parse(localStorage.getItem("user"));

const DEFAULT_PROFILE_PHOTO = "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png";

const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

const userProfileContainer = document.getElementById("userProfileContainer");
const userPostsContainer = document.getElementById("userPostsContainer");
const logoutBtn = document.getElementById("logoutBtn");

if (!token || !loggedUser) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

if (!userId) {
    alert("No se encontró el usuario");
    window.location.href = "foro.html";
}

if (loggedUser && userId === loggedUser.id) {
    window.location.href = "perfil.html";
}

if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
        localStorage.clear();
        window.location.href = "login.html";
    });
}

initUserProfile();

async function initUserProfile() {
    await loadUserProfile();
    await loadUserPosts();
}

async function loadUserProfile() {
    try {
        userProfileContainer.innerHTML = createLoader("Cargando perfil...");

        const response = await fetch(`/api/users/${userId}`, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            userProfileContainer.innerHTML = `
                <p class="text-danger">${data.message || "Error al cargar perfil"}</p>
            `;
            return;
        }

        const user = data.user;

        userProfileContainer.innerHTML = `
            <div class="card p-4">
                <div class="d-flex align-items-center gap-3">
                    <img 
                        src="${escapeHTML(user.fotoPerfil || DEFAULT_PROFILE_PHOTO)}"
                        alt="Foto de perfil"
                        class="profile-image"
                        style="width: 90px; height: 90px; object-fit: cover; border-radius: 50%;"
                    >

                    <div>
                        <h3 class="mb-1">
                            ${escapeHTML(`${user.nombre || ""} ${user.apellido || ""}`.trim() || "Usuario sin nombre")}
                        </h3>

                        <p class="text-muted mb-1">${escapeHTML(user.correo || "")}</p>

                        <span class="badge bg-secondary">
                            ${escapeHTML(user.role || "user")}
                        </span>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error(error);
        userProfileContainer.innerHTML = `
            <p class="text-danger">No se pudo conectar con el servidor.</p>
        `;
    }
}

async function loadUserPosts() {
    try {
        userPostsContainer.innerHTML = createLoader("Cargando publicaciones...");

        const response = await fetch("/api/posts", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            userPostsContainer.innerHTML = `
                <p class="text-danger">${data.message || "Error al cargar publicaciones"}</p>
            `;
            return;
        }

        const posts = data.posts.filter(post => {
            return post.autor && post.autor._id === userId;
        });

        renderUserPosts(posts);

    } catch (error) {
        console.error(error);
        userPostsContainer.innerHTML = `
            <p class="text-danger">No se pudo conectar con el servidor.</p>
        `;
    }
}

function renderUserPosts(posts) {
    if (!posts || posts.length === 0) {
        userPostsContainer.innerHTML = `
            <p class="text-muted">Este usuario todavía no tiene publicaciones.</p>
        `;
        return;
    }

    userPostsContainer.innerHTML = posts.map(post => {
        const createdDate = new Date(post.createdAt).toLocaleString("es-MX", {
            dateStyle: "short",
            timeStyle: "short"
        });

        return `
            <div class="post-card">
                <div class="post-header">
                    <h4 class="post-title">${escapeHTML(post.titulo)}</h4>
                </div>

                <div class="post-meta">
                    <span class="badge bg-secondary">${escapeHTML(post.categoria || "")}</span>
                    <small class="text-muted">${createdDate}</small>
                </div>

                <div class="post-content rich-content">
                    ${post.contenido || ""}

                    ${post.imagenUrl ? `
                        <img 
                            class="content-image" 
                            src="${escapeHTML(post.imagenUrl)}" 
                            alt="Imagen de publicación"
                        >
                    ` : ""}

                    ${post.youtubeUrl ? createYouTubeIframe(post.youtubeUrl) : ""}
                </div>
            </div>
        `;
    }).join("");
}

function escapeHTML(text) {
    if (!text) return "";

    return text
        .toString()
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getYouTubeVideoId(url) {
    if (!url) return null;

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

    if (!videoId) return "";

    return `
        <div class="youtube-container">
            <iframe 
                src="https://www.youtube.com/embed/${videoId}"
                title="Video de YouTube"
                allowfullscreen>
            </iframe>
        </div>
    `;
}