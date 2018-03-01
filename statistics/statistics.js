const ipcRenderer = require('electron').ipcRenderer;

ipcRenderer.send('windowLoad', 'statisticsWindow');

const updateOnlineStatus = () => {
  ipcRenderer.send('online-status-changed', navigator.onLine ? true : false)
}

window.addEventListener('online',  updateOnlineStatus);
window.addEventListener('offline',  updateOnlineStatus);

updateOnlineStatus();

ipcRenderer.on('getOrder', function (event, order, userName) {
    console.log(order);

    outOrder(order, userName);
    outBeginEndTime(order.beginDate, order.endDate);
    drawChart(getClassTimeOperations(order.info));
    outTotalTime(order.usefulTime, order.unhelpfulTime, order.necessaryTime);
    for (let i = 0; i < order.info.length; i++) {
      outOperation(order.info[i]);
    }
});

ipcRenderer.on('getOperationsHistory', function (event, operationHistory) {
    let block_historyOperation = document.getElementById('historyOperation');
    for (let i = 0; i < operationHistory.length; i++) {
      block_historyOperation.innerHTML += outOperationHistory(operationHistory[i]);
    }
});

window.addEventListener('load', function() {
    let btnBack = document.getElementById('arrow');

    btnBack.addEventListener('click', function () {
        ipcRenderer.send('openWindow', ['ordersWindow']);
    });
});


function drawChart(operations) {
  var ctx = document.getElementById("myChart");
  var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: operations[0],
          datasets: [{
              label: 'Класс операций',
              data: operations[1],
              backgroundColor: [
                  'rgba(82, 215, 132, 0.7)',
                  'rgba(82, 215, 132, 0.7)',
                  'rgba(82, 215, 132, 0.7)',
                  'rgba(82, 215, 132, 0.7)',
                  'rgba(82, 215, 132, 0.7)',
                  'rgba(82, 215, 132, 0.7)'
              ],
              borderWidth: 0
          }]
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }],
              xAxes: [{
                  ticks: {
                      fontSize: 10
                  }
              }]
          },
          legend: {
            labels: {
                fontColor: 'black'
            }
        }
      }
  });
}

function getClassTimeOperations(operation) {
  let classOperations = [];
  let timeOperations  = [];
  let flag = true;
  for (let i = 0; i < operation.length; i++) {
    for (let j = 0; j < classOperations.length; j++) {
      if (operation[i][0] === classOperations[j]) {
        timeOperations[j] += operation[i][2];
        flag = false;
        break;
      }
    }
    if (flag) {
      classOperations.push(operation[i][0]);
      timeOperations.push(operation[i][2]);
    }
    flag = true;
  }
  console.log(classOperations, timeOperations);
  return [classOperations, timeOperations];
}
