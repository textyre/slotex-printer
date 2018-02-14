const MongoClient = require('mongodb').MongoClient,
           assert = require('assert');
var _database  = null;
var connection = null;
var mongo      = {};
const user     = 'slotexapp';
const pwd      = 'slotexapp';
const connectionString = `mongodb://${user}:${pwd}@192.168.0.6:27017/slotex`;
module.exports = {
    connect: function (callback) {
      MongoClient.connect(connectionString,
        {
          reconnectTries: Number.MAX_VALUE,
          reconnectInterval: 1000,
          autoReconnect: true
        },
        (err, database) => {

            try {
              assert.equal(null, err);
            } catch (error) {
              console.log('Нет подключения');
              return callback(false);
            }

            if (_database === null) {
              connection = database;
              setMongoCollection();
            }

            return callback (true);
        });
    },

    getDb: function () {
      return _database;
    },

    closeConnect: function () {
      if (connection !== null) {
        connection.close();
      } else {
        return false;
      }
    },

    mongo
};

function setMongoCollection() {
  if (connection !== null) {
    _database = mongo.db = connection.db('slotex');
    mongo.users          = _database.collection('users');
    mongo.orders         = _database.collection('orders');
    mongo.ordersData     = _database.collection('ordersData');
    mongo.ordersHistory  = _database.collection('ordersHistory');
  }
}
