const express = require('express');
const router = express.Router();

/* ----- INICIO ----- */


router.get('', (req, res) => {
    const locals = {
        title: "Site do Boteco do R$",
        description: "Oficial hein! :D"
    }
    res.render('index', { locals: locals });
});


/* ------ WATCHLIST ------*/


router.get('/lista', (req, res) => {
    const locals = {
        title: "Lista de Filmes/Séries",
        description: "Oficial hein! :D"
    }
    res.render('lista', { locals: locals });
});


/* ------ Cutucar ------*/

router.get('/cutucar', (req, res) => {
    const locals = {
        title: "Cutucar",
        description: "Cuidado!"
    }
    res.render('cutucar', { locals: locals });
});

/* ------ SOBRE ------*/

router.get('/about', (req, res) => {
    const locals = {
        title: "Sobre",
        description: "Oficial hein! :D"
    }
    res.render('about', { locals: locals });
});

/* ------ TESTE ------*/

router.get('/teste', (req, res) => {
    const locals = {
        title: "teste",
        description: "testetesteteste"
    }
    res.render('teste', { locals: locals });
});

/* ------ GALERIA ------*/


router.get('/galeria', (req, res) => {
    const locals = {
        title: "Hall da Galeria",
        description: "Aqui tem bastante arte!"
    }
    res.render('galeria', { locals: locals });
});

router.get('/galeria/jogador', (req, res) => {
    const locals = {
        title: "JogadorStickman!!!",
        description: "furro?!"
    }
    res.render('galeria/jogador', { locals: locals });
});

router.get('/galeria/pets', (req, res) => {
    const locals = {
        title: "Pets do Boteco",
        description: "Muitos mini-queridos."
    }
    res.render('galeria/pets', { locals: locals });
});

router.get('/galeria/shitpost', (req, res) => {
    const locals = {
        title: "Muito cocôpost",
        description: "Cuidado."
    }
    res.render('galeria/shitpost', { locals: locals });
});


/* ------ Página de Recomendações ------*/


// Rota para página de recomendações
router.get('/recomendacao', (req, res) => {
    const locals = {
        title: "Recomendações",
        description: "Trabalho 4"
    }
    res.render('recomendacao');
});


/* ------ NÃO ENCONTRADO ------*/


// Rota para página não encontrada
router.use((req, res) => {
    const locals = {
        title: "Página não encontrada",
        description: "Se ferrou KKKKKK"
    }
    res.status(404);
    res.render('layouts/404', { layout: false, locals: locals });
});

module.exports = router;
