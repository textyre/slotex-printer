var searchKey;
var bufferSearchKey = null;

window.addEventListener('load', function () {
    let inputSearchBar = document.getElementById('inputSearchBar');
    var letterNumber = /[A-Za-zА-яа-яЁё0-9]([ A-Za-zА-яа-яЁё0-9])*/;
    inputSearchBar.addEventListener('keyup', function() {
        searchKey = inputSearchBar.value.toUpperCase();
          if (searchKey !== '' && searchKey !== undefined &&
              searchKey.trim().length !== 0 && searchKey.match(letterNumber)) {
            console.log(searchKey);
            hideDownloadOrders();
            hideButtonDowloadOrders();
            setTimeout(function () {
              if (searchKey !== bufferSearchKey) {
                removeErrorNotFoundOnDisplay();
                ipcRenderer.send('searchInDB', searchKey);
                bufferSearchKey = searchKey;
              }
            }, 700);
          } else {
            console.log('Значение inputSearchBar пустое: ', searchKey);
            removeErrorNotFoundOnDisplay();
            setTimeout(removeFoundOrders, 700);
            showButtonDowloadOrders();
            setTimeout(showDownloadOrders, 800);
          }
    });

    inputSearchBar.addEventListener('focus', function() {
        hideButtonDowloadOrders();
        hideDownloadOrders();
    });

    inputSearchBar.addEventListener('focusout', function() {
        if (!visibleFoundOrders) {
          showDownloadOrders();
          showButtonDowloadOrders();
        }
    });
});
