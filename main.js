const { app, BrowserWindow, ipcMain } = require('electron');
const fs                              = require('fs');
var mongoConnection                   = require('./mongoConnect');

let win; //Окно

global.orders     = []; //Хранятся заказы из БД
var foundOrders      = []; //Хранятся ID заказов
var ordersData    = []; //Хранятся клиенты и декоры
var users         = []; //Список юзеров
var userName      = null; //Имя текущего юзера

var orderID       = null; //ID заказа
var orderRun      = null; //Запущенный заказ

var positionAt    = 0; //Позиция, с которой выводим вновь загруженные заказы
var positionTo    = 0; //Позиция, по которую выводим вновь загруженные заказы

var BlockIntervalID = null; //Для интервалов
let focusIndex      = null; //Для возврата фокуса

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

    mongoConnection.connect(function (err) {
        if (err) console.log(err);
    });
});


//Обработка открытия окон
//Окно входа - если юзеры загружены, то отдаеть, иначе загрузить
//Окно заказов - проверка юзернейма и запуск окна
//Окно панели, статистики  - принимается ID заказов и запускается окно

ipcMain.on('openWindow', function (event, arg) {
    switch (arg[0]) {
      case 'enterWindow':
        if (users.length == 0) {
          getUsers(event);
        } else {
          event.sender.send('getUsers', users);
        }
      break;

      case 'ordersWindow':
        if (userName == null && arg[1] != null && arg[1] != undefined) userName = arg[1];
        win.loadURL(`file://${__dirname}/orders/orders.html`);
        event.sender.send('result', 'open');
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

      default:
    }
});


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
        if (orders[i].id == orderID) {
          event.sender.send('getOrder', orders[i], userName);
          event.sender.send('getOperations', orders[i], focusIndex);
          return true;
        }
      }
    break;

    default:
  }
});

//*******************ORDERS WINDOW*******************//
//*****************************************************//

//Подключаемся к БД и вставляем переданный заказ
//Очищаем orders, positionTo, positionAt и загружаем заново заказы (обновляем страницу таким образом)

ipcMain.on('createOrder', function (event, order) {
    let db = mongoConnection.getDb();
    let result = db.collection('orders').insert(order, function (err, docsInserted) {
        console.log(docsInserted);
        orders.length = 0;
        positionTo = 0;
        positionAt = 0;
        getOrders(event);
    });
});


