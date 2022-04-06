const Router = require('express');
const router = new Router();

const cardsController = require('../controllers/cardsController');

router.post('/getCards', cardsController.getCards);

module.exports = router;
