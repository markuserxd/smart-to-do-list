const API_BASE_URL = "http://localhost:3000/api";

export async function fetchTasks(queryString = "") {
    const url = queryString
        ? `${API_BASE_URL}/tasks?${queryString}`
        : `${API_BASE_URL}/tasks`;

    const response = await fetch(url);

    const body = await response.json();

    if (!response.ok) {
        throw new Error(
            body.message || "Unable to retrieve tasks"
        );
    }

    return body.data;
}