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


const API_URL = "/api/users";

correo.required = true;
password.required = true;

toggleBtn.addEventListener("click", () => { //Hacer toggle entre login y register
    isLogin = !isLogin;
    isAdmin = false;

    form.reset();

    if (isLogin) {
        title.textContent = "Iniciar Sesión";
        submitBtn.textContent = "Entrar";
        toggleBtn.textContent = "Sign Up";
        adminBtn.textContent = "Iniciar como administrador";

        adminBtn.style.display = "block";

        nombre.style.display = "none";
        apellido.style.display = "none"; //no mostramos estos campos
        confirmar.style.display = "none";

        nombre.required = false;
        apellido.required = false; //Deshabilitamos pq podrian causar error
        confirmar.required = false;
    } else {
        title.textContent = "Registrarse";
        submitBtn.textContent = "Crear cuenta";
        toggleBtn.textContent = "Log In";

        adminBtn.style.display = "none";

        nombre.style.display = "block";
        apellido.style.display = "block";
        confirmar.style.display = "block";

        nombre.required = true;
        apellido.required = true;
        confirmar.required = true;
    }
});

adminBtn.addEventListener("click", () => {
    isLogin = true;
    isAdmin = true;

    form.reset();

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

form.addEventListener("submit", async function (e) {
    e.preventDefault();

    if (isLogin) {
        await loginUser();
    } else {
        await registerUser();
    }
});

async function registerUser() {
    if (password.value !== confirmar.value) {
        alert("Las contraseñas no coinciden");
        return;
    }

    const userData = {
        nombre: nombre.value,
        apellido: apellido.value,
        correo: correo.value,
        password: password.value,
        role: "user"
    };

    try {
        const response = await fetch(`${API_URL}/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(userData) //lo mandamos como JSON
        });

        const data = await response.json(); //Lo recuperamos como objeto de JS

        if (!response.ok) {
            alert(data.message || "Error al crear usuario");
            return;
        }

        alert("Cuenta creada correctamente");

        localStorage.setItem("user", JSON.stringify(data.user)); //Lo guardamos localmente como JSON
        localStorage.setItem("token", data.token);

        window.location.href = "foro.html";

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
    }
}

async function loginUser() {
    const loginData = {
        correo: correo.value,
        password: password.value
    };

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(loginData)
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.message || "Correo o contraseña incorrectos");
            return;
        }

        const user = data.user;

        if (isAdmin && user.role !== "admin") {
            alert("Este usuario no es administrador");
            return;
        }

        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("token", data.token);

        if (user.role === "admin" && isAdmin) {
            window.location.href = "admin.html";
        } else {
            window.location.href = "foro.html";
        }

    } catch (error) {
        console.error(error);
        alert("No se pudo conectar con el servidor");
    }
}