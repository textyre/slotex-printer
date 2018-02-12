window.addEventListener('load', function () {

});

function outOperationHistory(operation) {
  return '<div class="operation"> \
    <label class="titleOperation">' + operation[0] + ' - ' + operation[1] + '</label> \
    <div class="dataOperation"> \
      <div class="DataOperationData"><label class="titleDataOperation">Начало</label><br><label class="beginTimeData">' + operation[2] + '</label></div> \
      <div class="DataOperationData"><label class="titleDataOperation">Конец</label><br><label class="endTimeData">' + operation[3] + '</label></div> \
      <div class="DataOperationData"><label class="titleDataOperation">Время</label><br><label class="timeData">' + operation[4] + '</label></div> \
    </div> \
  </div>'
}
