const postToken = localStorage.getItem("token");
const postUser = JSON.parse(localStorage.getItem("user"));

const followingContainer = document.getElementById("followingContainer");
const myPostsContainer = document.getElementById("myPostsContainer");
const myCommentsContainer = document.getElementById("myCommentsContainer");
const createPostForm = document.getElementById("createPostForm");
const editPostForm = document.getElementById("editPostForm");
const confirmDelete = document.getElementById("confirmDelete");
const editCommentForm = document.getElementById("editCommentForm");
const confirmDeleteComment = document.getElementById("confirmDeleteComment");


let myPosts = [];
let postIdToDelete = null;
let commentIdToDelete = null;
let allCategories = [];

if (!postToken || !postUser) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

initPerfil();

async function initPerfil() {
    await loadCategories();
    await loadMyPosts();
    await loadMyComments();
    await loadFollowingUsers();
}

if (createPostForm) {
    createPostForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        let contenido = "";

        if (typeof quill !== "undefined" && quill) {
            contenido = quill.root.innerHTML.trim();
            contenidoTexto = quill.getText().trim();
        }

        const postData = {
            titulo: document.getElementById("postTitulo").value.trim(),
            categoria: document.getElementById("postCategoria").value,
            contenido,
            youtubeUrl: document.getElementById("postYoutube").value.trim(),
            imagenUrl: document.getElementById("postImagenUrl").value.trim()
        };

        if (!postData.titulo || !postData.categoria || !contenidoTexto) {
            alert("Título, categoría y descripción son obligatorios");
            return;
        }

        const button = getSubmitButton(createPostForm);
        const stopLoading = startButtonLoading(button, "Publicando...");

        if (!stopLoading) {
            return;
        }

        try {
            const response = await fetch("/api/posts", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${postToken}`
                },
                body: JSON.stringify(postData)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al crear publicación");
                return;
            }

            alert("Publicación creada correctamente");

            createPostForm.reset();

            if (typeof quill !== "undefined" && quill) {
                quill.setText("");
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById("postModal"));
            if (modal) modal.hide();

            await loadMyPosts();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            stopLoading();
        }
    });
}

if (editPostForm) {
    editPostForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const id = document.getElementById("editPostId").value;

        let contenido = "";

        if (typeof quillEdit !== "undefined" && quillEdit) {
            contenido = quillEdit.root.innerHTML.trim();
            contenidoTexto = quillEdit.getText().trim();
        }

        const postData = {
    titulo: document.getElementById("editPostTitulo").value.trim(),
    categoria: document.getElementById("editPostCategoria").value,
    contenido,
    youtubeUrl: document.getElementById("editPostYoutube").value.trim(),
    imagenUrl: document.getElementById("editPostImagenUrl").value.trim()
};

        if (!postData.titulo || !postData.categoria || !contenidoTexto) {
            alert("Título, categoría y descripción son obligatorios");
            return;
        }

        const button = getSubmitButton(editPostForm);
        const stopLoading = startButtonLoading(button, "Guardando...");

        if (!stopLoading) {
            return;
        }

        try {
            const response = await fetch(`/api/posts/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${postToken}`
                },
                body: JSON.stringify(postData)
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al editar publicación");
                return;
            }

            alert("Publicación actualizada correctamente");

            const modal = bootstrap.Modal.getInstance(document.getElementById("editPost"));
            if (modal) modal.hide();

            await loadMyPosts();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            stopLoading();
        }
    });
}

if (confirmDelete) {
    confirmDelete.addEventListener("click", async function () {
        if (!postIdToDelete) {
            return;
        }

        const stopLoading = startButtonLoading(confirmDelete, "Eliminando...");

        if (!stopLoading) {
            return;
        }

        try {
            const response = await fetch(`/api/posts/${postIdToDelete}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${postToken}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al eliminar publicación");
                return;
            }

            alert("Publicación eliminada correctamente");

            const modal = bootstrap.Modal.getInstance(document.getElementById("deletePostModal"));
            if (modal) modal.hide();

            postIdToDelete = null;

            await loadMyPosts();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            stopLoading();
        }
    });
}

