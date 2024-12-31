// Função para calcular multiplicador baseado no multiplicador
function calcularMultiplicador(multiplicador) {
    return 1 + multiplicador / 100;
}

// Função para atualizar o preço do upgrade de click
function atualizarPrecoClick(upgrade) {
    return upgrade = upgrade * 1.75;
}

// Função para atualizar o preço do upgrade de maquina
function atualizarPrecoMaquina(upgrade) {
    return upgrade = upgrade * 2;
}

// Função de anti-cheating
function antiCheating(cpsMedio) {
    const agora = Date.now();

    // Ignora análise se o CPS médio é 1 ou menor (usuário AFK ou inativo)
    if (cpsMedio <= 1) return;

    // Outra condição de anticheat: CPS médio muito alto
    if (cpsMedio >= 13) {
        document.getElementById("popup-anticheating").style.display = "flex";
        return
    }

    // Adiciona o CPS atual ao array e mantém o histórico apenas dos últimos 5 segundos
    ultimosCps.push({ timestamp: agora, cps: cpsMedio });
    ultimosCps = ultimosCps.filter(entry => agora - entry.timestamp <= 5000);

    // Verifica a constância dos valores de CPS (analisamos apenas se há múltiplos registros)
    if (ultimosCps.length > 500) {
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