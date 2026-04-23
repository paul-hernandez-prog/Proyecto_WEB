let isLogin = true;
let isAdmin = false;

const toggleBtn = document.getElementById("toggle-btn");
const title = document.getElementById("form-title");
const submitBtn = document.getElementById("submit-btn");
const form = document.getElementById("form");
const adminBtn = document.getElementById("admin-btn");

const nombre = document.getElementById("nombre");
const apellido = document.getElementById("apellido");
const correo = document.getElementById("correo");
const password = document.getElementById("password");
const confirmar = document.getElementById("confirmar");

toggleBtn.addEventListener("click", () => {
    isLogin = !isLogin;
    isAdmin = false;

    if (isLogin) {
        title.textContent = "Iniciar Sesión";
        submitBtn.textContent = "Entrar";
        toggleBtn.textContent = "Sign Up";
        adminBtn.textContent = "Iniciar como administrador";

        adminBtn.style.display = "block";

        nombre.style.display = "none";
        apellido.style.display = "none";
        confirmar.style.display = "none";

    } else {
        title.textContent = "Registrarse";
        submitBtn.textContent = "Crear cuenta";
        toggleBtn.textContent = "Log In";

        adminBtn.style.display = "none";

        nombre.style.display = "block";
        apellido.style.display = "block";
        confirmar.style.display = "block";
    }
});

adminBtn.addEventListener("click", () => {
    isLogin = true;
    isAdmin = true;

    title.textContent = "Iniciar sesión como administrador";
    submitBtn.textContent = "Entrar como admin";

    adminBtn.style.display = "none";

    nombre.style.display = "none";
    apellido.style.display = "none";
    confirmar.style.display = "none";

    nombre.required = false;
    apellido.required = false;
    confirmar.required = false;
});

form.addEventListener("submit", function(e) {
    e.preventDefault();

    if (isLogin) {

        if (isAdmin) {
            window.location.href = "admin.html";
        } else {
            window.location.href = "foro.html";
        }

    } else {
        alert("Cuenta creada");
        window.location.href = "foro.html";
    }
});
