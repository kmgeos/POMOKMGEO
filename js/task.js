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

    // Renderizar vista de la materia
    const groupEl = document.createElement('div');
    groupEl.className = 'group-item';
    const completedCount = group.tasks.filter(t => t.completed).length;

    groupEl.innerHTML = `
      <div class="group-header" onclick="toggleGroup(${group.id})">
        <span>${group.open ? '▼' : '▶'} ${group.name}</span>
        <small>${completedCount}/${group.tasks.length}</small>
      </div>
      <div class="group-tasks ${group.open ? 'open' : ''}">
        ${group.tasks.map(task => `
          <div class="task-row ${task.completed ? 'completed' : ''}">
            <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${group.id}, ${task.id})">
            <span>${task.text}</span>
          </div>
        `).join('')}
      </div>
    `;
    groupsContainer.appendChild(groupEl);

    // Llenar selector global de tarea activa
    const optTaskGroup = document.createElement('option');
    optTaskGroup.value = group.name;
    optTaskGroup.textContent = `[Materia] ${group.name}`;
    activeTaskSelect.appendChild(optTaskGroup);

    group.tasks.forEach(task => {
      const optTask = document.createElement('option');
      optTask.value = `${group.name} - ${task.text}`;
      optTask.textContent = `  └ ${task.text}`;
      activeTaskSelect.appendChild(optTask);
    });
  });

  updateTaskTitle();
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
    group.tasks.push({ id: Date.now(), text: input.value.trim(), completed: false });
    group.open = true;
    input.value = '';
    renderGroups();
  }
}
