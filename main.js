const { app, BrowserWindow, ipcMain } = require('electron');
const fs                              = require('fs');
var mongoConnection                   = require('./mongoConnect');
var ControllerLocalStore              = require('./ControllerLocalStore');
var dateModule                        = require('./date');

let win; //Окно

var orders            = []; //Хранятся заказы из БД
var localOrders       = [];
global.ordersData = []; //Хранятся клиенты и декоры
global.moveBetweenDisplay = false;

var foundOrders   = []; //Хранятся найденны заказы
var users         = []; //Список юзеров
var userName      = null; //Имя текущего юзера

var orderID       = null; //ID заказа
var orderRun      = null; //Запущенный заказ

var positionAt    = 0; //Позиция, с которой выводим вновь загруженные заказы
var positionTo    = 0; //Позиция, по которую выводим вновь загруженные заказы

var BlockIntervalID = null; //Для интервалов
let focusIndex      = null; //Для возврата фокуса

var beginDateOperation = null; //Начальное время запуск операции
var lastTimeOperation  = 0;

var nameOperation      = null;
var historyOperations  = [];

var sampleDate = '';

let controllerLocalStore = new ControllerLocalStore(app);

//startOrdersPage: регулирует запуск страницы, при запуске true, после загрузки заказов false

//moreDownloadOrderds: регулирует загрузку заказов, при старте страницы true,
//после включения сети и загрузки заказов false
var startOrdersPage     = false;
var moreDownloadOrderds = false;
var addLocalOrders      = true;
var statusNetwork       = false;
var workArrayOrders     = [];

//При запуске приложения получаем юзеров или ошибку
app.on('ready', () => {
    win = new BrowserWindow({
      width:  1280,
      height: 720,
      minWidth: 1280,
      minHeight: 720,
      webPreferences: {
          devTools: true
        }
    });
    win.loadURL(`file://${__dirname}/enter/enter.html`);
});


app.on('before-quit', (event) => {
    stopOperation(workArrayOrders);
    mongoConnection.closeConnect();
});

//Обработка открытия окон
//Окно входа - если юзеры загружены, то отдаеть, иначе загрузить
//Окно заказов - проверка юзернейма и запуск окна
//Окно панели, статистики  - принимается ID заказов и запускается окно

ipcMain.on('openWindow', function (event, arg) {

    switch (arg[0]) {
      case 'enterWindow':
        if (users.length === 0) {
          firstConnectionToDb(event);
        } else {
          event.sender.send('getUsers', users);
        }
      break;

      case 'ordersWindow':
        if (userName == null &&
            arg[1]   != null &&
            arg[1]   != undefined) userName = arg[1];

        win.loadURL(`file://${__dirname}/orders/orders.html`);
        event.sender.send('result', 'open');

        if (arg[1] === 'panelWindow') moveBetweenDisplay = true;
      break;

      case 'panelWindow':
        orderID = arg[1];
        win.loadURL(`file://${__dirname}/main/main.html`);
        event.sender.send('result', 'open');
      break;

      case 'statisticsWindow':
        orderID = arg[1];
        win.loadURL(`file://${__dirname}/statistics/statistics.html`);
        event.sender.send('result', 'open');
      break;

      case 'sumstatistics':
        sampleDate = arg[1];
        win.loadURL(`file://${__dirname}/sumstatistics/sumstatistics.html`);
        event.sender.send('result', 'open');
      break;

      default:
    }
});

function firstConnectionToDb(event) {
  mongoConnection.connect((status) => {
      if (!status) {
        controllerLocalStore.getUsersFromLocalStore((localUsers) => {
            users = localUsers;
            event.sender.send('getUsers', users);
        });
      } else {
        mongoConnection.mongo.users.find().toArray((err, usersObject) => {
            if (err) return false
            users = usersObject[0].users;
            controllerLocalStore.updateUsersInLocalStore(users);
            event.sender.send('getUsers', users);
        });
      }
  });
}

//Обработка загрузки окон
//Окно заказов - отдать заказы, клиентов и декоры, если есть, иначе загрузить
//Окно панели - getOrder отсылает заказ в head.js, getOperations отсылает заказ в operations.js

