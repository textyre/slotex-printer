const ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.send('windowLoad', 'sumstatistics');

ipcRenderer.on('getSampleOrders', function (event, orders) {
    console.log(orders);
    outSample(orders);
    infoArray = [];
    for (let i = 0; i < orders.length; i++) {
      infoArray = infoArray.concat(orders[i].info);
    }
});

ipcRenderer.on('getUserNameAndRangeDate', function (event, userName, sampleDate) {
    date = '';
    user = '';
    date = sampleDate;
    user = userName;
});

window.onload = function () {
  let viewHead = new ViewHead();
      viewHead.setRangeDate(date);
  for (let i = 0; i < infoArray.length; i++) {
      viewHead.outClassTime(infoArray[i]);
  }
      viewHead.setUserName(user);

  let btnBack = document.getElementById('arrow');
      btnBack.addEventListener('click', function () {
          ipcRenderer.send('openWindow', ['ordersWindow']);
      });
}

function outSample(orders) {
  let sumstatistics = document.getElementById('sumstatistics');
  for (let i = 0; i < orders.length; i++) {
    for (let j = 0; j < orders[i].info.length; j++) {
      let operationBlock = document.getElementById(orders[i].info[j][1]);
      if (operationBlock === null) {
        sumstatistics.innerHTML += templateOperationBlock(orders[i].id, orders[i].info[j]);
      } else {
        operationBlock.innerHTML += templateDataBlock(orders[i].id, orders[i].info[j]);
      }
    }
  }
}

function templateOperationBlock(id, operation) {
  return '<div class="operation_block"> \
    <div class="operation_block_title_operation"><label>' + operation[1] + '</label></div> \
    <div class="operation_block_data_operation" id="' + operation[1] + '"> \
      <div class="data ' + getProgramClass(operation[0]) + '"> \
        <div class="id-minutes"><div><label class="title_id-minutes">Заказ</label><br><label class="order">' + id + '</label></div><div><label class="title_id-minutes">Время</label><br><label class="time">' + operation[2] + '</label></div></div> \
        <div class="fromDate"><div><label class="titleData">Начальная дата и время</label><br><label class="date">' + operation[3].split(' ')[0] + '</label></div><label class="datetime">' + operation[3].split(' ')[1] + '</label></div> \
        <div class="toDate"><div><label class="titleData">Конечная дата и время</label><br><label class="date">' + operation[4].split(' ')[0] + '</label></div><label class="datetime">' + operation[4].split(' ')[1] + '</label></div> \
      </div> \
    </div> \
  </div>'
}

function templateDataBlock(id, operation) {
  return '<div class="data ' + getProgramClass(operation[0]) + '"> \
    <div class="id-minutes"><div><label class="title_id-minutes">Заказ</label><br><label class="order">' + id + '</label></div><div><label class="title_id-minutes">Время</label><br><label class="time">' + operation[2] + '</label></div></div> \
    <div class="fromDate"><div><label class="titleData">Начальная дата и время</label><br><label class="date">' + operation[3].split(' ')[0] + '</label></div><label class="datetime">' + operation[3].split(' ')[1] + '</label></div> \
    <div class="toDate"><div><label class="titleData">Конечная дата и время</label><br><label class="date">' + operation[4].split(' ')[0] + '</label></div><label class="datetime">' + operation[4].split(' ')[1] + '</label></div> \
  </div>'
}

function getProgramClass(className) {
    switch (className) {
      case 'Наладка':
      case 'Цветоподбор':
        return 'adjustment';
      break;

      case 'Печать':
        return 'print';
      break;

      case 'Простои ПЗ':
      case 'Простои техники':
        return 'downtime';
      break;

      case 'Остановка программы':
        return 'stop';
      break;
      default:
    }
}
