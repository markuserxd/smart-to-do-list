const taskList = document.querySelector("#task-list");
const statusMessage = document.querySelector("#status-message");
const taskCount = document.querySelector("#task-count");
const toast = document.querySelector("#toast");
const pagination = document.querySelector("#pagination");
const previousPageButton = document.querySelector("#previous-page-button");
const nextPageButton = document.querySelector("#next-page-button");
const pageButtons = document.querySelector("#page-buttons");

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
    editButton.dataset.taskId = String(task.id);

    editButton.setAttribute(
        "aria-label",
        `Edit ${task.title}`
    );

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

function createPageButton(page, currentPage) {
    const button = document.createElement("button");

    button.className = "page-number-button";
    button.type = "button";
    button.textContent = String(page);
    button.dataset.page = String(page);

    if (page === currentPage) {
        button.classList.add("active");
        button.setAttribute("aria-current", "page");
        button.disabled = true;
    }

    button.setAttribute(
        "aria-label",
        page === currentPage
            ? `Current page, page ${page}`
            : `Go to page ${page}`
    );

    return button;
}

function createEllipsis() {
    const span = document.createElement("span");

    span.className = "pagination-ellipsis";
    span.textContent = "…";
    span.setAttribute("aria-hidden", "true");

    return span;
}

function getVisiblePages(currentPage, totalPages) {
    if (totalPages <= 7) {
        return Array.from(
            { length: totalPages },
            (_, index) => index + 1
        );
    }

    const pages = [1];

    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(
        totalPages - 1,
        currentPage + 1
    );

    if (startPage > 2) {
        pages.push("ellipsis-start");
    }

    for (
        let page = startPage;
        page <= endPage;
        page += 1
    ) {
        pages.push(page);
    }

    if (endPage < totalPages - 1) {
        pages.push("ellipsis-end");
    }

    pages.push(totalPages);

    return pages;
}

export function showLoading() {
    taskList.replaceChildren();
    pagination.hidden = true;

    statusMessage.hidden = false;
    statusMessage.className = "status-message";
    statusMessage.textContent = "Loading tasks...";
}

export function showError(message) {
    taskList.replaceChildren();
    pagination.hidden = true;

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
        pagination.hidden = true;

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

export function renderPagination(paginationData) {
    const {
        page,
        totalPages
    } = paginationData;

    pageButtons.replaceChildren();

    if (totalPages <= 1) {
        pagination.hidden = true;
        return;
    }

    pagination.hidden = false;

    previousPageButton.disabled = page <= 1;
    nextPageButton.disabled = page >= totalPages;

    previousPageButton.dataset.page = String(page - 1);
    nextPageButton.dataset.page = String(page + 1);

    const visiblePages = getVisiblePages(
        page,
        totalPages
    );

    const fragment = document.createDocumentFragment();

    visiblePages.forEach((item) => {
        if (
            item === "ellipsis-start" ||
            item === "ellipsis-end"
        ) {
            fragment.append(createEllipsis());
            return;
        }

        fragment.append(
            createPageButton(item, page)
        );
    });

    pageButtons.append(fragment);
}