ipcMain.on('windowLoad', function (event, arg) {
  switch (arg) {
    case 'ordersWindow':
      foundOrders.length = [];

      if (ordersData.length == 0) {
        getData(event);
      } else {
        event.sender.send('getClients', ordersData[0]);
        event.sender.send('getDecors', ordersData[1]);
      }

    break;

    case 'panelWindow':
      for (let i = 0; i < orders.length; i++) {
        if (orders[i].id === orderID) {
          event.sender.send('getOrder', orders[i], userName);
          event.sender.send('getOperations', orders[i], focusIndex);
          workArrayOrders = orders;
          return true;
        }
      }

      for (let i = 0; i < foundOrders.length; i++) {
        if (foundOrders[i].id === orderID) {
          event.sender.send('getOrder', foundOrders[i], userName);
          event.sender.send('getOperations', foundOrders[i], focusIndex);
          workArrayOrders = foundOrders;
          return true;
        }
      }

      for (let i = 0; i < localOrders.length; i++) {
        if (localOrders[i].id === orderID) {
          event.sender.send('getOrder', localOrders[i], userName);
          event.sender.send('getOperations', localOrders[i], focusIndex);
          workArrayOrders = localOrders;
          return true;
        }
      }
    break;

    case 'statisticsWindow':
      for (let i = 0; i < orders.length; i++) {
        if (orders[i].id === orderID) {
          getOperationsHistory(event, orderID);
          event.sender.send('getOrder', orders[i], userName);
          return true;
        }
      }

      for (let i = 0; i < foundOrders.length; i++) {
        if (foundOrders[i].id === orderID) {
          getOperationsHistory(event, orderID);
          event.sender.send('getOrder', foundOrders[i], userName);
          return true;
        }
      }

      for (let i = 0; i < localOrders.length; i++) {
        if (localOrders[i].id === orderID) {
          console.log('fffff');
          getOperationsHistory(event, orderID);
          event.sender.send('getOrder', localOrders[i], userName);
          return true;
        }
      }
    break;

    case 'sumstatistics':
      event.sender.send('getSampleOrders', foundOrders);
      event.sender.send('getUserNameAndRangeDate', userName, sampleDate);
    break;

    default:
  }
});

ipcMain.on('startOrdersPage', (event, status) => {
    startOrdersPage = true;
});

ipcMain.on('moreDownloadOrderds', (event, status) => {
    moreDownloadOrderds = true;
});

ipcMain.on('online-status-changed-panel', (event, status) => {
    statusNetwork = status;
    if (status) {
      mergeLocalAndRemoteOrdersCollection();
      mergeLocalAndRemoteOrdersHistoryCollection();
    } else {
      return true;
    }
});

ipcMain.on('online-status-changed', (event, status) => {
    statusNetwork = status;
    if (status) {
      if (addLocalOrders || orders.length === 0) {
        console.log('Был добавлен локально заказ и мы его заливаем в монгу');
        mergeLocalAndRemoteOrdersCollection();
        mergeLocalAndRemoteOrdersHistoryCollection();
      }

      if (orders.length === 0 && startOrdersPage) {
        console.log('Сеть есть и загружаем заказы из монги');
        getOrders(event);
      } else if (orders.length > 0 && startOrdersPage) {
        console.log('Сеть есть: Заказы есть в массиве и страница была перезагружена');
        event.sender.send('getOrders', orders, 0, orders.length);
      } else if (localOrders.length > 0 && orders.length === 0) {
        console.log('Есть сеть, объединяем локальные и удаленные заказы');
        concatLocalAndRemoteOrders(event);
      } else if (localOrders.length === 0 && orders.length === 0) {
        console.log('Сеть есть, но заказов нигде нет, поэтому загружаем');
        getOrders(event);
      }
      startOrdersPage = false;

    } else {
      if (orders.length > 0 && startOrdersPage) {
        console.log('Сети нет: Заказы есть в orders и страница была перезагружена');
        event.sender.send('getOrders', orders, 0, orders.length);
      } else if (localOrders.length === 0 && startOrdersPage) {
        getLocalOrders(event);
        console.log('Загружаем заказы из локала');
      } else if (localOrders.length > 0 && startOrdersPage) {
        console.log('Сети нет: Заказы есть в localOrders и страница была перезагружена');
        event.sender.send('getOrders', localOrders, 0, localOrders.length);
      } else {
        console.log('Нет сети, заказы загружать не надо');
      }
      startOrdersPage = false;
    }
});

