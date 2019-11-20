const _ = require('lodash');
const { Observable } = require('rxjs');
const { retry } = require('rxjs/operators');

const codesToDropIndex = ['IndexOptionsConflict', 'IndexKeySpecsConflict'];
const indexNameMongoErrorRegExp = /name:\s*"?(?<indexName>\w*)/;
const normalizeIndexName = idxName => idxName.replace(/(_1|_index)/g, '');
const reservedIndexes = ['_id_'];

const autoUpdateMongoModel = (maxRetryCount = 3) => (Model) => new Observable((observer) => {
  const { dataSource, dataSource: { connector: { db } } } = Model;
  const collection = db && db.collection(Model.modelName);
  if (!collection) return;

  dataSource.autoupdate([Model.modelName], async (autoUpdateErr) => {
    try {
      // drop Indexes created by loopback for previous configuration of Model
      const DBIndexes = (await collection.indexes())
        .map(idx => idx.name)
        .filter(idxName => !reservedIndexes.includes(idxName));

      const loopbackIndexes = Object.keys(Model.definition.indexes() || {}).map(normalizeIndexName);

      const indexesToBeDropped = DBIndexes
        .filter(indexName => !loopbackIndexes.includes(normalizeIndexName(indexName)));

      const dropIndexesPromises = indexesToBeDropped.map((indexName) => collection.dropIndex(indexName));

      if (!autoUpdateErr) return observer.complete();
      
      // drop Indexes that requires recreate due to different options
      if (codesToDropIndex.includes(autoUpdateErr.codeName)) {
        const indexName = _.get(autoUpdateErr.message.match(indexNameMongoErrorRegExp), 'groups.indexName');
        indexesToBeDropped.push(collection.dropIndex(indexName));
      }
      await Promise.all(dropIndexesPromises);
      observer.error(autoUpdateErr);
    } catch (err) {
      if (err.codeName !== 'NamespaceNotFound') {
        observer.error(err);
      }
    }
  });
})
  .pipe(retry(maxRetryCount))
  .toPromise();

module.exports = autoUpdateMongoModel;