
window.onload = function () {
  var ctx = document.getElementById("myChart");
  console.log(ctx);
  var myChart = new Chart(ctx, {
      type: 'bar',
      data: {
          labels: ["Печать", "Наладка", "Цветоподбор", "Простои ПЗ", ["Простои", " техники"], ["Остановка", " программы"]],
          datasets: [{
              label: 'Класс операций',
              data: [212, 123, 25, 37, 64, 360],
              backgroundColor: [
                  'rgba(82, 215, 132, 0.7)',
                  'rgba(82, 215, 132, 0.7)',
                  'rgba(82, 215, 132, 0.7)',
                  'rgba(82, 215, 132, 0.7)',
                  'rgba(82, 215, 132, 0.7)',
                  'rgba(82, 215, 132, 0.7)'
              ],
              borderWidth: 0
          }]
      },
      options: {
          scales: {
              yAxes: [{
                  ticks: {
                      beginAtZero:true
                  }
              }]
          }
      }
  });
}