function concatLocalAndRemoteOrders(event) {
  // orders = orders.concat(localOrders);
  //Синхронизация
  setTimeout(() => {
    getOrders(event);
    moreDownloadOrderds = false;
  }, 1000);
}

function mergeLocalAndRemoteOrdersCollection() {
  controllerLocalStore.getAllOrdersFromLocalStore((_localOrders) => {
     addLocalOrders = false;
     if (_localOrders.length > 0) {
       insertLocalOrdersToRemoteDb(_localOrders);
       controllerLocalStore.removeAllOrdersFromLocalStore((result) => {
          return true;
       });
     } else {
       return true;
     }
  });
}

function mergeLocalAndRemoteOrdersHistoryCollection() {
  controllerLocalStore.getAll_HistoryOrdersFromLocalStore((_localHistory) => {
      if (_localHistory !== false && _localHistory.length > 0) {
        insertLocalHistoryToRemoteDb(_localHistory);
        controllerLocalStore.removeAll_HistoryOrderFromLocalStore((result) => {
           return true;
        });
      } else {
        return true;
      }
  });
}

//*******************ORDERS WINDOW*******************//
//*****************************************************//

//Подключаемся к БД и вставляем переданный заказ
//Очищаем orders, positionTo, positionAt и загружаем заново заказы (обновляем страницу таким образом)

ipcMain.on('createOrder', function (event, order) {
    checkStatusNetwork((status) => {
        if (status) {
          mongoConnection.mongo.orders.createIndex( { 'id': 1 }, { unique: true } );
          let result = mongoConnection.mongo.orders.insert(order, function (err, docsInserted) {
              orders.length = 0;
              positionTo = 0;
              positionAt = 0;
              getOrders(event);
          });
        } else {
          controllerLocalStore.insertOrderToLocalStore(order, (localOrder) => {
              addLocalOrders = true;
              if (localOrder === false) {
                console.log('Такой заказ уже есть');
                event.sender.send('getOrders', localOrders, 0, localOrders.length);
              } else if (orders.length > 0) {
                orders.unshift(order);
                localOrders.unshift(order);
                console.log('Создаем и кладем заказ в orders и localOrders');

                event.sender.send('getOrders', orders, 0, orders.length);
              } else {
                console.log('Создаем и кладем заказ в localOrders');
                localOrders.unshift(order);
                event.sender.send('getOrders', localOrders, 0, localOrders.length);
              }
          });
        }
    });
    searchClient(order.client);
    searchDecor(order.decor);
});

function insertLocalOrdersToRemoteDb(_localOrders) {
  checkStatusNetwork((status) => {
     if (status) {
       mongoConnection.mongo.orders.createIndex({ "id": 1 }, { unique: true });
       for (let i = 0; i < _localOrders.length; i++) {
         console.log('Обновление заказа');
         console.log(_localOrders[i]);
         mongoConnection.mongo.orders.update(
           { 'id': _localOrders[i].id },
           {
              'beginDate': _localOrders[i].beginDate,
              'beginTime': _localOrders[i].beginTime,
                 'client': _localOrders[i].client,
                  'count': _localOrders[i].count,
             'dateCreate': _localOrders[i].dateCreate,
                  'decor': _localOrders[i].decor,
                'endDate': _localOrders[i].endDate,
                'endTime': _localOrders[i].endTime,
                     'id': _localOrders[i].id,
                   'info': _localOrders[i].info,
          'necessaryTime': _localOrders[i].necessaryTime,
                 'people': _localOrders[i].people,
                 'status': _localOrders[i].status,
          'unhelpfulTime': _localOrders[i].unhelpfulTime,
             'usefulTime': _localOrders[i].usefulTime,
            'userCreater': _localOrders[i].userCreater,
                 'weight': _localOrders[i].weight
           },
           { upsert: true },
           (err, docInserted) => {
             if (err) console.log(err);;
           });
       }
     } else {
       return false;
     }
  });
}

