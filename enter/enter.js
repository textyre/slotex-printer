const ipcRenderer = require('electron').ipcRenderer;
const remote = require('electron').remote;
var tabindex = 0;
var userName = null;

// setTimeout(function () {
// }, 1000);
ipcRenderer.send('openWindow', ['enterWindow']);

ipcRenderer.on('getUsers', function (event, users) {
    console.log(users);
    console.log('fff');
    for (let i = 0; i < users.length; i++) {
      list.innerHTML += '<a>' + users[i] + '</a>';
    }
});

window.addEventListener('click', function () {
    if (event.target.tagName === 'INPUT') {
      return false;
    } else if (event.target.tagName === 'A') {
      document.getElementById('inputFIO').value = event.target.textContent;
      closeDropDown();
    } else {
      closeDropDown();
    }
});

window.onload = function() {
  console.log('READY');
  // setTimeout(getUsers, 1100);
  let usersBlock = document.getElementById('users');
  let inputFIO   = document.getElementById('inputFIO');
  let list       = document.getElementById('list');

  inputFIO.addEventListener('focus', function (event) {
      showDropDown(event.target);
  });

  inputFIO.addEventListener('focusout', function () {
  });

  inputFIO.addEventListener('keydown', function (event) {
      let value = inputFIO.value;
      let elementsA = list.getElementsByTagName('a');
      for (let i = 0; i < elementsA.length; i++) {
        if (elementsA[i].textContent.indexOf(value) !== -1) {
          elementsA[i].style.display = '';
        } else {
          elementsA[i].style.display = 'none';
        }
      }
  });



  const btnclick = document.getElementById('enterBttn');
  btnclick.addEventListener('click', function () {
      var arg = 'ordersWindow';
      if (inputFIO.value === null || inputFIO.value === '') {
        return false;
      } else {
        ipcRenderer.send("openWindow", [arg, inputFIO.value]);
      }
  });

  // usersBlock.addEventListener('click', function () {
  //     userName = event.target.textContent;
  // });
}

ipcRenderer.on('result', function(event, param) {
  console.log(param);
});

function showDropDown(element) {
  let list = document.getElementById('list');
  list.classList.toggle("show");
  // element.getElementsByTagName('div')[0].classList.toggle("show");
}

//Закрыть выпдаюащий список
function closeDropDown() {
  if (document.querySelector('.show') != null) {
    document.querySelector('.show').classList.remove("show");
  }
}
