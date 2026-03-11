import * as express from 'express';
import passport from 'passport';
import Config from 'config';
import { Environment } from '@shared/types';
import { UserModel } from 'schemas/user';
const routes = express.Router();
const DEV_SWITCH_ENABLED = Config.ENV === Environment.LOCAL && process.env.AUTH_BYPASS === 'true';

routes.get('/logout', (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err);
    }
    res.redirect('/');
  });
});

routes.get('/google',
  passport.authenticate('google', {
    scope: ['https://www.googleapis.com/auth/plus.login'],
    session: true
  }));

routes.get('/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/' // maybe /login-failed in the future
  }), (req, res) => {
    res.redirect('/');
  });

routes.get('/switch-user/:userId', async (req, res, next) => {
  if (!DEV_SWITCH_ENABLED) {
    return res.status(404).send('Not found.');
  }
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return res.status(403).send('Must be signed in to continue');
  }
  try {
    const user = await (UserModel as any).findById(req.params.userId).exec();
    if (!user) {
      return res.status(404).send('User not found.');
    }
    req.login(user, (err) => {
      if (err) {
        return next(err);
      }
      res.redirect('/');
    });
  } catch (err) {
    next(err);
  }
});

module.exports = routes;
export {}
