const { Schema, model } = require('mongoose');

const User = new Schema({
  name: { type: String, unique: true },
  cards: { type: Array, ref: 'Cards' },
});

module.exports = new model('User', User);
