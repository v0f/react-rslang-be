const wordRepo = require('./aggregatedWord.db.repository');

const getAll = async (userId, group, page, perPage, filter) =>
  wordRepo.getAll(userId, group, page, perPage, filter);

const getWordsCounts = async (userId, group) =>
  wordRepo.getWordsCounts(userId, group);

const getUserWordsForTextbook = async (userId, group, page) =>
  wordRepo.getUserWordsForTextbook(userId, group, page);

const get = async (wordId, userId) => wordRepo.get(wordId, userId);

module.exports = { getAll, get, getWordsCounts, getUserWordsForTextbook };
