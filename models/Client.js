const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ClientSchema = new Schema({
  username: String,
  IDBooksBorrowed: [Number] // Just store the book IDs as numbers
});

module.exports = mongoose.model('Client', ClientSchema);