function insertLocalHistoryToRemoteDb(_localHistory) {
  checkStatusNetwork((status) => {
      if (status) {
        mongoConnection.mongo.ordersHistory.createIndex({ 'id': 1 }, { unique: true });
        for (let i = 0; i < _localHistory.length; i++) {
          console.log('Обновление истории операций');
          console.log(_localHistory[i]);
          mongoConnection.mongo.ordersHistory.update( { 'id': _localHistory[i].id }, { 'id': _localHistory[i].id, 'history': _localHistory[i].history }, { upsert: true }, (err, docsUpdated) => {
            if (err) console.log(err);;
          });
        }
      } else {
        console.log('Error: История операций из локального хранлища в удаленное не перенасена');
      }
  });
}


function searchClient(client) {
  for (let i = 0; i < ordersData[0].length; i++) {
    if (ordersData[0][i] === client) {
      return true;
    }
  }
  console.log('Добавляем клиента в БД');
  addCLientInDb(client);
}

function searchDecor(decor) {
  for (let i = 0; i < ordersData[1].length; i++) {
    if (ordersData[1][i] === decor) {
      return true;
    }
  }
  console.log('Добавляем декор в БД');
  addOrderInDb(decor);
}

function addCLientInDb(client) {
  checkStatusNetwork((status) => {
       if (status) {
         mongoConnection.mongo.ordersData.update(
           { 'id': 'clients' },
           { $push: { 'clients': client } },
           (err, result) => {
             if (err) return false;
             console.log(result);
           });
       } else {
         console.log('Добавляем клиента в локал');
       }
       controllerLocalStore.addClientInLocalStore(client);
       ordersData[0].push(client);
  });
}

function addOrderInDb(decor) {
  checkStatusNetwork((status) => {
      if (status) {
        mongoConnection.mongo.ordersData.update(
          { 'id': 'decors' },
          { $push: { 'decors': decor } },
          (err, result) => {
            if (err) return false;
            console.log(result);

          });
      } else {
        console.log('Добавляем декор в локал');
      }
      controllerLocalStore.addDecorInLocalStore(decor);
      ordersData[1].push(decor);
  });
}

ipcMain.on('deleteClientOrder', function (event, nameArray, indexItem) {
    checkStatusNetwork((status) => {
        if (status) {
          let updateObject;

          if (nameArray === 'clients') {
            ordersData[0].splice(indexItem, 1);
            updateObject = {
              'id': 'clients',
              'clients': ordersData[0]
            }
          } else if (nameArray === 'decors') {
            ordersData[1].splice(indexItem, 1);
            updateObject = {
              'id': 'decors',
              'decors': ordersData[1]
            }
          }

          mongoConnection.mongo.ordersData.update({ 'id': nameArray }, updateObject,
          (err, docUpdated) => {
              if (err) event.returnValue = false;
              console.log(docUpdated);
              event.returnValue = true;
          });
        } else {
          console.log('Нет сети');
          event.returnValue = false;
        }
    });
});


ipcMain.on('loadOrder', function (event, arg) {
    getOrders(event);
});


//Запрос из usersBar.js, выполняется при смене имени
ipcMain.on('setUserName', function (event, argUserName) {
    userName = argUserName;
    event.returnValue = true;
})


//Запрос из orders.js
//Отдает ему пользователя

ipcMain.on('getUserName', function (event, arg) {
    event.sender.send('setUserName', userName);
});


//Запрос из sideBar.js
//Возвращает список юзеров для выбора

ipcMain.on('getUsers', function (event, arg) {
    event.sender.send('setUsers', users);
});

ipcMain.on('deleteOrder', function (event, id) {
    checkStatusNetwork((status) => {
        if (status) {
          for (let i = 0; i < orders.length; i++) {
            if (orders[i].id === id) {
              let orderDelete        = deleteOrderInDb(id);
              console.log(orderDelete);
              let historyOrderDelete = deleteHistoryOrderInDb(id);
              console.log(historyOrderDelete);
              if (orderDelete && historyOrderDelete) {
                orders.splice(i, 1);
                if (orderRun === id) {
                  stopOperation(workArrayOrders);
                  orderRun = null;
                  historyOperations = [];
                }
                event.returnValue = true;
              } else {
                event.returnValue = false;
              }
            }
          }
        } else {
          console.log('Нет сети для удаления заказа');
          event.returnValue = false;
        }
    });
});

