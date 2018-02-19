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
        db.ordersHistory = new Datastore({ filename: path.join(app.getPath('userData'), 'ordersHistory.db'), autoload: true });

    this.updateUsersInLocalStore = function (users) {
      db.users.update({ 'id': 'users' },
                      { 'id': 'users', 'users': users },
                      { upsert: true },
                      (err, docUpdated) => {
                        if (err) return false;
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
                             if (err) return false;
                             console.log(succesfull_update_clients);
                           }
      );
    }

    this.addClientInLocalStore = function (client) {
      db.ordersData.update({ 'id': 'clients' },
                           { $push: { 'clients': client } },
                           (err, result) => {
                             if (err) return false;
                           });
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
                             if (err) return false;
                             console.log(succesfull_update_decors);
                           }
      );
    }

    this.addDecorInLocalStore = function (decor) {
      db.ordersData.update({ 'id': 'decors' },
                           { $push: { 'decors': decor } },
                           (err, result) => {
                             if (err) return false;
                           });
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

    this.updateOrderInLocalStore = function (id, order) {
      _updateOrder(db.orders, id, order);
    }

    this.updateHistoryOrderInLocalStore = function (id, history) {
      _updateHistoryOrder(db.ordersHistory, id, history);
    }

    this.getHistoryOrdersFromLocalStore = function (id, callback) {
      db.ordersHistory.find({ 'id': id }, function (err, history) {
          _dataReclaimer(err, history, callback);
      });
    }

    this.getAll_HistoryOrdersFromLocalStore = function (callback) {
      db.ordersHistory.find({}, function (err, history) {
          _dataReclaimer(err, history, callback);
      });
    }

    this.removeAll_HistoryOrderFromLocalStore = function (callback) {
      db.ordersHistory.remove({}, { multi: true }, function (err, docsRemoved) {
          callback(docsRemoved);
      });
    }
  }
}

function createIndexInOrders(db) {
  db.ensureIndex({ fieldName: 'id', unique: true }, function (err) {
      if (err) return false;
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

function _updateOrder(collection, id, order) {
  collection.update(
      { 'id': id },
      {
         'beginDate': order.beginDate,
         'beginTime': order.beginTime,
            'client': order.client,
             'count': order.count,
        'dateCreate': order.dateCreate,
             'decor': order.decor,
           'endDate': order.endDate,
           'endTime': order.endTime,
                'id': order.id,
              'info': order.info,
     'necessaryTime': order.necessaryTime,
            'people': order.people,
            'status': order.status,
     'unhelpfulTime': order.unhelpfulTime,
        'usefulTime': order.usefulTime,
       'userCreater': order.userCreater,
            'weight': order.weight
      },
      { upsert: true },

      (err, docUpdated) => {
        if (err) console.log(err);
      });
}

function _updateHistoryOrder(collection, id, history) {
  collection.update(
                      { 'id': id },
                      {
                        'id': id,
                        'history': history
                      },
                      { upsert: true },

  (err, docsUpdated) => {
      if (err) return false;
  });
}
