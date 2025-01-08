function moveBlock(block, directionX, directionY, speed) {

    function animate() {
        
        const currentX = parseFloat(block.style.left);
        const currentY = parseFloat(block.style.top);

        // Apenas mudamos de lugar o bloco quando o jogo está não pausado
        if (!gamePaused) {
            block.style.left = `${currentX + directionX * speed}px`;
            block.style.top = `${currentY + directionY * speed}px`;
        }

        // Remover o bloco se sair da tela
        if (
            currentX < -block.offsetWidth ||
            currentX > gameplayArea.offsetWidth ||
            currentY < -block.offsetHeight ||
            currentY > gameplayArea.offsetHeight
        ) {
            addToScore();
            block.remove();
            return;
        }

        // Continuar a animação
        requestAnimationFrame(animate);
    }

    // Iniciar o movimento
    animate();
}