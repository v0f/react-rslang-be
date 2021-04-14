const mongoose = require('mongoose');

const Word = require('../words/word.model');
const { NOT_FOUND_ERROR } = require('../../errors/appErrors');
const ENTITY_NAME = 'user word';

const lookup = {
  $lookup: {
    from: 'userWords',
    let: { word_id: '$_id' },
    pipeline: [
      {
        $match: {
          $expr: {
            $and: [
              { $eq: ['$userId', null] },
              { $eq: ['$wordId', '$$word_id'] }
            ]
          }
        }
      }
    ],
    as: 'userWord'
  }
};

const pipeline = [
  {
    $unwind: {
      path: '$userWord',
      preserveNullAndEmptyArrays: true
    }
  },
  {
    $unset: [
      '__v',
      'userWord._id',
      'userWord.wordId',
      'userWord.userId',
      'userWord.__v'
    ]
  },
  {
    $addFields: { id: '$_id' } // for compatibility with Mongoose virtuals
  }
];

const getAll = async (userId, group, page, perPage, filter) => {
  lookup.$lookup.pipeline[0].$match.$expr.$and[0].$eq[1] = mongoose.Types.ObjectId(
    userId
  );

  const matches = [];

  if (group || group === 0) {
    matches.push({
      $match: {
        group
      }
    });
  }

  if (filter) {
    matches.push({
      $match: {
        ...filter
      }
    });
  }
  const facet = {
    $facet: {
      paginatedResults: [{ $skip: page * perPage }, { $limit: perPage }],
      totalCount: [
        {
          $count: 'count'
        }
      ]
    }
  };
  if (perPage) return Word.aggregate([lookup, ...pipeline, ...matches, facet]);
  return Word.aggregate([lookup, ...pipeline, ...matches]);
};

const getWordsCounts = async (userId, group) => {
  lookup.$lookup.pipeline[0].$match.$expr.$and[0].$eq[1] = mongoose.Types.ObjectId(
    userId
  );

  const matches = [];

  if (group || group === 0) {
    matches.push({
      $match: {
        group
      }
    });
  }

  const facet = {
    $facet: {
      difficultCount: [
        {
          $match: {
            $and: [
              { 'userWord.difficulty': 'difficult' },
              { 'userWord.optional.isDeleted': { $ne: true } }
            ]
          }
        },
        { $count: 'count' }
      ],
      deletedCount: [
        { $match: { 'userWord.optional.isDeleted': true } },
        { $count: 'count' }
      ],
      learningCount: [
        {
          $match: {
            $and: [
              { userWord: { $exists: true } },
              { 'userWord.optional.isDeleted': { $ne: true } }
            ]
          }
        },
        { $count: 'count' }
      ]
    }
  };
  return Word.aggregate([lookup, ...pipeline, ...matches, facet]);
};

const getUserWordsForTextbook = async (userId, group, page) => {
  lookup.$lookup.pipeline[0].$match.$expr.$and[0].$eq[1] = mongoose.Types.ObjectId(
    userId
  );

  const matches = [];

  matches.push({
    $match: {
      'userWord.optional.isDeleted': { $ne: true }
    }
  });

  const facet = {
    $facet: {
      words: [{ $match: { group, page } }],
      pagination: [
        { $group: { _id: '$page', page: { $first: '$page' } } },
        { $sort: { page: 1 } }
      ]
    }
  };
  return Word.aggregate([lookup, ...pipeline, ...matches, facet]);
};

const get = async (wordId, userId) => {
  lookup.$lookup.pipeline[0].$match.$expr.$and[0].$eq[1] = mongoose.Types.ObjectId(
    userId
  );

  const match = {
    $match: {
      _id: mongoose.Types.ObjectId(wordId)
    }
  };

  const userWord = await Word.aggregate([match, lookup, ...pipeline]);
  if (!userWord) {
    throw new NOT_FOUND_ERROR(ENTITY_NAME, { wordId, userId });
  }

  return userWord;
};

module.exports = { getAll, get, getWordsCounts, getUserWordsForTextbook };
