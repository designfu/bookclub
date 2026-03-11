import * as express from 'express';
import * as mongoLayers from 'utils/mongo-layers';
import { requireAuthentication, requireAdmin } from 'middleware';
import { VotingSessionModel } from 'schemas/voting-session';
const routes = express.Router();

routes.get('/', mongoLayers.findAll(VotingSessionModel));
routes.get('/current',
  (req, res) => {
    VotingSessionModel.getCurrentSession()
      .then(currentSession => {
        if (currentSession) {
          res.status(200).json(currentSession);
        } else {
          res.status(404).json({});
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send(err);
      });
  }
);
routes.get('/latest',
  (req, res) => {
    VotingSessionModel.find({}).sort({ 'dates.finished': 'descending' })
      .then(sessions => {
        if (sessions[0]) {
          res.status(200).json(sessions[0]);
        } else {
          res.status(404).json({});
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send(err);
      });
  }
);
routes.get('/latest-with-user-votes',
  requireAuthentication,
  (req, res) => {
    const user = req.user as any;
    const userId = user && user._id ? user._id.toString() : null;
    if (!userId) {
      return res.status(401).send('Not authenticated.');
    }
    VotingSessionModel.find({
      'dates.finished': {
        $exists: true,
      },
      'votes.user': userId,
    }).sort({ 'dates.finished': 'descending' })
      .then(sessions => {
        if (sessions[0]) {
          res.status(200).json(sessions[0]);
        } else {
          res.status(404).json({});
        }
      })
      .catch(err => {
        console.log(err);
        res.status(500).send(err);
      });
  }
);
routes.get('/:_id', mongoLayers.findOne(VotingSessionModel));
routes.post('/',
  requireAuthentication,
  requireAdmin,
  mongoLayers.createOne(VotingSessionModel)
);
routes.patch('/:_id',
  requireAuthentication,
  requireAdmin,
  mongoLayers.patchOne(VotingSessionModel)
);
routes.put('/:_id',
  requireAuthentication,
  requireAdmin,
  mongoLayers.putOne(VotingSessionModel)
);
routes.delete('/:_id',
  requireAuthentication,
  requireAdmin,
  mongoLayers.deleteOne(VotingSessionModel)
);

module.exports = routes;
export {}
