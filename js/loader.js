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

window.getSubmitButton = function (form) {
    if (!form) return null;

    return document.querySelector(`button[type="submit"][form="${form.id}"]`)
        || form.querySelector("button[type='submit']");
};

window.startButtonLoading = function (button, loadingText = "Cargando...") {
    if (!button) return null;

    if (button.disabled) {
        return null;
    }

    const originalHTML = button.innerHTML;

    button.disabled = true;
    button.innerHTML = `
        <span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
        ${loadingText}
    `;

    return function stopLoading() {
        button.disabled = false;
        button.innerHTML = originalHTML;
    };
};