function deleteOrderInDb(id) {
  mongoConnection.mongo.orders.remove({ 'id': id },
  { justOne: true },
  (err, docRemove) => {
     if (err) return false;
  });
  return true;
}

function deleteHistoryOrderInDb(id) {
  mongoConnection.mongo.ordersHistory.remove({ 'id': id },
  { justOne: true },
  (err, docRemove) => {
      if (err) return false;
  });
  return true;
}


//Загрузка заказов
//Подключаемся к БД, пропускаем n-позиций, которые уже были загружены
//Лимит 15 заказов, чтобы не нагружать сеть
//Сортировка: с последних созданных
//Кладем документы в массив, ID заказов кладем в массив и увеличиваем positionTo++ для следующих запросов
//Если positionTo == positionAt, то не даем больше загружать документы, иначе прокрутка вниз вызовет загрузку
//Устанавливаем positionAt = positionTo

function getOrders(event) {
    checkStatusNetwork((status) => {
        if (status) {
          let cursor = mongoConnection.mongo.orders.find().skip(positionTo).limit(15).sort({ 'dateCreate': -1 });
          cursor.forEach(function (doc) {
            orders.push(doc);
            if (doc.status === 'run') {
              orderRun = doc.id;
              getOperationsHistory(undefined, orderRun);
            }
            positionTo++;
          }, function (err) {
              if (err) return false;
              if (positionTo == positionAt) event.sender.send('getOrders', orders, positionAt, positionTo, true);
              else                          event.sender.send('getOrders', orders, positionAt, positionTo, false);

              positionAt = positionTo;
              moreDownloadOrderds = false;
          });
        }
    });
}

function getLocalOrders(event) {
  controllerLocalStore.getOrdersFromLocalStore((_localOrders) => {
      moreDownloadOrderds = true;
      if (_localOrders !== false) {
        if (_localOrders.length > 0) {
          localOrders = _localOrders
          event.sender.send('getOrders', localOrders, 0, localOrders.length);
          for (let i = 0; i < localOrders.length; i++) {
            if (localOrders[i].status === 'run') {
              orderRun = localOrders[i].id;
              getOperationsHistory(undefined, orderRun);
            }
          }
        } else {
          console.log('local orders is empty');
        }
      }
  });
}

function checkStatusNetwork(callback) {
  mongoConnection.connect((status) => {
     if (status) {
       return callback(true);
     } else {
       return callback(false);
     }
  });
}


function getOperationsHistory(event, id) {
  checkStatusNetwork((status) => {
      if (status) {
        let cursor = mongoConnection.mongo.ordersHistory.find( { 'id': id });

        cursor.forEach(
          resultHistory => {
            if (event === undefined) {
              historyOperations = resultHistory.history;
            } else {
              event.sender.send('getOperationsHistory', resultHistory.history);
            }
          },

          error => {
            return false;
          });
      } else {
        controllerLocalStore.getHistoryOrdersFromLocalStore(id, (history) => {
            console.log(event);
            if (history !== false) {
              if (event === undefined) {
                historyOperations = history[0].history;
              } else {
                console.log(history[0].history);
                event.sender.send('getOperationsHistory', history[0].history);
              }
            }
        });
      }
  });
}


//Подключаем к БД и загружаем клиентов с декорами, заносим в массив
function getData(event) {
  checkStatusNetwork((status) => {
      if (status) {
        mongoConnection.mongo.ordersData.find().toArray((err, remoteOrdersData) => {
            if (err) console.log('error');
            ordersData.push(remoteOrdersData[0].clients);
            ordersData.push(remoteOrdersData[1].decors);

            controllerLocalStore.updateClientsInLocalStore(remoteOrdersData[0].clients);
            controllerLocalStore.updateDecorsInLocalStore(remoteOrdersData[1].decors);

            event.sender.send('getClients', ordersData[0]);
            event.sender.send('getDecors', ordersData[1]);
        });
      } else {
        controllerLocalStore.getClientsFromLocalStore((localClients) => {
            ordersData.push(localClients[0].clients);
            console.log(ordersData[0]);

            event.sender.send('getClients', ordersData[0]);
        });

        controllerLocalStore.getDecorsFromLocalStore((localDecors) => {
            ordersData.push(localDecors[0].decors);
            console.log(ordersData[1]);

            event.sender.send('getDecors', ordersData[1]);
        });

      }
  });
}

