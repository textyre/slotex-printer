window.addEventListener('load', function () {

});

function outOrder(order, userName) {
  document.getElementById('Order').textContent  = order.id;
  document.getElementById('Client').textContent = order.client;
  document.getElementById('Decor').textContent  = order.decor;
  document.getElementById('Weight').textContent = order.weight;
  document.getElementById('Count').textContent  = order.count;
  document.getElementById('User').textContent   = userName;
}
