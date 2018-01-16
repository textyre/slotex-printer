
window.addEventListener('click', function () {

});


window.addEventListener('load', function () {
    const changeUser      = document.getElementById('changeUser');
    const filterBar       = document.getElementById('filterbar');
    const createOrderBar  = document.getElementById('createOrderBar');
    const usersBar        = document.getElementById('usersBar');

    const inputFromDate   = document.getElementById('fromDate');
    const inputToDate     = document.getElementById('toDate');
    const inputFromTime   = document.getElementById('fromTime');
    const inputToTime     = document.getElementById('toTime');

    const errorFromDate_incorrect   = document.getElementById('errorFromDate_incorrect');
    const errorToDate_incorrect     = document.getElementById('errorToDate_incorrect');
    const errorToDate_min           = document.getElementById('errorToDate_min');
    let show_buttton_showStatistics = false;

    changeUser.addEventListener('click', function () {
        ipcRenderer.send('getUsers', null);

        filterBar.classList.add('hide');
        if (createOrderBar.className == 'visible') {
          createOrderBar.classList.remove('visible');
        }
        createOrderBar.classList.add('hide');
        usersBar.classList.add('visible');
    });


    inputFromDate.addEventListener('focus', function() {
        if (errorFromDate_incorrect.style.display === 'block') {
          errorFromDate_incorrect.style.display = 'none';
        }
        deleteErrorDisplay();
    });

    inputToDate.addEventListener('focus', function() {
        if (errorToDate_incorrect.style.display === 'block') {
          errorToDate_incorrect.style.display = 'none';
        } else if (errorToDate_min.style.display === 'block') {
          errorToDate_min.style.display = 'none';
        }
        deleteErrorDisplay();
    });

    inputFromDate.addEventListener('focusout', function() {
        let valueFromDate = inputFromDate.value;
        if (valueFromDate === '' || valueFromDate === undefined) {
          inputFromDate.value = '';
          inputFromDate.type = 'text';
          errorFromDate_incorrect.style.display = 'block';
          inputToDate.style.pointerEvents = 'none';
          inputToDate.style.opacity = '0.5';
          return false;
        } else {
          inputFromDate.type              = 'text';
          inputToDate.style.pointerEvents = 'auto';
          inputToDate.style.opacity       = '1';
          inputToDate.min                 = valueFromDate;

          hideDownloadOrders();

          if (!show_buttton_showStatistics) {
            show_buttton_showStatistics = showBlock_buttton_showStatistics();
          }

          checkInputData(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
        }
    });

    inputToDate.addEventListener('focusout', function() {
        let valueToDate = inputToDate.value;
        console.log(valueToDate);
        if (valueToDate === '' || valueToDate === undefined) {
          inputToDate.value = '';
          inputToDate.type = 'text';
          if (inputFromDate.value === '' && inputFromTime.value === '' && inputToTime.value === '') {
            return false;
          } else {
            errorToDate_incorrect.style.display = 'block';
          }
          return false;
        } else if (new Date(inputFromDate.value) > new Date(inputToDate.value)) {
          errorToDate_min.style.display = 'block';
          return false;
        }

        inputToDate.type = 'text';
        hideDownloadOrders();

        checkInputData(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
    });

    inputFromTime.addEventListener('focusout', function() {
        let valueFromTime = inputFromTime.value;
        console.log(valueFromTime);
        if (valueFromTime !== '' || valueFromTime !== undefined) {
          hideDownloadOrders();
          if (!show_buttton_showStatistics) {
            show_buttton_showStatistics = showBlock_buttton_showStatistics();
          }
          checkInputData(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
        }
    });

    inputToTime.addEventListener('focusout', function() {
        let valueToTime = inputToTime.value;
        console.log(valueToTime);
        if (valueToTime !== '' || valueToTime !== undefined) {
          hideDownloadOrders();
          console.log(document.getElementById('button_showStatistics'));
          if (!show_buttton_showStatistics) {
            show_buttton_showStatistics = showBlock_buttton_showStatistics();
          }
          checkInputData(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
        }
    });

});

function checkInputData(valueFromDate, valueToDate, valueFromTime, valueToTime) {
  if (valueFromDate !== '') {
    checkInputWhithToDate(valueFromDate, valueToDate, valueFromTime, valueToTime);
  } else {
    checkInputFromDateOnly(valueFromDate, valueFromTime, valueToTime);
  }
}

function checkInputWhithToDate(valueFromDate, valueToDate, valueFromTime, valueToTime) {
  if (valueToDate !== '') {
    if (valueFromTime !== '' && valueToTime !== '') {
      console.log('Начальная, конечная, начальное, конечное');
      ipcRenderer.send('timeSearchInDB', valueFromDate, valueToDate, valueFromTime, valueToTime);
      document.getElementById('time').innerHTML = valueFromDate + ' ' + valueFromTime + '   -   ' +
                                                  valueToDate   + ' ' + valueToTime;
    } else if (valueFromTime !== '') {
      console.log('Начальная, конечная, начальное');
      ipcRenderer.send('timeSearchInDB', valueFromDate, valueToDate, valueFromTime);
      document.getElementById('time').innerHTML = valueFromDate + ' ' + valueFromTime + '   -   ' +
                                                  valueToDate;
    } else if (valueToTime !== '') {
      console.log('Начальная, конечная, конечное');
      ipcRenderer.send('timeSearchInDB', valueFromDate, valueToDate, undefined, valueToTime);
      document.getElementById('time').innerHTML = valueFromDate + '   -   ' +
                                                  valueToDate   + ' ' + valueToTime;
    } else {
      console.log('Начальная, конечная');
      ipcRenderer.send('timeSearchInDB', valueFromDate, valueToDate);
      document.getElementById('time').innerHTML = valueFromDate + '   -   ' + valueToDate;
    }
  } else if (valueFromTime !== '' && valueToTime === '') {
    console.log('Начальная, начальное');
    ipcRenderer.send('timeSearchInDB', valueFromDate, undefined, valueFromTime, undefined);
    document.getElementById('time').innerHTML = valueFromDate + ' ' + valueFromTime;
  } else if (valueFromTime === '' && valueToTime !== '') {
    console.log('Начальная, конечное');
    ipcRenderer.send('timeSearchInDB', valueFromDate, undefined, undefined, valueToTime);
    document.getElementById('time').innerHTML = valueFromDate + ' ' + valueToTime;
  } else if (valueFromTime !== '' && valueToTime !== '') {
    console.log('Начальная, начальное, конечное');
    ipcRenderer.send('timeSearchInDB', valueFromDate, undefined, valueFromTime, valueToTime);
    document.getElementById('time').innerHTML = valueFromDate + ' ' + valueFromTime + '-' + valueToTime;
  } else {
    ipcRenderer.send('timeSearchInDB', valueFromDate);
    document.getElementById('time').innerHTML = valueFromDate;
    console.log('Начальная');
  }
}

function checkInputFromDateOnly(valueFromDate, valueFromTime, valueToTime) {
  if (valueFromTime !== '' && valueToTime !== '') {
    console.log('Начальное, конечное');
    ipcRenderer.send('timeSearchInDB', undefined, undefined, valueFromTime, valueToTime);
    document.getElementById('time').innerHTML = valueFromTime + '-' + valueToTime;
  } else if (valueFromTime !== '') {
    console.log('Начальное');
    ipcRenderer.send('timeSearchInDB', undefined, undefined, valueFromTime, undefined);
    document.getElementById('time').innerHTML = valueFromTime;
  } else if (valueToTime !== '') {
    console.log('Конечное');
    ipcRenderer.send('timeSearchInDB', undefined, undefined, undefined, valueToTime);
    document.getElementById('time').innerHTML = valueToTime;
  }
}


function showBlock_buttton_showStatistics() {
  console.log('f');
  document.getElementById('button_showStatistics').style.display = 'inline-flex';
  document.getElementById('main').style.paddingTop = '0px';
  return true;
}

ipcRenderer.on('error_notFound', function (event, param) {
    removeFoundOrders();
    let main = document.getElementById('main');
    let error = document.createElement('label');
        error.innerHTML = 'Ничего не нашлось! :(';
        error.className = 'error_notFound';
        error.id        = 'error_notFound';

    main.style.display        = 'inline-flex';
    main.style.justifyContent = 'center';
    main.style.alignItems     = 'center';
    main.appendChild(error);
});

function deleteErrorDisplay() {
  document.getElementById('error_notFound').remove();
  let main = document.getElementById('main');
  main.style.display        = 'inline-block';
  main.style.justifyContent = '';
  main.style.alignItems     = '';
}

function f() {
  console.log('f');
}
