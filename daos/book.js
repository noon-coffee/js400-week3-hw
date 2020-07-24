const mongoose = require('mongoose');

const Book = require('../models/book');

module.exports = {};

module.exports.getAll = (page, perPage, authorId) => {
  //return Book.find().limit(perPage).skip(perPage*page).lean();

  let authorFilter = authorId 
    ? { authorId : mongoose.Types.ObjectId(authorId) }
    : { authorId : {$exists: true} }

  return Book
    .aggregate([
      { $match : authorFilter },
      { $skip: perPage*page },
      { $limit: perPage },
    ]);
}

module.exports.search = (term) => {
  return Book
  .find(
    { $text: { $search: term } },
    { score: { $meta: "textScore" } }
  )
  .sort(
    { score: { $meta: "textScore" } }
  )
}

module.exports.getAuthorStats = (includeAuthorInfo) => {
  const aggregationQuery = includeAuthorInfo
    ? [
      { $match: {} },
      { $sort: {_id: -1 }}, 
      { $group: {
        _id: "$authorId", 
        averagePageCount: {$avg: "$pageCount"},
        titles: { $addToSet: "$title"},
      }},
      { $project: {
        _id: 0, 
        authorId: "$_id",
        averagePageCount: 1, 
        numBooks: { $size: "$titles" },  
        titles: 1 }
      },
      // { $lookup: {
      //   from: "authors",
      //   localField: "authorId",
      //   foreignField: "_id",
      //   as: "author"
      // }},
    ]
    : [
      { $match: {} },
      { $sort: {_id: -1 }}, 
      { $group: {
        _id: "$authorId", 
        averagePageCount: {$avg: "$pageCount"},
        titles: { $addToSet: "$title"},
      }},
      { $project: {
        _id: 0, 
        authorId: "$_id",
        averagePageCount: 1, 
        numBooks: { $size: "$titles" },  
        titles: 1 }
      },
      //{$sort: {authorId: 1}},
    ];

  return Book.aggregate(aggregationQuery);
}

module.exports.getById = (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return null;
  }
  return Book.findOne({ _id: bookId }).lean();
}

module.exports.deleteById = async (bookId) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.deleteOne({ _id: bookId });
  return true;
}

module.exports.updateById = async (bookId, newObj) => {
  if (!mongoose.Types.ObjectId.isValid(bookId)) {
    return false;
  }
  await Book.updateOne({ _id: bookId }, newObj);
  return true;
}

module.exports.create = async (bookData) => {
  try {
    const created = await Book.create(bookData);
    return created;
  } catch (e) {
    if (e.message.includes('validation failed') || e.message.includes('E11000')) {
      throw new BadDataError(e.message);
    }
    throw e;
  }
}

class BadDataError extends Error {};
module.exports.BadDataError = BadDataError;