const { app, BrowserWindow, ipcMain } = require('electron');

var mongoConnection                     = require('./mongoConnect');
const ControllerLocalStore              = require('./ControllerLocalStore');
const ControllerRemoteStore             = require('./ControllerRemoteStore');
const ModelUsers                        = require('./ModelUsers');
const ModelClientsDecors                = require('./ModelClientsDecors');
const ModelOrders                       = require('./ModelOrders');

let win; //Окно

var BlockIntervalID = null; //Для интервалов
let focusIndex      = null; //Для возврата фокуса

var beginDateOperation = null; //Начальное время запуск операции
var lastTimeOperation  = 0;
var nameOperation      = null;

var sampleDate = '';

const modelUsers          = new ModelUsers();
const modelClientsDecors  = new ModelClientsDecors();
const modelOrders         = new ModelOrders();

let controllerLocalStore  = new ControllerLocalStore(app, modelUsers);
let controllerRemoteStore = new ControllerRemoteStore(modelUsers, modelClientsDecors, modelOrders);

//startOrdersPage: регулирует запуск страницы, при запуске true, после загрузки заказов false

//moreDownloadOrderds: регулирует загрузку заказов, при старте страницы true,
//после включения сети и загрузки заказов false
var startOrdersPage     = false;
var moreDownloadOrderds = false;
var addLocalOrders      = true;
var statusNetwork       = false;

//При запуске приложения получаем юзеров или ошибку
app.on('ready', () => {
    createWindow();
    // let array1 = [{ 'id': 1, 'name': 'petya' }, { 'id': 2, 'name': 'vasya' }, { 'id': 3, 'name': 'vanya' }];
    // let array2 = array1[1];
    // array1.unshift({ 'id': 0, 'name': 'admin' });
    // // array2[0].name = 'root';
    // console.log(array1);
    // array1.push({ 'id': 4, 'name': 'database' });
    // console.log(array2.name = 'root');
    // console.log(array1);

});

app.on('activate', () => {
    if (win === null) {
      createWindow()
    }
});

function createWindow() {
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

  win.on('closed', () => {
      win = null;
  });
}

app.on('window-all-closed', (event) => {
    // event.preventDefault();
    stopOperation((status) => {
        console.log(status);
        focusIndex = null;
    });

    if (process.platform !== 'darwin') {
      mongoConnection.closeConnect();
      app.quit();
    }
});


//Обработка открытия окон
//Окно входа - если юзеры загружены, то отдаеть, иначе загрузить
//Окно заказов - проверка юзернейма и запуск окна
//Окно панели, статистики  - принимается ID заказов и запускается окно

