const Router = require('express');
const router = new Router();

const roomsController = require('../controllers/roomsController');

router.post('/createRoom', roomsController.createRoom);
router.post('/createUser', roomsController.createUser);
router.get('/getRoom', roomsController.getRoom);
router.get('/clearRoom', roomsController.clearRoom);
router.post('/voteUser', roomsController.voteUser);

module.exports = router;
