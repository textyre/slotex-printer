window.addEventListener('load', function () {

    const back       = document.getElementById('arrow');
    const closeOrder = document.getElementById('closeOrder');

    closeOrder.addEventListener('click', function () {
        if (lastActiveElement !== null) {
          let classNameOperation = lastActiveElement.querySelector('#class').textContent;
          let nameOperation      = lastActiveElement.querySelector('#type').textContent;
          let timeOperation      = lastActiveElement.querySelector('#min').textContent;
          ipcRenderer.send('setHistoryOperation', classNameOperation, nameOperation, timeOperation);
        }

        ipcRenderer.send('closeOrder', _order.id);
    });

    back.addEventListener('click', function () {
        ipcRenderer.send("openWindow", ["ordersWindow", "panelWindow"]);
    }, false);


    ipcRenderer.send('windowLoad', 'panelWindow');
    ipcRenderer.on('getOrder', function (event, order, userName) {
        outOrder(order, userName);
    });
});

function outOrder(order, userName) {
  document.getElementById('Order').textContent  = order.id;
  document.getElementById('Client').textContent = order.client;
  document.getElementById('Decor').textContent  = order.decor;
  document.getElementById('Weight').textContent = order.weight;
  document.getElementById('Count').textContent  = order.count;
  document.getElementById('User').textContent   = userName;
}
