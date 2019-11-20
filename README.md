# loopback-mongo-sync-indexes

A function that can be used in a [loopback](https://loopback.io/) script to sync indexes between loopback models and mongodb.

## Installation

```shell
npm install loopback-mongo-sync-indexes
```

## Usage

Write the following code in a boot script.

```javascript
const syncMongoIndexes = require('loopback-mongo-sync-indexes');

module.exports = (app) => {
  // get mongodb datasource
  const dataSource = app.datasources.MongoDs;

  // ensure datasource is already connected
  if (dataSource.connected) {
    syncMongoIndexes(app, dataSource);
  } else {
    dataSource.once('connected', () => {
      syncMongoIndexes(app, dataSource);
    });
  }
};
```

## Api

syncMongoIndexes(app, dataSource, maxRetries)

#### parameters
* app: loopback application
* dataSource: loopback mongodb datasource
* maxRetries: maximum number of retries - default 3