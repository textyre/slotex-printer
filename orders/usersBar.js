window.addEventListener('load', function () {
    const usersBlock           = document.getElementById('users');
    const btnCancelChooseUsers = document.getElementById('btnCancelChooseUsers');
    const btnChooseUser        = document.getElementById('btnChooseUser');
    let userName;

    ipcRenderer.on('setUsers', function (event, users) {
        usersBlock.innerHTML = '';
        let tabindex = 0;
        for (let i = 0; i < users.length; i++) {
          usersBlock.innerHTML += '<div class="user" tabindex="' + (tabindex++) + '">' + users[i] + '</div>'
        }
    });

    usersBlock.addEventListener('click', function () {
        console.log(event.target.textContent);
        userName = event.target.textContent;
    });

    btnChooseUser.addEventListener('click', function () {
        document.getElementById('nameUser').innerHTML = userName;
        closeUserBar();
        ipcRenderer.send('setUserName', userName);
    });

    btnCancelChooseUsers.addEventListener('click', function () {
        closeUserBar();
    });
});

function closeUserBar() {
  document.getElementById('usersBar').classList.remove('visible');
  document.getElementById('filterbar').classList.remove('hide');
  document.getElementById('createOrderBar').classList.remove('hide');
}