//Если переданный флаг true, то загружаем заказы
ipcMain.on('loadOrder', function (event, flag) {
  if (flag) getOrders(event);
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


//Загрузка заказов
//Подключаемся к БД, пропускаем n-позиций, которые уже были загружены
//Лимит 15 заказов, чтобы не нагружать
//Сортировка: с последних созданных
//Кладем документы в массив, ID заказов кладем в массив и увеличиваем positionTo++ для следующих запросов
//Если positionTo == positionAt, то не даем больше загружать документы, иначе прокрутка вниз вызовет загрузку
//Устанавливаем positionAt = positionTo

function getOrders(event) {
  let db = mongoConnection.getDb();

  let cursor = db.collection('orders').find().skip(positionTo).limit(2).sort({ 'dateCreate': -1 });
  cursor.forEach(function (doc) {
    orders.push(doc);
    positionTo++;
  }, function (err) {
      if (positionTo == positionAt) {
        event.sender.send('getOrders', positionAt, positionTo, true);
      } else {
        event.sender.send('getOrders', positionAt, positionTo, false);
      }
      positionAt = positionTo;
  });
}


//Подключаем к БД и загружаем клиентов с декорами, заносим в массив
function getData(event) {
  let db = mongoConnection.getDb();
  let cursor = db.collection('ordersData').find();
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
}


//Подключаемся к БД и загружаем юзеров
function getUsers(event) {
  let db = mongoConnection.getDb();
  let cursor = db.collection('users').find();
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
    console.log('=======TIME SEARCH IN DB=========');
    foundOrders = [];
    console.log(fromDate, toDate, fromTime, toTime);
    let cursor = run(fromDate, toDate, fromTime, toTime);
    cursor.sort({ 'dateCreate': -1 })
    .toArray(function (err, uploadOrders) {
        if (err) {
          console.log(err);
          return false;
        }
        uploadOrders = checkSameOrder(uploadOrders);

        if (uploadOrders.length) {
          console.log('=======КОЛИЧЕСТВО ЗАКАЗОВ: ' + uploadOrders.length + ' =========');
          console.log(uploadOrders);
          console.log('===========================');

          addOrderToOrderID(uploadOrders, event);
        } else {
          event.sender.send('error_notFound', null);
          console.log('Ничего не загрузилось');
        }
    });
});

function run(fromDate, toDate, fromTime, toTime) {
  let db = mongoConnection.getDb();
  console.log('run');
  console.log(fromDate, toDate, fromTime, toTime);
  if (fromDate !== null) {
      if (toDate !== null) {
        if (fromTime !== null && toTime !== null) {
          //Если начальная дата, и конечная, и начальное время, и конечное время
          return db.collection('orders')
          .find({
                  $and: [
                          {
                            'beginDate': {
                                          $gte: fromDate,
                                          $lte: toDate
                                        }
                          },

                          {
                            'beginTime': {
                                            $gte: fromTime,
                                            $lte: toTime
                                         }
                          },

                          {
                            'id': {
                                    $not: {$in: foundOrders }
                                  }
                          }
                        ]
                });
        } else if (fromTime !== null && toTime === null) {
          //Начальная, конечня дата, начальное время
          return db.collection('orders')
          .find({ $and: [
                    {
                      'beginDate': {
                                    $gte: fromDate,
                                    $lte: toDate
                                  }
                    },

                    {
                      'beginTime': {$gte: fromTime}
                    },

                    {
                      'id': {
                              $not: {$in: foundOrders }
                            }
                    }
                  ]
          });
        } else if (fromTime === null && toTime !== null) {
          //Начальная дата, конечная дата, конечное время
          return db.collection('orders')
          .find({ $and: [
                    {
                      'beginDate': {
                                    $gte: fromDate,
                                    $lte: toDate
                                  }
                    },

                    {
                      'beginTime': {$lte: toTime}
                    },

                    {
                      'id': {
                              $not: {$in: foundOrders }
                            }
                    }
                  ]
          });
        } else {
          //Если начальная и конечная дата
          return db.collection('orders')
          .find({ $and: [
                    {
                      'beginDate': {
                                    $gte: fromDate,
                                    $lte: toDate
                                  }
                    },
                  ]
          });
        }
      }

    if (fromTime !== null && toTime !== null) {
      //Начальная дата, начальное время, конечное время
      return db.collection('orders')
      .find({ $and: [
                {
                  'beginDate': {$gte: fromDate}
                },

                {
                  'beginTime': {
                                  $gte: fromTime,
                                  $lte: toTime
                               }
                },

                {
                  'id': {
                          $not: {$in: foundOrders }
                        }
                }
              ]
      });

    } else if (fromTime !== null && toTime === null) {
      //Начальная дата, начальное время
      return db.collection('orders')
      .find({ $and: [
                {
                  'beginDate': {$gte: fromDate}
                },

                {
                  'beginTime': {$gte: fromTime}
                },

                {
                  'id': {
                          $not: {$in: foundOrders }
                        }
                }
              ]
      });
    } else if (fromTime === null && toTime !== null) {
      //Начальная дата, конечное время
      return db.collection('orders')
      .find({ $and: [
                {
                  'beginDate': {$gte: fromDate}
                },

                {
                  'beginTime': {$lte: toTime}
                },

                {
                  'id': {
                          $not: {$in: foundOrders }
                        }
                }
              ]
      });

    } else {
      //Только начальная дата
      return db.collection('orders')
      .find({ $and: [
                    {
                      'beginDate': {$gte: fromDate}
                    },

                    {
                      'id': {
                              $not: {$in: foundOrders }
                            }
                    }
                  ]
            });
    }
  } else {
    if (fromTime !== null && toTime !== null) {
      //Начальное и конечное время
      return db.collection('orders')
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
                              $not: {$in: foundOrders }
                            }
                    }
                  ]
            });
    } else if (fromTime !== null) {
      //Начальное время
      console.log('Начальное время');
      return db.collection('orders')
      .find({ $and: [
                    {
                      'beginTime': {$gte: fromTime}
                    },

                    {
                      'id': {
                              $not: {$in: foundOrders }
                            }
                    }
                  ]
            });

    } else if (toTime !== null) {
      //Конечное время
      return db.collection('orders')
      .find({ $and: [
                    {
                      'endTime': {$gte: toTime}
                    },

                    {
                      'id': {
                              $not: {$in: foundOrders }
                            }
                    }
                  ]
            });
    }
  }
}

