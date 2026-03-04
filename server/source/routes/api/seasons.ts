import * as express from 'express';
import * as mongoLayers from 'utils/mongo-layers';
import { requireAuthentication, requireAdmin, setReqDate } from 'middleware';
import { SeasonModel } from 'schemas/season';
import { VotingSessionModel } from 'schemas/voting-session';
import { BookModel } from 'schemas/book';
const routes = express.Router();

routes.get('/', mongoLayers.findAll(SeasonModel));
routes.get('/current',
  async (req, res) => {
    try {
      const openSeason = await SeasonModel.getOpenSeason();
      const previousSeason = await SeasonModel.getPreviousSeason();
      res.status(200).json({
        current: openSeason,
        previous: previousSeason,
      });
    } catch(err) {
      console.log(err);
      res.status(500).send(err);
    }
  }
);
routes.get('/:_id', mongoLayers.findOne(SeasonModel));

routes.patch('/:_id',
  requireAuthentication,
  requireAdmin,
  async (req, res) => {
    const patch = {
      title: req.body.title,
    };
    try {
      const seasonTransaction = await SeasonModel.updateOne({ _id: req.params._id }, {
        "$set": patch,
      });

      const season = await SeasonModel.findById({ _id: req.params._id });

      res.header('Transactions', JSON.stringify({
        season: seasonTransaction,
      }));

      res.status(200).json(season);
    } catch(err) {
      console.log(err);
      res.status(500).send(err);
    }
  },
);

routes.delete('/:_id',
  requireAuthentication,
  requireAdmin,
  async (req, res) => {
    try {
      const season = await SeasonModel.findById(req.params._id);
      if(!season) {
        return res.status(404).json({ error: 'Season not found.' });
      }

      if(!season.dates || !season.dates.finished) {
        return res.status(400).json({ error: 'Only completed seasons can be deleted.' });
      }

      const seasonTransaction = await SeasonModel.deleteOne({ _id: req.params._id });
      let votingSessionTransaction = null;
      if(season.votingSession) {
        votingSessionTransaction = await VotingSessionModel.deleteOne({ _id: season.votingSession });
      }
      let bookFinishedTransaction = null;
      let bookChosenTransaction = null;
      if(season.book && season.dates) {
        if(season.dates.finished) {
          // Only clear finished when it corresponds to this season's completed timestamp.
          bookFinishedTransaction = await BookModel.updateOne({
            _id: season.book,
            'dates.finished': season.dates.finished,
          }, {
            $unset: { 'dates.finished': 1 },
          });
        }

        if(season.dates.started) {
          // Only clear chosen when it corresponds to this season's chosen/start timestamp.
          bookChosenTransaction = await BookModel.updateOne({
            _id: season.book,
            'dates.chosen': season.dates.started,
          }, {
            $unset: { 'dates.chosen': 1 },
          });
        }
      }

      return res.status(200).json({
        seasonId: req.params._id,
        votingSessionId: season.votingSession || null,
        transactions: {
          season: seasonTransaction,
          votingSession: votingSessionTransaction,
          bookFinished: bookFinishedTransaction,
          bookChosen: bookChosenTransaction,
        },
      });
    } catch(err) {
      console.log(err);
      return res.status(500).send(err);
    }
  },
);

// =============
// === GOALS ===
// =============

routes.post('/:_id/goals',
  requireAuthentication,
  requireAdmin,
  setReqDate('created'),
  (req, res, next) => {
    SeasonModel.updateOne({ _id: req.params._id }, {
      "$push": {
        "goals": req.body,
      },
    }).then(transaction => {
      res.header('Transaction', JSON.stringify(transaction));
      return SeasonModel.findById({ _id: req.params._id });
    })
      .then(entry => {
        res.status(200).json(entry);
      })
      .catch(err => {
        console.log(err);
        res.status(500).send(err);
      });
  },
);

routes.patch('/:seasonId/goals/:goalId',
  requireAuthentication,
  requireAdmin,
  setReqDate('created'),
  (req, res, next) => {
    SeasonModel.updateOne({
      _id: req.params.seasonId,
      'goals._id': req.params.goalId,
    }, {
      "$set": {
        "goals.$": req.body,
      },
    }).then(transaction => {
      res.header('Transaction', JSON.stringify(transaction));
      return SeasonModel.findById({ _id: req.params.seasonId });
    })
      .then(entry => {
        res.status(200).json(entry);
      })
      .catch(err => {
        console.log(err);
        res.status(500).send(err);
      });
  },
);

routes.delete('/:seasonId/goals/:goalId',
  requireAuthentication,
  requireAdmin,
  setReqDate('created'),
  (req, res, next) => {
    SeasonModel.updateOne({
      _id: req.params.seasonId,
    }, {
      "$pull": {
        "goals": {
          _id: req.params.goalId,
        },
      },
    }).then(transaction => {
      res.header('Transaction', JSON.stringify(transaction));
      return SeasonModel.findById({ _id: req.params.seasonId });
    })
      .then(entry => {
        res.status(200).json(entry);
      })
      .catch(err => {
        console.log(err);
        res.status(500).send(err);
      });
  },
);

module.exports = routes;
export {}
