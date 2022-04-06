const { Schema, model } = require('mongoose');

const Apocalypse = new Schema({
  description: { type: String },
  name: { type: String },
});

module.exports = new model('Apocalypse', Apocalypse);
