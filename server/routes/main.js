const express = require('express');
const router = express.Router();

/* ----- Routes ----- */
router.get('', (req, res) => {
    const locals = {
        title: "Site do Boteco do R$",
        description: "Oficial hein! :D"
    }
    res.render('index', { locals: locals });
});

router.get('/lista', (req, res) => {
    const locals = {
        title: "Lista de Filmes/Séries",
        description: "Oficial hein! :D"
    }
    res.render('lista', { locals: locals });
});

router.get('/galeria', (req, res) => {
    const locals = {
        title: "Galeria",
        description: "Muita arte aqui!"
    }
    res.render('galeria', { locals: locals });
});

router.get('/about', (req, res) => {
    const locals = {
        title: "Sobre",
        description: "Oficial hein! :D"
    }
    res.render('about', { locals: locals });
});

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
