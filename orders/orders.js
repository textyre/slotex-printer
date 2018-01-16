const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;

var orders = function getOrders() {
  return remote.getGlobal('orders');
}

var _userName;
var foundOrders = [];

let loadContent = false;

ipcRenderer.send("windowLoad", "ordersWindow");
ipcRenderer.send('getUserName', null);

ipcRenderer.on('getOrders', function (event, positionAt, positionTo, flag) {
    loadContent = flag;
    outOrderOnPage(remote.getGlobal('orders'), positionAt, positionTo);
});

ipcRenderer.on('setUserName', function (event, userName) {
    document.getElementById('nameUser').textContent = userName;
    _userName = userName;
});

ipcRenderer.on('foundOrders', function (event, arrayOrders) {
    removeFoundOrders();
    outOrderOnPage(arrayOrders, 0, arrayOrders.length, 'searchMode');
    foundOrders = [];
    foundOrders = arrayOrders;
});

window.scroll = function () {

}

window.onload = function () {
  $(window).scroll(function() {
      if($(window).scrollTop() + $(window).height() >= $(document).height() - 70 && !loadContent) {
        loadContent = true;
        console.log(loadContent);
        ipcRenderer.send("loadOrder", loadContent);
      }
  });
  var main = document.getElementById('main');
}

function openPanel() {
  if (event.target.className.indexOf('statisticsICO') !== -1) {
    return true;
  }
  let arrayOrders = orders();
  let id = $(this).attr('id');
  for (let i = 0; i < arrayOrders.length; i++) {
    if (arrayOrders[i].id == id) {
      ipcRenderer.send("openWindow", ['panelWindow', id]);
      return true;
    }
  }
}

function openStatistics() {
  let arrayOrders = orders();
  let id = event.target.parentNode.parentNode.id;
  for (let i = 0; i < arrayOrders.length; i++) {
    if (arrayOrders[i].id == id) {
      ipcRenderer.send("openWindow", ['statisticsWindow', id]);
      return true;
    }
  }
}

function outOrderOnPage(arr, positionAt, positionTo, mode) {
  let orderStatus;

  for (let i = positionAt; i < positionTo; i++) {
    orderStatus = getClassTemplate(arr[i].status);
    document.getElementById('main').innerHTML += getTemplate(arr[i], orderStatus, mode);
  }

  setEventListener(main);
}

function setEventListener(section) {
  var orders = section.getElementsByClassName('order');
  var icons  = section.getElementsByClassName('statisticsICO');

  for (let i = 0; i < orders.length; i++) {
    orders[i].addEventListener('click', openPanel);
  }

  for (let i = 0; i < icons.length; i++) {
    icons[i].addEventListener('click', openStatistics);
  }
}

function getTemplate(order, status, mode) {
  let headOrder;
  switch (mode) {
    case 'searchMode':
      headOrder = '<div class="order" id="buff_' + order.id + '">'
    break;

    default:
      headOrder = '<div class="order animated slideInUp" id="' + order.id + '">'
  }

  return headOrder + ' \
    <div id="titleOrder"> \
      <label>' + order.id + '</label> \
      <img class="statisticsICO animated zoomIn" src="../resources/diagram.png"> \
    </div> \
    <div id="bodyClient"> \
      <label id="client" class="data">' + order.client + '</label> \
    </div> \
    <div id="bodyMore"> \
      <div id="decor"><label class="data">'  + order.decor  + '</label></div> \
      <div id="weight"><label class="data">' + order.weight + '</label></div> \
      <div id="count"><label class="data">'  + order.count  + '</label></div> \
    </div>'
    + status +
  '</div>';
}

function getClassTemplate(status) {
  switch (status) {
    case 'close':
      return '<div class="statusClose" ></div>'
      break;

    case 'open':
      return '<div class="statusOpen"></div>'
      break;

    case 'run':
      return '<div class="statusRun"></div>'
      break;

    default:
      return '<div style="display:none"></div>'
  }
}

function hideDownloadOrders() {
  let orders = document.getElementsByClassName('order');

  console.log('загруженные скрыть, найденные - показать');
  for (let i = 0; i < orders.length; i++) {
    if (orders[i].id.indexOf('buff_') === -1 && orders[i].style.display !== 'none') {
      orders[i].style.display = 'none';
    }
  }
}
//
function showDownloadOrders() {
  let orders = document.getElementsByClassName('order');

  for (let i = 0; i < orders.length; i++) {
    if (orders[i].style.display == 'none') {
      orders[i].style.display = 'inline-block';
    }
  }
  orders = null;
}

function removeFoundOrders() {
  let orders = document.getElementsByClassName('order');

  for (let i = 0; i < orders.length; i++) {
    if (orders[i].id.indexOf('buff_') !== -1) {
      console.log(orders[i]);
      orders[i].remove();
      i--;
    }
  }

  orders = null;
}
