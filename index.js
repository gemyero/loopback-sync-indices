const {autoUpdateDatasourceModels, waitForBoot, findMongoDatasources, waitForConnect} = require('./lib/helpers');

module.exports = (app, options = {}) => {
  waitForBoot(app, () => {
    const mongoDatasources = findMongoDatasources(app);
    mongoDatasources.forEach(dataSource => {
      waitForConnect(dataSource, () => {
        autoUpdateDatasourceModels(app, dataSource, options);
      });
    });
  });
};