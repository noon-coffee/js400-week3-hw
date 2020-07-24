const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  genre: { type: String },
  ISBN: { 
    type: String, 
    required: true, 
    index: true,
    unique: true, 
  },
  authorId: { 
    type: String,
    required: true, 
    index: true },
  blurb: { type: String },
  publicationYear: { type: Number, required: true },
  pageCount: { type: Number, required: true }
});

//enable text searching on genre and blurb
bookSchema.index({genre: 'text', blurb: 'text'});

module.exports = mongoose.model("books", bookSchema);