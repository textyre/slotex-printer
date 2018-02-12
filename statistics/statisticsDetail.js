window.addEventListener('load', function () {
});

function outOperation(operation) {
  let detailBlock    = document.getElementById('detail');
  let operationBlock = document.getElementById(operation[0]);

  if (operationBlock === null) {
    detailBlock.innerHTML    += getTemplateBlock(operation);
  } else {
    operationBlock.innerHTML += getTemplateOperation(operation);
  }
}

function getTemplateBlock(operation) {
  if (operation[0] === 'Печать') {
    return '<div id="printBlock" class="block"> \
              <label class="print" id="' + operation[1] + '">Печать</label> \
              <label id="printTime">' + operation[2] + '</label> \
            </div>'
  } else {
    return '<div class="block ' + getProgramClass(operation[0]) + '"> \
      <div class="titleBlock"> \
        <label class="title">' + operation[0] + '</label> \
      </div> \
      <div class="dataBlock" id="' + operation[0] + '"> \
      ' + getTemplateOperation(operation) + ' \
      </div> \
    </div>'
  }
}

function getTemplateOperation(operation) {
  return '<div class="dataBlock_data"> \
            <label class="dataTitle">' + operation[1] + '</label><br><br> \
            <label class="dataMain">' + operation[2] + ' / ' + (Number(operation[2])/60).toFixed(2) +  '</label> \
          </div>'
}

function getProgramClass(className) {
    switch (className) {
      case 'Наладка':
      case 'Цветоподбор':
        return 'adjust';
      break;

      case 'Печать':
        return 'print';
      break;

      case 'Простои ПЗ':
      case 'Простои техники':
        return 'down';
      break;

      case 'Остановка программы':
        return 'stop';
      break;
      default:
    }
}
