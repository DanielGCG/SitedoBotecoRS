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

router.get('/galeria/destaques', (req, res) => {
    const locals = {
        title: "Destaques do Boteco",
        description: "Só coisa boa"
    }
    res.render('galeria/destaques', { locals: locals });
});

router.get('/galeria/shitpost', (req, res) => {
    const locals = {
        title: "Muito cocôpost",
        description: "Cuidado."
    }
    res.render('galeria/shitpost', { locals: locals });
});

/* ------ EASTER EGGS ------*/


router.get('/velas', (req, res) => {
    const locals = {
        title: "Velas",
        description: "VelasVelasVelasVelasVelasVelasVelas"
    }
    res.render('eastereggs/velas', { locals: locals });
});

router.get('/notificacoes', (req, res) => {
    const locals = {
        title: "Match!",
        description: "Veja quem é muito você!"
    }
    res.render('notificacoes', { locals: locals });
});


/* ------ Página de TRABALHO DE ALA ------*/


// Rota para página de recomendações
router.get('/filmedagalera', (req, res) => {
    const locals = {
        title: "Filme da Galera",
        description: "Trabalho de ALA"
    }
    res.render('filmedagalera/filmedagalera', { locals: locals });
});

// Rota para página de o questionário das recomendações
router.get('/filmedagalera/questionario', (req, res) => {
    const locals = {
        title: "Questionário",
        description: "Responda com sinceridade!"
    }
    res.render('filmedagalera/questionario', { locals: locals });
});

// Rota para página de o match das recomendações
router.get('/filmedagalera/match', (req, res) => {
    const locals = {
        title: "Match!",
        description: "Veja quem é muito você!"
    }
    res.render('filmedagalera/match', { locals: locals });
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
