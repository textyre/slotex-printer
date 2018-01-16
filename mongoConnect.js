const MongoClient = require('mongodb').MongoClient,
           assert = require('assert');
var _database;
module.exports = {

    connect: function (callback) {
      MongoClient.connect( 'mongodb://techdir:techdir_slotex@ds038547.mlab.com:38547/slotex', function (err, database) {
        _database = database.db('slotex');
        return callback (err);
      });
    },

    getDb: function () {
      return _database;
    },

    closeConnect: function () {
      database.close();
    }
};
