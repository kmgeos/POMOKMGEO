// Variable para rastrear la tarea actualmente seleccionada
let selectedTaskFullTitle = "LABORAL PELICULA - Ver escena 1";

function renderGroups() {
  groupsContainer.innerHTML = '';
  groupAddSelect.innerHTML = '';
  activeTaskSelect.innerHTML = '';

  groups.forEach(group => {
    // Llenar selector de materias para crear tareas
    const optGroup = document.createElement('option');
    optGroup.value = group.id;
    optGroup.textContent = group.name;
    groupAddSelect.appendChild(optGroup);

    // Llenar selector global de tarea activa (cabecera del grupo)
    const optTaskGroup = document.createElement('option');
    optTaskGroup.value = group.name;
    optTaskGroup.textContent = `[Materia] ${group.name}`;
    activeTaskSelect.appendChild(optTaskGroup);

    // Renderizar vista de las tareas del grupo
    const groupEl = document.createElement('div');
    groupEl.className = 'group-item';
    const completedCount = group.tasks.filter(t => t.completed).length;

    const tasksHtml = group.tasks.map(task => {
      const fullTaskName = `${group.name} - ${task.text}`;
      const isSelected = (selectedTaskFullTitle === fullTaskName);

      // Agregar opción al dropdown general
      const optTask = document.createElement('option');
      optTask.value = fullTaskName;
      optTask.textContent = `  └ ${task.text}`;
      if (isSelected) optTask.selected = true;
      activeTaskSelect.appendChild(optTask);

      return `
        <div class="task-row ${task.completed ? 'completed' : ''} ${isSelected ? 'task-active' : ''}">
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${group.id}, ${task.id})">
          <span class="task-text">${task.text}</span>
          <button class="select-task-btn ${isSelected ? 'active' : ''}" onclick="selectTaskDirectly('${escapeQuotes(fullTaskName)}')">
            ${isSelected ? '★ Activa' : 'Seleccionar'}
          </button>
        </div>
      `;
    }).join('');

    groupEl.innerHTML = `
      <div class="group-header" onclick="toggleGroup(${group.id})">
        <span>${group.open ? '▼' : '▶'} ${group.name}</span>
        <small>${completedCount}/${group.tasks.length}</small>
      </div>
      <div class="group-tasks ${group.open ? 'open' : ''}">
        ${tasksHtml.length > 0 ? tasksHtml : '<div style="font-size:0.8rem; opacity:0.6; padding: 5px;">No hay tareas en esta materia</div>'}
      </div>
    `;
    groupsContainer.appendChild(groupEl);
  });

  updateTaskTitle();
}

// Función auxiliar para prevenir fallos con comillas o apóstrofes en los nombres de las tareas
function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}

// Seleccionar tarea directamente usando el botón "Seleccionar" en la lista
function selectTaskDirectly(fullTaskName) {
  selectedTaskFullTitle = fullTaskName;
  activeTaskSelect.value = fullTaskName;
  renderGroups();
}

// Cambiar tarea desde el selector desplegable superior
function onActiveTaskChange() {
  selectedTaskFullTitle = activeTaskSelect.value;
  renderGroups();
}

function toggleGroup(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (group) { group.open = !group.open; renderGroups(); }
}

function toggleTask(groupId, taskId) {
  const group = groups.find(g => g.id === groupId);
  if (group) {
    const task = group.tasks.find(t => t.id === taskId);
    if (task) { task.completed = !task.completed; renderGroups(); }
  }
}

function addGroup() {
  const input = document.getElementById('new-group-name');
  if (!input.value.trim()) return;
  groups.push({ id: Date.now(), name: input.value.trim(), open: true, tasks: [] });
  input.value = '';
  renderGroups();
}

function addTask() {
  const input = document.getElementById('new-task-name');
  const groupId = parseInt(groupAddSelect.value);
  if (!groupId || !input.value.trim()) return;
  const group = groups.find(g => g.id === groupId);
  if (group) {
    const newTask = { id: Date.now(), text: input.value.trim(), completed: false };
    group.tasks.push(newTask);
    group.open = true;
    
    // Al crear una tarea nueva, pasa a ser la seleccionada inmediatamente
    selectedTaskFullTitle = `${group.name} - ${newTask.text}`;
    
    input.value = '';
    renderGroups();
  }
}
