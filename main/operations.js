const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;

//Количество запусков операций
let countOperation = 0;

//Псевдоконстанта для увелечения tabIndex
let lastIndex      = 30;

//Содержит последнюю операцию на экране, чтобы возвращать на нее фокус
let lastActiveElement = null;

//Содержит статус заказа
let status;

//Содержит сам заказ
let _order;

let allOutOperationsOnDisplay = true;
window.addEventListener('load', function () {

    ipcRenderer.on('getOperations', function (event, order, focusIndex) {
        status = order.status;
        _order = order;

        switch (status) {
          case 'run':
            allOutOperationsOnDisplay = false;
            for (let i = 0; i < order.info.length; i++) {
              outOperation(order.info[i], focusIndex);
              if (i === order.info.length - 1) {
                allOutOperationsOnDisplay = true;
              }
            }
          break;

          case 'close':
            for (let i = 0; i < order.info.length; i++) {
              outOperation(order.info[i]);
            }
            document.getElementById('panel').style.pointerEvents            = 'none';
            document.getElementById('closeOrder').style.pointerEvents       = 'none';
            document.getElementById('activeOperations').style.pointerEvents = 'none';
            document.getElementById('block_warning').style.display      = 'inline-flex';
          break;

          default:
        }
    });

    ipcRenderer.on('showCloseOrder', function (event, order) {
        console.log(order);
        let operationsBlock = document.getElementsByName('operationsBlock');
        for (let i = 0; i < operationsBlock.length; i++) {
          changeColorAllOperations(operationsBlock[i]);
        }
        document.getElementById('panel').style.pointerEvents            = 'none';
        document.getElementById('closeOrder').style.pointerEvents       = 'none';
        document.getElementById('activeOperations').style.pointerEvents = 'none';
        document.getElementById('block_warning').style.display          = 'inline-flex';
    });
});


//Принимает класс операции и возвращает программный класс для стилей
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

//Принимает массив operation, где:
//operation[0] - класс операции
//operation[1] - имя операции
//operation[2] - время
//operation[3] - программный класс для стиля

//operation[4] - добавляем номер индекса

//1. Очищает #activeOperations
//2. Если status = run:   проверяет есть ли уже операция на экране
//   Если status = close: выводит операции заказа и меняет у каждой цвет
//   Если status = open:  при первом вызове outOperation(), отправит в main id заказа
//   Вывыдет на экран операцию и если focusIndex != null, то установит фокус на операцию
//   что имеет такой же focusIndex.
//   Иначе установит на последний элемент фокус.

function outOperation(operation, focusIndex) {

  switch (status) {
    case 'run':
      ipcRenderer.send('setOrderRun', _order.id);
      clearTemplate();
      if (checkRetryOperation(operation[1])) return true;
    break;

    case 'close':
      clearTemplate();
      let operationBlock = getTemplateBlock(operation);
      document.getElementById('activeOperations').innerHTML += operationBlock;
      let operationsBlock = document.getElementsByName('operationsBlock');
      changeColorAllOperations(operationsBlock[operationsBlock.length-1]);
      return true;
    break;

    default:
      let flag = ipcRenderer.sendSync('setStatus', _order.id);
      if (!flag) {
        console.log('Уже выполняется какой-то заказ');
        return true;
      }
      clearTemplate();
      status = 'run';
  }
  document.getElementById('activeOperations').innerHTML += getTemplateBlock(operation);
  setFocus(focusIndex);
}

function setFocus(focusIndex) {
  let operationsBlock = document.getElementsByName('operationsBlock');
  if (focusIndex) {
    for (let i = 0; i < operationsBlock.length; i++) {
      if (operationsBlock[i].tabIndex === focusIndex) {
        operationsBlock[i].focus();
        return true;
      }
    }
  }
}

// Проверяет есть ли операция на экране
function checkRetryOperation(nameOperation) {

  let operationsBlock = document.getElementsByName('operationsBlock');
  for (let i = 0; i < operationsBlock.length; i++) {
    let nameOperationBlock = operationsBlock[i].querySelector('#type').textContent;
    if (nameOperationBlock === nameOperation) {
      operationsBlock[i].focus();
      return true;
    }
  }
  return false;
}

