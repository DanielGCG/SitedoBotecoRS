// Variáveis globais
let quantidadeTotalCookies = 0;
let quantidadeCookies = 0;          // Variável para quantidade atual de cookies
let multiplicadorCookie = 0;        // Variável para multiplicador de cookie por click
let ultimosCps = [];                // Armazenar os últimos valores de CPS calculados

const cookiesPorSegundoInicial = 0; // Valor inicial para cookies por segundo
const precoClickInicial = 25;       // Preço inicial para upgrade de click
const precoMaquinaInicial = 55;     // Preço inicial para upgrade de máquina
const CPS_INTERVAL = 3000;          // Janela de tempo para cálculo de CPS (3 segundos)

let cookiesPorSegundo = cookiesPorSegundoInicial;
let precoClick = precoClickInicial;
let precoMaquina = precoMaquinaInicial;
let clickTimestamps = [];           // Armazena os timestamps dos cliques


// Carregar valores do Local Storage ao iniciar
document.addEventListener("DOMContentLoaded", () => {
    const cookiesSalvos = localStorage.getItem("quantidadeCookies");
    if (cookiesSalvos !== null) {
        quantidadeCookies = parseInt(cookiesSalvos, 10);
        document.getElementById("mostrador-de-cookies").textContent = `Você tem ${quantidadeCookies.toFixed(0)} cookies!`;
    }

    const multiplicadorSalvo = localStorage.getItem("multiplicadorCookie");
    if (multiplicadorSalvo !== null) {
        multiplicadorCookie = parseInt(multiplicadorSalvo, 10);
        atualizarIndicadorMultiplicador();
    }

    const upgradeClickSalvo = localStorage.getItem("precoClick");
    if (upgradeClickSalvo !== null) {
        precoClick = parseInt(upgradeClickSalvo, 10);
    }

    const upgradeMaquinaSalvo = localStorage.getItem("precoMaquina");
    if (upgradeMaquinaSalvo !== null) {
        precoMaquina = parseInt(upgradeMaquinaSalvo, 10);
    }

    const cpsSalvo = localStorage.getItem("cookiesPorSegundo");
    if (cpsSalvo !== null) {
        cookiesPorSegundo = parseFloat(cpsSalvo);  // Assegurando que é um número de ponto flutuante
        atualizarIndicadorMaquina();
    }

    // Total absoluto de cookies
    const quantidadeTotalCookiesSalvo = localStorage.getItem("quantidadeTotalCookies");
    if (cpsSalvo !== null) {
        quantidadeTotalCookies = parseFloat(quantidadeTotalCookiesSalvo);
    }

    if (!document.getElementById('lista-click').innerHTML) {
        exibirOfertaClick();
    }
    if (!document.getElementById('lista-maquina').innerHTML) {
        exibirOfertaMaquina();
    }
});

// Função para resetar os valores para o padrão inicial
function resetarValores() {
    quantidadeTotalCookies = 0;
    quantidadeCookies = 0;
    multiplicadorCookie = 0;
    cookiesPorSegundo = cookiesPorSegundoInicial;
    precoClick = precoClickInicial;
    precoMaquina = precoMaquinaInicial;

    // Atualizar elementos na interface
    atualizarIndicadorMultiplicador();
    atualizarIndicadorMaquina();
    document.getElementById("mostrador-de-cookies").textContent = `Você tem ${quantidadeCookies.toFixed(0)} cookies!`;
    document.getElementById("cps").textContent = `${cookiesPorSegundo.toFixed(1)} cookie/s`;

    // Limpar ofertas
    document.getElementById("lista-click").innerHTML = '';
    document.getElementById("lista-maquina").innerHTML = '';

    // Limpar armazenamento local
    localStorage.clear();
}

// Atualiza monitor de CPS a cada 100ms
setInterval(() => {
    atualizarCps(); // Atualiza a exibição do CPS
}, 100);

