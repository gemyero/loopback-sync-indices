# loopback-sync-indexes

A function that can be called with a [loopback](https://loopback.io/) application to sync indexes between loopback models and databases.

## Installation

```shell
npm install loopback-sync-indexes
```

## Usage


```javascript
const syncIndexes = require('loopback-sync-indexes');

const app = loopback();
syncIndexes(app);

```

## Api

syncIndexes(app, options)

#### parameters
* app: loopback application
* options.maxRetryCount (Number): maximum number of retries - default 3
* options.dropIndexes (Boolean): whether to remove unused indexes or not - default false 

## Note
### This package supports MongoDB for now and I will add other databases later.