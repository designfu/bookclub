import Config from 'config';
import { Environment } from '@shared/types';
import { UserModel } from 'schemas/user';

const DEV_BYPASS_ENABLED = Config.ENV === Environment.LOCAL && process.env.AUTH_BYPASS === 'true';

const TEST_USER = {
  googleId: 'dev-test-user',
  name: 'Test Admin',
  avatar: '',
  roles: ['ADMIN'],
  suggestions: [],
  dates: {
    created: new Date(),
  },
};

async function ensureDevUser() {
  let user = await (UserModel as any).findOne({ googleId: TEST_USER.googleId }).exec();
  if(!user) {
    user = await (UserModel as any).create(TEST_USER);
  }
  return user;
}

export function devAuthBypass(req, res, next) {
  if(!DEV_BYPASS_ENABLED) {
    return next();
  }

  if(req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  ensureDevUser()
    .then(user => {
      req.login(user, (err) => {
        if(err) {
          return next(err);
        }
        next();
      });
    })
    .catch(err => {
      next(err);
    });
}

