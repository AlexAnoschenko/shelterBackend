const { Schema, model } = require('mongoose');

const Shelter = new Schema({
  name: { type: String },
  square: { type: String },
  capacity: { type: String },
  description: { type: String },
  location: { type: String },
  rooms: { type: String },
  resources: { type: String },
});

module.exports = new model('Shelter', Shelter);
