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
  alarmSound: "kitchen",
  alarmVol: 50,
  alarmRepeat: 1,
  darkModeRunning: true,
  colorPomodoro: "#6b4c9a",
  colorShort: "#2d8883",
  colorLong: "#397097",
  gifUrl: "https://i.gifer.com/XOsX.gif",
  reminderType: "last",
  reminderMin: 0
};

function saveData() {
    localStorage.setItem('pomodoro_groups', JSON.stringify(groups));
    localStorage.setItem('ungrouped_tasks', JSON.stringify(ungroupedTasks));
    localStorage.setItem('pomodoro_config', JSON.stringify(config));
}
