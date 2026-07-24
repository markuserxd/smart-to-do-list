import { createTask, deleteTask, fetchTasks, toggleTaskComplete, updateTask } from "./api.js";
import { renderPagination, renderTasks, showError, showLoading, showToast } from "./ui.js";

let editingTaskId = null;
let currentTasks = [];

let currentPagination = {
    page: 1,
    limit: 10,
    totalItems: 0,
    totalPages: 0
};

const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const priorityFilter = document.querySelector("#priority-filter");
const sortSelect = document.querySelector("#sort-select");
const pagination = document.querySelector("#pagination");
const limitSelect = document.querySelector("#limit-select");

const taskQuery = {
    search: "",
    status: "",
    priority: "",
    sort: "newest",
    page: 1,
    limit: 10
};

function buildQueryString() {
    const params = new URLSearchParams();

    if (taskQuery.search) {
        params.set("search", taskQuery.search);
    }

    if (taskQuery.status) {
        params.set("status", taskQuery.status);
    }

    if (taskQuery.priority) {
        params.set("priority", taskQuery.priority);
    }

    if (taskQuery.sort) {
        params.set("sort", taskQuery.sort);
    }

    params.set("page", taskQuery.page);
    params.set("limit", taskQuery.limit);

    return params.toString();
}

async function loadTasks({ showLoadingState = true } = {}) {
    if (showLoadingState) {
        showLoading();
    }

    try {
        const result = await fetchTasks(buildQueryString());
        currentTasks = result.tasks;
        currentPagination = result.pagination;

        renderTasks(
            result.tasks,
            result.pagination.totalItems
        );

        renderPagination(result.pagination);

    } catch (error) {
        if (error.name === "AbortError") {
            return;
        }

        console.error(error);

        if (showLoadingState) {
            showError(
                error.message === "Failed to fetch"
                    ? "Unable to connect to the server."
                    : error.message
            );
        } else {
            showToast(
                error.message === "Failed to fetch"
                    ? "Unable to connect to the server."
                    : error.message,
                "error"
            );
        }
    }
}

async function handleTaskSubmit(event) {
    event.preventDefault();

    if (!validateTaskForm()) {
        return;
    }

    const taskId = editingTaskId;
    const isEditing = taskId !== null;

    submitTaskButton.disabled = true;
    submitTaskButton.textContent = isEditing
        ? "Saving..."
        : "Adding...";

    formError.hidden = true;
    formError.textContent = "";

    try {
        const taskData = getTaskFormData();

        if (isEditing) {
            await updateTask(taskId, taskData);
            showToast("Task updated successfully");
        } else {
            await createTask(taskData);
            taskQuery.page = 1;
            showToast("Task created successfully");
        }

        closeTaskModal();

        await loadTasks({
            showLoadingState: false
        });
    } catch (error) {
        console.error(error);

        formError.hidden = false;

        formError.textContent =
            error.message === "Failed to fetch"
                ? "Unable to connect to the server."
                : error.message;
    } finally {
        submitTaskButton.disabled = false;

        if (!taskModal.hidden) {
            submitTaskButton.textContent = isEditing
                ? "Save Changes"
                : "Add Task";
        }
    }
}

async function handleTaskListChange(event) {
    const checkbox = event.target.closest(
        '[data-action="toggle-complete"]'
    );

    if (!checkbox) {
        return;
    }

    const taskId = Number(checkbox.dataset.taskId);

    if (!Number.isInteger(taskId)) {
        return;
    }

    const previousCheckedState = !checkbox.checked;

    checkbox.disabled = true;

    try {
        const updatedTask = await toggleTaskComplete(taskId);

        showToast(
            updatedTask.completed
                ? "Task marked as completed"
                : "Task marked as pending"
        );

        await loadTasks();
    } catch (error) {
        console.error(error);

        checkbox.checked = previousCheckedState;

        showToast(
            error.message === "Failed to fetch"
                ? "Unable to connect to the server."
                : error.message,
            "error"
        );
    } finally {
        checkbox.disabled = false;
    }
}