async function loadMyPosts() {
    try {
        myPostsContainer.innerHTML = createLoader("Cargando tus publicaciones...");

        const response = await fetch("/api/posts/me/my-posts", {
            headers: {
                "Authorization": `Bearer ${postToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            myPostsContainer.innerHTML = `<p class="text-danger">${data.message || "Error al cargar tus publicaciones"}</p>`;
            return;
        }

        myPosts = data.posts;
        renderMyPosts();

    } catch (error) {
        console.error(error);
        myPostsContainer.innerHTML = `<p class="text-danger">No se pudo conectar con el servidor.</p>`;
    }
}

function renderMyPosts() {
    if (!myPosts || myPosts.length === 0) {
        myPostsContainer.innerHTML = `<p class="text-muted">Todavía no has creado publicaciones.</p>`;
        return;
    }

    myPostsContainer.innerHTML = myPosts.map(post => {
        return `
            <div class="post-card">

                <div class="post-header">
                    <h4 class="post-title">${escapeHTML(post.titulo)}</h4>

                    <div class="post-actions">
                        <i class="fa-solid fa-pen edit-icon text-primary"
                            style="cursor:pointer"
                            onclick="openEditPost('${post._id}')">
                        </i>

                        <i class="fa-solid fa-trash delete-icon text-danger"
                            style="cursor:pointer"
                            onclick="openDeletePost('${post._id}')">
                        </i>
                    </div>
                </div>

                <div class="post-meta">
                    <span><strong>Autor:</strong> ${escapeHTML(getAuthorName(post))}</span>
                    <span class="badge ${getCategoryBadge(post.categoria)}">${escapeHTML(post.categoria)}</span>
                </div>

                <div class="post-content rich-content">
                    ${post.contenido || ""}
                </div>

                ${post.imagenUrl ? `
    <img 
        class="content-image" 
        src="${escapeHTML(post.imagenUrl)}" 
        alt="Imagen de publicación"
    >
` : ""}

            ${post.youtubeUrl ? createYouTubeIframe(post.youtubeUrl) : ""}

            </div>
        `;
    }).join("");
}

function openEditPost(id) {
    const post = myPosts.find(p => p._id === id);

    if (!post) {
        alert("Publicación no encontrada");
        return;
    }

    document.getElementById("editPostId").value = post._id;
    document.getElementById("editPostTitulo").value = post.titulo;
    document.getElementById("editPostCategoria").value = post.categoria;
    document.getElementById("editPostYoutube").value = post.youtubeUrl || "";
    document.getElementById("editPostImagenUrl").value = post.imagenUrl || "";

    const modalElement = document.getElementById("editPost");

    modalElement.addEventListener("shown.bs.modal", function setEditorContent() {
        if (typeof quillEdit !== "undefined" && quillEdit) {
            quillEdit.root.innerHTML = post.contenido || "";
        }

        modalElement.removeEventListener("shown.bs.modal", setEditorContent);
    });

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function openDeletePost(id) {
    postIdToDelete = id;

    const modal = new bootstrap.Modal(document.getElementById("deletePostModal"));
    modal.show();
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

async function loadMyComments() {
    if (!myCommentsContainer) {
        return;
    }

    try {
        myCommentsContainer.innerHTML = createLoader("Cargando tus comentarios...");

        const response = await fetch("/api/comments/me/my-comments", {
            headers: {
                "Authorization": `Bearer ${postToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            myCommentsContainer.innerHTML = `<p class="text-danger">${data.message || "Error al cargar tus comentarios"}</p>`;
            return;
        }

        renderMyComments(data.comments);

    } catch (error) {
        console.error(error);
        myCommentsContainer.innerHTML = `<p class="text-danger">No se pudo conectar con el servidor.</p>`;
    }
}

function renderMyComments(comments) {
    if (!comments || comments.length === 0) {
        myCommentsContainer.innerHTML = `<p class="text-muted">Todavía no has comentado publicaciones.</p>`;
        return;
    }

    myCommentsContainer.innerHTML = comments.map(comment => {
        const postTitle = comment.post ? comment.post.titulo : "Publicación eliminada";
        const category = comment.post ? comment.post.categoria : "";
        const createdDate = new Date(comment.createdAt).toLocaleString("es-MX", {
            dateStyle: "short",
            timeStyle: "short"
        });

        return `
            <div class="comment">
                <div class="comment-header">
                    <strong>En: ${escapeHTML(postTitle)}</strong>

                    <div class="comment-actions">
                        <button 
                            class="btn btn-outline-secondary btn-sm"
                            onclick="openEditCommentModal('${comment._id}', '${escapeForAttribute(comment.contenido)}')">
                            <i class="fa-solid fa-pen"></i>
                        </button>

                        <button 
                            class="btn btn-outline-danger btn-sm"
                            onclick="openDeleteCommentModal('${comment._id}')">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>

                ${category ? `<span class="badge ${getCategoryBadge(category)}">${escapeHTML(category)}</span>` : ""}

                <p class="mt-2">${escapeHTML(comment.contenido)}</p>
                <small class="text-muted">${createdDate}</small>
            </div>
        `;
    }).join("");
}

if (editCommentForm) {
    editCommentForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const commentId = document.getElementById("editCommentId").value;
        const contenido = document.getElementById("editCommentContenido").value.trim();

        if (!contenido) {
            alert("El comentario no puede estar vacío");
            return;
        }

        const button = getSubmitButton(editCommentForm);
        const stopLoading = startButtonLoading(button, "Guardando...");

        if (!stopLoading) {
            return;
        }

        try {
            const response = await fetch(`/api/comments/${commentId}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${postToken}`
                },
                body: JSON.stringify({ contenido })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al editar comentario");
                return;
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById("editCommentModal"));
            if (modal) modal.hide();

            await loadMyComments();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            stopLoading();
        }
    });
}

