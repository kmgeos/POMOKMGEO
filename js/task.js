let selectedTaskFullTitle = "";
let creatingNewGroupInline = false;
let editingTaskId = null; 

function renderGroups() {
  const groupsContainer = document.getElementById('groups-container');
  if (!groupsContainer) return;
  groupsContainer.innerHTML = '';
  const ungroupedContainer = document.getElementById('ungrouped-container');
  if (ungroupedContainer) {
    ungroupedContainer.innerHTML = '';
  }
  const selectTaskGroup = document.getElementById('select-task-group');
  if (selectTaskGroup) {
    selectTaskGroup.innerHTML = '';
    
    const optNone = document.createElement('option');
    optNone.value = "";
    optNone.textContent = "-- Sin grupo --";
    selectTaskGroup.appendChild(optNone);
    groups.forEach(group => {
      const opt = document.createElement('option');
      opt.value = group.id;
      opt.textContent = group.name;
      selectTaskGroup.appendChild(opt);
    });
    const optNew = document.createElement('option');
    optNew.value = "NEW";
    optNew.textContent = "+ Crear nuevo grupo...";
    selectTaskGroup.appendChild(optNew);
  }
  // Renderizar Grupos
  groups.forEach(group => {
    const groupEl = document.createElement('div');
    groupEl.className = 'group-item';
    const completedCount = group.tasks.filter(t => t.completed).length;
    const tasksHtml = group.tasks.map(task => {
      const fullTaskName = `${group.name} - ${task.text}`;
      const isSelected = (selectedTaskFullTitle === fullTaskName);
      return `
        <div class="task-row ${task.completed ? 'completed' : ''} ${isSelected ? 'task-active' : ''}">
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(null, ${group.id}, ${task.id})">
          <span class="task-text">${task.text}</span>
          <span class="task-meta-info">${task.completedPomos || 0}/${task.estPomos || 1} Pomo</span>
          <button class="select-task-btn ${isSelected ? 'active' : ''}" onclick="selectTaskDirectly('${escapeQuotes(fullTaskName)}')">
            ${isSelected ? '★ Activa' : 'Seleccionar'}
          </button>
          <button class="task-action-icon-btn" onclick="openEditTask(null, ${group.id}, ${task.id})" title="Editar tarea">⚙</button>
          <button class="task-action-icon-btn" onclick="deleteTask(null, ${group.id}, ${task.id})" title="Eliminar tarea">🗑</button>
        </div>
      `;
    }).join('');
    groupEl.innerHTML = `
      <div class="group-header" onclick="toggleGroup(${group.id})">
        <span style="flex: 1; cursor: pointer;">
          ${group.open ? '▼' : '▶'} ${group.name} (${completedCount}/${group.tasks.length})
        </span>
        <div style="display: flex; gap: 6px; align-items: center;" onclick="event.stopPropagation()">
          <button class="task-action-icon-btn" onclick="editGroup(${group.id})" title="Editar grupo">⚙</button>
          <button class="task-action-icon-btn" onclick="deleteGroup(${group.id})" title="Eliminar grupo">🗑</button>
        </div>
      </div>
      <div class="group-tasks ${group.open ? 'open' : ''}">
        ${tasksHtml.length > 0 ? tasksHtml : '<div style="font-size:0.8rem; opacity:0.6; padding: 5px; color: white;">No hay tareas en este grupo</div>'}
      </div>
    `;
    groupsContainer.appendChild(groupEl);
  });
  // Renderizar Tareas Sin Grupo
  if (ungroupedTasks.length > 0 && ungroupedContainer) {
    const ungroupedEl = document.createElement('div');
    ungroupedEl.className = 'group-item';
    const completedUngrouped = ungroupedTasks.filter(t => t.completed).length;
    const ungroupedTasksHtml = ungroupedTasks.map(task => {
      const fullTaskName = task.text;
      const isSelected = (selectedTaskFullTitle === fullTaskName);
      return `
        <div class="task-row ${task.completed ? 'completed' : ''} ${isSelected ? 'task-active' : ''}">
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('ungrouped', null, ${task.id})">
          <span class="task-text">${task.text}</span>
          <span class="task-meta-info">${task.completedPomos || 0}/${task.estPomos || 1} Pomo</span>
          <button class="select-task-btn ${isSelected ? 'active' : ''}" onclick="selectTaskDirectly('${escapeQuotes(fullTaskName)}')">
            ${isSelected ? '★ Activa' : 'Seleccionar'}
          </button>
          <button class="task-action-icon-btn" onclick="openEditTask('ungrouped', null, ${task.id})" title="Editar tarea">⚙</button>
          <button class="task-action-icon-btn" onclick="deleteTask('ungrouped', null, ${task.id})" title="Eliminar tarea">🗑</button>
        </div>
      `;
    }).join('');
    ungroupedEl.innerHTML = `
      <div class="group-header" style="background: rgba(0,0,0,0.25);">
        <span>▼ Tareas sin grupo (${completedUngrouped}/${ungroupedTasks.length})</span>
      </div>
      <div class="group-tasks open">
        ${ungroupedTasksHtml}
      </div>
    `;
    ungroupedContainer.appendChild(ungroupedEl);
  }
  updateTaskTitle();
  if (typeof saveData === 'function') saveData();
}