//Подключаемся к БД и загружаем юзеров
function getUsers(event) {
  let cursor = mongoConnection.mongo.users.find();
  cursor.forEach(function (doc) {
    users.push(doc);
  }, function (err) {
      if (err) {
        return false;
      } else {
        event.sender.send('getUsers', users);
        return true;
      }
  });
}

ipcMain.on('removeOrdersID', function (event, arg) {
    foundOrders = [];
});

ipcMain.on('timeSearchInDB', function (event, fromDate = null, toDate = null, fromTime = null, toTime = null) {
    if (statusNetwork) {
      foundOrders = [];

      let cursor = execute(fromDate, toDate, fromTime, toTime);
      cursor.sort({ 'dateCreate': -1 })
      .toArray(function (err, uploadOrders) {
          if (err) {
            return false;
          }

          if (uploadOrders.length) {
            event.sender.send('foundOrders', uploadOrders);
            foundOrders = uploadOrders;
          } else {
            event.sender.send('error_notFound', null);
          }
      });
    } else {
      return false;
    }
});

function execute(fromDate, toDate, fromTime, toTime) {
  if (fromDate !== null) {
      if (toDate !== null) {
        if (fromTime !== null && toTime !== null) {
          //Начальная, конечная, начальное, конечное
          return mongoConnection.mongo.orders
          .find({
                  'beginDate': {
                                $gte: fromDate,
                                $lte: toDate
                              }
                });
        } else if (fromTime !== null && toTime === null) {
          //Начальная, конечная, начальное
          return mongoConnection.mongo.orders
          .find({
                  'beginDate': {
                                $gte: fromDate,
                                $lte: toDate
                              }
                });
        } else if (fromTime === null && toTime !== null) {
          //Начальная дата, конечная дата, конечное время
          return mongoConnection.mongo.orders
        .find({
                'beginDate': {
                              $gte: fromDate,
                              $lte: toDate
                            }
              });
        } else {
          //Если начальная и конечная дата
          return mongoConnection.mongo.orders
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
      return mongoConnection.mongo.orders
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
      return mongoConnection.mongo.orders
      .find({
              'beginDate': { $gte: fromDate }
            });
    } else if (fromTime === null && toTime !== null) {
      //Начальная дата, конечное время
      return mongoConnection.mongo.orders
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
      return mongoConnection.mongo.orders
      .find({
              'beginDate': { $gte: fromDate }
            });
    }
  } else {
    if (fromTime !== null && toTime !== null) {
      //Начальное и конечное время
      return mongoConnection.mongo.orders
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
      return mongoConnection.mongo.orders
      .find({
              'beginTime': { $gte: fromTime }
            });

    } else if (toTime !== null) {
      //Конечное время
      return mongoConnection.mongo.orders
      .find({
              'endTime': { $gte: toTime }
            });
    }
  }
}

ipcMain.on('searchInDB', function (event, key) {
    if (statusNetwork) {
      mongoConnection.mongo.orders
      .find({ $or: [
                      {'id'    : {$regex: `.*${key}.*`, $options: 'i'} },
                      {'client': {$regex: `.*${key}.*`, $options: 'i'} },
                      {'decor' : {$regex: `.*${key}.*`, $options: 'i'} },
                      {'people': {$regex: `.*${key}.*`, $options: 'i'} }
                   ]
            })
      .sort({ 'dateCreate': -1 })
      .toArray(function (err, uploadOrders) {
          if (err) {
            return false;
          }

          if (uploadOrders.length) {
            event.sender.send('foundOrders', uploadOrders);
            foundOrders = uploadOrders;
            return true;
          } else {
            event.sender.send('error_notFound', null);
          }
      });
    } else {
      return false;
    }
});

//*******************OPERATION WINDOW*******************//
//*****************************************************//

//Принимает ID заказа
//Если нет запущенного заказа, то устанавливаем, иначе выход
//Находим в массиве заказ, устанавливаем статус, начальную дату и время запуска

ipcMain.on('setStatus', function (event, id) {
    if (orderRun == null) {
      orderRun = id;
    } else {
      event.returnValue = false;
      return false;
    }

    if (orders.length !== 0) {
      for (let i = 0; i < orders.length; i++) {
        if (orders[i].id == id) {
          orders[i].status = 'run';
          orders[i].beginDate = new Date().toISOString();
          orders[i].beginTime = getCurrentTime();
          event.returnValue = true;
        }
      }
    } else if (localOrders.length !== 0) {
      for (let i = 0; i < localOrders.length; i++) {
        if (localOrders[i].id == id) {
          localOrders[i].status = 'run';
          localOrders[i].beginDate = new Date().toISOString();
          localOrders[i].beginTime = getCurrentTime();
          event.returnValue = true;
        }
      }
    }
});

ipcMain.on('setOrderRun', (event, id) => {
    orderRun = id;
});

//Запуск операции
//Запоминаем индекса последнего запущенного элемента
//Добавляем работника к заказу
//Создаем интервал в 60 секунд (60000 млсек)
//Увеличиваем число для вывода, если открыт запущенный заказ, то возвращаем в представление
//Увеличиваем время у класс операций

ipcMain.on('startOperation', function (event, operation) {
    focusIndex         = operation[4];
    beginDateOperation = fromDate(beginDateOperation);

    stopOperation(workArrayOrders);

    if (nameOperation !== operation[1]) {
      lastTimeOperation = 0;
    }

    nameOperation = operation[1];

    addWorkUser(workArrayOrders);
    editOrder(workArrayOrders, operation);
    addHistoryOperation(operation);

    BlockIntervalID = setInterval(function run() { //Создаем новый таймер для операций

      lastTimeOperation++;
      operation[2]++;

      if (orderID === orderRun) {
        event.sender.send('setTime', operation);
      }

      setTimeClass(workArrayOrders, operation[0]);
      editOrder(workArrayOrders, operation);
      editHistoryOperation();
      addHistoryToDB();

      for (let i = 0; i < workArrayOrders.length; i++) {
        if (workArrayOrders[i].id === orderRun) {
          updateOrder(workArrayOrders[i].id, workArrayOrders[i]);
          break;
        }
      }

    }, 60000);
});

function addHistoryOperation(operation) {
  let history = [];
  let hours   = new Date();

  hours.setMinutes(hours.getMinutes() + 1);
  let optionsForTime = {
    hour: 'numeric',
    minute: 'numeric',
    timezone: 'UTC'
  };
  let endDateOperation = hours.toLocaleString('ru-RU', optionsForTime);

  history.push(operation[0]);
  history.push(operation[1]);
  history.push(beginDateOperation);
  history.push(getCurrentDate() + ' ' + endDateOperation);
  history.push(lastTimeOperation);

  historyOperations.push(history);
}

function editHistoryOperation() {
  let hours   = new Date();

  hours.setMinutes(hours.getMinutes() + 1);
  let optionsForTime = {
    hour: 'numeric',
    minute: 'numeric',
    timezone: 'UTC'
  };

  let endDateOperation = hours.toLocaleString('ru-RU', optionsForTime);

  historyOperations[historyOperations.length - 1][3] = getCurrentDate() + ' ' + getCurrentTime();
  historyOperations[historyOperations.length - 1][4] = lastTimeOperation;
}

function addHistoryToDB() {
  checkStatusNetwork((status) => {
      if (status) {
        mongoConnection.mongo.ordersHistory.update({ 'id': orderRun },
        {
          'id': orderRun,
          'history': historyOperations
        },
        { upsert: true },
        (err, docsUpdated) => {
            if (err) console.log(err);
            // else console.log(docUpdated);
        });
      } else {
        controllerLocalStore.updateHistoryOrderInLocalStore(orderRun, historyOperations);
      }
  });
}

function setEndTimeOperation(_orders) {
  for (let i = 0; i < _orders.length; i++) {
    if (_orders[i].id === orderRun) {
      for (let j = 0; j < _orders[i].info.length; j++) {
        if (_orders[i].info[j][1] === nameOperation) {
          _orders[i].info[j][4] = getCurrentDate() + ' ' + getCurrentTime();
          return true;
        }
      }
    }
  }
  return false;
}

function fromDate(beginDateOperation) {
  beginDateOperation = null;
  return getCurrentDate() + ' ' + getCurrentTime();
}

//Находим запущенный заказ, если работника в массиве нет, то добавляем, иначе возврат
function addWorkUser(orders) {
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].id == orderRun) {
      for (let j = 0; j < orders[i].people.length; j++) {
        if (orders[i].people[j] == userName) return true;
      }
      orders[i].people.push(userName);
    }
  }
}

