let currentMode = 'pomodoro'; 
let timeLeft = config.pomodoro * 60;
let timerInterval = null;
let transitionInterval = null;
let isRunning = false;
let pomodoroCount = 1;
let isTransitioning = false;

const timerDisplay = document.getElementById('timer-display');
const startBtn = document.getElementById('start-btn');
const counterDisplay = document.getElementById('pomodoro-counter');
const popover = document.getElementById('settings-popover');

function updateTimerDisplay() {
  const mins = Math.floor(timeLeft / 60);
  const secs = timeLeft % 60;
  if (timerDisplay) {
    timerDisplay.textContent = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
}

/* INCISO 3: Descripción Clara en Intervalos de Descanso */
function updateCounterDisplay() {
  if (!counterDisplay) return;
  // Si estamos en la pausa de 5 segundos, no sobrescribir la cuenta regresiva
  if (isTransitioning) return;

  if (currentMode === 'longBreak') {
    counterDisplay.textContent = "Descanso Largo";
  } else if (currentMode === 'shortBreak') {
    const totalShortBreaks = config.longBreakInterval - 1;
    counterDisplay.textContent = `Descanso Corto (${pomodoroCount} / ${totalShortBreaks})`;
  } else {
    counterDisplay.textContent = `Pomodoro #${pomodoroCount} / ${config.longBreakInterval}`;
  }
}

/* INCISO 2: Control de Tema y Modo Oscuro al Correr */
function updateTheme() {
  // Sincronizar clase de modo general
  document.body.dataset.mode = currentMode;

  // Si está corriendo y la opción de modo oscuro al activar está activa
  if (isRunning && config.darkModeRunning) {
    document.body.classList.add('dark-theme');
  } else if (!config.darkModeAlways) {
    // Si no hay un modo oscuro global permanente, remover al pausar/detener
    document.body.classList.remove('dark-theme');
  }

  // Actualizar estado visual de pestañas
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
  const activeBtn = document.getElementById(`btn-${currentMode}`);
  if (activeBtn) activeBtn.classList.add('active');
}

function toggleTimer() {
  // Reproducir siempre gatcha.mp3 al pulsar el botón Iniciar / Pausa
  const clickSound = document.getElementById('click-audio');
  if (clickSound) { 
    clickSound.src = 'assets/gatcha.mp3';
    clickSound.currentTime = 0; 
    clickSound.play().catch(e => console.log("Error al reproducir gatcha.mp3:", e)); 
  }

  // Si estamos en la pausa de 5 segundos y el usuario pulsa START, inicia inmediatamente
  if (isTransitioning) {
    clearInterval(transitionInterval);
    isTransitioning = false;
    updateCounterDisplay();
    startTimer();
    return;
  }

  if (isRunning) {
    pauseTimer();
  } else {
    startTimer();
  }
}

function startTimer() {
  clearInterval(transitionInterval);
  clearInterval(timerInterval);
  isTransitioning = false;
  isRunning = true;

  if (startBtn) startBtn.textContent = "PAUSA";
  
  // Activar modo oscuro si está configurado para ejecutarse mientras corre
  if (config.darkModeRunning) {
    document.body.classList.add('dark-theme');
  }

  timerInterval = setInterval(() => {
    if (timeLeft > 0) {
      timeLeft--;
      updateTimerDisplay();

      // Recordatorio antes de finalizar
      if (config.reminderEnabled && timeLeft === config.reminderMin * 60) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("¡Atención!", {
            body: `Te quedan ${config.reminderMin} min para finalizar el ${getModeLabel(currentMode)}.`
          });
        }
      }
    } else {
      clearInterval(timerInterval);
      onTimerComplete();
    }
  }, 1000);
}

function pauseTimer() {
  clearInterval(timerInterval);
  clearInterval(transitionInterval);
  isRunning = false;
  isTransitioning = false;
  if (startBtn) startBtn.textContent = "INICIAR";
  
  // Desactivar modo oscuro al pausar si dependía del temporizador
  if (config.darkModeRunning && !config.darkModeAlways) {
    document.body.classList.remove('dark-theme');
  }
}

