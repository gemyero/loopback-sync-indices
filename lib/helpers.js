const _ = require('lodash');
const { Observable } = require('rxjs');
const { retry } = require('rxjs/operators');

const waitForBoot = (app, cb) => {
  if (app.hasOwnProperty('booting') && app.booting === false) {
    cb();
  } else {
    app.once('booted', cb);
  }
};

const codesToDropIndex = ['IndexOptionsConflict', 'IndexKeySpecsConflict'];
const indexNameMongoErrorRegExp = /name:\s*"?(?<indexName>\w*)/;
const normalizeIndexName = idxName => idxName.replace(/(_1|_index)/g, '');
const reservedIndexes = ['_id_'];

const autoUpdateMongoModel = ({ maxRetryCount = 3, dropIndexes = false }) => (Model) => new Observable((observer) => {
  const { dataSource, dataSource: { connector: { db } } } = Model;
  const collection = db && db.collection(Model.modelName);
  if (!collection) return;

  dataSource.autoupdate([Model.modelName], async (autoUpdateErr) => {
    try {
      // drop Indexes created by loopback for previous configuration of Model
      if (dropIndexes) {
        const DBIndexes = (await collection.indexes())
          .map(idx => idx.name)
          .filter(idxName => !reservedIndexes.includes(idxName));

        const loopbackIndexes = Object.keys(Model.definition.indexes() || {}).map(normalizeIndexName);

        const indexesToBeDropped = DBIndexes
          .filter(indexName => !loopbackIndexes.includes(normalizeIndexName(indexName)));

        const dropIndexesPromises = indexesToBeDropped.map((indexName) => collection.dropIndex(indexName));

        // drop Indexes that requires recreate due to different options
        if (autoUpdateErr && codesToDropIndex.includes(autoUpdateErr.codeName)) {
          const indexName = _.get(autoUpdateErr.message.match(indexNameMongoErrorRegExp), 'groups.indexName');
          dropIndexesPromises.push(collection.dropIndex(indexName));
        }

        await Promise.all(dropIndexesPromises);
      }

      if (autoUpdateErr) throw autoUpdateErr;
      observer.complete();
    } catch (err) {
      if (err.codeName !== 'NamespaceNotFound') {
        observer.error(err);
      }
    }
  });
})
  .pipe(retry(maxRetryCount))
  .toPromise();

const findMongoDatasources = (app) => {
  const mongoDatasources = Object.values(app.datasources).filter(ds => ds.connector.name === 'mongodb');
  return _.uniq(mongoDatasources);
};

const autoUpdateDatasourceModels = (app, dataSource, options) => {
  app
    .models()
    .filter(model => model.dataSource === dataSource)
    .forEach(autoUpdateMongoModel(options));
};

const waitForConnect = (dataSource, cb) => {
  if (dataSource.connected) {
    cb();
  } else {
    dataSource.once('connected', cb);
  }
};

module.exports = {
  autoUpdateDatasourceModels,
  waitForBoot,
  findMongoDatasources,
  waitForConnect,
};