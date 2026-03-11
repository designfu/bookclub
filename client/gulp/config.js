module.exports = function(ENV) {
  const envConfigPath = `../../shared/@env/${ENV.toLowerCase()}-client`;
  const EnvConfig = require(envConfigPath).default;

  return {
    NODE_MODULES: [ 
        'lodash',
        'jquery',
        'lockr'
    ],
    GA: EnvConfig.GA,
    SENTRY: EnvConfig.SENTRY,
    ENV: ENV,
    VERSION: EnvConfig.CLIENT_VERSION,
    JS_BUNDLES: ['global', 'main'],
    EXT: {
      JS: 'ts'
    }
  };
};
