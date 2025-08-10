const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  _id: { type: Number },
  title: String,
  author: String,
  available: Boolean
}) 

module.exports = mongoose.model('books', BookSchema);
