const MongoModule = require('./mongoConnect');

module.exports = class ControllerRemoteStore {
  constructor(modelUsers, modelClientsDecors, modelOrders) {

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
          return callback(true);
      });
    }

    this.getAllClientsAndDecors = function (callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.ordersData.find().toArray((err, clients_decors) => {
                    if (err || clients_decors.length === 0) return callback(false);
                    return callback(clients_decors);
                });
            } else callback(false);
      });
    }

    this.addCLientInDb = function (client, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.ordersData.update(
                  { 'id': 'clients' },
                  { $push: { 'clients': client } },
                  (err, result) => {
                    _modelClientsDecors.addClient(client);
                    if (err) return callback(false);
                    return callback(true);
                  });
            } else return callback(false);
      });
    }

    this.addDecorInDb = function (decor, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.ordersData.update(
                  { 'id': 'decors' },
                  { $push: { 'decors': decor } },
                  (err, result) => {
                    _modelClientsDecors.addDecor(decor);
                    if (err) return callback(false);
                    return callback(true);
                  });
            } else return callback(false);
      });
    }

    this.updateOrdersData = function (nameArray, updateObject, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.ordersData.update({ 'id': nameArray }, updateObject,
                (err, docUpdated) => {
                    if (err) return callback(false);
                    return callback(true);
                });
            } else return callback(false);
      });
    }

    this.getAllOrders = function (positionTo, callback) {
      MongoModule.isConnected((status) => {
          if (status) {
            MongoModule.mongo.orders.find()
                                    .skip(positionTo)
                                    .limit(15)
                                    .sort({ 'status': -1, 'dateCreate': -1 })
                                    .toArray((err, orders) => {
                                        if (err) return callback(false);
                                        _modelOrders.addOrders(orders, (id) => {
                                            this.getOperationsHistory(id,
                                                (history) => _modelOrders.setHistory(history));
                                        });
                                        _modelOrders.setPositionTo(positionTo + orders.length);
                                        return callback(orders);
                                    });
          } else callback(false);
      });
    }

    this.createOrder = function (order, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.orders.createIndex( { 'id': 1 }, { unique: true } );
                MongoModule.mongo.orders.insert(order, (err, docsInserted) => {
                    if (err) return callback(false);
                    return callback(true);
                });
            } else return callback(false);
      });
    }

    this.deleteOrder = function (id, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.orders.remove( { 'id': id }, { justOne: true },
                  (err, docRemove) => {
                     if (err) return callback(false);
                     return callback(true);
                  });
            } else return callback(false);
      });
    }

    this.updateOrder = function (id, order, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.orders.update(
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
                          console.log('O1-R: Update order error', err);
                          return callback (false);
                        } else {
                          console.log('00-R: Succesfull order update');
                          return callback(true);
                        }
                    });
            } else {
              console.log('01-R: Empty connection for update order');
              return callback(false);
            }
      });
    }


    this.addHistory = function (id, history, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
              MongoModule.mongo.ordersHistory.update(
                                                      { 'id': id },
                                                      {
                                                        'id': id,
                                                        'history': history
                                                      },
                                                      { upsert: true },
                                                      (err, docsUpdated) => {
                                                          if (err) {
                                                            console.log('01-R: Error update one history document in MongoDB');
                                                            return callback(false);
                                                          }
                                                          else {
                                                            console.log('00-R: Update one history document in MongoDB');
                                                            return callback(true);
                                                          }
                                                      }
                                                    );
            } else {
              console.log('01-R: Empty connection with MongoDB for update history document');
              return callback(false);
            }
      });
    }

    this.getOperationsHistory = function (id, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.ordersHistory.find( { 'id': id } ).toArray((err, history) => {
                    if (err || history.length === 0) return callback(false);
                    return callback(history[0].history);
                });
            } else return callback(false);
      });
    }

    this.deleteHistory = function (id, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.ordersHistory.remove( { 'id': id }, { justOne: true },
                  (err, docRemove) => {
                      if (err) return callback(false);
                      return callback(true);
                  });
            } else return callback(false);
      });
    }

    this.insertLocalOrders = function (localOrders, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.orders.createIndex( { 'id': 1 }, { unique: true } );

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
            } else return callback(false);
      });
    }

    this.insertLocalHistoryOrders = function (localHistory, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.ordersHistory.createIndex(  { 'id': 1 }, { unique: true } );

                for (let i = 0; i < localHistory.length; i++) {
                  MongoModule.mongo.ordersHistory.update(
                    { 'id': localHistory[i].id },
                    { 'id': localHistory[i].id, 'history': localHistory[i].history },
                    { upsert: true },
                    (err, docsUpdated) => {
                        if (err) {
                          console.log('01-R: Error update history documents in MongoDB');
                          return callback(false);
                        } else {
                          console.log('00-R: All history documents update in MongoDB');
                          return callback(true);
                        }

                    });
                }
            } else {
              console.log('01-R: Empty connection with MongoDB for update history documents');
              return callback(false);
            }
      });
    }

    this.searchByInputs = function (key, callback) {
      MongoModule.isConnected((status) => {
            if (status) {
                MongoModule.mongo.orders
                .find({ $or: [
                                {'id'    : {$regex: `.*${key}.*`, $options: 'i'} },
                                {'client': {$regex: `.*${key}.*`, $options: 'i'} },
                                {'decor' : {$regex: `.*${key}.*`, $options: 'i'} },
                                {'people': {$regex: `.*${key}.*`, $options: 'i'} }
                             ]
                      })
                .sort({ 'dateCreate': -1 })
                .toArray(function (err, orders) {
                    if (err) return false;
                    if (orders.length) {
                      _modelOrders.addFoundOrders(orders);
                      return callback(true);
                    } else {
                      return callback(false);
                    }
                });
            } else return callback(false);
      });
    }

    this.searchByTime = function (fromDate, toDate, fromTime, toTime) {
          if (fromDate !== null) {
                if (toDate !== null) {
                  if (fromTime !== null && toTime !== null) {
                    //Начальная, конечная, начальное, конечное
                    return MongoModule.mongo.orders
                    .find({
                            'beginDate': {
                                          $gte: fromDate,
                                          $lte: toDate
                                        }
                          });
                  } else if (fromTime !== null && toTime === null) {
                    //Начальная, конечная, начальное
                    return MongoModule.mongo.orders
                    .find({
                            'beginDate': {
                                          $gte: fromDate,
                                          $lte: toDate
                                        }
                          });
                  } else if (fromTime === null && toTime !== null) {
                    //Начальная дата, конечная дата, конечное время
                    return MongoModule.mongo.orders
                  .find({
                          'beginDate': {
                                        $gte: fromDate,
                                        $lte: toDate
                                      }
                        });
                  } else {
                    //Если начальная и конечная дата
                    return MongoModule.mongo.orders
                    .find({ $and: [
                              {
                                'beginDate': {
                                              $gte: fromDate
                                            }
                              },

                              {
                                'endDate': {
                                              $lte: toDate
                                            }
                              }
                            ]
                    });
                  }
                }

                if (fromTime !== null && toTime !== null) {
                  //Начальная дата, начальное время, конечное время
                  return MongoModule.mongo.orders
                  .find({ $and: [
                            {
                              'beginDate': { $gte: fromDate }
                            },

                            {
                              'beginTime': {
                                              $lte: toTime
                                           }
                            }
                          ]
                  });

                } else if (fromTime !== null && toTime === null) {
                  //Начальная дата, начальное время
                  return MongoModule.mongo.orders
                  .find({
                          'beginDate': { $gte: fromDate }
                        });
                } else if (fromTime === null && toTime !== null) {
                  //Начальная дата, конечное время
                  return MongoModule.mongo.orders
                  .find({ $and: [
                            {
                              'beginDate': { $gte: fromDate }
                            },

                            {
                              'beginTime': { $lte: toTime }
                            }
                          ]
                  });

                } else {
                  //Только начальная дата
                  return MongoModule.mongo.orders
                  .find({
                          'beginDate': { $gte: fromDate }
                        });
                }
          } else {
                if (fromTime !== null && toTime !== null) {
                  //Начальное и конечное время
                  return MongoModule.mongo.orders
                  .find({ $and: [
                                {
                                  'beginTime': {
                                                  $gte: fromTime
                                               }
                                },

                                {
                                  'endTime': {
                                                  $lte: toTime
                                             }
                                }
                              ]
                        });
                } else if (fromTime !== null) {
                  //Начальное время
                  return MongoModule.mongo.orders
                  .find({
                          'beginTime': { $gte: fromTime }
                        });

                } else if (toTime !== null) {
                  //Конечное время
                  return MongoModule.mongo.orders
                  .find({
                          'endTime': { $gte: toTime }
                        });
                }
          }
    }
}

  connectRemote(callback) {
    MongoModule.connect((status) => {
       this.setStatusConnection(status);
       return callback(status);
    });
  }
}
