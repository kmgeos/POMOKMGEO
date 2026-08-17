// js/data.js

// Carga inicial desde localStorage con valores por defecto
let groups = JSON.parse(localStorage.getItem('pomodoro_groups')) || [];
let ungroupedTasks = JSON.parse(localStorage.getItem('ungrouped_tasks')) || [];

let config = JSON.parse(localStorage.getItem('pomodoro_config')) || {
  pomodoro: 25,
  shortBreak: 5,
  longBreak: 15,
  longBreakInterval: 4,
  autoBreaks: false,
  autoPomos: false,
  autoCheck: false,
  checkBottom: true,
  alarmSound: "alarm.mp3",     // Se mantiene con extensión para assets/
  alarmVol: 50,
  alarmRepeat: 1,
  darkModeRunning: false,
  reminderEnabled: false,      // Requerido por el temporizador principal
  reminderMin: 1,
  colorPomodoro: "#9bb979",
  colorShort: "#82a862",
  colorLong: "#6a934a",
  gifUrl: "https://i.gifer.com/XOsX.gif"
};

// Función global para guardar cualquier cambio
function saveData() {
  localStorage.setItem('pomodoro_groups', JSON.stringify(groups));
  localStorage.setItem('ungrouped_tasks', JSON.stringify(ungroupedTasks));
  localStorage.setItem('pomodoro_config', JSON.stringify(config));
}
