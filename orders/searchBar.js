var searchKey;

window.addEventListener('load', function () {
    let inputSearchBar = document.getElementById('inputSearchBar');
    inputSearchBar.addEventListener('keyup', function() {
        searchKey = inputSearchBar.value.toUpperCase();
        if (searchKey !== '' && searchKey !== undefined) {
          hideDownloadOrders();
          ipcRenderer.send('searchInDB', searchKey);
        } else {
          removeFoundOrders();
          showDownloadOrders();
        }
    });

    inputSearchBar.addEventListener('focus', function() {
        hideDownloadOrders();
    });

    inputSearchBar.addEventListener('focusout', function() {
        removeFoundOrders();
        showDownloadOrders();
    });
});
