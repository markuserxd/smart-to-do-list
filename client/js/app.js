import { fetchTasks } from "./api.js";

import {
    renderTasks,
    showError,
    showLoading
} from "./ui.js";

async function loadTasks() {
    showLoading();

    try {
        const result = await fetchTasks(
            "page=1&limit=10&sort=newest"
        );

        renderTasks(
            result.tasks,
            result.pagination.totalItems
        );
    } catch (error) {
        console.error(error);
        showError(error.message);
    }
}

document.addEventListener("DOMContentLoaded", loadTasks);