//Останавливаем и очищаем интервал
function stopOperation(_orders) {
  if(BlockIntervalID != null) {
    clearInterval(BlockIntervalID);
    setEndTimeOperation(_orders);
    BlockIntervalID = null;
  }
}


//Находим запущенный процесс и передаем в addOperation: операции и операцию из представления
function editOrder(orders, operation) {
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].id == orderRun) addOperation(orders[i].info, operation);
  }
}


//Если операция уже есть в массиве, то меняем время у операции и выходим,
//иначе заносим массив с новой операцией и ее временем

function addOperation(arrOperation, operation) {
  for (let i = 0; i < arrOperation.length; i++) {
    if (arrOperation[i][1] == operation[1]) {
      arrOperation[i][2] = operation[2];
      return true;
    }
  }
  arrOperation.push([operation[0], operation[1], operation[2], getCurrentDate() + ' ' + getCurrentTime(), ' ']);
}

//Находим запущенную операцию
//Сравниваем переданный класс операцию и меняем значение времени этого класса

function setTimeClass(orders, className) {
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].id == orderRun) {
      switch (className) {
        case 'Наладка':
        case 'Цветоподбор':
        case 'Печать':
          orders[i].usefulTime++;
        break;

        case 'Простои ПЗ':
        case 'Простои техники':
          orders[i].unhelpfulTime++;
        break;

        case 'Остановка программы':
          orders[i].necessaryTime++;
        break;

        default:
          return false;
      }
      return true;
    }
  }
}


