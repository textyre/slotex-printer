const Datastore = require('nedb');
const path      = require('path');

module.exports = class ControllerLocalStore {
  constructor(app, modelUsers) {
    let _modelUsers = modelUsers;

    const succesfull_update_users   = '00: Коллекция Users в локальном хранилище успено обновлена';
    const succesfull_update_clients = '00: Коллекция ordersData (док. id: clients) в локальном хранилище успено обновлена';
    const succesfull_update_decors  = '00: Коллекция ordersData (док. id: decors) в локальном хранилище успено обновлена';

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
      db.users.find({}, function (err, users) {
          if (err || users.length === 0) return callback(false);
          _modelUsers.addUsers(users[0].users);
          return callback(true);
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

    this.updateOrdersData = function (nameArray, updateObject, callback) {
      db.ordersData.update({ 'id': nameArray }, updateObject,
      (err, docUpdated) => {
          if (err) return callback(false);
          return callback(true);
      });
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
      db.orders.find({}).sort({ 'status': -1, 'dateCreate': -1 }).exec( (err, orders) => {
          _dataReclaimer(err, orders, callback);
      });
    }

    this.removeAllOrdersFromLocalStore = function (callback) {
      db.orders.remove({}, { multi: true }, function (err, docsRemoved) {
          callback(docsRemoved);
      });
    }

    this.removeOrder = function (id, callback) {
      db.orders.remove( { 'id': id }, { justOne: true },
        (err, docRemove) => {
           if (err) return callback(false);
           return callback(true);
        });
    }

    this.updateOrderInLocalStore = function (id, order, callback) {
      _updateOrder(db.orders, id, order, callback);
    }

    this.updateHistoryOrderInLocalStore = function (id, history) {
      _updateHistoryOrder(db.ordersHistory, id, history);
    }

    this.getHistoryOrdersFromLocalStore = function (id, callback) {
      db.ordersHistory.find({ 'id': id }, function (err, history) {
        if (history.length === 0) callback(false);
        else _dataReclaimer(err, history[0].history, callback);
      });
    }

    this.getAllHistoryOrders = function (callback) {
      db.ordersHistory.find({}, function (err, history) {
          _dataReclaimer(err, history, callback);
      });
    }

    this.removeAllHistoryOrders = function (callback) {
      db.ordersHistory.remove({}, { multi: true }, function (err, docsRemoved) {
          callback(docsRemoved);
      });
    }

    this.removeHistory = function (id, callback) {
      db.ordersHistory.remove( { 'id': id }, { justOne: true },
        (err, docRemove) => {
            if (err) return callback(false);
            return callback(true);
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

function _updateOrder(collection, id, order, callback) {
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
          if (err) {
             console.log('01-L: Заказ не обновлен локально', err.errorType);
             return callback(false);
          }
          else {
            console.log('00-L: Заказ успешно обновлен');
            return callback(true);
          }
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
      if (err) {
        console.log('01-L: Error update one history document in NeDB', err.errorType);
        return false;
      }
      else {
        console.log('00-L: One update history document in NeDB');
        return true;
      }
  });
}
