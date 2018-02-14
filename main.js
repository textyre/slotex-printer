const { app, BrowserWindow, ipcMain } = require('electron');
const fs                              = require('fs');
var mongoConnection                   = require('./mongoConnect');
var ControllerLocalStore              = require('./ControllerLocalStore');
var dateModule                        = require('./date');

let win; //Окно

global.orders     = []; //Хранятся заказы из БД
global.ordersData = []; //Хранятся клиенты и декоры
global.moveBetweenDisplay = false;

var foundOrders   = []; //Хранятся найденны заказы
var idFoundOrders = []; //Хранятся id найденных заказов
var users         = []; //Список юзеров
var userName      = null; //Имя текущего юзера

var orderID       = null; //ID заказа
var orderRun      = null; //Запущенный заказ

var positionAt    = 0; //Позиция, с которой выводим вновь загруженные заказы
var positionTo    = 0; //Позиция, по которую выводим вновь загруженные заказы

var BlockIntervalID = null; //Для интервалов
let focusIndex      = null; //Для возврата фокуса
let sync = true;

var beginDateOperation = null; //Начальное время запуск операции
var lastTimeOperation  = 0;

var nameOperation      = null;
var historyOperations  = [];

var sampleDate = '';

var outPanel = false;
let controllerLocalStore = new ControllerLocalStore(app);

var statusNetwork = false;


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
    stopOperation();
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
        statusNetwork = true;
        mongoConnection.mongo.users.find().toArray((err, usersObject) => {
            if (err) console.log(err);
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
      if (orders.length == 0) {
        getOrders(event);
      } else {
        event.sender.send('getOrders', 0, orders.length);
      }

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
          return true;
        }
      }

      for (let i = 0; i < foundOrders.length; i++) {
        if (foundOrders[i].id === orderID) {
          event.sender.send('getOrder', foundOrders[i], userName);
          event.sender.send('getOperations', foundOrders[i], focusIndex);
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
    break;

    case 'sumstatistics':
      event.sender.send('getSampleOrders', foundOrders);
      event.sender.send('getUserNameAndRangeDate', userName, sampleDate);
    break;

    default:
  }
});

//*******************ORDERS WINDOW*******************//
//*****************************************************//

//Подключаемся к БД и вставляем переданный заказ
//Очищаем orders, positionTo, positionAt и загружаем заново заказы (обновляем страницу таким образом)

ipcMain.on('createOrder', function (event, order) {
    let result = mongoConnection.mongo.orders.insert(order, function (err, docsInserted) {
        orders.length = 0;
        positionTo = 0;
        positionAt = 0;
        getOrders(event);
    });

    searchClient(order.client);
    searchDecor(order.decor);
});

function searchClient(client) {
  for (let i = 0; i < ordersData[0].clients.length; i++) {
    if (ordersData[0].clients[i] === client) {
      return true;
    }
  }

  addCLientInDb(client);
}

function searchDecor(decor) {
  for (let i = 0; i < ordersData[1].decors.length; i++) {
    if (ordersData[1].decors[i] === decor) {
      return true;
    }
  }

  addOrderInDb(decor);
}

function addCLientInDb(client) {
  mongoConnection.mongo.ordersData.update(
    { 'id': 'clients' },
    { $push: { 'clients': client } },
    (err, result) => {
      if (err) console.log(err);
      ordersData[0].clients.push(client)
    });
}

function addOrderInDb(decor) {
  mongoConnection.mongo.ordersData.update(
    { 'id': 'decors' },
    { $push: { 'decors': decor } },
    (err, result) => {
      if (err) console.log(err);
      ordersData[1].decors.push(decor);
    });
}

