import { fetchTasks } from "./api.js";

import {
    renderTasks,
    showError,
    showLoading
} from "./ui.js";

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

async function loadTasks() {
    showLoading();

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

        showError(
            error.message === "Failed to fetch"
                ? "Unable to connect to the server."
                : error.message
        );
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

const handleSearch = debounce(() => {
    taskQuery.search = searchInput.value.trim();
    taskQuery.page = 1;

    loadTasks();
});

const resetFiltersButton = document.querySelector(
    "#reset-filters-button"
);

statusFilter.addEventListener("change", handleFilterChange);
priorityFilter.addEventListener("change", handleFilterChange);
sortSelect.addEventListener("change", handleFilterChange);
searchInput.addEventListener("input", handleSearch);
resetFiltersButton.addEventListener("click", resetFilters);

document.addEventListener("DOMContentLoaded", loadTasks);