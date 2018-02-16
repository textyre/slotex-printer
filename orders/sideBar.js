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

    const btnReset = document.getElementById('btnReset');

    $('#fromDate').datepicker({
        autoClose: true,
        keyboardNav: false,
        showOtherMonths: false,
        position: 'right top'
    });

    //Принимает юзера, скрывает основной бар, скрыть бар "Создание заказа", если открыт
    //Показать бар с юзерами для выбора
    changeUser.addEventListener('click', function () {
        ipcRenderer.send('getUsers', null);

        filterBar.classList.add('hide');
        if (createOrderBar.className == 'visible') {
          createOrderBar.classList.remove('visible');
        }
        createOrderBar.classList.add('hide');
        usersBar.classList.add('visible');
    });

    btnReset.addEventListener('click', function() {
        inputFromDate.value = '';
        disableInputToDate(inputToDate);
        disableInputFromTime(inputFromTime);
        disableInputToTime(inputToTime);
        removeFoundOrders();
        removeErrorNotFoundOnDisplay();
        callHideBlock_Buttton_ShowStatistics(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
        showDownloadOrders();
    });

    //Удалить предыдущее значение, скрыть ошибку, если на экране
    //Удалить элемент "Ничего не найдено! :("

    inputFromDate.addEventListener('focus', function() {
        if (statusNetwork) {
          hideButtonDowloadOrders();
          inputFromDate.value = '';

          if (errorFromDate_incorrect.style.display === 'block')
            showHideErrorFromDate(true);

          removeErrorNotFoundOnDisplay();
        }
    });

    // inputFromDate.addEventListener('keyup', function(event) {
    //     keyInputs = event.key;
    // });

    inputFromDate.addEventListener('focusout', function() {
        if (statusNetwork) {
          let valueFromDate = inputFromDate.value;

          if (valueFromDate === '' || valueFromDate === undefined) {
            disableInputToDate(inputToDate);
            callHideBlock_Buttton_ShowStatistics(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
            return false;
          }

          let date = valueFromDate.split('.');
          if (date.length === 3) {
            let flag = checkOnErrorInputDate(valueFromDate);

            if (flag) {
              activableInputToDate(inputToDate);
              hideDownloadOrders();
              toDatePickerSettings(valueFromDate);
              sendInputsDataInMain(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
              return true;
            } else {
              showHideErrorFromDate(false);
              return false;
            }
          } else {
            showHideErrorFromDate(false);
            return false;
          }
        }
    });

    //Если показана ошибка - скрыть
    //Удалить элемент "Ничего не найдено! :("
    inputToDate.addEventListener('focus', function() {
        if (statusNetwork) {
          inputToDate.value = '';

          if (errorToDate_incorrect.style.display === 'block') {
            showHideErrorIncorrectToDate(true);
          } else if (errorToDate_min.style.display === 'block') {
            showHideErrorMinRageToDate(true);
          }
          removeErrorNotFoundOnDisplay();
        }
    });

    //Если дата содержит день, месяц, год - продолжить, иначе вывести ошибку
    //Если конечная дата меньше начальной - ошибка, иначе продолжить
    //Если день, месяц, год указаны правильно - продолжить, иначе ошибка
    inputToDate.addEventListener('focusout', function() {
        if (statusNetwork) {
          let valueToDate = inputToDate.value;

          let date  = valueToDate.split('.');
          if (date.length === 3) {
            let minMaxFlag = checkMinMaxRange(inputFromDate.value, date);
            if (minMaxFlag) {
              let flag = checkOnErrorInputDate(valueToDate);
              if (flag) {
                sendInputsDataInMain(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
              } else {
                console.log('Неверная дата 1');
                showHideErrorIncorrectToDate(false);
              }
            } else {
              showHideErrorMinRageToDate(false);
            }
          } else {
            if (valueToDate === '') {
              return true;
            } else {
              showHideErrorIncorrectToDate(false);
            }
          }
        }
    });

    inputFromTime.addEventListener('focus', function() {
        if (statusNetwork) {
          inputFromTime.value = '';
          hideButtonDowloadOrders();
          removeErrorNotFoundOnDisplay();
        }
    });

    //Если значение не пустое, то скрываем загруженные заказы
    //Если блок "Показать статистику" скрыть - отобразить
    //Найти заказы по фильтру
    //Иначе вызвать функцию скрытия блока "Показать статистику"
    inputFromTime.addEventListener('focusout', function() {
        if (statusNetwork) {
          let valueFromTime = inputFromTime.value;
          if (valueFromTime !== '') {
            hideDownloadOrders();
            if (!show_buttton_showStatistics) {
              show_buttton_showStatistics = showBlock_buttton_showStatistics();
            }
            sendInputsDataInMain(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
          } else {
            disableInputFromTime(inputFromTime);
            callHideBlock_Buttton_ShowStatistics(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
          }
        }
    });

    inputToTime.addEventListener('focus', function() {
        if (statusNetwork) {
          inputToTime.value = '';
          hideButtonDowloadOrders();
          removeErrorNotFoundOnDisplay();
        }
    });

    inputToTime.addEventListener('focusout', function() {
        if (statusNetwork) {
          let valueToTime = inputToTime.value;
          if (valueToTime !== '') {
            hideDownloadOrders();
            if (!show_buttton_showStatistics) {
              show_buttton_showStatistics = showBlock_buttton_showStatistics();
            }
            sendInputsDataInMain(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
          } else {
            disableInputToTime(inputToTime);
            callHideBlock_Buttton_ShowStatistics(inputFromDate.value, inputToDate.value, inputFromTime.value, inputToTime.value);
          }
        }
    });
});

function sendInputsDataInMain(valueFromDate, valueToDate, valueFromTime, valueToTime) {
  if (valueFromDate !== '') {
    checkInputWhithToDate(valueFromDate, valueToDate, valueFromTime, valueToTime);
  } else {
    checkInputWhithOutDates(valueFromTime, valueToTime);
  }
}

function getCurrentDateWithTime (date, time) {
  let year    = date.split('.')[2],
      month   = date.split('.')[1],
      day     = date.split('.')[0],
      hours   = time.split(':')[0],
      minutes = time.split(':')[1];

  return new Date(year, Number(month)-1, Number(day), hours, minutes).toISOString();
}

function getCurrentDateWithOutTime(date) {
  let year    = date.split('.')[2],
      month   = date.split('.')[1],
      day     = date.split('.')[0];

  return new Date(year, Number(month)-1, Number(day), 3, 0).toISOString();
}



function checkInputWhithToDate(valueFromDate, valueToDate, valueFromTime, valueToTime) {
  if (valueToDate !== '') {
    if (valueFromTime !== '' && valueToTime !== '') {
      // console.log('Начальная, конечная, начальное, конечное');

      ipcRenderer.send('timeSearchInDB', getCurrentDateWithTime(valueFromDate, valueFromTime),
                                         getCurrentDateWithTime(valueToDate, valueToTime), valueFromTime, valueToTime);
      document.getElementById('time').innerHTML = valueFromDate + ' ' + valueFromTime + '   -   ' +
                                                  valueToDate   + ' ' + valueToTime;
    } else if (valueFromTime !== '') {
      // console.log('Начальная, конечная, начальное');
      ipcRenderer.send('timeSearchInDB', getCurrentDateWithTime(valueFromDate, valueFromTime),
                                         getCurrentDateWithOutTime(valueToDate), valueFromTime);
      document.getElementById('time').innerHTML = valueFromDate + ' ' + valueFromTime + '   -   ' +
                                                  valueToDate;
    } else if (valueToTime !== '') {
      // console.log('Начальная, конечная, конечное');
      ipcRenderer.send('timeSearchInDB', getCurrentDateWithOutTime(valueFromDate),
                                         getCurrentDateWithTime(valueToDate, valueToTime), undefined, valueToTime);
      document.getElementById('time').innerHTML = valueFromDate + '   -   ' +
                                                  valueToDate   + ' ' + valueToTime;
    } else {
      // console.log('Начальная, конечная');
      ipcRenderer.send('timeSearchInDB', getCurrentDateWithOutTime(valueFromDate),
                                         getCurrentDateWithOutTime(valueToDate));
      document.getElementById('time').innerHTML = valueFromDate + '   -   ' + valueToDate;
    }
  } else if (valueFromTime !== '' && valueToTime === '') {
    // console.log('Начальная, начальное');
    ipcRenderer.send('timeSearchInDB', getCurrentDateWithTime(valueFromDate, valueFromTime),
                                       undefined, valueFromTime, undefined);
    document.getElementById('time').innerHTML = valueFromDate + ' ' + valueFromTime;
  } else if (valueFromTime === '' && valueToTime !== '') {
    // console.log('Начальная, конечное');
    ipcRenderer.send('timeSearchInDB', getCurrentDateWithOutTime(valueFromDate),
                                       undefined, undefined, valueToTime);
    document.getElementById('time').innerHTML = valueFromDate + ' ' + valueToTime;
  } else if (valueFromTime !== '' && valueToTime !== '') {
    // console.log('Начальная, начальное, конечное');
    ipcRenderer.send('timeSearchInDB', getCurrentDateWithTime(valueFromDate, valueFromTime),
                                       undefined, valueFromTime, valueToTime);
    document.getElementById('time').innerHTML = valueFromDate + ' ' + valueFromTime + '-' + valueToTime;
  } else {
    // console.log('Начальная');
    ipcRenderer.send('timeSearchInDB', getCurrentDateWithOutTime(valueFromDate));
    document.getElementById('time').innerHTML = valueFromDate;
  }
}

function checkInputWhithOutDates(valueFromTime, valueToTime) {
  if (valueFromTime !== '' && valueToTime !== '') {
    // console.log('Начальное, конечное');
    ipcRenderer.send('timeSearchInDB', undefined, undefined, valueFromTime, valueToTime);
    document.getElementById('time').innerHTML = valueFromTime + '-' + valueToTime;
  } else if (valueFromTime !== '') {
    // console.log('Начальное');
    ipcRenderer.send('timeSearchInDB', undefined, undefined, valueFromTime, undefined);
    document.getElementById('time').innerHTML = valueFromTime;
  } else if (valueToTime !== '') {
    // console.log('Конечное');
    ipcRenderer.send('timeSearchInDB', undefined, undefined, undefined, valueToTime);
    document.getElementById('time').innerHTML = valueToTime;
  }
}

function checkOnErrorInputDate(date) {
  if ( ((date.split('.')[0].length == 1 || date.split('.')[0].length == 2) &&
        (date.split('.')[1].length == 1 || date.split('.')[1].length == 2) &&
         date.split('.')[2].length == 4)

        &&

       ((Number(date.split('.')[0]) >= 1 && Number(date.split('.')[0]) <= 31) &&
       ( Number(date.split('.')[1]) >= 1 && Number(date.split('.')[1]) <= 12 ) &&
       ( Number(date.split('.')[2]) >= 2010 && Number(date.split('.')[2]) <= 2500 ))) {
         return true;
      } else {
        return false;
      }
}

function activableInputToDate(inputToDate) {
  inputToDate.style.pointerEvents = 'auto';
  inputToDate.style.opacity       = '1';
}

function disableInputToDate(inputToDate) {
  inputToDate.value = '';
  inputToDate.style.pointerEvents = 'none';
  inputToDate.style.opacity       = '0.5';
}

function disableInputFromTime(inputFromTime) {
  inputFromTime.value = '';
  inputFromTime.type = 'text';
}

function disableInputToTime(inputToTime) {
  inputToTime.value = '';
  inputToTime.type = 'text';
}

function showHideErrorFromDate(flag) {
  if (flag) {
    errorFromDate_incorrect.style.display = 'none';
  } else {
    errorFromDate_incorrect.style.display = 'block';
  }
}

function showHideErrorIncorrectToDate(flag) {
  if (flag) {
    errorToDate_incorrect.style.display = 'none';
  } else {
    errorToDate_incorrect.style.display = 'block';
  }
}

function showHideErrorMinRageToDate(flag) {
  if (flag) {
    errorToDate_min.style.display = 'none';
  } else {
    errorToDate_min.style.display = 'block';
  }
}

function checkMinMaxRange(from, toArray) {
  let fromArray = from.split('.');
  if (  new Date( Number(fromArray[2]), Number(fromArray[1]) - 1, Number(fromArray[0])) <=
        new Date( Number(toArray[2]), Number(toArray[1]) - 1, Number(toArray[0]))  ) {
    return true;
  } else {
    return false;
  }
}

function checkInputsOnData(fromDate, toDate, fromTime, toTime) {
  if (fromDate === '' && toDate === '' && fromTime === '' && toTime === '') {
    showButtonDowloadOrders();
    return true;
  } else {
    return false;
  }
}

function callHideBlock_Buttton_ShowStatistics(fromDate, toDate, fromTime, toTime) {
  if (show_buttton_showStatistics) {
    let flag = checkInputsOnData(fromDate, toDate, fromTime, toTime);
    if (flag) {
      hideBlock_buttton_showStatistics();
      removeFoundOrders();
      showDownloadOrders();
    } else {
      return false;
    }
  }
}


function toDatePickerSettings(date) {
  let day   = date.split('.')[1],
      month = date.split('.')[0],
      year  = date.split('.')[2];
  $('#toDate').datepicker({
      autoClose: true,
      showOtherMonths: false,
      minDate: new Date(year, Number(day)-1, Number(month)),
      keyboardNav: false,
      position: 'right top'
  });
}
