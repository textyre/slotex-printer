const MongoClient = require('mongodb').MongoClient,
           assert = require('assert');
var _database;
var connection = null;
var mongo = {};
const user = 'slotexapp';
const pwd  = 'slotexapp';
module.exports = {
    connect: function (callback) {
      MongoClient.connect( `mongodb://${user}:${pwd}@192.168.0.6:27017/slotex`,
        {
          autoReconnect: true
        },
        (err, database) => {
            connection = database;
            setMongoCollection();
            return callback (err);
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
