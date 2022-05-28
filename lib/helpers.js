const {
  lastValueFrom,
  Observable
} = require('rxjs');
const _ = require('lodash');
const { retry } = require('rxjs/operators');

const waitForBoot = (app, cb) => {
  if (Object.prototype.hasOwnProperty.call(app, 'booting') && app.booting === false) {
    cb();
  } else {
    app.once('booted', cb);
  }
};

const indexNameMongoErrorRegExp = /name:\s*"?(?<indexName>\w*)/;
const normalizeIndexName = (idxName) => idxName.replace(/(_1|_index)/g, '');

const getUnusedMongoIndexes = async (collection, Model, reservedIndexes) => {
  const DBIndexes = (await collection.indexes())
    .map((idx) => idx.name)
    .filter((idxName) => !reservedIndexes.includes(idxName));

  const loopbackIndexes = Object.keys(Model.definition.indexes() || {}).map(normalizeIndexName);

  const indexesToBeDropped = DBIndexes
    .filter((indexName) => !loopbackIndexes.includes(normalizeIndexName(indexName)));
  return indexesToBeDropped;
};


const autoUpdateMongoModel = ({
  maxRetryCount = 3,
  dropIndexes = false,
  recreateIndexesErrorCodes = ['IndexOptionsConflict', 'IndexKeySpecsConflict'],
  reservedIndexes = ['_id_'],
} = {}) => (Model) => lastValueFrom(new Observable((observer) => {
  const { dataSource, dataSource: { connector: { db } } } = Model;
  const collection = db && db.collection(Model.modelName);
  if (!collection) return;

  dataSource.autoupdate([Model.modelName], async (autoUpdateErr) => {
    try {
      if (dropIndexes) {
        // drop DB Indexes that are not in loopback
        const indexesToBeDropped = await getUnusedMongoIndexes(collection, Model, reservedIndexes);
        const dropIndexesPromises = indexesToBeDropped.map((indexName) => collection.dropIndex(indexName));
        await Promise.all(dropIndexesPromises);
      }

      // drop Indexes that requires recreate due to conflict
      if (autoUpdateErr && recreateIndexesErrorCodes.includes(autoUpdateErr.codeName)) {
        const indexName = _.get(autoUpdateErr.message.match(indexNameMongoErrorRegExp), 'groups.indexName');
        await collection.dropIndex(indexName);
      }


      if (autoUpdateErr) throw autoUpdateErr;
      observer.complete();
    } catch (err) {
      if (err.codeName !== 'NamespaceNotFound') {
        console.error(err);
        observer.error(err);
      }
    }
  });
})
  .pipe(retry(maxRetryCount)));

const findMongoDatasources = (app) => {
  const mongoDatasources = Object.values(app.datasources).filter((ds) => ds.connector.name === 'mongodb');
  return _.uniq(mongoDatasources);
};

const autoUpdateDatasourceModels = (app, dataSource, options) => {
  app
    .models()
    .filter((model) => model.dataSource === dataSource)
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
  autoUpdateMongoModel,
};
