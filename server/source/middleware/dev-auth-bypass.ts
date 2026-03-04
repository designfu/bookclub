import Config from 'config';
import { Environment } from '@shared/types';
import { UserModel } from 'schemas/user';

const DEV_BYPASS_ENABLED = Config.ENV === Environment.LOCAL && process.env.AUTH_BYPASS === 'true';

const DEV_USERS = [
  {
    googleId: 'dev-test-user',
    name: 'Test Admin',
    avatar: '',
    roles: ['ADMIN'],
    suggestions: [],
    dates: { created: new Date() },
  },
  {
    googleId: 'dev-member-1',
    name: 'Sample Member One',
    avatar: '',
    roles: ['MEMBER'],
    suggestions: [],
    dates: { created: new Date() },
  },
  {
    googleId: 'dev-member-2',
    name: 'Sample Member Two',
    avatar: '',
    roles: ['MEMBER'],
    suggestions: [],
    dates: { created: new Date() },
  },
  {
    googleId: 'dev-member-3',
    name: 'Sample Member Three',
    avatar: '',
    roles: ['MEMBER'],
    suggestions: [],
    dates: { created: new Date() },
  },
];

const ADMIN_GOOGLE_ID = 'dev-test-user';
let ensureDevUsersPromise: Promise<any> | null = null;

async function ensureDevUsersAndGetAdmin() {
  for (const userData of DEV_USERS) {
    let user = await (UserModel as any).findOne({ googleId: userData.googleId }).exec();
    if (!user) {
      await (UserModel as any).create(userData);
    }
  }
  return await (UserModel as any).findOne({ googleId: ADMIN_GOOGLE_ID }).exec();
}

export function devAuthBypass(req, res, next) {
  if(!DEV_BYPASS_ENABLED) {
    return next();
  }

  if(req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }

  if(!ensureDevUsersPromise) {
    ensureDevUsersPromise = ensureDevUsersAndGetAdmin();
  }

  ensureDevUsersPromise
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
