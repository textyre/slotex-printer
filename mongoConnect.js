const MongoClient = require('mongodb').MongoClient,
           assert = require('assert');
var _database;
var connect;
var mongo = {};
const user = 'slotexapp';
const pwd  = 'slotexapp';
module.exports = {
    connect: function (callback) {
      MongoClient.connect( `mongodb://${user}:${pwd}@192.168.0.6:27017/slotex`, function (err, database) {
        connect            = database;
        _database           = database.db('slotex');
        mongo.users         = _database.collection('users');
        mongo.orders        = _database.collection('orders');
        mongo.ordersData    = _database.collection('ordersData');
        mongo.ordersHistory = _database.collection('ordersHistory');
        return callback (err);
      });
    },

    getDb: function () {
      return _database;
    },

    closeConnect: function () {
      connect.close();
    },

    mongo
};
