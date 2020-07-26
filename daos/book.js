const mongoose = require('mongoose');

const Book = require('../models/book');

module.exports = {};

module.exports.getAll = (page, perPage, authorId) => {
  //return Book.find().limit(perPage).skip(perPage*page).lean();

  //Include filter for authorId if specified and modified to use aggregate query
  let findFilter = authorId ? { authorId : authorId } : {}
  return Book
    .aggregate([
      { $match : findFilter },
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
    ? [ //includeAuthorInfo = true
      { $match: {} },
      { $sort: {_id: -1 }}, 
      { $group: {
        _id: "$authorId", 
        averagePageCount: {$avg: "$pageCount"},
        titles: { $addToSet: "$title"},
      }},
      { $project: {
        _id: 0, 
        authorId: { $toObjectId: "$_id" },
        averagePageCount: 1, 
        numBooks: { $size: "$titles" },  
        titles: 1
      }},
      { $lookup: {
        from: "authors",
        localField: "authorId",
        foreignField: "_id",
        as: "author"
      }},
      { $unwind: '$author' }
    ]
    : [ //includeAuthorInfo = false
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
    if (e.message.includes('validation failed') || 
      e.message.includes('E11000')) { //Check for unique index error based on error code(?)
      throw new BadDataError(e.message);
    }
    throw e;
  }
}

class BadDataError extends Error {};
module.exports.BadDataError = BadDataError;