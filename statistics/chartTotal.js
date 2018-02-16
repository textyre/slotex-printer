let heightUseful    = null;
let heightUnhelpful = null;
let heightNecessary = null;

window.addEventListener('load', function () {
    let useful    = document.querySelector('.useful');
    let unhelpful = document.querySelector('.unhelpful');
    let necessary = document.querySelector('.necessary');

    useful.addEventListener('mouseover', function (event) {
        let color_line = useful.querySelector('.color-line');
        color_line.style.height = `${heightUseful}%`;
    });

    useful.addEventListener('mouseout', function (event) {
        let color_line = useful.querySelector('.color-line');
        color_line.style.height = `3px`;
    });

    unhelpful.addEventListener('mouseover', function (event) {
        let color_line = unhelpful.querySelector('.color-line');
        color_line.style.height = `${heightUnhelpful}%`;
    });

    unhelpful.addEventListener('mouseout', function (event) {
        let color_line = unhelpful.querySelector('.color-line');
        color_line.style.height = `3px`;
    });

    necessary.addEventListener('mouseover', function (event) {
        let color_line = necessary.querySelector('.color-line');
        color_line.style.height = `${heightNecessary}%`;
    });

    necessary.addEventListener('mouseout', function (event) {
        let color_line = necessary.querySelector('.color-line');
        color_line.style.height = `3px`;
    });
});


function outBeginEndTime(fromTime, toTime) {
  let timeBegin = document.getElementById('timeBegin');
  let timeEnd   = document.getElementById('timeEnd');

  let options = {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric'
  }
  if (fromTime === '' || fromTime === undefined || fromTime === ' ') {
    timeBegin.innerHTML = ' - '
  } else {
    timeBegin.innerHTML = new Date(fromTime).toLocaleString('ru-RU', options).replace(',', '');
  }

  if (toTime === '' || toTime === undefined || toTime === ' ') {
    timeEnd.innerHTML = ' - '
  } else {
    timeEnd.innerHTML = new Date(toTime).toLocaleString('ru-RU', options).replace(',', '');
  }
}

function outTotalTime(useful, unhelpful, necessary) {
  let usefulLabel      = document.getElementById('useful');
  let usefulPercent    = document.getElementById('usefulPercent');

  let unhelpfulLabel   = document.getElementById('unhelpful');
  let unhelpfulPercent = document.getElementById('unhelpfulPercent');

  let necessaryLabel   = document.getElementById('necessary');
  let necessaryPercent = document.getElementById('necessaryPercent');

  if (useful != 0) {
    usefulLabel.innerHTML    = useful    + ' / ' + (Number(useful)/60).toFixed(2);

    let summa = useful + unhelpful + necessary;
    heightUseful = ((useful / summa) * 100).toFixed(2);

    usefulPercent.innerHTML  = heightUseful + '%';

  } else {
    usefulLabel.innerHTML = 0;
    usefulPercent.innerHTML  = '<i class="em em-man-shrugging"></i>';
  }

  if (unhelpful != 0) {
    unhelpfulLabel.innerHTML = unhelpful + ' / ' + (Number(unhelpful)/60).toFixed(2);

    let summa = useful + unhelpful + necessary;
    heightUnhelpful = ((unhelpful / summa) * 100).toFixed(2);

    unhelpfulPercent.innerHTML  = heightUnhelpful + '%';
  } else {
    unhelpfulLabel.innerHTML = 0;
    unhelpfulPercent.innerHTML = '<i class="em em-man-shrugging"></i>';
  }

  if (necessary != 0) {
    necessaryLabel.innerHTML = necessary + ' / ' + (Number(necessary)/60).toFixed(2);

    let summa = useful + unhelpful + necessary;
    heightNecessary = ((necessary / summa) * 100).toFixed(2);

    necessaryPercent.innerHTML  = heightNecessary + '%';
  } else {
    necessaryLabel.innerHTML = 0;
    necessaryPercent.innerHTML = '<i class="em em-man-shrugging"></i>';
  }
}
