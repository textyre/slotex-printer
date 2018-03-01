var searchKey;
var bufferSearchKey = null;

window.addEventListener('load', function () {
    let inputSearchBar = document.getElementById('inputSearchBar');
    var letterNumber = /[A-Za-zА-яа-яЁё0-9]([ A-Za-zА-яа-яЁё0-9])*/;
    inputSearchBar.addEventListener('keyup', function() {
        if (statusNetwork) {
            searchKey = inputSearchBar.value.toUpperCase();

            if (
                searchKey               !== ''        &&
                searchKey               !== undefined &&
                searchKey.trim().length !== 0         &&
                searchKey.match(letterNumber)
              ) {
                  hideDownloadOrders();
                  hideButtonDowloadOrders();

                  setTimeout(() => {
                    if (searchKey !== bufferSearchKey) {
                        removeErrorNotFoundOnDisplay();
                        ipcRenderer.send('searchByInputs', searchKey);
                        bufferSearchKey = searchKey;
                    }
                  }, 700);

            } else {
              console.log('fff');
              removeErrorNotFoundOnDisplay();
              removeFoundOrders();
              // showDownloadOrders();
              showButtonDowloadOrders();
            }
        } else {
          return false;
        }
    });

    inputSearchBar.addEventListener('focus', function() {
        if (statusNetwork) {
          hideButtonDowloadOrders();
          hideDownloadOrders();
        }
    });

    inputSearchBar.addEventListener('focusout', function() {
        if (!visibleFoundOrders) {
          showDownloadOrders();
          showButtonDowloadOrders();
        }
    });
});
