const { OK } = require('http-status-codes');
const router = require('express').Router({ mergeParams: true });

const { wordId } = require('../../utils/validation/schemas');
const { validator } = require('../../utils/validation/validator');
const aggregatedWordsService = require('./aggregatedWord.service');
const { BAD_REQUEST_ERROR } = require('../../errors/appErrors');
const extractQueryParam = require('../../utils/getQueryNumberParameter');

router.get('/', async (req, res) => {
  const perPage = extractQueryParam(req.query.wordsPerPage, 10);
  const page = extractQueryParam(req.query.page, 0);
  const group = extractQueryParam(req.query.group);

  if ((req.query.group && isNaN(group)) || isNaN(page) || isNaN(perPage)) {
    throw new BAD_REQUEST_ERROR(
      'Wrong query parameters: the group, page and words-per-page numbers should be valid integers'
    );
  }

  const filter = req.query.filter ? JSON.parse(req.query.filter) : null;

  const words = await aggregatedWordsService.getAll(
    req.userId,
    group,
    page,
    perPage,
    filter
  );
  res.status(OK).send(words);
});

router.get('/stat', async (req, res) => {
  const group = extractQueryParam(req.query.group);

  if (req.query.group && isNaN(group)) {
    throw new BAD_REQUEST_ERROR(
      'Wrong query parameters: the group, page and words-per-page numbers should be valid integers'
    );
  }

  const wordsCounts = await aggregatedWordsService.getWordsCounts(
    req.userId,
    group
  );
  res.status(OK).send(wordsCounts);
});

router.get('/forTextbook', async (req, res) => {
  const group = extractQueryParam(req.query.group);
  const page = extractQueryParam(req.query.page);

  if (req.query.group && isNaN(group)) {
    throw new BAD_REQUEST_ERROR(
      'Wrong query parameters: the group, page and words-per-page numbers should be valid integers'
    );
  }

  const words = await aggregatedWordsService.getUserWordsForTextbook(
    req.userId,
    group,
    page
  );
  res.status(OK).send(words);
});

router.get('/:wordId', validator(wordId, 'params'), async (req, res) => {
  const word = await aggregatedWordsService.get(req.params.wordId, req.userId);

  res.status(OK).send(word);
});

module.exports = router;