function openAddForm() {
  editingTaskId = null;
  const card = document.getElementById('dropdown-form-card');
  if (card) card.style.display = 'block';
  const taskNameInput = document.getElementById('input-task-name');
  if (taskNameInput) {
    taskNameInput.focus();
    taskNameInput.value = '';
  }
  const taskPomoInput = document.getElementById('input-task-pomo');
  if (taskPomoInput) taskPomoInput.value = '1';
  const groupContainer = document.getElementById('group-section-container');
  if (groupContainer) groupContainer.style.display = 'none';
  const newGroupContainer = document.getElementById('new-group-input-container');
  if (newGroupContainer) newGroupContainer.style.display = 'none';
  const deleteBtn = document.getElementById('btn-delete-task-trash');
  if (deleteBtn) deleteBtn.style.display = 'none';
  creatingNewGroupInline = false;
  renderGroups();
}

function openEditTask(locationType, groupId, taskId) {
  editingTaskId = taskId;
  let taskToEdit = null;
  let currentGroup = null;
  if (locationType === 'ungrouped') {
    taskToEdit = ungroupedTasks.find(t => t.id === taskId);
  } else {
    currentGroup = groups.find(g => g.id === groupId);
    if (currentGroup) {
      taskToEdit = currentGroup.tasks.find(t => t.id === taskId);
    }
  }
  if (!taskToEdit) return;
  const card = document.getElementById('dropdown-form-card');
  if (card) card.style.display = 'block';
  const taskNameInput = document.getElementById('input-task-name');
  if (taskNameInput) taskNameInput.value = taskToEdit.text;
  const taskPomoInput = document.getElementById('input-task-pomo');
  if (taskPomoInput) taskPomoInput.value = taskToEdit.estPomos || 1;
  const deleteBtn = document.getElementById('btn-delete-task-trash');
  if (deleteBtn) deleteBtn.style.display = 'block';
  const selectGroup = document.getElementById('select-task-group');
  const groupContainer = document.getElementById('group-section-container');
  if (selectGroup && groupContainer) {
    if (currentGroup) {
      selectGroup.value = currentGroup.id;
      groupContainer.style.display = 'block';
    } else {
      selectGroup.value = "";
      groupContainer.style.display = 'none';
    }
  }
  const newGroupContainer = document.getElementById('new-group-input-container');
  if (newGroupContainer) newGroupContainer.style.display = 'none';
  creatingNewGroupInline = false;
  if (taskNameInput) taskNameInput.focus();
}

function closeAddForm() {
  const card = document.getElementById('dropdown-form-card');
  if (card) card.style.display = 'none';
  editingTaskId = null;
}

function saveDropdownForm() {
  const taskNameInput = document.getElementById('input-task-name');
  const taskPomoInput = document.getElementById('input-task-pomo');
  const taskGroupSelect = document.getElementById('select-task-group');
  const newGroupNameInput = document.getElementById('input-new-group-name');
  if (!taskNameInput) return;
  const taskName = taskNameInput.value.trim();
  if (!taskName) return;
  const estPomos = taskPomoInput ? (parseInt(taskPomoInput.value) || 1) : 1;
  if (editingTaskId !== null) {
    let foundTask = null;
    ungroupedTasks = ungroupedTasks.filter(t => {
      if (t.id === editingTaskId) { foundTask = t; return false; }
      return true;
    });
    groups.forEach(g => {
      g.tasks = g.tasks.filter(t => {
        if (t.id === editingTaskId) { foundTask = t; return false; }
        return true;
      });
    });
    if (foundTask) {
      foundTask.text = taskName;
      foundTask.estPomos = estPomos;
      if (creatingNewGroupInline || (taskGroupSelect && taskGroupSelect.value === "NEW")) {
        const newGroupName = newGroupNameInput ? newGroupNameInput.value.trim() : "General";
        let targetGroup = groups.find(g => g.name.toLowerCase() === newGroupName.toLowerCase());
        if (!targetGroup) {
          targetGroup = { id: Date.now(), name: newGroupName, open: true, tasks: [] };
          groups.push(targetGroup);
        }
        targetGroup.tasks.push(foundTask);
        selectedTaskFullTitle = `${targetGroup.name} - ${foundTask.text}`;
      } else if (taskGroupSelect && taskGroupSelect.value !== "") {
        const groupId = parseInt(taskGroupSelect.value);
        let targetGroup = groups.find(g => g.id === groupId);
        if (targetGroup) {
          targetGroup.tasks.push(foundTask);
          selectedTaskFullTitle = `${targetGroup.name} - ${foundTask.text}`;
        } else {
          ungroupedTasks.push(foundTask);
          selectedTaskFullTitle = foundTask.text;
        }
      } else {
        ungroupedTasks.push(foundTask);
        selectedTaskFullTitle = foundTask.text;
      }
    }
  } else {
    const newTask = {
      id: Date.now(),
      text: taskName,
      completed: false,
      estPomos: estPomos,
      completedPomos: 0
    };
    if (creatingNewGroupInline || (taskGroupSelect && taskGroupSelect.value === "NEW")) {
      const newGroupName = newGroupNameInput ? newGroupNameInput.value.trim() : "General";
      let targetGroup = groups.find(g => g.name.toLowerCase() === newGroupName.toLowerCase());
      if (!targetGroup) {
        targetGroup = { id: Date.now(), name: newGroupName, open: true, tasks: [] };
        groups.push(targetGroup);
      }
      targetGroup.tasks.push(newTask);
      targetGroup.open = true;
      selectedTaskFullTitle = `${targetGroup.name} - ${newTask.text}`;
    } else if (taskGroupSelect && taskGroupSelect.value !== "") {
      const groupId = parseInt(taskGroupSelect.value);
      let targetGroup = groups.find(g => g.id === groupId);
      if (targetGroup) {
        targetGroup.tasks.push(newTask);
        targetGroup.open = true;
        selectedTaskFullTitle = `${targetGroup.name} - ${newTask.text}`;
      } else {
        ungroupedTasks.push(newTask);
        selectedTaskFullTitle = newTask.text;
      }
    } else {
      ungroupedTasks.push(newTask);
      selectedTaskFullTitle = newTask.text;
    }
  }
  closeAddForm();
  renderGroups();
}