async function handleDeleteConfirm() {
    if (!selectedTaskForDelete) {
        return;
    }

    const taskId = selectedTaskForDelete.id;

    confirmDeleteButton.disabled = true;
    confirmDeleteButton.textContent = "Deleting...";

    try {
        await deleteTask(taskId);

        const remainingItems = Math.max(
            currentPagination.totalItems - 1,
            0
        );

        const remainingPages = Math.max(
            Math.ceil(remainingItems / taskQuery.limit),
            1
        );

        if (taskQuery.page > remainingPages) {
            taskQuery.page = remainingPages;
        }

        closeDeleteModal();

        showToast("Task deleted successfully");

        await loadTasks({
            showLoadingState: false
        });
    } catch (error) {
        console.error(error);

        showToast(
            error.message === "Failed to fetch"
                ? "Unable to connect to the server."
                : error.message,
            "error"
        );
    } finally {
        confirmDeleteButton.disabled = false;
        confirmDeleteButton.textContent = "Delete Task";
    }
}

function debounce(callback, delay = 400) {
    let timeoutId;

    return (...args) => {
        clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            callback(...args);
        }, delay);
    };
}

function handleFilterChange() {
    taskQuery.status = statusFilter.value;
    taskQuery.priority = priorityFilter.value;
    taskQuery.sort = sortSelect.value;
    taskQuery.page = 1;

    loadTasks();
}

function resetFilters() {
    searchInput.value = "";
    statusFilter.value = "";
    priorityFilter.value = "";
    sortSelect.value = "newest";
    limitSelect.value = "10";

    taskQuery.search = "";
    taskQuery.status = "";
    taskQuery.priority = "";
    taskQuery.sort = "newest";
    taskQuery.page = 1;
    taskQuery.limit = 10;

    loadTasks();
}

function resetTaskForm() {
    taskForm.reset();

    editingTaskId = null;

    taskModalEyebrow.textContent = "New task";
    taskModalTitle.textContent = "Add Task";

    taskPriorityInput.value = "Medium";
    titleError.textContent = "";

    formError.hidden = true;
    formError.textContent = "";

    taskTitleInput.removeAttribute("aria-invalid");

    document.querySelector("#task-modal-title")
        .textContent = "Add Task";

    submitTaskButton.textContent = "Add Task";
}

function openTaskModal() {
    resetTaskForm();

    taskModal.hidden = false;
    document.body.classList.add("modal-open");

    requestAnimationFrame(() => {
        taskTitleInput.focus();
    });
}

function closeTaskModal() {
    taskModal.hidden = true;
    document.body.classList.remove("modal-open");

    resetTaskForm();
    addTaskButton.focus();
}

function validateTaskForm() {
    const title = taskTitleInput.value.trim();

    titleError.textContent = "";
    taskTitleInput.removeAttribute("aria-invalid");

    if (!title) {
        titleError.textContent = "Title is required.";
        taskTitleInput.setAttribute("aria-invalid", "true");
        taskTitleInput.focus();

        return false;
    }

    if (title.length > 100) {
        titleError.textContent =
            "Title must not exceed 100 characters.";

        taskTitleInput.setAttribute("aria-invalid", "true");
        taskTitleInput.focus();

        return false;
    }

    return true;
}

function getTaskFormData() {
    return {
        title: taskTitleInput.value.trim(),

        description:
            taskDescriptionInput.value.trim() || null,

        priority: taskPriorityInput.value,

        deadline: taskDeadlineInput.value || null
    };
}

let selectedTaskForDelete = null;

function openDeleteModal(taskId, taskTitle) {
    selectedTaskForDelete = {
        id: taskId,
        title: taskTitle
    };

    deleteModalMessage.textContent =
        `Are you sure you want to delete "${taskTitle}"? ` +
        "This action cannot be undone.";

    deleteModal.hidden = false;
    document.body.classList.add("modal-open");

    requestAnimationFrame(() => {
        cancelDeleteButton.focus();
    });
}

function closeDeleteModal() {
    deleteModal.hidden = true;
    document.body.classList.remove("modal-open");

    selectedTaskForDelete = null;
}

function handleTaskListClick(event) {
    const editButton = event.target.closest(
        '[data-action="edit"]'
    );

    if (editButton) {
        const taskId = Number(editButton.dataset.taskId);

        const task = currentTasks.find(
            (item) => item.id === taskId
        );

        if (!task) {
            showToast("Task could not be found.", "error");
            return;
        }

        openEditTaskModal(task);
        return;
    }

    const deleteButton = event.target.closest(
        '[data-action="delete"]'
    );

    if (!deleteButton) {
        return;
    }

    const taskId = Number(deleteButton.dataset.taskId);

    const taskTitle =
        deleteButton.dataset.taskTitle || "this task";

    if (!Number.isInteger(taskId)) {
        return;
    }

    openDeleteModal(taskId, taskTitle);
}

