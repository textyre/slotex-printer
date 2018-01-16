let clients;
let decors;
var eventTarget;

window.addEventListener('click', function () {
    switch (event.target.id) {
      default:
        if (event.target.classList[0] == 'listitem') setDataInput(eventTarget);

        if (event.target.id != 'inputClient' &&
            event.target.id != 'inputDecor'  &&
            event.target.id != 'list') closeList();
    }
});

ipcRenderer.on('getClients', function (event, objectClients) {
    clients = objectClients.client;
});

ipcRenderer.on('getDecors', function (event, objectDecors) {
    decors = objectDecors.decors;
});

window.addEventListener('load', function () {
    let inputClient    = document.getElementById('inputClient');
    let inputDecor     = document.getElementById('inputDecor');
    let btnAddOrder    = document.getElementById('btnAddOrder');
    let btnCancel      = document.getElementById('btnCancel');
    let btnCreateOrder = document.getElementById('btnCreateOrder');

    inputClient.addEventListener('focus', function () {
        eventTarget = event.target;
        document.getElementById("list").innerHTML = '';
        showList();
        outClientsInList();
    });

    inputDecor.addEventListener('focus', function() {
        eventTarget = event.target;
        document.getElementById("list").innerHTML = '';
        showList();
        outDecorsInList();
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
  main.style.position = 'fixed';
}

function closeList() {
  document.getElementById("list").innerHTML = '';
  document.getElementById('list').classList.remove('visible');
  main.style.position = 'static';
}

function outClientsInList() {
  let list = document.getElementById('list');
  for (let i = 0; i < clients.length; i++) {
    list.innerHTML += '<div class="listitem">' + clients[i] + '</div>'
  }
}

function outDecorsInList() {
  let list = document.getElementById('list');
  for (let i = 0; i < decors.length; i++) {
    list.innerHTML += '<div class="listitem">' + decors[i] + '</div>'
  }
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

  let date = new Date().toLocaleString("sq", options);
  if (order  != '' && order  != undefined &&
      client != '' && client != undefined &&
      decor  != '' && decor  != undefined &&
      weight != '' && weight != undefined &&
      count  != '' && count  != undefined) {
          let objectOrder =
          {
            "id":          order,
            "client":      client,
            "decor":       decor,
            "weight":      weight,
            "count":       count,
            "dateCreate":  date,
            "beginDate":   "",
            "endDate":     "",
            "beginTime":   "",
            "endTime":     "",
            "userCreater": _userName,
            "people":      [],
            "info":[],
            "usefulTime": 0,
            "unhelpfulTime": 0,
            "necessaryTime": 0,
            "status":      "open"
          };
          document.getElementById('main').innerHTML = "";
          ipcRenderer.send("createOrder", objectOrder)
    } else {
      console.log('Пустые поля');
    }
}