ipcMain.on('openWindow', function (event, arg) {

    switch (arg[0]) {
      case 'enterWindow':
        let lengthUsers = modelUsers.getAllUsers().length;

        if (lengthUsers === 0) {
          controllerRemoteStore.connectRemote((status) => {
              if (status) {
                  controllerRemoteStore.getAllUsers((status) => {
                      event.sender.send('getUsers', modelUsers.getAllUsers());
                      controllerLocalStore.updateUsersInLocalStore(modelUsers.getAllUsers());
                  });
              } else {
                  controllerLocalStore.getUsersFromLocalStore((status) => {
                      if (status) event.sender.send('getUsers', modelUsers.getAllUsers());
                      else console.log('01: Нет доступа по сети и нет доступа к диску');
                  });
              }
          });
        } else {
          event.sender.send('getUsers', modelUsers.getAllUsers());
        }
      break;

      case 'ordersWindow':
        win.loadURL(`file://${__dirname}/orders/orders.html`);
      break;

      case 'panelWindow':
        modelOrders.setOrderID(arg[1]);
        win.loadURL(`file://${__dirname}/main/main.html`);
        event.sender.send('result', 'open');
      break;

      case 'statisticsWindow':
        modelOrders.setOrderID(arg[1]);
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

function sendToView_ClientsAndDecors(event) {
  event.sender.send('getClients',  modelClientsDecors.getAllClients());
  event.sender.send('getDecors', modelClientsDecors.getAllDecors());
}

ipcMain.on('windowLoad', function (event, arg) {
  let id       = null;
  let order    = null;
  let userName = null;

  switch (arg) {
    case 'ordersWindow':
      modelOrders.newFoundOrders();

      let lengthClientsAndDecors = modelClientsDecors.getAllClientsAndDecors()[0].length ||
                                   modelClientsDecors.getAllClientsAndDecors()[1].length;

      if (lengthClientsAndDecors === 0) {
        controllerRemoteStore.getAllClientsAndDecors((clients_decors) => {
            if (clients_decors !== false) {
                modelClientsDecors.addClientsAndDecors(clients_decors);

                controllerLocalStore.updateClientsInLocalStore(clients_decors[0].clients);
                controllerLocalStore.updateDecorsInLocalStore(clients_decors[1].decors);

                sendToView_ClientsAndDecors(event);
            } else {
                clients_decors = [];
                controllerLocalStore.getClientsFromLocalStore((localClients) => {
                    clients_decors.push(localClients[0]);
                    event.sender.send('getClients', localClients[0].clients);
                });

                controllerLocalStore.getDecorsFromLocalStore((localDecors) => {
                    clients_decors.push(localDecors[0]);
                    event.sender.send('getDecors', localDecors[0].decors);

                    modelClientsDecors.addClientsAndDecors(clients_decors);
                });
            }
        });
      } else {
        sendToView_ClientsAndDecors(event);
      }
    break;

    case 'panelWindow':
      id       = modelOrders.getOrderID();
                 modelOrders.searchOrder(id);
      order    = modelOrders.getCurrentOrder();
      userName = modelUsers.getUserName();
      event.sender.send('getOrder', order, userName);
      event.sender.send('getOperations', order, focusIndex);
    break;

    case 'statisticsWindow':
      id       = modelOrders.getOrderID();
                 modelOrders.searchOrder(id);
      order    = modelOrders.getCurrentOrder();
      userName = modelUsers.getUserName();
      getOperationsHistory(event, id);
      event.sender.send('getOrder', order, userName);
    break;

    case 'sumstatistics':
      userName = modelUsers.getUserName();
      event.sender.send('getSampleOrders', modelOrders.getWorkaArrayOrders());
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

ipcMain.on('online-status-changed', (event, status) => {
    statusNetwork = status;
    if (status) {
      mergeLocalAndRemoteOrdersCollection();
      mergeLocalAndRemoteOrdersHistoryCollection();
    } else {
      return true;
    }
});

ipcMain.on('online-status-changed-orders', (event, status) => {
    statusNetwork         = status;
    let lengthOrders      = modelOrders.getLengthOrders();
    let lengthLocalOrders = modelOrders.getLengthLocalOrders();

    if (status) {
      if (addLocalOrders || lengthOrders === 0) {
        mergeLocalAndRemoteOrdersCollection();
        mergeLocalAndRemoteOrdersHistoryCollection();
      }

      if (lengthOrders === 0 && startOrdersPage) {
        getOrders(event);

      } else if (lengthOrders > 0 && startOrdersPage) {
        event.sender.send('getOrders', modelOrders.getAllOrders());

      } else if (lengthLocalOrders > 0 && lengthOrders === 0) {
        getOrdersWithTimeout(event);

      } else if (lengthLocalOrders === 0 && lengthOrders === 0) {
        getOrders(event);
      }
      startOrdersPage = false;

    } else {
      if (lengthOrders > 0 && startOrdersPage) {
        event.sender.send('getOrders', modelOrders.getAllOrders());

      } else if (lengthLocalOrders === 0 && startOrdersPage) {
        getLocalOrders(event);

      } else if (lengthLocalOrders > 0 && startOrdersPage) {
        event.sender.send('getOrders', modelOrders.getAllLocalOrdes());
      }
      startOrdersPage = false;
    }
});

function getOrdersWithTimeout(event) {
  setTimeout(() => {
    getOrders(event);
    moreDownloadOrderds = false;
  }, 1000);
}

//Получаем заказы из NeDB
//Проверка на кол-во, добавляем в MongoDB, удаляем из NeDB
//Устанавливаем флаг addLocalOrders = false,
//чтобы больше не мержить до событие(добавление в NeDB)
function mergeLocalAndRemoteOrdersCollection() {
  addLocalOrders = false;
  controllerLocalStore.getOrdersFromLocalStore((localOrders) => {
     if (localOrders.length > 0) {
           controllerRemoteStore.insertLocalOrders(localOrders, (status) => { if (!status) return false });
           controllerLocalStore.removeAllOrdersFromLocalStore((status) => {
               if (!status) return false;
           });
     } else return true;
  });
}


//Получаем истории заказов из NeDB
//Проверка на кол-во, добавляем в MongoDB, удаляем из NeDB
function mergeLocalAndRemoteOrdersHistoryCollection() {
  controllerLocalStore.getAllHistoryOrders((localHistory) => {
      if (localHistory.length > 0) {
        controllerRemoteStore.insertLocalHistoryOrders(localHistory, (status) => { if (!status) return false });
        controllerLocalStore.removeAllHistoryOrders((status) => { if (!status) return false });
      } else return true;
  });
}


//Кладем в в MongoDB заказ, если удачно, то и в массив
//Если неудачно: кладем в NeDB, устанавливаем флаг событие(добавление в NeDB)
//Если в главном массиве (orders) уже есть заказы, то кладем туда и в массив для
//локальных заказов, чтобы при появлении сети смержить их.
//Иначе кладем заказы в массив для локальных заказов
//Далее ищем декор и клиента, чтобы добавить в базу в случае их отсутствия.
ipcMain.on('createOrder', function (event, order) {
      controllerRemoteStore.createOrder(order, (status) => {
           if (status) {
             console.log('00: Order is create');
             modelOrders.unshiftOrders(order);
             modelOrders.setPositionTo(0);
             event.sender.send('getOrders', modelOrders.getWorkaArrayOrders());
           } else {

             controllerLocalStore.insertOrderToLocalStore(order, (localOrder) => {
                 addLocalOrders = true;
                 if (localOrder === false) {
                   event.sender.send('getOrders', modelOrders.getWorkaArrayOrders());

                 } else if (modelOrders.getAllOrders().length > 0) {
                   // modelOrders.unshiftLocalOrders(order);
                   modelOrders.unshiftOrders(order);
                   event.sender.send('getOrders', modelOrders.getWorkaArrayOrders());

                 } else {
                   modelOrders.unshiftLocalOrders(order);
                   event.sender.send('getOrders', modelOrders.getWorkaArrayOrders());
                 }
             });
           }
      });

      let resultFoundClient = modelClientsDecors.searchClient(order.client);
      let resultFoundDecor  = modelClientsDecors.searchDecor(order.decor);

      if (!resultFoundClient) {
        controllerRemoteStore.addCLientInDb(order.client, (status) => {
             if (!status) controllerLocalStore.addClientInLocalStore(order.client);
             event.sender.send('getClients', modelClientsDecors.getAllClients());
        });
      }

      if (!resultFoundDecor) {
        controllerRemoteStore.addDecorInDb(order.decor, (status) => {
              if (!status) controllerLocalStore.addDecorInLocalStore(order.decor);
              event.sender.send('getDecors', modelClientsDecors.getAllDecors());
        });
      }
});


ipcMain.on('deleteClientDecor', function (event, nameArray, indexItem) {
      let updateObject;
      if (nameArray === 'clients')     updateObject = modelClientsDecors.deleteClient(indexItem);
      else if (nameArray === 'decors') updateObject = modelClientsDecors.deleteDecor(indexItem);
      console.log(updateObject);
      controllerRemoteStore.updateOrdersData(nameArray, updateObject, (status) => {
          if (status) event.returnValue = true;
          else
          {
            controllerLocalStore.updateOrdersData(nameArray, updateObject, (status) => {
               if (status) event.returnValue = true;
               event.returnValue = false;
            });
          }
      });
});


ipcMain.on('loadOrder', function (event, arg) {
      getOrders(event);
});


//Запрос из usersBar.js, выполняется при смене имени
ipcMain.on('setUserName', function (event, userName) {
      modelUsers.setUserName(userName);
});

//Запрос из orders.js
//Отдает ему пользователя
ipcMain.on('getUserName', function (event, arg) {
      event.sender.send('setUserName', modelUsers.getUserName());
});

//Запрос из sideBar.js
//Возвращает список юзеров для выбора
ipcMain.on('getUsers', function (event, arg) {
      event.sender.send('setUsers', modelUsers.getAllUsers());
});

ipcMain.on('deleteOrder', function (event, id) {
      let _status  = false;
      controllerRemoteStore.deleteOrder(id, (status) => {
          if (!status) {
            controllerLocalStore.removeOrder(id, (status) => {
                _status = status;
                controllerLocalStore.removeHistory(id, (status) => {
                    _status = _status && status;
                    deleteOrder(event, _status, id);
                });
            });
          } else {
            _status = status;
            controllerRemoteStore.deleteHistory(id, (status) => {
                _status = _status && status;
                deleteOrder(event, _status, id);
            });
          }
      });

      function deleteOrder(event, status, id) {
        let orderRun = modelOrders.getOrderRun();
        if (status) {
          modelOrders.splice(id);
          if (id === orderRun) {
            stopOperation();
            modelOrders.setOrderRun(null);
            modelOrders.newHistory();
          }
          event.returnValue = true;
        } else {
          event.returnValue = false;
        }
      }
});

function getOrders(event) {
    controllerRemoteStore.getAllOrders(modelOrders.getPositionTo(), (orders) => {
          if (orders) event.sender.send('getOrders', orders);
          else return false;
    });
}

function getLocalOrders(event) {
  controllerLocalStore.getOrdersFromLocalStore((localOrders) => {
      moreDownloadOrderds = true;
      if (localOrders !== false && localOrders.length > 0) {
          console.log('00-L: Orders received');
          modelOrders.addLocalOrders(localOrders, (id) => {
              console.log('00-L: Get the history of the ', id);
              getOperationsHistory(undefined, id);
          });
          event.sender.send('getOrders', modelOrders.getAllLocalOrdes());
      } else {
        console.log('O1-L: Error get orders from local store');
      }
  });
}

function getOperationsHistory(event, id) {
  controllerRemoteStore.getOperationsHistory(id, history => {
        if (history.length > 0) {
          addOrGiveHistory(event, history);
        } else {
          controllerLocalStore.getHistoryOrdersFromLocalStore(id, (history) => {
              if (!history) {
                console.log('01-L: Local history order', id, 'is empty');
                return false;
              } else {
                console.log('00-L: Local history launch order', id, history);
                addOrGiveHistory(event, history);
              }
          });
        }
  });
}

function addOrGiveHistory(event, history) {
    if (event === undefined) {
      console.log('PROGRAM_DATA: HISTORY: Event is undefined, save history in modelOrders');
      modelOrders.setHistory(history);
    } else {
      console.log('PROGRAM_DATA: HISTORY: Event not undefined, get history to event');
      event.sender.send('getOperationsHistory', history);
    }
}


ipcMain.on('searchByTime', function (event, fromDate = null, toDate = null, fromTime = null, toTime = null) {
      if (statusNetwork) {
          modelOrders.newFoundOrders();
          let cursor = controllerRemoteStore.searchByTime(fromDate, toDate, fromTime, toTime);
          cursor.sort({ 'dateCreate': -1 })
          .toArray(function (err, orders) {
              if (err) return false;
              if (orders.length) {
                modelOrders.addFoundOrders(orders);
                event.sender.send('foundOrders', orders);
              } else event.sender.send('error_notFound', null);
          });
      } else {
        return false;
      }
});

ipcMain.on('searchByInputs', function (event, key) {
      if (statusNetwork) {
        modelOrders.newFoundOrders();
        controllerRemoteStore.searchByInputs(key, (status) => {
           if (status) event.sender.send('foundOrders', modelOrders.getAllFoundOrdes());
           else        event.sender.send('error_notFound', null);
        });
      } else {
        return false;
      }
});

ipcMain.on('setStatus', function (event, id) {
      let orderRun = modelOrders.getOrderRun();
      if (orderRun === null) modelOrders.setOrderRun(id);
      else event.returnValue = false;

      modelOrders.setStatusRun(id, new Date().toISOString(), getCurrentTime(), (status) => {
          event.returnValue = status;
      });
});

ipcMain.on('setOrderRun', (event, id) => {
    modelOrders.setOrderRun(id);
});


ipcMain.on('startOperation', function (event, operation) {
    focusIndex         = operation[4];
    beginDateOperation = fromDate();
    let fullDate       = getCurrentDate() + ' ' + getCurrentTime();

    stopOperation();

    if (nameOperation !== operation[1]) lastTimeOperation = 0;

    nameOperation = operation[1];

    modelOrders.addWorkUser(modelUsers.getUserName());
    modelOrders.addOperation(operation, fullDate);
    modelOrders.addHistoryOperation(operation, beginDateOperation, getCurrentDate(), lastTimeOperation);

    BlockIntervalID = setInterval(function run() { //Создаем новый таймер для операций
        lastTimeOperation++;
        operation[2]++;

        if (modelOrders.matchID( modelOrders.getOrderID() )) event.sender.send('setTime', operation);

        modelOrders.setTimeClassOperation(operation[0]);
        modelOrders.addOperation(operation, fullDate);
        modelOrders.editHistoryOperation( fullDate, lastTimeOperation );

        let orderRun = modelOrders.getOrderRun();
        let history  = modelOrders.getHistory();
        console.log('PROGRAM_DATA: HISTORY:', history);
        controllerRemoteStore.addHistory(
          orderRun,
          history,
          (status) => {
              if (!status) controllerLocalStore.updateHistoryOrderInLocalStore(orderRun, history);
              else console.log('00-R: History remote is update');
          });

        controllerRemoteStore.updateOrder(orderRun, modelOrders.getCurrentRunOrder(), (status) => {
           if (status) return true;
           else controllerLocalStore.updateOrderInLocalStore(orderRun, modelOrders.getCurrentRunOrder(), (status) => {
                if (status) return true;
           });
        });
    }, 5000);
});

function fromDate() {
  beginDateOperation = null;
  return getCurrentDate() + ' ' + getCurrentTime();
}

//Останавливаем и очищаем интервал
function stopOperation(callback) {
  if (BlockIntervalID != null) {
    clearInterval(BlockIntervalID);
    BlockIntervalID = null;
    modelOrders.setTimeEndOperation(nameOperation, getCurrentDate(), getCurrentTime(), (status) => {
        if (status) {
          let orderRunID = modelOrders.getOrderRun();
          let order      = modelOrders.getCurrentRunOrder();
          controllerRemoteStore.updateOrder(orderRunID, order, (status) => {
                                              if (status) console.log('00-R: Операция остановлена');
                                              else {
                                                console.log('00-L: Stop operation in local');
                                                controllerLocalStore.updateOrderInLocalStore(orderRunID, order, (status) => {
                                                      if (status) console.log('00-L: Операция остановлена');
                                                });
                                              }
                                              returnCallback(callback);
                                          });
        }
        else console.log('01: Операция не остановлена');
    });
  }

  function returnCallback(callback) {
    if (callback !== null || callback !== undefined) {
      console.log('PROGRAM_DATA: QUIT: App exit');
      return callback(true);
    }
  }
}

ipcMain.on('closeOrder', function (event, id) {
    if (!(modelOrders.matchID(id))) return false;

    stopOperation();
    let date = new Date().toISOString();
    let time = getCurrentTime();
    modelOrders.closeOrder(date, time)
    controllerRemoteStore.updateOrder(id, modelOrders.getCurrentRunOrder(), (status) => {
       if (status) {
         console.log('00-R: Заказ успешно обновлен');
         event.sender.send('showCloseOrder', null);
       } else {
         console.log('00-L: Попытка закрыть заказ локально');
         controllerLocalStore.updateOrderInLocalStore(id, modelOrders.getCurrentRunOrder(), (status) => {
              if (status) event.sender.send('showCloseOrder', null);
              else return false;
         });
       }
       modelOrders.setOrderRun(null);
       modelOrders.newHistory();
       lastTimeOperation = 0;
       nameOperation     = null;
    });
});

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