ipcMain.on('searchInDB', function (event, key) {
    let db = mongoConnection.getDb();
    foundOrders = [];
    console.log("====SEARCH KEY====");
    console.log(key);

    db.collection('orders')
    .find(
        { $and: [
                  { $or: [
                            {'id'    : {$regex: `.*${key}.*`, $options: 'i'} },
                            {'client': {$regex: `.*${key}.*`, $options: 'i'} },
                            {'decor' : {$regex: `.*${key}.*`, $options: 'i'} },
                            {'people': {$regex: `.*${key}.*`, $options: 'i'} }
                         ]
                  },

                  {'id': { $not: {$in: foundOrders } } }
                ]
        })
    .sort({ 'dateCreate': -1 })
    .toArray(function (err, uploadOrders) {
        if (err) {
          console.log(err);
          return false;
        }

        uploadOrders = checkSameOrder(uploadOrders);

        if (uploadOrders.length) {
          console.log('=======КОЛИЧЕСТВО ЗАКАЗОВ: ' + uploadOrders.length + ' =========');
          console.log(uploadOrders);
          console.log('===========================');

          addOrderToOrderID(uploadOrders, event);
        } else {
          console.log('Ничего не загрузилось');
        }
    });
});

function checkSameOrder(uploadOrders) {
  for (let i = 0; i < foundOrders.length; i++) {
    for (let j = 0; j < uploadOrders.length; j++) {
      if (foundOrders[i].id == uploadOrders[j].id) {
        console.log('УДАЛЯЕМ КОПИЮ ЗАКАЗА');
        uploadOrders.splice(j, 1);
      }
    }
  }
  return uploadOrders;
}

function addOrderToOrderID(uploadOrders, event) {
    for (let i = 0; i < uploadOrders.length; i++) {
      foundOrders.push(uploadOrders[i]);
    }
    event.sender.send('foundOrders', foundOrders);
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
        orders[i].beginDate = getCurrentDate();
        orders[i].beginTime = getCurrentTime();
        event.returnValue = true;
      }
    }
});


//Запуск операции
//Запоминаем индекса последнего запущенного элемента
//Добавляем работника к заказу
//Создаем интервал в 60 секунд (60000 млсек)
//Увеличиваем число для вывода, если открыт запущенный заказ, то возвращаем в представление
//Увеличиваем время у класс операций

ipcMain.on('startOperation', function (event, operation) {
    focusIndex = operation[4];
    addWorkUser();
    stopOperation();
    editOrder(operation);

    BlockIntervalID = setInterval(function run() { //Создаем новый таймер для операций
      operation[2]++;
      if (orderID == orderRun) {
        event.sender.send('setTime', operation);
      }
      setTimeClass(operation[0]);
      editOrder(operation);
    }, 2000);
});


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
      console.log('Обновление значения');
      return true;
    }
  }
  console.log('Добавление новой операции');
  arrOperation.push([operation[0], operation[1], operation[2]]);
}


//Находим запущенную операцию
//Сравниваем переданный класс операцию и меняем значение времени этого класса

function setTimeClass(className) {
  console.log(className);
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
          orders[i].endDate = getCurrentDate();
          orders[i].endTime = getCurrentTime();

          orderRun = null;

          event.sender.send('showCloseOrder', orders[i]);

          let db = mongoConnection.getDb();
          db.collection('orders').update(
              { 'id': orders[i].id },
              orders[i]
          , function (err, docUpdated) {
            console.log(docUpdated);
          });
        }
      }
    } else {
      console.log('Не тот заказ пытаетесь закрыть');
    }
});


//Текущая дата
function getCurrentDate() {
  let optionsForDate = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    timezone: 'UTC'
  };

  return new Date().toLocaleString('sq', optionsForDate);
}

//Текущее время
function getCurrentTime() {
  let optionsForTime = {
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timezone: 'UTC'
  };

  return new Date().toLocaleString('sq', optionsForTime);
}

// ipcMain.on('removeOrder', function (event, arg) {
//   console.log('delete');
//   let db = mongoConnection.getDb();
//   db.collection('orders').remove({ "dateCreate": { $gt: "2017-12-19 00:00:00" } } );
// });