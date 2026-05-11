const token = localStorage.getItem("token");
const user = JSON.parse(localStorage.getItem("user"));

const API_CATEGORIES = "/api/categories";
const API_REPORTS = "/api/reports";
const API_POSTS = "/api/posts";
const reportsList = document.getElementById("reportsList");
const editReportForm = document.getElementById("editReportForm");
const confirmDeleteReport = document.getElementById("confirmDeleteReport");

let reports = [];
let reportIdToDelete = null;

const categoriesList = document.getElementById("categoriesList");
const createCategoryForm = document.getElementById("createCategoryForm");
const editCategoryForm = document.getElementById("editCategoryForm");
const confirmDeleteCategory = document.getElementById("confirmDeleteCategory");
const logoutBtn = document.getElementById("logoutBtn");

let categories = [];
let categoryIdToDelete = null;

if (!token || !user) {
    alert("Debes iniciar sesión");
    window.location.href = "login.html";
}

if (user.role !== "admin") {
    alert("No tienes permiso para entrar al panel de administrador");
    window.location.href = "foro.html";
}

loadCategories();
loadReports();

if (createCategoryForm) {
    createCategoryForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const nombre = document.getElementById("createCategoryName").value.trim();
        const color = document.querySelector("input[name='createColor']:checked").value;

        if (!nombre) {
            alert("El nombre es obligatorio");
            return;
        }

        const button = getSubmitButton(createCategoryForm);
        const stopLoading = startButtonLoading(button, "Creando...");

        if (!stopLoading) {
            return;
        }

        try {
            const response = await fetch(API_CATEGORIES, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ nombre, color })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al crear categoría");
                return;
            }

            createCategoryForm.reset();

            const modal = bootstrap.Modal.getInstance(document.getElementById("createCategoryModal"));
            if (modal) modal.hide();

            await loadCategories();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            stopLoading();
        }
    });
}

if (editCategoryForm) {
    editCategoryForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const id = document.getElementById("editCategoryId").value;
        const nombre = document.getElementById("editCategoryName").value.trim();
        const color = document.getElementById("editCategoryColor").value;

        if (!nombre) {
            alert("El nombre es obligatorio");
            return;
        }
        
        const button = getSubmitButton(editCategoryForm);
        const stopLoading = startButtonLoading(button, "Guardando...");

        if (!stopLoading) {
            return;
        }

        try {
            const response = await fetch(`${API_CATEGORIES}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ nombre, color })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al editar categoría");
                return;
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById("editCategoryModal"));
            if (modal) modal.hide();

            await loadCategories();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            stopLoading();
        }   
    });
}

if (confirmDeleteCategory) {
    confirmDeleteCategory.addEventListener("click", async function () {
        if (!categoryIdToDelete) {
            return;
        }

        const stopLoading = startButtonLoading(confirmDeleteCategory, "Eliminando...");

        if (!stopLoading) {
            return;
        }

        try {
            const response = await fetch(`${API_CATEGORIES}/${categoryIdToDelete}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al eliminar categoría");
                return;
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById("deleteCategoryModal"));
            if (modal) modal.hide();

            categoryIdToDelete = null;

            await loadCategories();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            stopLoading();
        }
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
        categoriesList.innerHTML = `
            <li class="list-group-item">
                ${createLoader("Cargando categorías...")}
            </li>
        `;

        const response = await fetch(API_CATEGORIES, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            categoriesList.innerHTML = `
                <li class="list-group-item text-danger">
                    ${data.message || "Error al cargar categorías"}
                </li>
            `;
            return;
        }

        categories = data.categories || [];
        renderCategories();

    } catch (error) {
        console.error(error);
        categoriesList.innerHTML = `
            <li class="list-group-item text-danger">
                No se pudo conectar con el servidor
            </li>
        `;
    }
}

