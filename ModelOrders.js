module.exports = class ModelOrders {
  constructor() {
    let _orders          = [],
        _localOrders     = [],
        _foundOrders     = [],
        _workArrayOrders = [],
        _history         = [],
        indexOrder       = null,
        objectOrderRun   = null,
        orderRun         = null,
        orderID          = null,
        positionTo       = 0;

    this.setOrderID = function (id) {
      orderID = id;
    }

    this.getOrderID = function () {
      return orderID;
    }

    this.matchID = function (id) {
      return orderRun === id ? true : false;
    }

    this.getPositionTo = function () {
      return positionTo;
    }

    this.setPositionTo = function (to) {
      console.log('00: Set "positionTo" to', to);
      positionTo = to;
    }

    this.setHistory = function (history) {
      _history = history;
      console.log('PROGRAM_DATA: HISTORY: History = ', _history);
    }

    this.getHistory = function () {
      return _history;
    }

    this.addHistoryOperation = function (operation, beginDate, endDate, time) {
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
      history.push(beginDate);
      history.push(endDate + ' ' + endDateOperation);
      history.push(time);
      console.log('PROGRAM_DATA: HISTORY: Current history = ', _history);
      _history.push(history);
    }

    this.editHistoryOperation = function (date, time) {
      _history[_history.length - 1][3] = date;
      _history[_history.length - 1][4] = time;
    }

    this.newHistory = function () {
      _history = null;
      _history = [];
    }

    this.unshiftOrders = function (order) {
      let duplicateOrder = this.searchOrder(order.id);
      if (duplicateOrder !== '404') {
        console.log('00: Duplicate found, update order');
        this.updateOrderInfo(_workArrayOrders[indexOrder], order);
      }
      else {
        console.log('00: Duplicate NOT found, insert order IN "order"');
        _orders.unshift(order);
      }
      this.setWorkArrayOrders(_orders);
    }

    this.unshiftLocalOrders = function (order) {
      let duplicateOrder = this.searchOrder(order.id);
      if (duplicateOrder !== '404') this.updateOrderInfo(_workArrayOrders[indexOrder], order); //_workArrayOrders[indexOrder] = order;
      else _localOrders.unshift(order);

      this.setWorkArrayOrders(_localOrders);
    }

    this.setWorkArrayOrders = function (array) {
      _workArrayOrders = null;
      _workArrayOrders = array;
    }

    this.getAllOrders = function () {
      return _orders;
    }

    this.addOrders = function (orders, callback) {
      for (let i = 0; i < orders.length; i++) {
        if (orders[i].status === 'run' && orderRun === null) {
          orderRun = orders[i].id;
          callback(orderRun);
        }
        _orders.push(orders[i]);
      }
      this.setWorkArrayOrders(_orders);
    }

    this.closeOrder = function (date, time) {
      objectOrderRun.status = 'close';
      objectOrderRun.endDate = date;
      objectOrderRun.endTime = time;
    }

    this.getAllLocalOrdes = function () {
      return _localOrders;
    }

    this.addLocalOrders = function (orders, callback) {
      for (let i = 0; i < orders.length; i++) {
        if (orders[i].status === 'run' && orderRun === null) {
          orderRun = orders[i].id;
          callback(orderRun);
        }
        _localOrders.push(orders[i]);
      }
      this.setWorkArrayOrders(_localOrders);
    }

    this.getAllFoundOrdes = function () {
      return _foundOrders;
    }

    this.addFoundOrders = function (orders) {
      for (let i = 0; i < orders.length; i++) {
        _foundOrders.push(orders[i]);
      }
      this.setWorkArrayOrders(_foundOrders);
    }

    this.getWorkaArrayOrders = function () {
      return _workArrayOrders;
    }

    this.getCurrentOrder = function () {
      return _workArrayOrders[indexOrder];
    }

    this.getCurrentRunOrder = function () {
      return objectOrderRun;
    }

    this.newFoundOrders = function () {
      _foundOrders = null;
      _foundOrders = [];
    }

    this.getLengthOrders = function () {
      return _orders.length;
    }

    this.getLengthLocalOrders = function () {
      return _localOrders.length
    }

    this.getLengthFoundOrders = function () {
      return _foundOrders.length
    }

    this.geLengthWorkArray = function () {
      return _workArrayOrders.length;
    }

    this.searchOrder = function (id) {
      for (let i = 0; i < _workArrayOrders.length; i++) {
        if (id === _workArrayOrders[i].id) {
          indexOrder = i;
          return i;
        }
      }
      return '404';
    }

    this.splice = function (id) {
      let index = this.searchOrder(id);
      console.log('00: Splice in _workArrayOrders', index);
      _workArrayOrders.splice(index, 1);
    }

    this.getOrderRun = function () {
      return orderRun;
    }

    this.setOrderRun = function (value) {
      if (value === null) {
        objectOrderRun = null;
        orderRun = null;
      } else {
        objectOrderRun = _workArrayOrders[indexOrder];
        orderRun = value;
      }
    }

    this.setStatusRun = function (id, date, time, callback) {
      if (!(this.matchID(id))) return false;
      objectOrderRun.status    = 'run';
      objectOrderRun.beginDate = date;
      objectOrderRun.beginTime = time;
      callback(true);
    }

    this.setTimeEndOperation = function (nameOperation, date, time, callback) {
      for (let i = 0; i < objectOrderRun.info.length; i++) {
        if (objectOrderRun.info[i][1] === nameOperation) {
          objectOrderRun.info[i][4] = date.toString() + ' ' + time.toString();
          console.log('PROGRAM_DATA: OPERATION: Set end time operation', objectOrderRun.info[i]);
          return callback(true);
        }
      }
      console.log('PROGRAM_DATA: OPERATION: Did not set end time operation s=227 (ModelOrders.setTimeEndOperation)');
      return callback(false);
    }

    this.addWorkUser = function (userName) {
      for (let i = 0; i < objectOrderRun.people.length; i++) {
        if (objectOrderRun.people[i] === userName) return true;
      }
      objectOrderRun.people.push(userName);
    }

    this.addOperation = function (operation, date) {
      for (let i = 0; i < objectOrderRun.info.length; i++) {
        if (objectOrderRun.info[i][1] === operation[1]) {
          objectOrderRun.info[i][2] = operation[2];
          return true;
        }
      }
      objectOrderRun.info.push([
                                  operation[0],
                                  operation[1],
                                  operation[2],
                                  date,
                                  ' '
                                ]);
    }

    this.setTimeClassOperation = function (className) {
      switch (className) {
        case 'Наладка':
        case 'Цветоподбор':
        case 'Печать':
          objectOrderRun.usefulTime++;
        break;

        case 'Простои ПЗ':
        case 'Простои техники':
          objectOrderRun.unhelpfulTime++;
        break;

        case 'Остановка программы':
          objectOrderRun.necessaryTime++;
        break;

        default:
          return false;
      }
      return true;
    }
  }

  updateOrderInfo(order, newOrder) {
    order.client = newOrder.client;
    order.decor  = newOrder.decor;
    order.weight = newOrder.weight;
    order.count  = newOrder.count;
  }
}
