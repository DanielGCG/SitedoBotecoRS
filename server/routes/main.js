const express = require('express');
const router = express.Router();

// Routes
router.get('', (req, res) =>{
    const locals = {
        title: "Site do Boteco do R$",
        description: "Oficial hein! :D"
    }

    res.render('index', { locals });
});

router.get('/lista', (req, res) =>{
    res.render('lista');
});


router.get('/about', (req, res) =>{
    res.render('about');
});

module.exports = router;