class ViewHead {
  constructor() {
    this.head = document.getElementById('Head');
  }

  outClassTime(operation) {
    let fieldClassOperation = document.getElementById(operation[0]);
    if (fieldClassOperation === null) {
      this.head.innerHTML += this.getTemplate(operation[0], operation[2]);
    } else {
      let time = fieldClassOperation.textContent;
      fieldClassOperation.innerHTML = Number(time) + operation[2];
    }
  }

   getTemplate(nameClass, time) {
    return `<div class="Field"> \
              <label>${nameClass}</label><br> \
              <label id="${nameClass}">${time}</label> \
            </div>`
  }

  setUserName(userName) {
    this.head.innerHTML += `<div class="user"><label id="User">${userName}</label></div>`;
  }

  setRangeDate(date) {
    this.head.innerHTML += `<div class="Field"><label>Дата выборки</label><br><label id="Interval">${date}</label></div>`
  }
}
