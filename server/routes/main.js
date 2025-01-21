const express = require('express');
const router = express.Router();

/* ----- INICIO ----- */

router.get('', (req, res) => {
    const locals = {
        title: "Site do Boteco do R$",
        description: "Oficial hein! :D"
    }
    res.render('pages/inicial/index', { locals: locals });
});

router.get('/sugerir', (req, res) => {
    const locals = {
        title: "Sugerir Imagem do Dia",
        description: "deixe a sua imagem na fila!"
    }
    res.render('pages/inicial/sugerir', { locals: locals });
});

/* ------ WATCHLIST ------*/

router.get('/lista', (req, res) => {
    const locals = {
        title: "Lista de Filmes/Séries",
        description: "Oficial hein! :D"
    }
    res.render('pages/lista', { locals: locals });
});

router.get('/watchlist', (req, res) => {
    const locals = {
        title: "Lista de Filmes/Séries",
        description: "Oficial hein! :D"
    }
    res.render('pages/watchlist', { locals: locals });
});

/* ------ Cutucar ------*/

router.get('/cutucar', (req, res) => {
    const locals = {
        title: "Cutucar",
        description: "Cuidado!"
    }
    res.render('pages/cutucar', { locals: locals });
});

/* ------ Minigames ------*/

router.get('/games', (req, res) => {
    const locals = {
        title: "Minijogos!",
        description: "oba minujogos!"
    }
    res.render('pages/minigames/minigames', { locals: locals });
});

router.get('/minigames', (req, res) => {
    const locals = {
        title: "Minijogos!",
        description: "oba minijogos!"
    }
    res.render('pages/minigames/minigames', { locals: locals });
});

router.get('/minigames/cookie', (req, res) => {
    const locals = {
        title: "cookie!",
        description: "aperte muitos cookies!"
    }
    res.render('pages/minigames/cookieclicker', { locals: locals });
});

router.get('/minigames/setinha', (req, res) => {
    const locals = {
        title: "setinhas!",
        description: "tá rápido ne rapaz"
    }
    res.render('pages/minigames/setinha', { locals: locals });
});

router.get('/minigames/quadrados', (req, res) => {
    const locals = {
        title: "quadrados!",
        description: "⬜"
    }
    res.render('pages/minigames/quadrados', { locals: locals });
});

/* ------ SOBRE ------*/

router.get('/about', (req, res) => {
    const locals = {
        title: "Sobre",
        description: "Oficial hein! :D"
    }
    res.render('pages/about', { locals: locals });
});

/* ------ GALERIA ------*/

router.get('/galeria', (req, res) => {
    const locals = {
        title: "Hall da Galeria",
        description: "Aqui tem bastante arte!"
    }
    res.render('pages/galeria/galeria', { locals: locals });
});

router.get('/galeria/jogador', (req, res) => {
    const locals = {
        title: "JogadorStickman!!!",
        description: "furro?!"
    }
    res.render('pages/galeria/jogador', { locals: locals });
});

router.get('/galeria/pokebsmp', (req, res) => {
    const locals = {
        title: "Destaques do Boteco",
        description: "Só coisa boa"
    }
    res.render('pages/galeria/pokebsmp', { locals: locals });
});

router.get('/galeria/pets', (req, res) => {
    const locals = {
        title: "Pets do Boteco",
        description: "Muitos mini-queridos."
    }
    res.render('pages/galeria/pets', { locals: locals });
});

router.get('/galeria/destaques', (req, res) => {
    const locals = {
        title: "Destaques do Boteco",
        description: "Só coisa boa"
    }
    res.render('pages/galeria/destaques', { locals: locals });
});

router.get('/galeria/shitpost', (req, res) => {
    const locals = {
        title: "Muito cocôpost",
        description: "Cuidado."
    }
    res.render('pages/galeria/shitpost', { locals: locals });
});

/* ------ EASTER EGGS ------*/

router.get('/velas', (req, res) => {
    const locals = {
        title: "Velas",
        description: "VelasVelasVelasVelasVelasVelasVelas"
    }
    res.render('pages/eastereggs/velas', { locals: locals });
});

router.get('/carolls', (req, res) => {
    const locals = {
        title: "carolls",
        description: "carollscarollscarollscarolls"
    }
    res.render('pages/eastereggs/carolls', { locals: locals });
});

router.get('/pokebsmp', (req, res) => {
    const locals = {
        title: "PokeBSMP",
        description: "Site oficial do PokeBSMP"
    }
    res.render('pages/inicial/pokebsmp', { locals: locals });
});