// Если lastActiveElement == document.activeElement, то ничего не делает, иначе присваевает lastActiveElement
// При получении фокуса меняет цвет всех операций на белый, кроме той, что получила фокус
// Собирает данные выведенной операции и отправляет в main
function getFocus() {
  if (lastActiveElement == document.activeElement) {
    return false;
  } else {

    lastActiveElement = document.activeElement;
    changeColorOperation();

    if (allOutOperationsOnDisplay) {
      let classOperation = document.activeElement.querySelector('#class').textContent;
      let nameOperation  = document.activeElement.querySelector('#type').textContent;
      let timeOperation  = Number(document.activeElement.querySelector('#min').textContent);
      let tabindex       = document.activeElement.tabIndex;
      let programmClass  = document.activeElement.className;
      ipcRenderer.send('startOperation', [classOperation, nameOperation, timeOperation, programmClass, tabindex]);
    }
  }
}


// Выводим время в операцию у которой focusIndex == присланному focusIndex
ipcRenderer.on('setTime', function (event, operation) {
    let operationsBlock = document.getElementsByName('operationsBlock');
    for (let i = 0; i < operationsBlock.length; i++) {
      if (operationsBlock[i].tabIndex == operation[4]) {
        operationsBlock[i].querySelector('#min').innerHTML = operation[2];
        return true;
      }
    }
    return false;
});

// Все понятно и так
function clearTemplate() {
  if (countOperation == 0) {
    document.getElementById('activeOperations').innerHTML = '';
    document.getElementById('activeOperations').style.height = 'auto';
  }
  countOperation++;
}

// Тоже все понятно
function getTemplateBlock(operation) {
  return '<div name="operationsBlock" class="' + getProgramClass(operation[0]) + '" onfocus="getFocus()" tabindex="' + getLastTabIndex() + '"/> \
    <div class="ClassType"> \
      <label id="class"><i>' + operation[0] + '</i></label><br> \
      <label id="type">' + operation[1] + '</label> \
    </div> \
    <div class="Time"> \
      <label id="min">'+ operation[2] + '</label><br> \
      <label id="labelMin">мин</label> \
    </div> \
  </div>';
}

// Понятно
function changeColorOperation() {
  let operations = document.getElementsByName('operationsBlock');
  for (let i = 0; i < operations.length; i++) {
    let labels = operations[i].getElementsByTagName('label');
    if (operations[i] == document.activeElement) {
      switch (operations[i].className) {
        case 'adjustment':
          operations[i].style.backgroundColor = '#8CD98E';
          break;
        case 'print':
          operations[i].style.backgroundColor = '#29B2FF';
          break;
        case 'downtime':
          operations[i].style.backgroundColor = '#F07070';
          break;
        case 'stop':
          operations[i].style.backgroundColor = '#FFD747';
          break;
        default:
      }

      for (let j = 0; j < labels.length; j++) {
        labels[j].style.color = 'white';
      }
    } else {
      operations[i].style.backgroundColor = 'white';
      for (let j = 0; j < labels.length; j++) {
        labels[j].style.color = 'grey';
      }
    }
  }
}

// Похожа на ту, что выше
// Дадада, я слышал про DRY, все дела, ну а что поделать?
function changeColorAllOperations (element) {
  let labels = element.getElementsByTagName('label');
  switch (element.className) {
    case 'adjustment':
      element.style.backgroundColor = '#8CD98E';
      break;
    case 'print':
      element.style.backgroundColor = '#29B2FF';
      break;
    case 'downtime':
      element.style.backgroundColor = '#F07070';
      break;
    case 'stop':
      element.style.backgroundColor = '#FFD747';
      break;
    default:
  }
  for (let j = 0; j < labels.length; j++) {
    labels[j].style.color = 'white';
  }
}

// Ну тут вообще все понятно
function getLastTabIndex() {
  return lastIndex++;
}
