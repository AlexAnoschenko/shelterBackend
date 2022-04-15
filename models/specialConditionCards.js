const { Schema, model } = require('mongoose');

const SpecialConditionCards = new Schema({
  specialConditionCards: { type: Array },
});

module.exports = new model('SpecialConditionCards', SpecialConditionCards);
