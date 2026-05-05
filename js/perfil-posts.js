const postToken = localStorage.getItem("token");
const postUser = JSON.parse(localStorage.getItem("user"));

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

if (!postToken || !postUser) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

loadMyPosts();
loadMyComments();

if (createPostForm) {
    createPostForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        let contenido = "";

        if (typeof quill !== "undefined" && quill) {
            contenido = quill.getText().trim();
        }

        const postData = {
            titulo: document.getElementById("postTitulo").value.trim(),
            categoria: document.getElementById("postCategoria").value,
            contenido,
            youtubeUrl: document.getElementById("postYoutube").value.trim(),
            imagenUrl: document.getElementById("postImagenUrl").value.trim()
        };

        if (!postData.titulo || !postData.categoria || !postData.contenido) {
            alert("Título, categoría y descripción son obligatorios");
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
        }
    });
}

if (editPostForm) {
    editPostForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const id = document.getElementById("editPostId").value;

        let contenido = "";

        if (typeof quillEdit !== "undefined" && quillEdit) {
            contenido = quillEdit.getText().trim();
        }

        const postData = {
    titulo: document.getElementById("editPostTitulo").value.trim(),
    categoria: document.getElementById("editPostCategoria").value,
    contenido,
    youtubeUrl: document.getElementById("editPostYoutube").value.trim(),
    imagenUrl: document.getElementById("editPostImagenUrl").value.trim()
};

        if (!postData.titulo || !postData.categoria || !postData.contenido) {
            alert("Título, categoría y descripción son obligatorios");
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
        }
    });
}

if (confirmDelete) {
    confirmDelete.addEventListener("click", async function () {
        if (!postIdToDelete) {
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
        }
    });
}

async function loadMyPosts() {
    try {
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

                <p class="post-content">${escapeHTML(post.contenido)}</p>

                ${post.imagenUrl ? `
    <img 
        class="content-image" 
        src="${escapeHTML(post.imagenUrl)}" 
        alt="Imagen de publicación"
    >
` : ""}

                ${post.youtubeUrl ? `
                    <a href="${escapeHTML(post.youtubeUrl)}" target="_blank" class="btn btn-outline-danger btn-sm">
                        <i class="fa-brands fa-youtube"></i> Ver video
                    </a>
                ` : ""}

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
            quillEdit.setText(post.contenido || "");
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

async function loadMyComments() {
    if (!myCommentsContainer) {
        return;
    }

    try {
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
        const createdDate = new Date(comment.createdAt).toLocaleString("es-MX");

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
        }
    });
}

if (confirmDeleteComment) {
    confirmDeleteComment.addEventListener("click", async function () {
        if (!commentIdToDelete) {
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