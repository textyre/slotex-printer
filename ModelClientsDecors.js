module.exports = class ModelClientsDecors {
  constructor() {
    let clients = [],
        decors  = [];

    this.getAllClientsAndDecors = function () {
      return [clients, decors];
    }

    this.getAllClients = function () {
      return clients;
    }

    this.getAllDecors = function () {
      return decors;
    }

    this.addClientsAndDecors = function (ordersData) {
      clients = ordersData[0].clients;
      decors  = ordersData[1].decors;
    }

    this.addClient = function (client) {
      clients.push(client);
    }

    this.addDecor = function (decor) {
      decors.push(decor);
    }

    this.searchClient = function (client) {
      for (let i = 0; i < clients.length; i++) {
        if (client === clients[i]) return true;
      }
      return false;
    }

    this.searchDecor = function (decor) {
      for (let i = 0; i < decors.length; i++) {
        if (decor === decors[i]) return true;
      }
      return false;
    }

    this.deleteClient = function (index) {
      let updateObject = null;
      clients.splice(index, 1);
      return updateObject = {
        'id': 'clients',
        'clients': clients
      }
    }

    this.deleteDecor = function (index) {
      let updateObject = null;
      decors.splice(index, 1);
      return updateObject = {
        'id': 'decors',
        'decors': decors
      }
    }

  }
}
