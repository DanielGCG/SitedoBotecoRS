function OnLoadingScreen() {
    const novaDiv = document.createElement('div'); // Cria a nova div
    novaDiv.id = "loading"; // Define o ID da nova div

    // Adiciona estilos para centralizar e sobrepor o conteúdo
    novaDiv.style.position = "fixed";
    novaDiv.style.top = "0";
    novaDiv.style.left = "0";
    novaDiv.style.width = "100%";
    novaDiv.style.height = "100%";
    novaDiv.style.backgroundColor = "rgba(0, 0, 0, 0.5)"; // Fundo semitransparente
    novaDiv.style.display = "flex";
    novaDiv.style.justifyContent = "center";
    novaDiv.style.alignItems = "center";
    novaDiv.style.zIndex = "9999"; // Garante que está acima de tudo

    // Adiciona o conteúdo HTML (a imagem de carregamento)
    novaDiv.innerHTML = `
        <img style="max-height: 300px; width: auto;" src="/img/carregando.gif" alt="Carregando..." />
    `;

    // Adiciona a nova div ao corpo da página
    document.body.appendChild(novaDiv);
}


function OffLoadingScreen() {
    const loadingDiv = document.getElementById("loading");
    if (loadingDiv) {
        loadingDiv.remove(); // Remove a div do DOM
    }
}