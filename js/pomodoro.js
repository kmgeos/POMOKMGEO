let currentMode = 'pomodoro'; 
let timeLeft = config.pomodoro * 60;
let timerInterval = null;
let isRunning = false;
let pomodoroCount = 1;

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const gifDisplay = document.getElementById('gif-display');
const groupsContainer = document.getElementById('groups-container');
const activeTaskSelect = document.getElementById('active-task-select');
const groupAddSelect = document.getElementById('group-add-select');
const modal = document.getElementById('modal-settings');
const counterDisplay = document.getElementById('pomodoro-counter');
const taskTitleDisplay = document.getElementById('task-title-display');

function applyColors() {
  document.documentElement.style.setProperty('--color-pomodoro', config.colorPomodoro);
  document.documentElement.style.setProperty('--color-shortBreak', config.colorShort);
  document.documentElement.style.setProperty('--color-longBreak', config.colorLong);
}

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateCounterDisplay() {
  if (currentMode === 'longBreak') {
    counterDisplay.textContent = "Descanso Largo";
  } else if (currentMode === 'shortBreak') {
    counterDisplay.textContent = `Descanso Corto (${pomodoroCount} / ${config.longBreakInterval})`;
  } else {
    counterDisplay.textContent = `Pomodoro #${pomodoroCount} / ${config.longBreakInterval}`;
  }
}

function updateTaskTitle() {
  const selectedTaskVal = activeTaskSelect.value;
  if (selectedTaskVal) {
    taskTitleDisplay.textContent = selectedTaskVal.toUpperCase();
  } else {
    taskTitleDisplay.textContent = "SIN TAREA SELECCIONADA";
  }
}

function updateTheme() {
  document.body.className = `mode-${currentMode}`;
  if (isRunning && config.darkModeRunning) {
    document.body.classList.add('running-dark');
  }
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(`btn-${currentMode}`).classList.add('active');
}

function toggleTimer() {
  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  isRunning = true;
  startBtn.textContent = "PAUSE";
  if (config.darkModeRunning) {
    document.body.classList.add('running-dark');
  }
  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();
    } else {
      onTimerComplete();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  startBtn.textContent = "START";
  document.body.classList.remove('running-dark');
}

function onTimerComplete() {
  pauseTimer();

  if (currentMode === 'pomodoro') {
    if (pomodoroCount >= config.longBreakInterval) {
      switchMode('longBreak');
    } else {
      switchMode('shortBreak');
    }
  } else if (currentMode === 'shortBreak') {
    pomodoroCount++;
    switchMode('pomodoro');
  } else if (currentMode === 'longBreak') {
    pomodoroCount = 1;
    switchMode('pomodoro');
  }
}

function resetTimer() {
  pauseTimer();
  timeLeft = config[currentMode] * 60;
  updateTimerDisplay();
}

function skipPhase() {
  onTimerComplete();
}

function switchMode(mode) {
  pauseTimer();
  currentMode = mode;
  updateTheme();
  timeLeft = config[mode] * 60;
  updateTimerDisplay();
  updateCounterDisplay();
}

function openSmallWindow() {
  window.open(window.location.href, 'PomodoroSmall', 'width=360,height=520,resizable=yes');
}

document.getElementById('open-settings').onclick = () => modal.classList.add('active');
function closeSettings() { modal.classList.remove('active'); }

function saveSettings() {
  config.pomodoro = parseInt(document.getElementById('input-pomo').value) || 25;
  config.shortBreak = parseInt(document.getElementById('input-short').value) || 5;
  config.longBreak = parseInt(document.getElementById('input-long').value) || 15;
  config.longBreakInterval = parseInt(document.getElementById('input-interval').value) || 4;
  
  config.darkModeRunning = document.getElementById('input-dark-running').checked;
  
  config.colorPomodoro = document.getElementById('picker-pomo').value;
  config.colorShort = document.getElementById('picker-short').value;
  config.colorLong = document.getElementById('picker-long').value;

  const newGif = document.getElementById('input-gif').value;
  if(newGif) {
    config.gifUrl = newGif;
    gifDisplay.src = config.gifUrl;
  }

  applyColors();
  closeSettings();
  switchMode(currentMode);
}

// Inicialización de la aplicación
applyColors();
updateTimerDisplay();
renderGroups();
updateCounterDisplay();
