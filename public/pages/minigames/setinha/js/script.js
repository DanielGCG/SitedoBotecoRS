// Obtendo os elementos do DOM antes de utilizá-los
const elementoJogo = document.getElementById('jogo');
const elementoPontuacao = document.getElementById('pontuacao');
const linhaSuperior = document.getElementById('linha-superior');
const linhaInferior = document.getElementById('linha-inferior');

// Calculando a altura da tela de jogo
const ALTURA_TELA = elementoJogo.offsetHeight;  // Obtém a altura real da tela de jogo

// Calculando a posição das linhas superior e inferior
const POSICAO_LINHA_SUPERIOR = linhaSuperior.offsetTop;
const POSICAO_LINHA_INFERIOR = linhaInferior.offsetTop;

// Outras constantes do jogo
let VELOCIDADE_SETAS = 1.20; // Pixels por loop
let PROBABILIDADE_NOVA_SETA = 0.005; // Probabilidade de criar nova seta a cada loop

// Variáveis do jogo
const pistas = [0, 1, 2, 3];
const teclasSetas = ['ArrowLeft', 'ArrowUp', 'ArrowDown', 'ArrowRight'];
let pontuacao = 0;
let setas = [];

function criarSeta() {
    const indicePista = pistas[Math.floor(Math.random() * pistas.length)];
    const elementoSeta = document.createElement('div');
    elementoSeta.classList.add('seta');
    elementoSeta.style.left = `${indicePista * 25}%`;
    elementoSeta.style.top = `${ALTURA_TELA}px`; // Começa da parte inferior da tela
    elementoSeta.dataset.pista = indicePista;
    elementoSeta.textContent = indicePista === 0 ? '←' : indicePista === 1 ? '↑' : indicePista === 2 ? '↓' : '→';
    elementoJogo.appendChild(elementoSeta);
    setas.push(elementoSeta);
}

function moverSetas() {
    setas.forEach((seta, indice) => {
        const topoAtual = parseInt(seta.style.top);
        if (topoAtual <= POSICAO_LINHA_SUPERIOR) { // Quando a seta ultrapassa o topo
            elementoJogo.removeChild(seta);
            setas.splice(indice, 1);
            pontuacao = Math.max(0, pontuacao - 1); // Reduz um ponto, sem permitir valores negativos
            atualizarPontuacao();
        } else {
            seta.style.top = `${topoAtual - VELOCIDADE_SETAS}px`;
        }
    });
}

function mudaRegras() {
    let inputVelocidade = parseFloat(document.getElementById('velocidade').value);

    // Verifica se o valor do input é válido e calcula a nova velocidade
    if (!isNaN(inputVelocidade)) {
        inputVelocidade = inputVelocidade / 100;  // Converte a porcentagem para um número entre 0 e 1
        VELOCIDADE_SETAS = inputVelocidade * 3;  // Calcula a velocidade final com base na proporção
    } else {
        VELOCIDADE_SETAS = 1.20; // Valor padrão, caso não haja um valor válido no input
    }

    // Limpa o campo de entrada
    document.getElementById('velocidade').value = '';
}

function atualizarPontuacao() {
    elementoPontuacao.textContent = `Pontuação: ${pontuacao}`;
}

window.addEventListener('keydown', (evento) => {
    const indicePista = teclasSetas.indexOf(evento.key);
    if (indicePista !== -1) {
        const setaCorrespondente = setas.find(seta => 
            parseInt(seta.dataset.pista) === indicePista &&
            parseInt(seta.style.top) >= POSICAO_LINHA_INFERIOR &&
            parseInt(seta.style.top) <= POSICAO_LINHA_SUPERIOR
        );
        if (setaCorrespondente) {
            elementoJogo.removeChild(setaCorrespondente);
            setas = setas.filter(seta => seta !== setaCorrespondente);
            pontuacao++;
        } else {
            pontuacao = Math.max(0, pontuacao - 1);
        }
        atualizarPontuacao();
    }
});

function loopJogo() {
    if (Math.random() < PROBABILIDADE_NOVA_SETA) criarSeta();
    moverSetas();
    requestAnimationFrame(loopJogo);
}

loopJogo();