ipcMain.on('deleteClientOrder', function (event, nameArray, indexItem) {
    let indexPasteOrderData;

    if (nameArray === 'clients') {
      ordersData[0].clients.splice(indexItem, 1);
      indexPasteOrderData = 0;
    } else if (nameArray === 'decors') {
      ordersData[1].decors.splice(indexItem, 1);
      indexPasteOrderData = 1;
    }
    mongoConnection.mongo.ordersData.update({ 'id': nameArray }, ordersData[indexPasteOrderData],
    (err, docUpdated) => {
      console.log(docUpdated);
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
    for (let i = 0; i < orders.length; i++) {
      if (orders[i].id === id) {
        orders.splice(i, 1);
        deleteOrderInDb(id);
        deleteHistoryOrderInDb(id);
        if (orderRun === id) {
          stopOperation();
          orderRun = null;
          historyOperations = [];
        }
        break;
      }
    }
});

function deleteOrderInDb(id) {
  mongoConnection.mongo.orders.remove({ 'id': id },
  {
    justOne: true
  });
}

function deleteHistoryOrderInDb(id) {
  mongoConnection.mongo.ordersHistory.remove({ 'id': id },
  {
    justOne: true
  });
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
              if (err) console.log(err);
              if (positionTo == positionAt) {
                event.sender.send('getOrders', positionAt, positionTo, true);
              } else {
                event.sender.send('getOrders', positionAt, positionTo, false);
              }
              positionAt = positionTo;
          });
        } else {
          console.log('Забей');
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

  let cursor = mongoConnection.mongo.ordersHistory
  .find({ 'id': id }, { 'history': 1, '_id': 0 } );

  cursor.forEach(
    resultHistory => {
      if (event === undefined) {
        historyOperations = resultHistory.history;
      } else {
        event.sender.send('getOperationsHistory', resultHistory.history);
      }
    },

    error => {
      console.log(error);
    });
}


//Подключаем к БД и загружаем клиентов с декорами, заносим в массив
function getData(event) {
  checkStatusNetwork((status) => {
      if (status) {
        let cursor = mongoConnection.mongo.ordersData.find();
        cursor.forEach(function (doc) {
          ordersData.push(doc);
        }, function (err) {
            if (err) {
              console.log(err);
            } else {
              event.sender.send('getClients', ordersData[0]);
              event.sender.send('getDecors', ordersData[1]);
              return true;
            }
        });
      } else {
        console.log('Забей');
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
        console.log(err);
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
    foundOrders = [];

    let cursor = execute(fromDate, toDate, fromTime, toTime);
    cursor.sort({ 'dateCreate': -1 })
    .toArray(function (err, uploadOrders) {
        if (err) {
          console.log(err);
          return false;
        }

        if (uploadOrders.length) {
          event.sender.send('foundOrders', uploadOrders);
          foundOrders = uploadOrders;
        } else {
          event.sender.send('error_notFound', null);
        }
    });
});

function execute(fromDate, toDate, fromTime, toTime) {
  console.log(fromDate, toDate, fromTime, toTime);
  if (fromDate !== null) {
      if (toDate !== null) {
        if (fromTime !== null && toTime !== null) {
          //Начальная, конечная, начальное, конечное
          return mongoConnection.mongo.orders
          .find({
                  $and: [
                          {
                            'beginDate': {
                                          $gte: fromDate,
                                          $lte: toDate
                                        }
                          },

                          // {
                          //   'beginTime': {
                          //                   $gte: fromTime,
                          //                   $lte: toTime
                          //                }
                          // },

                          {
                            'id': {
                                    $not: {$in: idFoundOrders }
                                  }
                          }
                        ]
                });
        } else if (fromTime !== null && toTime === null) {
          //Начальная, конечная, начальное
          return mongoConnection.mongo.orders
          .find({ $and: [
                    {
                      'beginDate': {
                                    $gte: fromDate,
                                    $lte: toDate
                                  }
                    },

                    // {
                    //   'beginTime': {$gte: fromTime}
                    // },

                    {
                      'id': {
                              $not: {$in: idFoundOrders }
                            }
                    }
                  ]
          });
        } else if (fromTime === null && toTime !== null) {
          //Начальная дата, конечная дата, конечное время
          return mongoConnection.mongo.orders
          .find({ $and: [
                    {
                      'beginDate': {
                                    $gte: fromDate,
                                    $lte: toDate
                                  }
                    },

                    // {
                    //   'beginTime': {$lte: toTime}
                    // },

                    {
                      'id': {
                              $not: {$in: idFoundOrders }
                            }
                    }
                  ]
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
                    },

                    {
                      'id': {
                              $not: {$in: idFoundOrders }
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
                                  // $gte: fromTime,
                                  $lte: toTime
                               }
                },

                {
                  'id': {
                          $not: {$in: idFoundOrders }
                        }
                }
              ]
      });

    } else if (fromTime !== null && toTime === null) {
      //Начальная дата, начальное время
      return mongoConnection.mongo.orders
      .find({ $and: [
                {
                  'beginDate': { $gte: fromDate }
                },

                // {
                //   'beginTime': {$gte: fromTime}
                // },

                {
                  'id': {
                          $not: {$in: idFoundOrders }
                        }
                }
              ]
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
                },

                {
                  'id': {
                          $not: {$in: idFoundOrders }
                        }
                }
              ]
      });

    } else {
      //Только начальная дата
      return mongoConnection.mongo.orders
      .find({ $and: [
                    {
                      'beginDate': { $gte: fromDate }
                    },

                    {
                      'id': {
                              $not: {$in: idFoundOrders }
                            }
                    }
                  ]
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
                    },

                    {
                      'id': {
                              $not: {$in: idFoundOrders }
                            }
                    }
                  ]
            });
    } else if (fromTime !== null) {
      //Начальное время
      return mongoConnection.mongo.orders
      .find({ $and: [
                    {
                      'beginTime': { $gte: fromTime }
                    },

                    {
                      'id': {
                              $not: {$in: idFoundOrders }
                            }
                    }
                  ]
            });

    } else if (toTime !== null) {
      //Конечное время
      return mongoConnection.mongo.orders
      .find({ $and: [
                    {
                      'endTime': { $gte: toTime }
                    },

                    {
                      'id': {
                              $not: {$in: idFoundOrders }
                            }
                    }
                  ]
            });
    }
  }
}

