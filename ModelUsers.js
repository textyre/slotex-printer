module.exports = class ModelOrders {
  constructor() {
    let _users    = [],
        _userName = null,
        indexUser = null;

    this.addUsers = function (users) {
      _users = users;
    }

    this.getAllUsers = function () {
      return _users;
    }

    this.getUser = function () {
      return _users[indexUser];
    }

    this.selectUser = function (name) {
      for (let i = 0; i < _users.length; i++)
        if (name === _users[i]) indexUser = i;
    }

    this.setUserName = function (userName) {
      _userName = userName;
    }

    this.getUserName = function () {
      return _userName;
    }
  }
}