router.get('/notificacoes', (req, res) => {
    const locals = {
        title: "Match!",
        description: "Veja quem é muito você!"
    }
    res.render('pages/experimentais/notificacoes', { locals: locals });
});

/* ------ TESTE ------*/

router.get('/teste', (req, res) => {
    const locals = {
        title: "teste",
        description: "testetesteteste"
    }
    res.render('pages/experimentais/teste', { locals: locals });
});

router.get('/teste3', (req, res) => {
    const locals = {
        title: "teste",
        description: "testetesteteste"
    }
    res.render('pages/experimentais/teste3', { locals: locals });
});

router.get('/mensages', (req, res) => {
    const locals = {
        title: "teste",
        description: "testetesteteste"
    }
    res.render('pages/experimentais/mensages', { locals: locals });
});

/* ------ FORUM ------*/

router.get('/forum/autenticacao', (req, res) => {
    const locals = {
        title: "Autenticação",
        description: "forumforumforum"
    }
    res.render('pages/forum/autenticacao', { locals: locals });
});


router.get('/forum', (req, res) => {
    const locals = {
        title: "forum",
        description: "forumforumforum"
    };

    res.render('pages/forum/forum', {
        layout: 'layouts/forum-esq-dir',
        locals: locals
    });
});

router.get('/forum/user', (req, res) => {
    const locals = {
        title: "Usuário",
        description: "forumforumforum"
    };

    res.render('pages/forum/user', {
        layout: 'layouts/forum-esq',
        locals: locals
    });
});

router.get('/forum/post', (req, res) => {
    const locals = {
        title: "forum",
        description: "forumforumforum"
    }
    res.render('pages/forum/post', { locals: locals });
});

router.get('/forum/discussao', (req, res) => {
    const locals = {
        title: "forum",
        description: "forumforumforum"
    };

    res.render('pages/forum/discussao', {
        layout: 'layouts/forum-esq-dir',
        locals: locals
    });
});

router.get('/forum/novadiscussao', (req, res) => {
    const locals = {
        title: "forum",
        description: "forumforumforum"
    }
    res.render('pages/forum/novadiscussao', { locals: locals });
});

/* ------ Página de TRABALHO DE ALA ------*/

// Rota para página de recomendações
router.get('/filmedagalera', (req, res) => {
    const locals = {
        title: "Filme da Galera",
        description: "Trabalho de ALA"
    }
    res.render('pages/filmedagalera/filmedagalera', { locals: locals });
});

// Rota para página de o questionário das recomendações
router.get('/filmedagalera/questionario', (req, res) => {
    const locals = {
        title: "Questionário",
        description: "Responda com sinceridade!"
    }
    res.render('pages/filmedagalera/questionario', { locals: locals });
});

// Rota para página de o match das recomendações
router.get('/filmedagalera/match', (req, res) => {
    const locals = {
        title: "Match!",
        description: "Veja quem é muito você!"
    }
    res.render('pages/filmedagalera/match', { locals: locals });
});

/* ------ SEM HEADER ------*/

router.get('/noheader/galeria/pokebsmp', (req, res) => {
    const locals = {
        title: "PokeBSMP",
        description: "Página do pokeBSMP"
    };

    res.render('pages/galeria/pokebsmp_reduzido', {
        layout: 'layouts/noheader',
        locals: locals
    });
});

router.get('/noheader/galeria/pokebsmp', (req, res) => {
    const locals = {
        title: "PokeBSMP",
        description: "Página do pokeBSMP"
    };

    res.render('pages/galeria/pokebsmp_reduzido', {
        layout: 'layouts/noheader',
        locals: locals
    });
});

router.get('/teste2', (req, res) => {
    const locals = {
        title: "teste2",
        description: "testetesteteste"
    };

    res.render('pages/experimentais/teste2', {
        layout: 'layouts/noheader',
        locals: locals
    });
});

/* ------ SERVIÇO ------*/

// Rota para página em manutenção
router.get('/manutencao', (req, res) => {
    const locals = {
        title: "Manutenção",
        description: "Página atualmente em manutenção..."
    }
    res.status(503);
    res.render('pages/servico/503', {
        layout: 'layouts/noheader',
        locals: locals
    });
});

// Rota para página não encontrada
router.use((req, res) => {
    const locals = {
        title: "Página não encontrada",
        description: "Se ferrou KKKKKK"
    }
    res.status(404);
    res.render('pages/servico/404', {
        layout: 'layouts/noheader',
        locals: locals
    });
});

module.exports = router;
