import { createTask, deleteTask, fetchTasks, toggleTaskComplete } from "./api.js";
import { renderTasks, showError, showLoading, showToast } from "./ui.js";

const searchInput = document.querySelector("#search-input");
const statusFilter = document.querySelector("#status-filter");
const priorityFilter = document.querySelector("#priority-filter");
const sortSelect = document.querySelector("#sort-select");

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

        renderTasks(
            result.tasks,
            result.pagination.totalItems
        );
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

    submitTaskButton.disabled = true;
    submitTaskButton.textContent = "Adding...";

    formError.hidden = true;
    formError.textContent = "";

    try {
        const taskData = getTaskFormData();

        await createTask(taskData);

        closeTaskModal();

        taskQuery.page = 1;
        await loadTasks();
    } catch (error) {
        console.error(error);

        formError.hidden = false;

        formError.textContent =
            error.message === "Failed to fetch"
                ? "Unable to connect to the server."
                : error.message;
    } finally {
        submitTaskButton.disabled = false;
        submitTaskButton.textContent = "Add Task";
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

    taskQuery.search = "";
    taskQuery.status = "";
    taskQuery.priority = "";
    taskQuery.sort = "newest";
    taskQuery.page = 1;

    loadTasks();
}

function resetTaskForm() {
    taskForm.reset();

    taskPriorityInput.value = "Medium";
    titleError.textContent = "";

    formError.hidden = true;
    formError.textContent = "";

    taskTitleInput.removeAttribute("aria-invalid");
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