ipcMain.on('searchInDB', function (event, key) {
  // if (sync) {
    sync = false;
    //foundOrders = [];

    mongoConnection.mongo.orders
    .find(
        { $and: [
                  { $or: [
                            {'id'    : {$regex: `.*${key}.*`, $options: 'i'} },
                            {'client': {$regex: `.*${key}.*`, $options: 'i'} },
                            {'decor' : {$regex: `.*${key}.*`, $options: 'i'} },
                            {'people': {$regex: `.*${key}.*`, $options: 'i'} }
                         ]
                  },

                  {'id': { $not: {$in: idFoundOrders } } }
                ]
        })
    .sort({ 'dateCreate': -1 })
    .toArray(function (err, uploadOrders) {
        if (err) {
          console.log(err);
          return false;
        }

        if (uploadOrders.length) {
          // uploadOrders = checkSameOrder(uploadOrders);
          // console.log('=======КОЛИЧЕСТВО ЗАКАЗОВ: ' + uploadOrders.length + ' =========');
          // console.log(uploadOrders);
          // console.log('===========================');

          // addOrderToOrderID(uploadOrders, event);
          event.sender.send('foundOrders', uploadOrders);
          foundOrders = uploadOrders;
          return true;
        } else {
          event.sender.send('error_notFound', null);
          sync = true;
        }
    });
  // } else {
  //   console.log('  ');
  //   console.log('  ');
  //   console.log('ЗАПРОС ЕЩЕ ВЫПОЛНЯЕТСЯ');
  //   console.log('  ');
  //   console.log('  ');
  // }

});

function checkSameOrder(uploadOrders) {
  for (let i = 0; i < foundOrders.length; i++) {
    for (let j = 0; j < uploadOrders.length; j++) {
      if (foundOrders[i].id == uploadOrders[j].id) {
        uploadOrders.splice(j, 1);
      }
    }
  }
  return uploadOrders;
}

function addOrderToOrderID(uploadOrders, event) {
    for (let i = 0; i < uploadOrders.length; i++) {
      foundOrders.push(uploadOrders[i]);
      idFoundOrders.push(uploadOrders[i]);
    }
    event.sender.send('foundOrders', foundOrders);
    sync = true;
    return true;
}

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

    for (let i = 0; i < orders.length; i++) {
      if (orders[i].id == id) {
        orders[i].status = 'run';
        orders[i].beginDate = new Date().toISOString();
        orders[i].beginTime = getCurrentTime();
        event.returnValue = true;
      }
    }
});

