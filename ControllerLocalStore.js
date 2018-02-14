const Datastore = require('nedb');
const path      = require('path');

module.exports = class ControllerLocalStore {
  constructor(app) {
    const succesfull_update_users   = 'Коллекция Users в локальном хранилище успено обновлена';
    const succesfull_update_clients = 'Коллекция ordersData (док. id: clients) в локальном хранилище успено обновлена';
    const succesfull_update_decors = 'Коллекция ordersData (док. id: decors) в локальном хранилище успено обновлена';

    let db               = {};
        db.users         = new Datastore({ filename: path.join(app.getPath('userData'), 'users.db'), autoload: true });
        // db.orders        = new Datastore({ filename: `/tmp/orders.db`, autoload: true });
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
          if (err) {
            console.log(err);
            return false;
          } else {
            callback(usersObject[0].users);
          }
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
      db.ordersData.find({}, function (err, clientsObject) {
          if (err) {
            console.log(err);
            return false;
          } else {
            callback(clientsObject);
          }
      });
    }
  }
}
