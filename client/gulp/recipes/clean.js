const { deleteAsync } = require('del');

module.exports = (config) => {
  return () => {
    return deleteAsync(config.input, { force: true });
  }
};
