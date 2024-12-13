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
    const quantidadeTotalCookiesSalvo = localStorage.getItem("cookiesPorSegundo");
    if (cpsSalvo !== null) {
        quantidadeTotalCookies = parseFloat(quantidadeTotalCookiesSalvo);
    }

    if (quantidadeTotalCookies >= precoClick && !document.getElementById('lista-click').innerHTML) {
        exibirOfertaClick();
    }
    if (quantidadeTotalCookies >= precoMaquina && !document.getElementById('lista-maquina').innerHTML) {
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

// Função para calcular multiplicador baseado no multiplicador
function calcularMultiplicador(multiplicador) {
    return 1 + multiplicador / 100;
}

// Função para calcular CPS médio (cliques por segundo)
function calcularCpsMedia() {
    const agora = Date.now();

    // Filtra cliques dentro dos últimos 3 segundos
    clickTimestamps = clickTimestamps.filter(timestamp => agora - timestamp <= CPS_INTERVAL);

    // Retorna a média de cliques por segundo
    return clickTimestamps.length / (CPS_INTERVAL / 1000);
}

// Função para adicionar cookies automáticos ao total atual
function adicionarCookiesAutomaticos() {
    let totalCookies = 0;
    // Somatório de cookiesPorSegundo vezes o multiplicador calculado
    for (let i = 0; i < cookiesPorSegundo; i++) {
        totalCookies += calcularMultiplicador(multiplicadorCookie);
    }
    quantidadeCookies += totalCookies; // Atualiza a quantidade atual de cookies
    quantidadeTotalCookies += totalCookies;     // Atualiza a quantidade absoluta total de cookies
    document.getElementById("mostrador-de-cookies").textContent = `Você tem ${quantidadeCookies.toFixed(0)} cookies!`;
    localStorage.setItem("quantidadeCookies", Math.floor(quantidadeCookies));
    localStorage.setItem("quantidadeTotalCookies", quantidadeTotalCookies);

    // Verifica upgrades automaticamente ao exibir os cookies
    if (quantidadeTotalCookies >= precoClick && !document.getElementById('lista-click').innerHTML) {
        exibirOfertaClick();
    }
    if (quantidadeTotalCookies >= precoMaquina && !document.getElementById('lista-maquina').innerHTML) {
        exibirOfertaMaquina();
    }
}

// Função de anti-cheating
function antiCheating(cpsMedio) {
    const agora = Date.now();

    // Ignora análise se o CPS médio é 1 ou menor (usuário AFK ou inativo)
    if (cpsMedio <= 1) return;

    // Outra condição de anticheat: CPS médio muito alto
    if (cpsMedio >= 11) {
        document.getElementById("popup-anticheating").style.display = "flex";
        return
    }

    // Adiciona o CPS atual ao array e mantém o histórico apenas dos últimos 5 segundos
    ultimosCps.push({ timestamp: agora, cps: cpsMedio });
    ultimosCps = ultimosCps.filter(entry => agora - entry.timestamp <= 5000);

    // Verifica a constância dos valores de CPS (analisamos apenas se há múltiplos registros)
    if (ultimosCps.length > 5000) {
        const variacoes = ultimosCps.slice(1).map((entry, index) => 
            Math.abs(entry.cps - ultimosCps[index].cps)
        );

        // Condição: todas as variações entre registros sucessivos são menores ou iguais a 0.5
        const todasVariacoesBaixas = variacoes.every(variacao => variacao <= 0.5);

        // Ativa o anticheat se as variações forem consistentemente pequenas
        if (todasVariacoesBaixas) {
            document.getElementById("popup-anticheating").style.display = "flex";
            return;
        }
    }
}

// Função para atualizar o CPS (cookies por segundo)
function atualizarCps() {
    const cpsMediaClicks = calcularCpsMedia();
    antiCheating(cpsMediaClicks);
    const cpsTotal = cpsMediaClicks + cookiesPorSegundo * calcularMultiplicador(multiplicadorCookie); // Soma automática + média
    document.getElementById("cps").textContent = `${cpsTotal.toFixed(1)} cookies/s`;
}

// Atualiza monitor de CPS a cada 100ms
setInterval(() => {
    atualizarCps(); // Atualiza a exibição do CPS
}, 100);

// Função para atualizar o indicador de multiplicador
function atualizarIndicadorMultiplicador() {
    document.getElementById("indicador-multiplicador-cookies").textContent = `Multiplicador cookie: ${multiplicadorCookie + 100}%`;
}

// Função para atualizar o indicador de cookies por segundo
function atualizarIndicadorMaquina() {
    document.getElementById("indicador-maquina-cookies").textContent = `Máquina de cookies: ${cookiesPorSegundo.toFixed(1)} cookies/s`;
}

// Função para atualizar o preço do upgrade de click
function atualizarPrecoClick(upgrade) {
    return upgrade * 3;
}

// Função para atualizar o preço do upgrade de maquina
function atualizarPrecoMaquina(upgrade) {
    return upgrade * 4;
}

// Função para exibir a oferta de upgrade de click
function exibirOfertaClick() {
    const listaClicks = document.getElementById('lista-click');
    const novoClick = document.createElement('div');
    novoClick.classList.add('upgrade-item');
    novoClick.innerHTML = `
        <p>Aumentar multiplicador cookie em 20%!</p>
        <button class="comprar-click">Comprar por ${precoClick} cookies</button>
    `;
    listaClicks.appendChild(novoClick);
}

// Função para exibir a oferta de upgrade de máquina
function exibirOfertaMaquina() {
    const listaMaquina = document.getElementById('lista-maquina');
    const novaMaquina = document.createElement('div');
    novaMaquina.classList.add('upgrade-item');
    novaMaquina.innerHTML = `
        <p>Aumentar máquina de cookies em 30%!</p>
        <button class="comprar-maquina">Comprar por ${precoMaquina} cookies</button>
    `;
    listaMaquina.appendChild(novaMaquina);
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
    if (quantidadeTotalCookies >= precoClick && !document.getElementById('lista-click').innerHTML) {
        exibirOfertaClick();
    }
    if (quantidadeTotalCookies >= precoMaquina && !document.getElementById('lista-maquina').innerHTML) {
        exibirOfertaMaquina();
    }
});

function botaoReset(){
    document.getElementById("popup-reset").style.display = "flex";
}

function fecharPopupReset(){
    document.getElementById("popup-reset").style.display = 'none';
}

function fecharPopupAnticheating(){
    document.getElementById("popup-anticheating").style.display = 'none';
}

// Adiciona os cookies da máquina a cada segundo
setInterval(() => {
    adicionarCookiesAutomaticos();
}, 1000); // A cada segundo