function openEditTaskModal(task) {
    resetTaskForm();

    editingTaskId = task.id;

    taskTitleInput.value = task.title;
    taskDescriptionInput.value = task.description || "";
    taskPriorityInput.value = task.priority;
    taskDeadlineInput.value = task.deadline || "";
    taskModalEyebrow.textContent = "Update task";
    taskModalTitle.textContent = "Edit Task";

    submitTaskButton.textContent = "Save Changes";

    taskModal.hidden = false;
    document.body.classList.add("modal-open");

    requestAnimationFrame(() => {
        taskTitleInput.focus();
        taskTitleInput.select();
    });
}

function handlePaginationClick(event) {
    const button = event.target.closest(
        "[data-page]"
    );

    if (!button || button.disabled) {
        return;
    }

    const page = Number(button.dataset.page);

    if (
        !Number.isInteger(page) ||
        page < 1 ||
        page > currentPagination.totalPages
    ) {
        return;
    }

    taskQuery.page = page;

    loadTasks();

    document.querySelector(".task-section")
        .scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
}

const handleSearch = debounce(() => {
    taskQuery.search = searchInput.value.trim();
    taskQuery.page = 1;

    loadTasks();
});

const resetFiltersButton = document.querySelector(
    "#reset-filters-button"
);

const addTaskButton = document.querySelector(
    "#add-task-button"
);

const taskModal = document.querySelector("#task-modal");
const closeModalButton = document.querySelector(
    "#close-modal-button"
);

const cancelTaskButton = document.querySelector(
    "#cancel-task-button"
);

const taskForm = document.querySelector("#task-form");
const taskTitleInput = document.querySelector("#task-title");
const taskDescriptionInput = document.querySelector(
    "#task-description"
);

const taskPriorityInput = document.querySelector(
    "#task-priority"
);

const taskDeadlineInput = document.querySelector(
    "#task-deadline"
);

const titleError = document.querySelector("#title-error");
const formError = document.querySelector("#form-error");

const submitTaskButton = document.querySelector(
    "#submit-task-button"
);

const taskList = document.querySelector("#task-list");

const deleteModal = document.querySelector(
    "#delete-modal"
);

const deleteModalMessage = document.querySelector(
    "#delete-modal-message"
);

const cancelDeleteButton = document.querySelector(
    "#cancel-delete-button"
);

const confirmDeleteButton = document.querySelector(
    "#confirm-delete-button"
);

const taskModalEyebrow = document.querySelector(
    "#task-modal-eyebrow"
);

const taskModalTitle = document.querySelector(
    "#task-modal-title"
);

statusFilter.addEventListener("change", handleFilterChange);
priorityFilter.addEventListener("change", handleFilterChange);
sortSelect.addEventListener("change", handleFilterChange);
searchInput.addEventListener("input", handleSearch);
resetFiltersButton.addEventListener("click", resetFilters);
addTaskButton.addEventListener("click", openTaskModal);
closeModalButton.addEventListener("click", closeTaskModal);
cancelTaskButton.addEventListener("click", closeTaskModal);
taskList.addEventListener("change", handleTaskListChange);
taskList.addEventListener("click", handleTaskListClick);
cancelDeleteButton.addEventListener("click", closeDeleteModal);
confirmDeleteButton.addEventListener("click", handleDeleteConfirm);
pagination.addEventListener("click", handlePaginationClick);

deleteModal.addEventListener("click", (event) => {
    if (
        event.target.matches(
            "[data-delete-modal-close]"
        )
    ) {
        closeDeleteModal();
    }
});

taskModal.addEventListener("click", (event) => {
    if (event.target.matches("[data-modal-close]")) {
        closeTaskModal();
    }
});

taskForm.addEventListener("submit", handleTaskSubmit);

limitSelect.addEventListener("change", () => {
    taskQuery.limit = Number(limitSelect.value);
    taskQuery.page = 1;

    loadTasks();
});

document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") {
        return;
    }

    if (!taskModal.hidden) {
        closeTaskModal();
        return;
    }

    if (!deleteModal.hidden) {
        closeDeleteModal();
    }
});

document.addEventListener("DOMContentLoaded", loadTasks);