# loopback-sync-indices

A module exports a function that can be called with a [loopback 3](https://loopback.io/) application to sync indexes between loopback models and databases.

## Installation

```shell
npm install loopback-sync-indices
```

## Usage


```javascript
const syncIndexes = require('loopback-sync-indices');

const app = loopback();
syncIndexes(app);

```

## Api

```javascript
syncIndexes(app, options)
```

#### parameters
* app: loopback application
* options.maxRetryCount (Number = 3): maximum number of retries
* options.dropIndexes (Boolean = false): whether to remove db indexes that are not in loopback
* options.recreateIndexesErrorCodes (Array = ['IndexOptionsConflict', 'IndexKeySpecsConflict']): error codes to recreate conflicting indexes.
* options.reservedIndexes (Array = ['\_id_']): indexes not to be dropped from db.

## Limitation

* Supports only MongoDB connector.

## Roadmap

* Add support for other connectors.
