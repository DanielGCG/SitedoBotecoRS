// Verificar se a senha inserida está correta
async function checkPassword() {
    const senha = document.getElementById("password").value.trim(); // Obter senha do input

    try {
        const response = await fetch('/API/cutucar/verify-senha-cutucar', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ senha }), // Enviar senha como JSON
        });

        const data = await response.json(); // Converter a resposta para JSON
        

        if (data.success) {
            // Marca o usuário como validado
            localStorage.setItem("validacaoUsuario", "true");
            console.log("Validação do Usuário:", localStorage.getItem("validacaoUsuario"));
            document.getElementById("popup-senha").style.display = "none"; // Esconde o popup
        } else {
            alert("Senha incorreta. Tente novamente.");
        }
    } catch (error) {
        console.error("Erro ao verificar senha:", error);
        alert("Erro ao verificar a senha. Tente novamente mais tarde.");
    }
}

function checkUserAutentication() {
    const validacaoUsuario = (localStorage.getItem("validacaoUsuario") === "true" || localStorage.getItem("validacaoUsuario") === true);
    console.log("Validação do Usuário:", validacaoUsuario);
    if (!validacaoUsuario) {
        document.getElementById("popup-senha").style.display = ""; // Mostra o popup
    }
}

function setLastCutucadaTime() {
    // Obtém a data e hora atuais
    const currentDate = new Date();

    // Armazena no localStorage no formato ISO
    localStorage.setItem("LastCutucadaTime", currentDate.toISOString());
}

function checkUserLastCutucadaTime() {
    // Obtém o valor de LastCutucadaTime do localStorage
    const LastCutucadaTime = localStorage.getItem("LastCutucadaTime");

    // Verifica se o valor de LastCutucadaTime é válido
    if (LastCutucadaTime === null) {
        // Se LastCutucadaTime for null, considera que a pessoa nunca cutucou antes
        console.log("Nunca cutucou antes. Validação: true");
        return true; // Valida a pessoa
    } else {
        // Se LastCutucadaTime existe, calcula a diferença de tempo em segundos
        const currentTime = new Date();
        const lastCutucadaDate = new Date(LastCutucadaTime);
        const timeDifferenceInSeconds = (currentTime - lastCutucadaDate) / 1000;

        console.log("Diferença de tempo em segundos:", timeDifferenceInSeconds);

        // Verifica se já passaram pelo menos 30 segundos
        if (timeDifferenceInSeconds >= 30) {
            console.log("Mais de 30 segundos passaram. Validação: true");
            return true; // Valida a pessoa
        } else {
            console.log("Menos de 30 segundos. Validação: false");
            return false; // Não valida a pessoa
        }
    }
}

// Verificar se o usuário já está autenticado
document.addEventListener("DOMContentLoaded", () => {
    if (document.getElementById("popup-senha")) {
        checkUserAutentication();
    }
    clearMidiaInput();
    clearMentionInput();
    clearMessageTextInput();
});