function renderCategories() {
    if (!categories || categories.length === 0) {
        categoriesList.innerHTML = `<li class="list-group-item">No hay categorías registradas.</li>`;
        return;
    }

    categoriesList.innerHTML = categories.map(category => {
        const textColor = category.color === "warning" || category.color === "info" ? "text-dark" : "";

        return `
            <li class="list-group-item d-flex justify-content-between align-items-center">
                <span class="badge bg-${escapeHTML(category.color)} ${textColor}">
                    ${escapeHTML(category.nombre)}
                </span>

                <div class="d-flex gap-2">
                <button 
                    type="button"
                    class="btn btn-outline-primary btn-sm"
                    onclick="openEditCategory('${category._id}')"
                >
                    Editar
                </button>

                <button 
                    type="button"
                    class="btn btn-outline-danger btn-sm"
                    onclick="openDeleteCategory('${category._id}')"
                >
                    Eliminar
                </button>
                </div>
            </li>
        `;
    }).join("");
}

function openEditCategory(id) {
    const category = categories.find(c => c._id === id);

    if (!category) {
        alert("Categoría no encontrada");
        return;
    }

    document.getElementById("editCategoryId").value = category._id;
    document.getElementById("editCategoryName").value = category.nombre;
    document.getElementById("editCategoryColor").value = category.color;

    const modal = new bootstrap.Modal(document.getElementById("editCategoryModal"));
    modal.show();
}

function openDeleteCategory(id) {
    console.log("Categoría a eliminar:", id);

    categoryIdToDelete = id;    

    const modalElement = document.getElementById("deleteCategoryModal");

    if (!modalElement) {
        alert("No se encontró el modal de eliminar categoría");
        return;
    }

    const modal = new bootstrap.Modal(modalElement);
    modal.show();
}

function escapeHTML(text) {
    if (!text) {
        return "";
    }

    return text
        .toString()
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

async function loadReports() {
    if (!reportsList) {
        return;
    }

    try {
        reportsList.innerHTML = `
            <li class="list-group-item">
                ${createLoader("Cargando reportes...")}
            </li>
        `;

        const response = await fetch(API_REPORTS, {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            reportsList.innerHTML = `
                <li class="list-group-item text-danger">
                    ${data.message || "Error al cargar reportes"}
                </li>
            `;
            return;
        }

        reports = data.reports || [];
        renderReports();

    } catch (error) {
        console.error(error);
        reportsList.innerHTML = `
            <li class="list-group-item text-danger">
                No se pudo conectar con el servidor
            </li>
        `;
    }
}

function renderReports() {
    if (!reports || reports.length === 0) {
        reportsList.innerHTML = `
            <li class="list-group-item">
                No hay reportes registrados.
            </li>
        `;
        return;
    }

    reportsList.innerHTML = reports.map(report => {
        const userName = report.usuario
            ? `${report.usuario.nombre} ${report.usuario.apellido}`
            : "Usuario eliminado";

        let targetText = "";

        if (report.tipo === "post") {
            targetText = report.post
                ? `Publicación: ${report.post.titulo}`
                : "Publicación eliminada";
        }

        if (report.tipo === "comment") {
            targetText = report.comment
                ? `Comentario: ${report.comment.contenido}`
                : "Comentario eliminado";
        }

        return `
            <li class="list-group-item">
                <div class="d-flex justify-content-between align-items-start gap-3">

                    <div>
                        <div class="mb-2">
                            <span class="badge bg-${getReportStatusColor(report.estado)}">
                                ${escapeHTML(report.estado)}
                            </span>

                            <span class="badge bg-dark">
                                ${escapeHTML(report.tipo)}
                            </span>
                        </div>

                        <strong>Reportado por:</strong> ${escapeHTML(userName)}<br>
                        <strong>Motivo:</strong> ${escapeHTML(report.motivo)}<br>
                        <strong>Contenido:</strong> ${escapeHTML(targetText)}<br>

                        ${report.descripcion ? `
                            <strong>Descripción:</strong> ${escapeHTML(report.descripcion)}<br>
                        ` : ""}

                        <small class="text-muted">
                            ${new Date(report.createdAt).toLocaleString("es-MX", {
                                dateStyle: "short",
                                timeStyle: "short"
                            })}
                        </small>
                    </div>

                    <div class="d-flex gap-2">
                        <button 
                            type="button"
                            class="btn btn-outline-primary btn-sm"
                            onclick="openEditReport('${report._id}')"
                        >
                            Estado
                        </button>

                            ${report.tipo === "post" && report.post ? `
                                <button 
                                    type="button"
                                    class="btn btn-outline-danger btn-sm"
                                    onclick="deleteReportedPost('${report.post._id}', this)"
                                >
                                    Eliminar publicación
                                </button>
                            ` : ""}

                        <button 
                            type="button"
                            class="btn btn-outline-danger btn-sm"
                            onclick="openDeleteReport('${report._id}')"
                        >
                            Eliminar
                        </button>
                    </div>

                </div>
            </li>
        `;
    }).join("");
}

function getReportStatusColor(estado) {
    if (estado === "pendiente") return "warning text-dark";
    if (estado === "revisado") return "success";
    if (estado === "rechazado") return "secondary";
    return "dark";
}

function openEditReport(id) {
    const report = reports.find(r => r._id === id);

    if (!report) {
        alert("Reporte no encontrado");
        return;
    }

    document.getElementById("editReportId").value = report._id;
    document.getElementById("editReportEstado").value = report.estado;

    const modal = new bootstrap.Modal(document.getElementById("editReportModal"));
    modal.show();
}

if (editReportForm && editReportForm.dataset.listenerAdded !== "true") {
    editReportForm.dataset.listenerAdded = "true";

    editReportForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const id = document.getElementById("editReportId").value;
        const estado = document.getElementById("editReportEstado").value;

        const button = getSubmitButton(editReportForm);
        const stopLoading = startButtonLoading(button, "Guardando...");

        if (!stopLoading) {
            return;
        }

        try {
            const response = await fetch(`${API_REPORTS}/${id}`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({ estado })
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al actualizar reporte");
                return;
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById("editReportModal"));
            if (modal) modal.hide();

            await loadReports();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            stopLoading();
        }
    });
}

