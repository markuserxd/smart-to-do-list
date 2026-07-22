const API_BASE_URL = "http://localhost:3000/api";

let activeController;

export async function fetchTasks(queryString = "") {
    if (activeController) {
        activeController.abort();
    }

    activeController = new AbortController();

    const url = queryString
        ? `${API_BASE_URL}/tasks?${queryString}`
        : `${API_BASE_URL}/tasks`;

    try {
        const response = await fetch(url, {
            signal: activeController.signal
        });

        const body = await response.json();

        if (!response.ok) {
            throw new Error(
                body.message || "Unable to retrieve tasks"
            );
        }

        return body.data;
    } finally {
        activeController = null;
    }
}