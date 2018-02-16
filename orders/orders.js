const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
const ObjectID = require('mongodb').ObjectID;

let _orders = [];

var _userName;
var foundOrders = [];

let loadContent = false;

let show_buttton_showStatistics = false;
let visibleFoundOrders = false;

let statusNetwork = false;

ipcRenderer.send("windowLoad", "ordersWindow");
ipcRenderer.send('startOrdersPage', true);
ipcRenderer.send('moreDownloadOrderds', true);
ipcRenderer.send('getUserName', null);

ipcRenderer.on('getOrders', function (event, orders, positionAt, positionTo, flag) {
    loadContent = flag;
    _orders     = orders;
    document.getElementById('main').innerHTML = '';
    outOrderOnPage(orders, positionAt, positionTo);
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
    visibleFoundOrders = true;
    if (document.activeElement.id !== 'inputSearchBar') {
      show_buttton_showStatistics = showBlock_buttton_showStatistics();
    }
});

const updateOnlineStatus = () => {
  statusNetwork = navigator.onLine ? true : false;
  if (statusNetwork) {
    console.log('есть сеть');
    hideBlock_emptyNetwork();
  } else {
    console.log('нет сети');
    showBlock_emptyNetwork();
  }
  ipcRenderer.send('online-status-changed', statusNetwork);
}

window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline',  updateOnlineStatus);

window.addEventListener('load', function () {
    updateOnlineStatus();

    let buttonDownloadOrders = document.getElementById('downloadsOrders');
    buttonDownloadOrders.addEventListener('click', function () {
      if (!loadContent) {
        setTimeout(() => {
          window.scrollBy(0, window.innerHeight);
        }, 400);

        ipcRenderer.send("loadOrder", null);
      }
    });

    var main = document.getElementById('main');

    let btnShowStatistics = document.getElementById('btnShowStatistics');

    btnShowStatistics.addEventListener('click', function() {
        let time = document.getElementById('time').textContent;
        ipcRenderer.send('openWindow', ['sumstatistics', time]);
    });
});

function hideButtonDowloadOrders() {
  let buttonDownloadOrders = document.getElementById('downloadsOrders');
  buttonDownloadOrders.style.display = 'none';
}

function showButtonDowloadOrders() {
  let buttonDownloadOrders = document.getElementById('downloadsOrders');
  buttonDownloadOrders.style.display = 'block';
}

function openPanel() {
  if (event.target.className.indexOf('statisticsICO') !== -1 ||
      event.target.className.indexOf('deleteOrderICO')   !== -1) return true;

  let id = $(this).attr('id');

  searchOrdersInFoundOrders(id, 'panelWindow');
  for (let i = 0; i < _orders.length; i++) {
    if (_orders[i].id == id) {
      ipcRenderer.send("openWindow", ['panelWindow', id]);
      return true;
    }
  }
}

function openStatistics() {
  let id = event.target.parentNode.parentNode.parentNode.id;
  console.log(id);
  searchOrdersInFoundOrders(id, 'statisticsWindow');
  for (let i = 0; i < _orders.length; i++) {
    if (_orders[i].id == id) {
      ipcRenderer.send("openWindow", ['statisticsWindow', id]);
      return true;
    }
  }
}

let deleteOrderID;

function deleteOrder() {
  let id = event.target.parentNode.parentNode.parentNode.id;
  deleteOrderID = id;
  let block_deleteOrder           = document.createElement('div');
      block_deleteOrder.id        = 'block_deleteOrder';
      block_deleteOrder.innerHTML = getTemplateDeleteOrder(id);
  document.body.insertBefore(block_deleteOrder, document.body.childNodes[0]);
}

function getTemplateDeleteOrder(id) {
  return `<div id="block_deleteOrder"> \
    <div id="block_questionDeleteOrder" class="animated fadeInUpBig"> \
      <div id="block_question"><label id="el_question">Вы точно хотите удалить заказ ${id}?</label></div> \
      <div id="block_controls"> \
        <button class="btn_delay" id="btnCancel" onclick="cancelDeleteOrder()">Отменить</button> \
        <button class="btn_access" id="btnDelete" onclick="accessDeleteOrder()">Удалить</button> \
      </div> \
    </div> \
  </div>`
}

function accessDeleteOrder() {
  document.getElementById(deleteOrderID).remove();
  document.getElementById('block_deleteOrder').remove();
  ipcRenderer.send('deleteOrder', deleteOrderID);
}

function cancelDeleteOrder() {
  document.getElementById('block_deleteOrder').remove();
}

function searchOrdersInFoundOrders(id, nameWindow) {
  if (foundOrders !== null) {
    for (let i = 0; i < foundOrders.length; i++) {
      if (foundOrders[i].id == id) {
        ipcRenderer.send("openWindow", [nameWindow, id]);
        return true;
      }
    }
  }
}

