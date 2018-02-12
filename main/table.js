let operation = [];

window.onload = function windowLoad() {
  let classOperation;
  let nameOperation;

  //Обычный выбор операций
  $('td').click(function () {
      if (event.target.textContent == '') {
        closeDropDown();
        return false;
      }

      if (hasClass(event.target.className) && hasTag(event.target.tagName.toLowerCase())) {
        closeDropDown();
        classOperation = getClassOperation($(this));
        nameOperation = event.target.textContent;

        operation = [classOperation, nameOperation, 0];
        outOperation(operation, lastIndex);
      }
  });

  //Обработка нажатий, где будет выпадающий список
  $('td.dropbtn').click(function () {
    closeDropDown();
    classOperation = getClassOperation($(this));

      if (hasTag(event.target.tagName.toLowerCase())) {
        if (event.target.tagName.toLowerCase() == 'td') {
          nameOperation = getNameOperation(event.target);
          showDropDown(event.target);
        }

        if (event.target.tagName.toLowerCase() == 'label') {
          nameOperation = event.target.textContent;
          showDropDown(event.target.parentNode);
        }

        if (event.target.className == 'downCursor') {
          nameOperation = getNameOperation(event.target.parentNode);
          showDropDown(event.target.parentNode);
        }
      }
  });

  //Выбираем значения в выпадающием списке
  $('a').click(function () {
      nameOperation += ' - ' + event.target.textContent;

      operation = [classOperation, nameOperation, 0];
      outOperation(operation, lastIndex);
  });

  //Скрываем выпадающий список, если нажатие по экрану
  $(document).click(function () {
    if (hasClass(event.target.className))  {
      closeDropDown();
    }
  });
}

//Проверяем является ли тэг a
function hasTag(tagName) {
  if (tagName != 'a') {
    return true;
  } else {
    return false;
  }
}

//Провереяем является ли класс dropbtn или downCursor
function hasClass(className) {
  if (className != 'dropbtn' && className != 'downCursor') {
    return true;
  } else {
    return false;
  }
}

//Определяем имя операции, если нажатие произошло по label или downCursor (берем родителя - td)
function getNameOperation(parent) {
  return parent.getElementsByTagName('label')[0].textContent;
}

//Определяет класс операции.
//Получает номер столбца, по которому был произведен клик, из th берем имя класса операции
function getClassOperation(table) {
  var number = table.closest('td').index();
  var nameClassOperation = $("tr").find("th:eq(" + number + ")").text();
  return nameClassOperation;
};

//Открыть выпадающий список
function showDropDown(element) {
  element.getElementsByTagName('div')[0].classList.toggle("show");
}

//Закрыть выпдаюащий список
function closeDropDown() {
  if (document.querySelector('.show') != null) {
    document.querySelector('.show').classList.remove("show");
  }
}