function onTimerComplete() {
  clearInterval(timerInterval);
  isRunning = false;

  if (config.darkModeRunning && !config.darkModeAlways) {
    document.body.classList.remove('dark-theme');
  }

  // Incrementar +1 Pomodoro a la tarea activa únicamente si se completó un ciclo de trabajo
  if (currentMode === 'pomodoro') {
    if (typeof incrementActiveTaskPomo === 'function') {
      incrementActiveTaskPomo();
    }
  }

  // Reproducir la Alarma seleccionada en la configuración
  const alarmSound = document.getElementById('alarm-audio');
  if (alarmSound) {
    alarmSound.src = `assets/${config.alarmSound}`;
    alarmSound.currentTime = 0;
    alarmSound.play().catch(e => console.log("Error al reproducir la alarma:", e));
  }

  // Notificación del sistema
  if ("Notification" in window && Notification.permission === "granted") {
    if (currentMode === 'pomodoro') {
      new Notification("¡Pomodoro Finalizado! ⏱️", { body: "Tómate un descanso bien merecido." });
    } else {
      new Notification("¡Descanso Finalizado! 🚀", { body: "Hora de volver a concentrarse." });
    }
  }

  // Calcular siguiente modo de trabajo o descanso
  let nextMode = 'pomodoro';
  if (currentMode === 'pomodoro') {
    nextMode = (pomodoroCount >= config.longBreakInterval) ? 'longBreak' : 'shortBreak';
  } else if (currentMode === 'shortBreak') {
    pomodoroCount++;
    nextMode = 'pomodoro';
  } else {
    pomodoroCount = 1;
    nextMode = 'pomodoro';
  }

  // Transición de modo
  currentMode = nextMode;
  updateTheme();
  timeLeft = config[nextMode] * 60;
  updateTimerDisplay();

  // Verificar si aplica el Auto Start
  const shouldAutoStart = (nextMode.includes('Break') && config.autoBreaks) || 
                          (nextMode === 'pomodoro' && config.autoPomos);

  if (shouldAutoStart) {
    startAutoStartCountdown();
  } else {
    if (startBtn) startBtn.textContent = "INICIAR";
    updateCounterDisplay();
  }
}

// Cuenta regresiva suave de 5 segundos para automáticos
function startAutoStartCountdown() {
  clearInterval(transitionInterval);
  isTransitioning = true;
  let secondsRemaining = 5;

  if (counterDisplay) {
    counterDisplay.textContent = `Siguiente intervalo inicia en ${secondsRemaining}s...`;
  }
  if (startBtn) {
    startBtn.textContent = "INICIAR YA";
  }

  transitionInterval = setInterval(() => {
    secondsRemaining--;
    if (secondsRemaining > 0) {
      if (counterDisplay) {
        counterDisplay.textContent = `Siguiente intervalo inicia en ${secondsRemaining}s...`;
      }
    } else {
      clearInterval(transitionInterval);
      isTransitioning = false;
      updateCounterDisplay();
      startTimer();
    }
  }, 1000);
}

function resetTimer() {
  pauseTimer();
  timeLeft = config[currentMode] * 60;
  updateTimerDisplay();
  updateCounterDisplay();
}

