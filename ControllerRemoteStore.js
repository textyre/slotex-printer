const MongoModule = require('./mongoConnect');

module.exports = class ControllerRemoteStore {
  constructor(modelUsers, modelClientsDecors, modelOrders) {

    MongoModule.mongo.orders.createIndex( { 'id': 1 }, { unique: true } );
    MongoModule.mongo.ordersHistory.createIndex(  { 'id': 1 }, { unique: true } );

    let statusConnection    = false;
    let _modelUsers         = modelUsers;
    let _modelClientsDecors = modelClientsDecors;
    let _modelOrders        = modelOrders;

    this.getStatusConnection = function () {
      return statusConnection;
    }

    this.setStatusConnection = function (status) {
      statusConnection = status;
    }

    this.getAllUsers = function (callback) {
      MongoModule.mongo.users.find().toArray((err, users) => {
          _modelUsers.addUsers(users[0].users);
          callback(true);
      });
    }

    this.getAllClientsAndDecors = function (callback) {
      MongoModule.mongo.ordersData.find().toArray((err, clients_decors) => {
          if (err || clients_decors.length === 0) callback(false);
          return callback(clients_decors);
      });
    }

    this.addCLientInDb = function (callback) {
      MongoModule.mongo.ordersData.update(
        { 'id': 'clients' },
        { $push: { 'clients': client } },
        (err, result) => {
          _modelClientsDecors.addClient(order.client);
          if (err) return callback(false);
          return callback(true);
        });
    }

    this.addDecorInDb = function (callback) {
      MongoModule.mongo.ordersData.update(
        { 'id': 'decors' },
        { $push: { 'decors': decor } },
        (err, result) => {
          _modelClientsDecors.addDecor(order.decor);
          if (err) return callback(false);
          return callback(true);
        });
    }

    this.updateOrdersData = function (nameArray, updateObject, callback) {
      MongoModule.mongo.ordersData.update({ 'id': nameArray }, updateObject,
      (err, docUpdated) => {
          if (err) callback(false);
          callback(true);
      });
    }

    this.getAllOrders = function (positionTo, callback) {
      MongoModule.mongo.orders.find()
                              .skip(positionTo)
                              .limit(15)
                              .sort({ 'dateCreate': -1 })
                              .toArray((err, orders) => {
                                  if (err) callback(false);
                                  _modelOrders.addOrders(orders);
                                  _modelOrders.setPositionTo(positionTo + orders.length);
                                  callback(orders);
                              });
    }

    this.insertLocalOrders = function (localOrders, callback) {
      for (let i = 0; i < localOrders.length; i++) {
        MongoModule.mongo.orders.update(
          { 'id': localOrders[i].id },
          {
             'beginDate': localOrders[i].beginDate,
             'beginTime': localOrders[i].beginTime,
                'client': localOrders[i].client,
                 'count': localOrders[i].count,
            'dateCreate': localOrders[i].dateCreate,
                 'decor': localOrders[i].decor,
               'endDate': localOrders[i].endDate,
               'endTime': localOrders[i].endTime,
                    'id': localOrders[i].id,
                  'info': localOrders[i].info,
         'necessaryTime': localOrders[i].necessaryTime,
                'people': localOrders[i].people,
                'status': localOrders[i].status,
         'unhelpfulTime': localOrders[i].unhelpfulTime,
            'usefulTime': localOrders[i].usefulTime,
           'userCreater': localOrders[i].userCreater,
                'weight': localOrders[i].weight
          },
          { upsert: true },
          (err, docInserted) => {
            if (err) return callback(false);
            return callback(true);
          });
      }
    }

    this.insertLocalHistoryOrders = function (localHistory, callback) {
      for (let i = 0; i < localHistory.length; i++) {
        MongoModule.mongo.ordersHistory.update(
          { 'id': localHistory[i].id },
          { 'id': localHistory[i].id, 'history': localHistory[i].history },
          { upsert: true },
          (err, docsUpdated) => {
              if (err) return callback(false);
              return callback(true);
          });
      }
    }
  }

  connectRemote(callback) {
    MongoModule.connect((status) => {
       this.setStatusConnection(status);
       callback(status);
    });
  }
}
