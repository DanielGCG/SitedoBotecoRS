// Função para adicionar cookies automáticos ao total atual
function adicionarCookiesAutomaticos() {
    let totalCookies = cookiesPorSegundo * calcularMultiplicador(multiplicadorCookie);

    quantidadeCookies += totalCookies; // Atualiza a quantidade atual de cookies
    quantidadeTotalCookies += totalCookies;     // Atualiza a quantidade absoluta total de cookies
    document.getElementById("mostrador-de-cookies").textContent = `Você tem ${quantidadeCookies.toFixed(0)} cookies!`;
    localStorage.setItem("quantidadeCookies", Math.floor(quantidadeCookies));
    localStorage.setItem("quantidadeTotalCookies", quantidadeTotalCookies);

    // Verifica upgrades automaticamente ao exibir os cookies
    if (!document.getElementById('lista-click').innerHTML) {
        exibirOfertaClick();
    }
    if (!document.getElementById('lista-maquina').innerHTML) {
        exibirOfertaMaquina();
    }

    exibirAnimacaoCookies(totalCookies);
}

function botaoReset(){
    document.getElementById("popup-reset").style.display = "flex";
}

function fecharPopupReset(){
    document.getElementById("popup-reset").style.display = 'none';
}

function fecharPopupAnticheating(){
    document.getElementById("popup-anticheating").style.display = 'none';
}