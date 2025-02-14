function wrapText(ctx, text, maxWidth) {
    const paragraphs = text.split("\n"); // Divide o texto em parágrafos
    let lines = [];
    
    paragraphs.forEach(paragraph => {
      const words = paragraph.split(" ");
      let line = "";
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + " ";
        const testWidth = ctx.measureText(testLine).width;
        
        if (testWidth > maxWidth && i > 0) {
          lines.push(line.trim());
          line = words[i] + " ";
        } else {
          line = testLine;
        }
      }
      lines.push(line.trim());
    });
    return lines;
}

function generateImage() {
  const text = document.getElementById("messageText").value;
  const fileInput = document.getElementById("mediaFile");

  if (!fileInput) {
      console.error("Elemento fileInput não encontrado.");
      return;
  }

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 100;
  canvas.height = 100;

  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "black";
  ctx.font = "9px 'Segoe UI Emoji', 'Noto Color Emoji', sans-serif";
  ctx.textAlign = "center";
  ctx.filter = "blur(0.17px)";

  let lines = wrapText(ctx, text, 90);
  let lineHeight = 12;
  let y = (canvas.height - lines.length * lineHeight) / 2 + lineHeight;

  lines.forEach((line, i) => {
      ctx.fillText(line, canvas.width / 2, y + i * lineHeight);
  });

  const imageDataUrl = canvas.toDataURL("image/png");

  fetch(imageDataUrl)
      .then(res => res.blob())
      .then(blob => {
          const file = new File([blob], "generated-image.png", { type: "image/png" });

          // Criar um novo FileList e atribuir ao input
          const dataTransfer = new DataTransfer();
          dataTransfer.items.add(file);
          fileInput.files = dataTransfer.files;

          // Chamar previewMedia para exibir a imagem gerada
          previewMedia();
      })
      .catch(err => console.error("Erro ao criar a imagem:", err));
}

function enableBrat () {
  bratEnabled = true;
  generateImage();
  previewMedia();
  document.getElementById("messageText").addEventListener("input", generateImage);
}

function disableBrat() {
  bratEnabled = false;
  document.getElementById("messageText").removeEventListener("input", generateImage);
}