ipcMain.on('setOrderRun', (event, id) => {
    orderRun = id;
});

// ipcMain.on('setHistoryOperation', function (event, classNameOperation, nameOperation, timeOperation) {
//     for (let i = 0; i < orders.length; i++) {
//       if (orders[i].id === orderRun) {
//         for (let j = 0; j < orders[i].info.length; j++) {
//           if (orders[i].info[j][1] === nameOperation) {
//             orders[i].info[j][4] = getCurrentDate() + ' ' + getCurrentTime();
//           }
//         }
//         let endDateOperation = getCurrentDate() + ' ' + getCurrentTime();
//         let history          = [];
//             history.push(classNameOperation)
//             history.push(nameOperation);
//             history.push(beginDateOperation);
//             history.push(endDateOperation);
//             history.push(lastTimeOperation);
//       }
//     }
// });


//Запуск операции
//Запоминаем индекса последнего запущенного элемента
//Добавляем работника к заказу
//Создаем интервал в 60 секунд (60000 млсек)
//Увеличиваем число для вывода, если открыт запущенный заказ, то возвращаем в представление
//Увеличиваем время у класс операций

ipcMain.on('startOperation', function (event, operation) {

    focusIndex         = operation[4];
    beginDateOperation = fromDate(beginDateOperation);

    stopOperation();

    if (nameOperation !== operation[1]) {
      lastTimeOperation = 0;
    }

    nameOperation = operation[1];

    addWorkUser();
    editOrder(operation);
    addHistoryOperation(operation);

    BlockIntervalID = setInterval(function run() { //Создаем новый таймер для операций

      lastTimeOperation++;
      operation[2]++;

      if (orderID === orderRun) {
        event.sender.send('setTime', operation);
      }

      setTimeClass(operation[0]);
      editOrder(operation);
      editHistoryOperation();
      addHistoryToDB();
      console.log(historyOperations);

      for (let i = 0; i < orders.length; i++) {
        if (orders[i].id === orderRun) {
          updateOrder(orders[i].id, orders[i]);
          break;
        }
      }

    }, 1000);
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

  historyOperations[historyOperations.length - 1][3] = getCurrentDate() + getCurrentTime();
  historyOperations[historyOperations.length - 1][4] = lastTimeOperation;
}

function addHistoryToDB() {
  mongoConnection.mongo.ordersHistory.update({ 'id': orderRun },
  { 'id': orderRun,
    'history': historyOperations
  },
  { upsert: true },
  (err, docsUpdated) => {
      if (err) console.log(err);
      // else console.log(docUpdated);
  });
}

function setEndTimeOperation() {
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].id === orderRun) {
      for (let j = 0; j < orders[i].info.length; j++) {
        if (orders[i].info[j][1] === nameOperation) {
          orders[i].info[j][4] = getCurrentDate() + ' ' + getCurrentTime();
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
function addWorkUser() {
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
function stopOperation() {
  if(BlockIntervalID != null) {
    clearInterval(BlockIntervalID);
    setEndTimeOperation();
    BlockIntervalID = null;
  }
}


//Находим запущенный процесс и передаем в addOperation: операции и операцию из представления
function editOrder(operation) {
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

function setTimeClass(className) {
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
      stopOperation();
      for (let i = 0; i < orders.length; i++) {
        if (orders[i].id == orderRun) {
          orders[i].status = 'close';
          orders[i].endDate = new Date().toISOString();
          orders[i].endTime = getCurrentTime();

          updateOrder(orderRun, orders[i]);
          orderRun = null;
          historyOperations = [];
          event.sender.send('showCloseOrder', orders[i]);
        }
      }
    } else {
      console.log('Не тот заказ пытаетесь закрыть');
    }
});

function updateOrder(id, order) {
  mongoConnection.mongo.orders.update(
      { 'id': id },
      order
  , function (err, docUpdated) {
    return true;
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