//Если
//переданный id совпадает с id запущенной операцией, то останавливаем интервал
//Находим в массиве заказ, устанавливаем статус, дату и время
//Очищаем orderRun (хранит id запущенного заказ)
//Меняем представление
//Подключаемся к БД и обновляем заказ там

//Иначе
//Вывести в лог

ipcMain.on('closeOrder', function (event, id) {
    if (orderRun == id) {
      stopOperation(workArrayOrders);
      for (let i = 0; i < workArrayOrders.length; i++) {
        if (workArrayOrders[i].id == orderRun) {
          workArrayOrders[i].status = 'close';
          workArrayOrders[i].endDate = new Date().toISOString();
          workArrayOrders[i].endTime = getCurrentTime();

          updateOrder(orderRun, workArrayOrders[i]);
          orderRun = null;
          historyOperations = [];
          event.sender.send('showCloseOrder', workArrayOrders[i]);
        }
      }
    } else {
      console.log('Не тот заказ пытаетесь закрыть');
    }
});

function updateOrder(id, order) {
  checkStatusNetwork((status) => {
     if (status) {
       mongoConnection.mongo.orders.update(
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
           {
             upsert: true
           }
       , function (err, docUpdated) {
         return true;
       });
     } else {
       console.log('Обновление заказа локально');
       console.log(id);
       console.log(order);
       controllerLocalStore.updateOrderInLocalStore(id, order);
     }
  });
}


//Текущая дата
function getCurrentDate() {
  let optionsForDate = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timezone: 'UTC'
  };

  return new Date().toLocaleString('ru-RU', optionsForDate);
}

//Текущее время
function getCurrentTime() {
  let optionsForTime = {
    hour: 'numeric',
    minute: 'numeric',
    timezone: 'UTC'
  };

  return new Date().toLocaleString('ru-RU', optionsForTime);
}