function skipPhase() {
  pauseTimer();
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

function getModeLabel(mode) {
  switch (mode) {
    case 'pomodoro': return 'Pomodoro';
    case 'shortBreak': return 'Descanso Corto';
    case 'longBreak': return 'Descanso Largo';
    default: return 'Intervalo';
  }
}

/* FUNCIONES DE CONFIGURACIÓN */
function changeTimeInput(inputId, delta) {
  const input = document.getElementById(inputId);
  if (!input) return;
  let val = parseInt(input.value) || 0;
  val = Math.max(1, val + delta);
  input.value = val;
  saveCurrentSettings();
}

function previewAlarmSound(filename) {
  const alarmSound = document.getElementById('alarm-audio');
  if (alarmSound) {
    alarmSound.src = `assets/${filename}`;
    alarmSound.currentTime = 0;
    alarmSound.play().catch(e => console.log("Error al previsualizar:", e));
  }
  saveCurrentSettings();
}

function loadSettingsToUI() {
  if (document.getElementById('input-pomo')) document.getElementById('input-pomo').value = config.pomodoro;
  if (document.getElementById('input-short')) document.getElementById('input-short').value = config.shortBreak;
  if (document.getElementById('input-long')) document.getElementById('input-long').value = config.longBreak;
  if (document.getElementById('input-interval')) document.getElementById('input-interval').value = config.longBreakInterval;
  if (document.getElementById('input-auto-breaks')) document.getElementById('input-auto-breaks').checked = config.autoBreaks;
  if (document.getElementById('input-auto-pomos')) document.getElementById('input-auto-pomos').checked = config.autoPomos;
  if (document.getElementById('input-reminder')) document.getElementById('input-reminder').checked = config.reminderEnabled;
  if (document.getElementById('input-reminder-min')) document.getElementById('input-reminder-min').value = config.reminderMin;
  if (document.getElementById('input-alarm-sound')) document.getElementById('input-alarm-sound').value = config.alarmSound;
  if (document.getElementById('input-dark-running')) document.getElementById('input-dark-running').checked = config.darkModeRunning;
}

function saveCurrentSettings() {
  config.pomodoro = parseInt(document.getElementById('input-pomo')?.value) || 25;
  config.shortBreak = parseInt(document.getElementById('input-short')?.value) || 5;
  config.longBreak = parseInt(document.getElementById('input-long')?.value) || 15;
  config.longBreakInterval = parseInt(document.getElementById('input-interval')?.value) || 4;
  config.autoBreaks = document.getElementById('input-auto-breaks')?.checked ?? false;
  config.autoPomos = document.getElementById('input-auto-pomos')?.checked ?? false;
  config.reminderEnabled = document.getElementById('input-reminder')?.checked ?? false;
  config.reminderMin = parseInt(document.getElementById('input-reminder-min')?.value) || 1;
  config.alarmSound = document.getElementById('input-alarm-sound')?.value || 'alarm_clock.mp3';
  config.darkModeRunning = document.getElementById('input-dark-running')?.checked ?? false;

  if (!isRunning && !isTransitioning) {
    timeLeft = config[currentMode] * 60;
    updateTimerDisplay();
  }
  updateCounterDisplay();

  // Guardar en localStorage a través de data.js
  if (typeof saveData === 'function') {
    saveData();
  }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  const btnPomo = document.getElementById('btn-pomodoro');
  const btnShort = document.getElementById('btn-shortBreak');
  const btnLong = document.getElementById('btn-longBreak');

  if (btnPomo) btnPomo.addEventListener('click', () => switchMode('pomodoro'));
  if (btnShort) btnShort.addEventListener('click', () => switchMode('shortBreak'));
  if (btnLong) btnLong.addEventListener('click', () => switchMode('longBreak'));

  if (startBtn) startBtn.addEventListener('click', toggleTimer);

  document.getElementById('btn-restart')?.addEventListener('click', resetTimer);
  document.getElementById('btn-skip')?.addEventListener('click', skipPhase);

  const openSettingsBtn = document.getElementById('open-settings');
  if (openSettingsBtn && popover) {
    openSettingsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      loadSettingsToUI();
      popover.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!popover.contains(e.target) && e.target !== openSettingsBtn) {
        popover.classList.remove('active');
      }
    });
  }

  document.querySelectorAll('#settings-popover input, #settings-popover select').forEach(elem => {
    elem.addEventListener('change', saveCurrentSettings);
  });

  loadSettingsToUI();
  updateTheme();
  updateTimerDisplay();
  updateCounterDisplay();
});
