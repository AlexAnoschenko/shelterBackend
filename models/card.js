const { Schema, model } = require('mongoose');

const Card = new Schema({
  cards: { type: Array },
});

module.exports = new model('Card', Card);