function deleteCurrentEditingTask() {
  if (editingTaskId === null) return;
  ungroupedTasks = ungroupedTasks.filter(t => t.id !== editingTaskId);
  groups.forEach(g => {
    g.tasks = g.tasks.filter(t => t.id !== editingTaskId);
  });
  closeAddForm();
  renderGroups();
}

function deleteTask(locationType, groupId, taskId) {
  if (locationType === 'ungrouped') {
    ungroupedTasks = ungroupedTasks.filter(t => t.id !== taskId);
  } else {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      group.tasks = group.tasks.filter(t => t.id !== taskId);
    }
  }
  renderGroups();
}

function editGroup(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  const newName = prompt("Editar nombre del grupo:", group.name);
  if (newName !== null && newName.trim() !== "") {
    group.name = newName.trim();
    renderGroups();
  }
}

function deleteGroup(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (!group) return;
  if (confirm(`¿Estás segura de eliminar el grupo "${group.name}"? Sus tareas pasarán a "Tareas sin grupo".`)) {
    ungroupedTasks.push(...group.tasks);
    groups = groups.filter(g => g.id !== groupId);
    renderGroups();
  }
}

function adjustPomo(amount) {
  const input = document.getElementById('input-task-pomo');
  if (!input) return;
  let val = parseInt(input.value) || 1;
  val += amount;
  if (val < 1) val = 1;
  input.value = val;
}

function toggleGroupSection() {
  const groupContainer = document.getElementById('group-section-container');
  if (groupContainer) {
    groupContainer.style.display = groupContainer.style.display === 'none' ? 'block' : 'none';
  }
}

function toggleNewGroupInput() {
  const newGroupContainer = document.getElementById('new-group-input-container');
  if (!newGroupContainer) return;
  if (newGroupContainer.style.display === 'none') {
    newGroupContainer.style.display = 'block';
    creatingNewGroupInline = true;
    const inputNew = document.getElementById('input-new-group-name');
    if (inputNew) {
      inputNew.focus();
      inputNew.value = '';
    }
  } else {
    newGroupContainer.style.display = 'none';
    creatingNewGroupInline = false;
  }
}

function onGroupSelectChange(val) {
  if (val === "NEW") {
    toggleNewGroupInput();
  } else {
    creatingNewGroupInline = false;
    const newGroupContainer = document.getElementById('new-group-input-container');
    if (newGroupContainer) newGroupContainer.style.display = 'none';
  }
}

function escapeQuotes(str) {
  return str.replace(/'/g, "\\'");
}

function selectTaskDirectly(fullTaskName) {
  selectedTaskFullTitle = fullTaskName;
  renderGroups();
}

function toggleGroup(groupId) {
  const group = groups.find(g => g.id === groupId);
  if (group) { 
    group.open = !group.open; 
    renderGroups(); 
  }
}

function toggleTask(locationType, groupId, taskId) {
  let targetTask = null;
  if (locationType === 'ungrouped') {
    targetTask = ungroupedTasks.find(t => t.id === taskId);
  } else {
    const group = groups.find(g => g.id === groupId);
    if (group) {
      targetTask = group.tasks.find(t => t.id === taskId);
    }
  }

  if (targetTask) {
    targetTask.completed = !targetTask.completed;
    
    // Si se activa "Check to Bottom" en la configuración y la tarea se completó
    if (targetTask.completed && config.checkBottom) {
      if (locationType === 'ungrouped') {
        ungroupedTasks = ungroupedTasks.filter(t => t.id !== taskId);
        ungroupedTasks.push(targetTask);
      } else {
        const group = groups.find(g => g.id === groupId);
        if (group) {
          group.tasks = group.tasks.filter(t => t.id !== taskId);
          group.tasks.push(targetTask);
        }
      }
    }
    renderGroups();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  renderGroups();
});
