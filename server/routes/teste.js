const express = require('express');
const multer = require('multer');
const { getStorage, ref: stRef, listAll, getDownloadURL, uploadBytes, deleteObject, getBytes } = require('firebase/storage');
const { ref: dbRef, update, push, get, set, remove } = require('firebase/database');
const storage = multer.memoryStorage();
const upload = multer({ storage });
const { database } = require('../config/firebase');
const router = express.Router();
const puppeteer = require('puppeteer');

async function scrapeStopHtml(page, targetUrl, stopId) {
  console.log(`A navegar para: ${targetUrl}`);
  await page.goto(targetUrl, { waitUntil: 'networkidle2', timeout: 60000 });

  // A gestão de cookies só precisa ser feita na primeira navegação, mas podemos mantê-la aqui por segurança.
  try {
    const cookieButtonSelector = '#onetrust-accept-btn-handler';
    await page.waitForSelector(cookieButtonSelector, { visible: true, timeout: 5000 });
    console.log('Botão de cookies encontrado. A clicar...');
    await page.click(cookieButtonSelector);
    await new Promise(r => setTimeout(r, 1000));
  } catch (error) {
    console.log('Banner de cookies não encontrado ou já aceite para esta URL.');
  }

  const stopSelector = `div#stop-${stopId}`;
  console.log(`A aguardar pelo seletor do ponto: ${stopSelector}`);
  await page.waitForSelector(stopSelector, { visible: true, timeout: 30000 });

  console.log(`A clicar no elemento via page.evaluate: ${stopSelector}`);
  await page.evaluate((selector) => {
    document.querySelector(selector)?.click();
  }, stopSelector);

  const scheduleSelector = `${stopSelector} .arrivals`;
  console.log(`A aguardar pelo conteúdo de chegada em: ${scheduleSelector}`);
  await page.waitForSelector(scheduleSelector, { visible: true, timeout: 30000 });
  console.log('Conteúdo com os horários carregado!');
  
  await page.screenshot({ path: `depois_clique_${stopId}.png` });

  return page.$eval(stopSelector, (el) => {
    el.querySelector('.more-info')?.remove();
    el.querySelectorAll('mv-spinner').forEach(spinner => spinner.remove());
    return el.innerHTML;
  });
}

router.get('/get-directions', async (req, res) => {
  // Espera URLs e stopIds como strings separadas por vírgula
  const { urls, stopIds } = req.query;

  // 1. VALIDAÇÃO DOS PARÂMETROS DE ENTRADA
  if (!urls || !stopIds) {
    return res.status(400).send('Os parâmetros `urls` e `stopIds` são obrigatórios e devem ser separados por vírgula.');
  }

  const urlsArray = urls.split(',');
  const stopIdsArray = stopIds.split(',');

  if (urlsArray.length !== stopIdsArray.length) {
    return res.status(400).send('O número de URLs deve ser igual ao número de stopIds.');
  }

  let browser;
  try {
    console.log('A iniciar o navegador Puppeteer...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });

    const page = await browser.newPage();
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/115.0.0.0 Safari/537.36'
    );
    await page.setViewport({ width: 1366, height: 768 });

    const allHtmlContents = [];

    // Itera sobre cada par de URL e stopId
    for (let i = 0; i < urlsArray.length; i++) {
      const targetUrl = urlsArray[i];
      const stopId = stopIdsArray[i];
      console.log(`\n--- A processar Linha ${i + 1}/${urlsArray.length} ---`);
      try {
        const divContent = await scrapeStopHtml(page, targetUrl, stopId);
        if (divContent) {
          allHtmlContents.push(divContent);
        }
      } catch (e) {
        console.error(`Falha ao extrair dados para a URL: ${targetUrl} e Ponto: ${stopId}. Erro: ${e.message}`);
        // Opcional: pode-se adicionar um HTML de erro ao resultado
        allHtmlContents.push(`<div>Ocorreu um erro ao buscar os dados para o ponto ${stopId}.</div>`);
      }
    }

    // Junta todo o HTML recolhido numa única string
    if (allHtmlContents.length > 0) {
      res.send(allHtmlContents.join(''));
    } else {
      res.status(404).send('Não foi encontrado conteúdo para nenhum dos pontos e linhas especificados.');
    }

  } catch (error) {
    console.error('Erro geral no processo de scraping:', error);
    if (browser) {
      const pages = await browser.pages();
      if (pages[0]) await pages[0].screenshot({ path: 'erro_fatal.png', fullPage: true });
    }
    res.status(500).send("Erro no servidor ao tentar fazer o scraping. Verifique os logs.");
  } finally {
    if (browser) {
      await browser.close();
      console.log('Navegador fechado.');
    }
  }
});

module.exports = router;