function outOrderOnPage(arr, positionAt, positionTo, mode) {
  let orderStatus;

  for (let i = positionAt; i < positionTo; i++) {
    // if (document.getElementById(arr[i].id) === null) {
      orderStatus = getClassTemplate(arr[i].status);
      document.getElementById('main').innerHTML += getTemplate(arr[i], orderStatus, mode);
    // }
  }

  setEventListener(main);
}

function setEventListener(section) {
  var orders           = section.getElementsByClassName('order');
  var iconsStatistics  = section.getElementsByClassName('statisticsICO');
  let iconsDeleteOrder = section.getElementsByClassName('deleteOrderICO');

  for (let i = 0; i < orders.length; i++) {
    orders[i].addEventListener('click', openPanel);
  }

  for (let i = 0; i < iconsStatistics.length; i++) {
    iconsStatistics[i].addEventListener('click', openStatistics);
    iconsDeleteOrder[i].addEventListener('click', deleteOrder);
  }
}

function getTemplate(order, status, mode) {
  let headOrder;
  switch (mode) {
    case 'searchMode':
      headOrder = '<div class="order buff" id="' + order.id + '">'
    break;

    default:
      headOrder = '<div class="order" id="' + order.id + '">'
  }

  return headOrder + ' \
    <div id="titleOrder"> \
      <label>' + order.id + '</label> \
      <div class="controlIMG"> \
        <img class="statisticsICO  animated zoomIn" src="../resources/diagram.png"> \
        <img class="deleteOrderICO animated zoomIn" src="../resources/deleteOrder.png"> \
      </div> \
    </div> \
    <div id="bodyClient"> \
      <label id="client" class="dataOrder">' + order.client + '</label> \
    </div> \
    <div id="bodyMore"> \
      <div id="decor"><label class="dataOrder">'  + order.decor  + '</label></div> \
      <div id="weight"><label class="dataOrder">' + order.weight + '</label></div> \
      <div id="count"><label class="dataOrder">'  + order.count  + '</label></div> \
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

let hideShowFlag_DownloadsOrders = false;

//Скрыть заказы, загруженные при запуске программы
function hideDownloadOrders() {
  if (!hideShowFlag_DownloadsOrders) {
    let orders = document.getElementsByClassName('order');

    for (let i = 0; i < orders.length; i++) {
      if (orders[i].classList[1] !== 'buff' && orders[i].style.display !== 'none') {
        orders[i].style.display = 'none';
      }
    }
    hideShowFlag_DownloadsOrders = true;
  }
}

//Показать заказ, загруженные при запуске программы
function showDownloadOrders() {
  if (hideShowFlag_DownloadsOrders) {
    let orders = document.getElementsByClassName('order');

    for (let i = 0; i < orders.length; i++) {
      if (orders[i].style.display == 'none') {
        orders[i].style.display = 'inline-block';
      }
    }
    orders = null;

    hideShowFlag_DownloadsOrders = false;
  }
}

function removeFoundOrders() {
  let orders = document.getElementsByClassName('buff');
  if (orders !== null) {
    for (let i = orders.length-1; i >= 0; i--) {
        orders[i].remove();
    }
    orders = null;
    visibleFoundOrders = false;
  }
}

function showBlock_buttton_showStatistics() {
  document.getElementById('button_showStatistics').style.display = 'inline-flex';
  document.getElementById('main').style.paddingTop = '0px';
  return true;
}

function hideBlock_buttton_showStatistics() {
  document.getElementById('button_showStatistics').style.display = 'none';
  document.getElementById('main').style.paddingTop = '95px';
  return true;
}

function showBlock_emptyNetwork() {
  console.log('Салама');
  document.getElementById('emptyNetwork').style.display = 'inline-flex';
  document.getElementById('main').style.paddingTop = '0px';
  return true;
}

function hideBlock_emptyNetwork() {
  console.log('алейкум');
  document.getElementById('emptyNetwork').style.display = 'none';
  document.getElementById('main').style.paddingTop = '95px';
  return true;
}

ipcRenderer.on('error_notFound', function (event, param) {
    removeFoundOrders();
    console.log("error_notFound");
    let main = document.getElementById('main');
    let error_notFound = document.getElementById('error_notFound');
    if (error_notFound === null) {
      let error = document.createElement('label');
          error.innerHTML = 'Ничего не нашлось! :(';
          error.className = 'error_notFound';
          error.id        = 'error_notFound';
      main.appendChild(error);
    }
    // if (document.getElementById('inputSearchBar').value !== '') {
    //
    // }
});

function removeErrorNotFoundOnDisplay() {
  let error_notFound = document.getElementById('error_notFound');
  if (error_notFound !== null) {
    error_notFound.remove();
  }
}
