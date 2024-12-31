// Função para calcular CPS médio (cliques por segundo)
function calcularCpsMedia() {
    const agora = Date.now();

    // Filtra cliques dentro dos últimos 3 segundos
    clickTimestamps = clickTimestamps.filter(timestamp => agora - timestamp <= CPS_INTERVAL);
    if (clickTimestamps.length > 1000) {
        clickTimestamps.splice(0, clickTimestamps.length - 1000);
    }    

    // Retorna a média de cliques por segundo
    return clickTimestamps.length / (CPS_INTERVAL / 1000);
}

// Função para atualizar o CPS (cookies por segundo)
function atualizarCps() {
    const cpsMediaClicks = calcularCpsMedia();
    antiCheating(cpsMediaClicks);
    const cpsTotal = cpsMediaClicks + cookiesPorSegundo * calcularMultiplicador(multiplicadorCookie); // Soma automática + média
    document.getElementById("cps").textContent = `${cpsTotal.toFixed(1)} cookies/s`;
}

// Função para exibir a oferta de upgrade de click
function exibirOfertaClick() {
    const listaClicks = document.getElementById('lista-click');
    const novoClick = document.createElement('div');
    novoClick.classList.add('upgrade-item');
    novoClick.innerHTML = `
        <p>Aumentar multiplicador cookie em 20%!</p>
        <button class="comprar-click">Comprar por ${precoClick.toFixed(2)} cookies</button>
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
        <button class="comprar-maquina">Comprar por ${precoMaquina.toFixed(2)} cookies</button>
    `;
    listaMaquina.appendChild(novaMaquina);
}

// Função para atualizar o indicador de multiplicador
function atualizarIndicadorMultiplicador() {
    document.getElementById("indicador-multiplicador-cookies").textContent = `Multiplicador cookie: ${multiplicadorCookie + 100}%`;
}

// Função para atualizar o indicador de cookies por segundo
function atualizarIndicadorMaquina() {
    document.getElementById("indicador-maquina-cookies").textContent = `Máquina de cookies: ${cookiesPorSegundo.toFixed(1)} cookies/s`;
}
