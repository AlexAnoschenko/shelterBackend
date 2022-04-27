const { Schema, model } = require('mongoose');

const Room = new Schema({
  users: { type: Array, ref: 'Users' },
  shelter: { type: Object },
  apocalypse: { type: Object },
  numberOfPlayers: { type: Number },
  isEndGame: { type: Boolean },
  isDraw: { type: Boolean },
  drawPlayers: { type: Array },
});

module.exports = new model('Room', Room);
