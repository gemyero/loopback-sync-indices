const autoUpdateMongoModel = require('./lib/index-helpers');

module.exports = (app, dataSource, maxRetries) => {
  app
    .models()
    .filter(model => model.dataSource === dataSource)
    .forEach(autoUpdateMongoModel(maxRetries));
};