if (confirmDeleteComment) {
    confirmDeleteComment.addEventListener("click", async function () {
        if (!commentIdToDelete) {
            return;
        }
        
        const stopLoading = startButtonLoading(confirmDeleteComment, "Eliminando...");

        if (!stopLoading) {
            return;
        }

        try {
            const response = await fetch(`/api/comments/${commentIdToDelete}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${postToken}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al eliminar comentario");
                return;
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById("deleteCommentModal"));
            if (modal) modal.hide();

            commentIdToDelete = null;

            await loadMyComments();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            stopLoading();
        }   
    });
}

function openEditCommentModal(commentId, contenido) {
    document.getElementById("editCommentId").value = commentId;
    document.getElementById("editCommentContenido").value = contenido;

    const modal = new bootstrap.Modal(document.getElementById("editCommentModal"));
    modal.show();
}

function openDeleteCommentModal(commentId) {
    commentIdToDelete = commentId;

    const modal = new bootstrap.Modal(document.getElementById("deleteCommentModal"));
    modal.show();
}

function escapeForAttribute(text) {
    if (!text) return "";

    return text
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function loadCategories() {
    try {
        const response = await fetch("/api/categories", {
            headers: {
                "Authorization": `Bearer ${postToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            console.log(data.message || "Error al cargar categorías");
            return;
        }

        allCategories = data.categories || [];

        renderCategoryOptions();

    } catch (error) {
        console.error("Error al cargar categorías:", error);
    }
}

function renderCategoryOptions() {
    const postCategoriaSelect = document.getElementById("postCategoria");
    const editPostCategoriaSelect = document.getElementById("editPostCategoria");

    const options = `
        <option value="">Selecciona una categoría</option>
        ${allCategories.map(category => `
            <option value="${escapeHTML(category.nombre)}">
                ${escapeHTML(category.nombre)}
            </option>
        `).join("")}
    `;

    if (postCategoriaSelect) {
        postCategoriaSelect.innerHTML = options;
    }

    if (editPostCategoriaSelect) {
        editPostCategoriaSelect.innerHTML = options;
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

async function loadFollowingUsers() {
    if (!followingContainer) {
        return;
    }

    try {
        followingContainer.innerHTML = createLoader("Cargando personas que sigues...");

        const response = await fetch("/api/users/me/following", {
            headers: {
                "Authorization": `Bearer ${postToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            followingContainer.innerHTML = `
                <p class="text-danger">${data.message || "Error al cargar personas que sigues"}</p>
            `;
            return;
        }

        renderFollowingUsers(data.following);

    } catch (error) {
        console.error(error);
        followingContainer.innerHTML = `
            <p class="text-danger">No se pudo conectar con el servidor.</p>
        `;
    }
}

function renderFollowingUsers(following) {
    if (!following || following.length === 0) {
        followingContainer.innerHTML = `
            <p class="text-muted">Todavía no sigues a nadie.</p>
        `;
        return;
    }

    followingContainer.innerHTML = following.map(person => {
        const fullName = `${person.nombre || ""} ${person.apellido || ""}`.trim();

        return `
            <div class="following-card">

            <a href="usuario.html?id=${person._id}" class="text-decoration-none">
                <img 
                    class="following-img"
                    src="${escapeHTML(person.fotoPerfil || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png")}"
                    alt="Foto de perfil"
                >
            </a>

            <div class="following-info">
                <a href="usuario.html?id=${person._id}" class="text-decoration-none text-dark">
                    <strong>${escapeHTML(fullName || "Usuario sin nombre")}</strong>
                </a>

                <small>${escapeHTML(person.correo || "")}</small>
                <span class="badge bg-secondary">${escapeHTML(person.role || "user")}</span>
            </div>

                <button 
                    class="btn btn-outline-danger btn-sm"
                    onclick="unfollowFromProfile('${person._id}', this)"
                >
                    Dejar de seguir
                </button>

            </div>
        `;
    }).join("");
}

async function unfollowFromProfile(userId, button) {
    const confirmUnfollow = confirm("¿Seguro que quieres dejar de seguir a esta persona?");

    if (!confirmUnfollow) {
        return;
    }

    const stopLoading = startButtonLoading(button, "Quitando...");

    if (!stopLoading) {
        return;
    }

    try {
        const response = await fetch(`/api/users/${userId}/unfollow`, {
            method: "PUT",
            headers: {
                "Authorization": `Bearer ${postToken}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Error al dejar de seguir usuario");
            return;
        }

        const savedUser = JSON.parse(localStorage.getItem("user"));

        if (savedUser && savedUser.following) {
            savedUser.following = savedUser.following.filter(id => id !== userId);
            localStorage.setItem("user", JSON.stringify(savedUser));
        }

        await loadFollowingUsers();

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
    } finally {
        stopLoading();
    }
}

window.unfollowFromProfile = unfollowFromProfile;