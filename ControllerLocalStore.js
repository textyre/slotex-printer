const Datastore = require('nedb');
const path      = require('path');

module.exports = class ControllerLocalStore {
  constructor(app) {
    const succesfull_update = 'Успешно обновлено';
    let db               = {};
        db.users         = new Datastore({ filename: path.join(app.getPath('userData'), 'users.db'), autoload: true });
        // db.orders        = new Datastore({ filename: `/tmp/orders.db`, autoload: true });
        // db.ordersData    = new Datastore({ filename: `/tmp/ordersData.db`, autoload: true });
        // db.ordersHistory = new Datastore({ filename: `/tmp/ordersHistory.db`, autoload: true });

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

    this.updateUsersInLocalStore = function (users) {
      db.users.update({ 'id': 'users' },
                      { 'id': 'users', 'users': users },
                      { upsert: true },
                      (err, docUpdated) => {
                        if (err) console.log(err);
                        console.log(succesfull_update);
                      }
      );
    }
  }
}
