module.exports = class ModelOrders {
  constructor() {
    let _orders         = [],
        localOrder      = [],
        foundOrders     = [],
        workArrayOrders = [],
        indexOrders     = [],
        orderRun        = null,
        orderID         = null,
        positionTo      = 0;
        
    this.setOrderID = function (id) {
      orderID = id;
    }

    this.getPositionTo = function () {
      return positionTo;
    }

    this.setPositionTo = function (to) {
      positionTo = to;
    }

    this.getPositionAt = function () {
      return positionAt;
    }

    this.setPositionAt = function (at) {
      positionAt = at;
    }

    this.addOrders = function (orders) {
      for (let i = 0; i < orders.length; i++)
        _orders.push(orders[i]);
    }
  }

  searchOrderRun(orders) {
    for (let i = 0; i < orders.length; i++)
      if (orders[i].status === 'run') orderRun = orders[i].id;
  }
}
