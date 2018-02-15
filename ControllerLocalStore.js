const Datastore = require('nedb');
const path      = require('path');

module.exports = class ControllerLocalStore {
  constructor(app) {
    const succesfull_update_users   = 'Коллекция Users в локальном хранилище успено обновлена';
    const succesfull_update_clients = 'Коллекция ordersData (док. id: clients) в локальном хранилище успено обновлена';
    const succesfull_update_decors = 'Коллекция ordersData (док. id: decors) в локальном хранилище успено обновлена';

    let db               = {};
        db.users         = new Datastore({ filename: path.join(app.getPath('userData'), 'users.db'), autoload: true });
        db.orders        = new Datastore({ filename: path.join(app.getPath('userData'), 'orders.db'), autoload: true });
        db.ordersData    = new Datastore({ filename: path.join(app.getPath('userData'), 'ordersData.db'), autoload: true });
        // db.ordersHistory = new Datastore({ filename: `/tmp/ordersHistory.db`, autoload: true });

    this.updateUsersInLocalStore = function (users) {
      db.users.update({ 'id': 'users' },
                      { 'id': 'users', 'users': users },
                      { upsert: true },
                      (err, docUpdated) => {
                        if (err) console.log(err);
                        console.log(succesfull_update_users);
                      }
      );
    }

    this.getUsersFromLocalStore = function (callback) {
      db.users.find({}, function (err, usersObject) {
          _dataReclaimer(err, usersObject[0].users, callback);
      });
    }

    this.updateClientsInLocalStore = function (clients) {
      db.ordersData.update({ 'id': 'clients' },
                           { 'id': 'clients', 'clients': clients },
                           { upsert: true },
                           (err, docUpdated) => {
                             if (err) console.log(err);
                             console.log(succesfull_update_clients);
                           }
      );
    }

    this.getClientsFromLocalStore = function (callback) {
      db.ordersData.find({ 'id': 'clients' }, function (err, clientsObject) {
          _dataReclaimer(err, clientsObject, callback);
      });
    }

    this.updateDecorsInLocalStore = function (decors) {
      db.ordersData.update({ 'id': 'decors' },
                           { 'id': 'decors', 'decors': decors },
                           { upsert: true },
                           (err, docUpdated) => {
                             if (err) console.log(err);
                             console.log(succesfull_update_decors);
                           }
      );
    }

    this.getDecorsFromLocalStore = function (callback) {
      db.ordersData.find({ 'id': 'decors' }, function (err, decorsObject) {
          _dataReclaimer(err, decorsObject, callback);
      });
    }

    this.insertOrderToLocalStore = function (order, callback) {
      createIndexInOrders(db.orders);
      db.orders.insert(order, (err, docInserted) => {
          _dataReclaimer(err, docInserted, callback);
      });
    }

    this.getOrdersFromLocalStore = function (callback) {
      db.orders.find({}).sort({ 'dateCreate': -1 }).exec( (err, orders) => {
          _dataReclaimer(err, orders, callback);
      });
    }

    this.getAllOrdersFromLocalStore = function (callback) {
      db.orders.find({}).sort({ 'dateCreate': -1 }).exec( (err, orders) => {
          _dataReclaimer(err, orders, callback);
      });
    }

    this.removeAllOrdersFromLocalStore = function (callback) {
      db.orders.remove({}, { multi: true }, function (err, docsRemoved) {
          callback(docsRemoved);
      });
    }
  }
}

function createIndexInOrders(db) {
  db.ensureIndex({ fieldName: 'id', unique: true }, function (err) {
      if (err) console.log(err);
  });
}

function _dataReclaimer(err, data, callback) {
  if (err) {
    console.log(err);
    return callback(false);
  } else {
    return callback(data);
  }
}
