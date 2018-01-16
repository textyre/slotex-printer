const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
var tabindex = 0;
var userName = null;

function getUsers() {
  console.log('getUsers');
  ipcRenderer.send('openWindow', ['enterWindow']);
}

window.onload = function() {
  console.log('READY');
  setTimeout(getUsers, 1100);
  let usersBlock = document.getElementById('users');

  ipcRenderer.on('getUsers', function (event, objectUsers) {
      console.log('Принимаем USERS');
      for (let i = 0; i < objectUsers[0].users.length; i++) {
        usersBlock.innerHTML += '<div class="user" tabindex="' + (tabindex++) + '">' + objectUsers[0].users[i] + '</div>'
      }
  });

  const btnclick = document.getElementById('enterBttn');
  btnclick.addEventListener('click', function () {
      var arg = 'ordersWindow';
      if (userName != null) {
        ipcRenderer.send("openWindow", [arg, userName]);
      }
  });

  usersBlock.addEventListener('click', function () {
      userName = event.target.textContent;
  });
}

ipcRenderer.on('result', function(event, param) {
  console.log(param);
});
