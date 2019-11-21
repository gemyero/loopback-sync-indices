const {
  autoUpdateDatasourceModels, waitForBoot, findMongoDatasources, waitForConnect, autoUpdateMongoModel,
} = require('./lib/helpers');

const syncIndexes = (app, options = {}) => {
  waitForBoot(app, () => {
    const mongoDatasources = findMongoDatasources(app);
    mongoDatasources.forEach((dataSource) => {
      waitForConnect(dataSource, () => {
        autoUpdateDatasourceModels(app, dataSource, options);
      });
    });
  });
};

Object.assign(syncIndexes, {
  autoUpdateMongoModel,
});

module.exports = syncIndexes;
