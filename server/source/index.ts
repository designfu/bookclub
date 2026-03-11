import Config from 'config';
import express from 'express';
import session from 'express-session';
import morgan from 'morgan';
import MongoStore from 'connect-mongo';
// import raven from 'raven';
// import initSockets from 'sockets';
import { server } from 'lib/io';
import initPassport from 'lib/passport';
import { mongoURI } from 'lib/mongoose';
import { devAuthBypass } from 'middleware/dev-auth-bypass';
const routes = require('routes');

server.use(morgan('dev'));

server.use(express.static(Config.STATIC_FILES_PATH));
const sessionOptions: any = {
  secret: Config.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
};

sessionOptions.store = MongoStore.create({
  mongoUrl: mongoURI(Config.MONGO_DB),
  autoRemove: 'interval',
});

server.use(session(sessionOptions));
initPassport(server);
server.use(devAuthBypass);
server.use(routes);

// initSockets();

// module.exports = http;
// module.exports = server;
export default server;