function openDeleteReport(id) {
    reportIdToDelete = id;

    const modal = new bootstrap.Modal(document.getElementById("deleteReportModal"));
    modal.show();
}

if (confirmDeleteReport && confirmDeleteReport.dataset.listenerAdded !== "true") {
    confirmDeleteReport.dataset.listenerAdded = "true";

    confirmDeleteReport.addEventListener("click", async function () {
        if (!reportIdToDelete) {
            return;
        }

        const stopLoading = startButtonLoading(confirmDeleteReport, "Eliminando...");

        if (!stopLoading) {
            return;
        }

        try {
            const response = await fetch(`${API_REPORTS}/${reportIdToDelete}`, {
                method: "DELETE",
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                alert(data.message || "Error al eliminar reporte");
                return;
            }

            const modal = bootstrap.Modal.getInstance(document.getElementById("deleteReportModal"));
            if (modal) modal.hide();

            reportIdToDelete = null;

            await loadReports();

        } catch (error) {
            console.error(error);
            alert("No se pudo conectar con el servidor");
        } finally {
            stopLoading();
        }
    });
}

async function deleteReportedPost(postId, button) {
    const confirmDelete = confirm("¿Seguro que quieres eliminar esta publicación reportada?");

    if (!confirmDelete) {
        return;
    }

    const stopLoading = startButtonLoading(button, "Eliminando...");

    if (!stopLoading) {
        return;
    }

    try {
        const response = await fetch(`${API_POSTS}/${postId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Error al eliminar publicación");
            return;
        }

        alert("Publicación eliminada correctamente");

        await loadReports();

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
    } finally {
            stopLoading();
    }
}

window.openEditReport = openEditReport;
window.openDeleteReport = openDeleteReport;
window.deleteReportedPost = deleteReportedPost;

