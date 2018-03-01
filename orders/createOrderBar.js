let clients;
let decors;
var eventTarget;
let nameInput;

window.addEventListener('click', function () {
    switch (event.target.id) {
      default:
        if (event.target.classList[0] == 'listitem') setDataInput(eventTarget);

        if (event.target.id != 'inputClient' &&
            event.target.id != 'inputDecor'  &&
            event.target.id != 'list'        &&
            event.target.className != 'btnDeleteClientDecor') closeList();
    }
});

ipcRenderer.on('getClients', function (event, _clients) {
    clients = _clients;
});

ipcRenderer.on('getDecors', function (event, _decors) {
    decors = _decors;
});

window.addEventListener('load', function () {
    let inputClient    = document.getElementById('inputClient');
    let inputDecor     = document.getElementById('inputDecor');
    let btnAddOrder    = document.getElementById('btnAddOrder');
    let btnCancel      = document.getElementById('btnCancel');
    let btnCreateOrder = document.getElementById('btnCreateOrder');

    inputClient.addEventListener('focus', function () {
        if (clients.length) {
          nameInput   = 'clients';
          eventTarget = event.target;

          document.getElementById("list").innerHTML = '';

          showList();
          outClientsDecorsInList(clients);
        } else {
          closeList();
        }
    });

    inputDecor.addEventListener('focus', function() {
        if (decors.length) {
          nameInput = 'decors';
          eventTarget = event.target;

          document.getElementById("list").innerHTML = '';

          showList();
          outClientsDecorsInList(decors);
        } else {
          closeList();
        }
    });

    btnAddOrder.addEventListener('click', function () {
        console.log('Open createOrderBar');
        document.getElementById('filterbar').classList.add('hide');
        document.getElementById('createOrderBar').classList.add('visible');
    });

    btnCancel.addEventListener('click', function () {
        document.getElementById('filterbar').classList.remove('hide');
        document.getElementById('createOrderBar').classList.remove('visible');
        //ipcRenderer.send('removeOrder', null);
    });

    btnCreateOrder.addEventListener('click', function () {
        createOrder();
    });

});

function showList() {
  document.getElementById('list').classList.add('visible');
}

function closeList() {
  document.getElementById("list").innerHTML = '';
  document.getElementById('list').classList.remove('visible');
}

function outClientsDecorsInList(clientsDecors) {
  let list = document.getElementById('list');
      list.innerHTML += addTitleList();
  for (let i = 0; i < clientsDecors.length; i++) {
    list.innerHTML += '<div class="listitem animated fadeInUp">' + clientsDecors[i] + '<img class="btnDeleteClientDecor" src="../resources/delete.png" onclick="deleteClientsDecors()"/></div>'
  }
}

function deleteClientsDecors () {
  let listitem = document.getElementsByClassName('listitem'),
      indexItem;

  for (let i = 0; i < listitem.length; i++) {
    listitem = document.getElementsByClassName('listitem');
    if (listitem[i] === event.target.parentNode) {
      indexItem = i;
    }
  }
  let result = ipcRenderer.sendSync('deleteClientDecor', nameInput, indexItem);
  if (result) event.target.parentNode.remove();
}

function addTitleList() {
  return '<div class="container_titleList"><div class="titleList"> \
            <label>Выберите из списка</label> \
            <img class="listICO" src="../resources/list.png" /> \
          </div></div>'
}

function setDataInput(eventTarget) {
  if (event.target.textContent != ''   ||
      event.target.textContent != null ||
      event.target.textContent != undefined) {
        eventTarget.value = event.target.textContent;
      }
}

function createOrder() {
  let order  = document.getElementById('inputOrder').value;
  let client = document.getElementById('inputClient').value;
  let decor  = document.getElementById('inputDecor').value;
  let weight = document.getElementById('inputWeight').value;
  let count  = document.getElementById('inputCount').value;

  let options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    timezone: 'UTC'
  };

  if (order  != '' && order  != undefined &&
      client != '' && client != undefined &&
      decor  != '' && decor  != undefined &&
      weight != '' && weight != undefined &&
      count  != '' && count  != undefined) {
          order  = order.trim();
          client = client.trim();
          decor  = decor.trim();

          let objectOrder =
          {
            "id":          order.replace(/[\n\t\r]/g,""),
            "client":      client.trim(),
            "decor":       decor.trim(),
            "weight":      Number(weight),
            "count":       Number(count),
            "dateCreate":  new Date().toISOString(),
            "beginDate":   "",
            "endDate":     "",
            "beginTime":   "",
            "endTime":     "",
            "userCreater": _userName.trim(),
            "people":      [],
            "info":[],
            "usefulTime": 0,
            "unhelpfulTime": 0,
            "necessaryTime": 0,
            "status":      "open"
          };
          // document.getElementById('main').innerHTML = "";
          ipcRenderer.send("createOrder", objectOrder);
    } else {
      console.log('Пустые поля');
    }
}
