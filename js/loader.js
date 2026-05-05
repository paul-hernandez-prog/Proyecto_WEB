const LOADER_URL = "https://lottie.host/de7aedbd-e205-45c9-af29-0516f6840a7e/YB2SDQ2xC9.lottie";

window.createLoader = function (message = "Cargando...") {
    return `
        <div class="loader-box">
            <dotlottie-wc 
                src="${LOADER_URL}"
                style="width: 120px; height: 120px"
                autoplay 
                loop>
            </dotlottie-wc>

            <p>${message}</p>
        </div>
    `;
};