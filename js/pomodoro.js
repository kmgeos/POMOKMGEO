let currentMode = 'pomodoro'; 
let timeLeft = config.pomodoro * 60;
let timerInterval = null;
let isRunning = false;
let pomodoroCount = 1;
let isTransitioning = false; // Bandera para controlar la pausa de transición

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const gifDisplay = document.getElementById('gif-display');
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
  if (taskTitleDisplay) {
    taskTitleDisplay.textContent = selectedTaskFullTitle ? selectedTaskFullTitle.toUpperCase() : "SIN TAREA SELECCIONADA";
  }
}

function updateTheme() {
  document.body.className = `mode-${currentMode}`;
  if (isRunning && config.darkModeRunning) {
    document.body.classList.add('running-dark');
  }
  document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-${currentMode}`);
  if (activeBtn) activeBtn.classList.add('active');
}

function toggleTimer() {
  if (isTransitioning) return; // Evita interferir durante la pausa de transición

  // Reproducir sonido al hacer clic en Start / Pause
  const clickSound = document.getElementById('click-audio');
  if (clickSound) {
    clickSound.currentTime = 0; 
    clickSound.play();
  }

  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  isTransitioning = false;
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

  // Reproducir sonido de alarma al terminar el tiempo
  const alarmSound = document.getElementById('alarm-audio');
  if (alarmSound) {
    alarmSound.currentTime = 0;
    alarmSound.play();
  }

  // Lanzar notificación en pantalla si está permitido
  if ("Notification" in window && Notification.permission === "granted") {
    if (currentMode === 'pomodoro') {
      new Notification("¡Pomodoro Finalizado! ⏱️", {
        body: "Es hora de tomar un descanso."
      });
    } else {
      new Notification("¡Descanso Terminado! 🚀", {
        body: "Es hora de volver a concentrarse."
      });
    }
  }

  // Si estábamos en modo pomodoro, sumamos +1 pomodoro completado a la tarea activa si existe
  if (currentMode === 'pomodoro' && selectedTaskFullTitle) {
    addCompletedPomoToActiveTask();
  }

  let nextMode = 'pomodoro';
  if (currentMode === 'pomodoro') {
    if (pomodoroCount >= config.longBreakInterval) {
      nextMode = 'longBreak';
    } else {
      nextMode = 'shortBreak';
    }
  } else if (currentMode === 'shortBreak') {
    pomodoroCount++;
    nextMode = 'pomodoro';
  } else if (currentMode === 'longBreak') {
    pomodoroCount = 1;
    nextMode = 'pomodoro';
  }

  // Cambiamos al siguiente modo inmediatamente
  switchMode(nextMode);

  // Evaluamos si debe iniciar automáticamente según las opciones
  const shouldAutoStart = (nextMode.includes('Break') && config.autoBreaks) || 
                          (nextMode === 'pomodoro' && config.autoPomos);

  if (shouldAutoStart) {
    isTransitioning = true;
    let countdownSecs = 5; // <--- Aquí cambias los segundos de espera (puedes ajustarlo a 5, 10, etc.)
    
    counterDisplay.textContent = `Iniciando en ${countdownSecs}s...`;

    const transitionInterval = setInterval(() => {
      countdownSecs--;
      if (countdownSecs > 0) {
        counterDisplay.textContent = `Iniciando en ${countdownSecs}s...`;
      } else {
        clearInterval(transitionInterval);
        if (isTransitioning) {
          updateCounterDisplay(); 
          startTimer();
        }
      }
    }, 1000);
  }
}

// Función auxiliar para solicitar permisos de notificación del navegador
function requestNotificationPermission() {
  if ("Notification" in window && Notification.permission !== "granted" && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
}

// Función auxiliar para sumar el avance a la tarea que esté seleccionada
function addCompletedPomoToActiveTask() {
  let found = ungroupedTasks.find(t => t.text === selectedTaskFullTitle);
  if (found) {
    found.completedPomos = (found.completedPomos || 0) + 1;
    if (config.autoCheck && found.completedPomos >= found.estPomos) {
      found.completed = true;
    }
  } else {
    groups.forEach(g => {
      g.tasks.forEach(t => {
        const full = `${g.name} - ${t.text}`;
        if (full === selectedTaskFullTitle) {
          t.completedPomos = (t.completedPomos || 0) + 1;
          if (config.autoCheck && t.completedPomos >= t.estPomos) {
            t.completed = true;
          }
        }
      });
    });
  }
  if (typeof renderGroups === 'function') {
    renderGroups();
  }
}

function resetTimer() {
  isTransitioning = false;
  pauseTimer();
  timeLeft = config[currentMode] * 60;
  updateTimerDisplay();
  updateCounterDisplay();
}

function skipPhase() {
  isTransitioning = false;
  onTimerComplete();
}

function switchMode(mode) {
  isTransitioning = false;
  pauseTimer();
  currentMode = mode;
  updateTheme();
  timeLeft = config[mode] * 60;
  updateTimerDisplay();
  updateCounterDisplay();
}

const openSettingsBtn = document.getElementById('open-settings');
if (openSettingsBtn) {
  openSettingsBtn.onclick = () => {
    document.getElementById('input-pomo').value = config.pomodoro;
    document.getElementById('input-short').value = config.shortBreak;
    document.getElementById('input-long').value = config.longBreak;
    document.getElementById('input-interval').value = config.longBreakInterval;
    
    document.getElementById('input-auto-breaks').checked = config.autoBreaks;
    document.getElementById('input-auto-pomos').checked = config.autoPomos;
    document.getElementById('input-auto-check').checked = config.autoCheck;
    document.getElementById('input-check-bottom').checked = config.checkBottom;
    
    document.getElementById('input-alarm-sound').value = config.alarmSound;
    document.getElementById('input-alarm-vol').value = config.alarmVol;
    document.getElementById('input-alarm-repeat').value = config.alarmRepeat;

    document.getElementById('input-dark-running').checked = config.darkModeRunning;
    document.getElementById('picker-pomo').value = config.colorPomodoro;
    document.getElementById('picker-short').value = config.colorShort;
    document.getElementById('picker-long').value = config.colorLong;
    
    const newGif = document.getElementById('input-gif').value;
    if(newGif) {
      document.getElementById('input-gif').value = config.gifUrl;
    }

    document.getElementById('input-reminder-type').value = config.reminderType;
    document.getElementById('input-reminder-min').value = config.reminderMin;

    modal.classList.add('active');
  };
}

function closeSettings() { 
  modal.classList.remove('active'); 
}

function saveSettings() {
  config.pomodoro = parseInt(document.getElementById('input-pomo').value) || 25;
  config.shortBreak = parseInt(document.getElementById('input-short').value) || 5;
  config.longBreak = parseInt(document.getElementById('input-long').value) || 15;
  config.longBreakInterval = parseInt(document.getElementById('input-interval').value) || 4;
  
  config.autoBreaks = document.getElementById('input-auto-breaks').checked;
  config.autoPomos = document.getElementById('input-auto-pomos').checked;
  config.autoCheck = document.getElementById('input-auto-check').checked;
  config.checkBottom = document.getElementById('input-check-bottom').checked;
  
  config.alarmSound = document.getElementById('input-alarm-sound').value;
  config.alarmVol = parseInt(document.getElementById('input-alarm-vol').value) || 50;
  config.alarmRepeat = parseInt(document.getElementById('input-alarm-repeat').value) || 1;

  config.darkModeRunning = document.getElementById('input-dark-running').checked;
  config.colorPomodoro = document.getElementById('picker-pomo').value;
  config.colorShort = document.getElementById('picker-short').value;
  config.colorLong = document.getElementById('picker-long').value;

  const newGif = document.getElementById('input-gif').value;
  if(newGif && gifDisplay) {
    config.gifUrl = newGif;
    gifDisplay.src = config.gifUrl;
  }

  config.reminderType = document.getElementById('input-reminder-type').value;
  config.reminderMin = parseInt(document.getElementById('input-reminder-min').value) || 0;

  applyColors();
  closeSettings();
  switchMode(currentMode);
  if (typeof saveData === 'function') saveData();
}

// Inicialización de la aplicación
applyColors();
updateTimerDisplay();
if (typeof renderGroups === 'function') {
  renderGroups();
}
updateCounterDisplay();
requestNotificationPermission();