// Função para exibir uma quantidade de imagens animadas
function exibirAnimacaoCookies(quantidade) {
    const container = document.getElementById("container-animacao"); // Container onde as animações serão exibidas

    if(quantidade > 20){
        quantidade = 15 + (quantidade)*0.25;
    }

    for (let i = 0; i < quantidade; i++) {
        const img = document.createElement("img");
        img.src = "/pages/minigames/cookieclicker/cookie_pequeno.png"; // Caminho para a imagem do cookie
        img.classList.add("animacao-cookie"); // Classe para aplicar estilos e animação

        // Posicionamento inicial aleatório horizontal
        const posicaoHorizontal = Math.random() * 90 + 5; // Entre 5% e 95% da largura
        const posicaoVertical = Math.random() * 20 + -5; // Entre -5% e 15% da largura
        img.style.left = `${posicaoHorizontal}%`;
        img.style.bottom = `${posicaoVertical}%`;

        container.appendChild(img);

        // Remove a imagem após a animação terminar
        img.addEventListener("animationend", () => {
            img.remove();
        });
    }
}

// Função de compra de upgrade de click
document.getElementById("lista-click").addEventListener("click", (e) => {
    if (e.target.classList.contains("comprar-click")) {
        if (quantidadeCookies >= precoClick) {
            quantidadeCookies -= precoClick;
            multiplicadorCookie += 20;
            precoClick = atualizarPrecoClick(precoClick);
            localStorage.setItem("quantidadeCookies", quantidadeCookies);
            localStorage.setItem("quantidadeTotalCookies", quantidadeTotalCookies);
            localStorage.setItem("multiplicadorCookie", multiplicadorCookie);
            localStorage.setItem("precoClick", precoClick);             // Salva o novo preço do upgrade
            atualizarIndicadorMultiplicador();
            document.getElementById("mostrador-de-cookies").textContent = `Você tem ${quantidadeCookies.toFixed(0)} cookies!`;
            document.getElementById('lista-click').innerHTML = '';      // Remove a oferta de upgrade após compra
        }
    }
});

// Função de compra de upgrade de máquina
document.getElementById("lista-maquina").addEventListener("click", (e) => {
    if (e.target && e.target.classList.contains("comprar-maquina")) {
        if (quantidadeCookies >= precoMaquina) {
            quantidadeCookies -= precoMaquina;
            if (cookiesPorSegundo === 0){
                cookiesPorSegundo = 1;
            }
            else{
                cookiesPorSegundo += cookiesPorSegundo * 0.3; // Incrementa 30% ou começa com 1 cookie/s
            }
            precoMaquina = atualizarPrecoMaquina(precoMaquina);
            localStorage.setItem("quantidadeCookies", quantidadeCookies); // Salva a quantidade de cookies
            localStorage.setItem("quantidadeTotalCookies", quantidadeTotalCookies);
            localStorage.setItem("cookiesPorSegundo", cookiesPorSegundo); // Salva o valor de CPS (cookies por segundo)
            localStorage.setItem("precoMaquina", precoMaquina);           // Salva o novo preço do upgrade
            atualizarIndicadorMaquina();
            document.getElementById("mostrador-de-cookies").textContent = `Você tem ${quantidadeCookies.toFixed(0)} cookies!`;
            document.getElementById('lista-maquina').innerHTML = ''; // Remove oferta
        }
    }
});

// Evento de clique no cookie
document.getElementById("cookie").addEventListener("click", () => {
    const cookieButton = document.getElementById("cookie");
    
    // Adiciona a classe de animação
    cookieButton.classList.add("animate");

    // Remove a classe após a animação terminar
    setTimeout(() => {
        cookieButton.classList.remove("animate");
    }, 100); // O tempo deve coincidir com a duração da animação no CSS (0.1s)

    const multiplicador = calcularMultiplicador(multiplicadorCookie);
    quantidadeCookies += multiplicador;
    quantidadeTotalCookies += multiplicador;

    // Armazena o timestamp atual
    clickTimestamps.push(Date.now());

    // Atualiza o contador e CPS
    document.getElementById("mostrador-de-cookies").textContent = `Você tem ${quantidadeCookies.toFixed(0)} cookies!`;
    localStorage.setItem("quantidadeCookies", quantidadeCookies);
    localStorage.setItem("quantidadeTotalCookies", quantidadeTotalCookies);
    atualizarCps();

    // Verifica upgrades
    if (!document.getElementById('lista-click').innerHTML) {
        exibirOfertaClick();
    }
    if (!document.getElementById('lista-maquina').innerHTML) {
        exibirOfertaMaquina();
    }
});

// Adiciona os cookies da máquina a cada segundo
setInterval(() => {
    adicionarCookiesAutomaticos();
}, 1000); // A cada segundo