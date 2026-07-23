const taskList = document.querySelector("#task-list");
const statusMessage = document.querySelector("#status-message");
const taskCount = document.querySelector("#task-count");
const toast = document.querySelector("#toast");

function formatDeadline(deadline) {
    if (!deadline) {
        return "No deadline";
    }

    const date = new Date(`${deadline}T00:00:00`);

    return new Intl.DateTimeFormat("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }).format(date);
}

function getPriorityClass(priority) {
    return `priority-${priority.toLowerCase()}`;
}

function createTaskCard(task) {
    const article = document.createElement("article");

    article.className = task.completed
        ? "task-card completed"
        : "task-card";

    article.dataset.taskId = task.id;

    const checkbox = document.createElement("input");
    checkbox.className = "task-checkbox";
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(task.completed);
    checkbox.dataset.action = "toggle-complete";
    checkbox.dataset.taskId = String(task.id);
    checkbox.setAttribute(
        "aria-label",
        `Mark ${task.title} as complete`
    );

    const content = document.createElement("div");
    content.className = "task-content";

    const title = document.createElement("h3");
    title.className = "task-title";
    title.textContent = task.title;

    const description = document.createElement("p");
    description.className = "task-description";
    description.textContent =
        task.description || "No description provided.";

    const meta = document.createElement("div");
    meta.className = "task-meta";

    const priority = document.createElement("span");
    priority.className =
        `badge ${getPriorityClass(task.priority)}`;
    priority.textContent = task.priority;

    const deadline = document.createElement("span");
    deadline.className = "badge";
    deadline.textContent = formatDeadline(task.deadline);

    meta.append(priority, deadline);
    content.append(title, description, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";

    const editButton = document.createElement("button");
    editButton.className = "icon-button";
    editButton.type = "button";
    editButton.textContent = "Edit";
    editButton.dataset.action = "edit";

    const deleteButton = document.createElement("button");

    deleteButton.className = "icon-button delete-button";
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";
    deleteButton.dataset.action = "delete";
    deleteButton.dataset.taskId = String(task.id);
    deleteButton.dataset.taskTitle = task.title;

    deleteButton.setAttribute(
        "aria-label",
        `Delete ${task.title}`
    );

    actions.append(editButton, deleteButton);
    article.append(checkbox, content, actions);

    return article;
}

export function showLoading() {
    taskList.replaceChildren();

    statusMessage.hidden = false;
    statusMessage.className = "status-message";
    statusMessage.textContent = "Loading tasks...";
}

export function showError(message) {
    taskList.replaceChildren();

    statusMessage.hidden = false;
    statusMessage.className = "status-message error";
    statusMessage.textContent = message;

    taskCount.textContent = "0 tasks";
}

export function renderTasks(tasks, totalItems = tasks.length) {
    taskList.replaceChildren();

    taskCount.textContent =
        `${totalItems} ${totalItems === 1 ? "task" : "tasks"}`;

    if (tasks.length === 0) {
        statusMessage.hidden = false;
        statusMessage.className = "status-message";
        statusMessage.textContent =
            "No tasks found. Create your first task.";
        return;
    }

    statusMessage.hidden = true;

    const fragment = document.createDocumentFragment();

    tasks.forEach((task) => {
        fragment.append(createTaskCard(task));
    });

    taskList.append(fragment);
}

let toastTimeoutId;

export function showToast(
    message,
    type = "success",
    duration = 3000
) {
    clearTimeout(toastTimeoutId);

    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.hidden = false;

    toastTimeoutId = setTimeout(() => {
        toast.hidden = true;
    }, duration);
}