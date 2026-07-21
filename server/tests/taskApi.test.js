const request = require("supertest");
const app = require("../app");

async function createTask(overrides = {}) {
    const taskData = {
        title: "Test task",
        description: "Task created during automated testing",
        priority: "Medium",
        deadline: "2026-08-10",
        ...overrides
    };

    const response = await request(app)
        .post("/api/tasks")
        .send(taskData)
        .expect(201);

    return response.body.data;
}

describe("Smart To-Do API", () => {
    describe("GET /", () => {
        test("should return API status", async () => {
            const response = await request(app)
                .get("/")
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Smart To-Do API is running"
            });
        });
    });

    describe("POST /api/tasks", () => {
        test("should create a task", async () => {
            const taskData = {
                title: "Learn automated testing",
                description: "Practice Jest and Supertest",
                priority: "High",
                deadline: "2026-08-01"
            };

            const response = await request(app)
                .post("/api/tasks")
                .send(taskData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                "Task created successfully"
            );

            expect(response.body.data).toEqual(
                expect.objectContaining({
                    id: 1,
                    title: taskData.title,
                    description: taskData.description,
                    priority: taskData.priority,
                    deadline: taskData.deadline,
                    completed: 0
                })
            );
        });

        test("should reject an empty title", async () => {
            const response = await request(app)
                .post("/api/tasks")
                .send({
                    title: "   ",
                    priority: "High"
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Title is required"
            });
        });

        test("should reject an invalid priority", async () => {
            const response = await request(app)
                .post("/api/tasks")
                .send({
                    title: "Test validation",
                    priority: "Urgent"
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Priority must be Low, Medium, or High"
            });
        });
    });

    describe("GET /api/tasks", () => {
        test("should return an empty task list", async () => {
            const response = await request(app)
                .get("/api/tasks")
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                "Tasks retrieved successfully"
            );

            expect(response.body.data.tasks).toEqual([]);

            expect(response.body.data.pagination).toEqual({
                page: 1,
                limit: 10,
                totalItems: 0,
                totalPages: 0
            });
        });

        test("should return created tasks", async () => {
            await createTask({
                title: "First task"
            });

            await createTask({
                title: "Second task"
            });

            const response = await request(app)
                .get("/api/tasks")
                .expect(200);

            expect(response.body.data.tasks).toHaveLength(2);
            expect(response.body.data.pagination.totalItems).toBe(2);
        });
    });

    describe("GET /api/tasks/:id", () => {
        test("should return a task by ID", async () => {
            const createdTask = await createTask({
                title: "Read task by ID"
            });

            const response = await request(app)
                .get(`/api/tasks/${createdTask.id}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                "Task retrieved successfully"
            );

            expect(response.body.data).toEqual(
                expect.objectContaining({
                    id: createdTask.id,
                    title: "Read task by ID",
                    completed: 0
                })
            );
        });

        test("should reject an invalid task ID", async () => {
            const response = await request(app)
                .get("/api/tasks/abc")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Invalid task ID"
            });
        });

        test("should return 404 when task does not exist", async () => {
            const response = await request(app)
                .get("/api/tasks/99999")
                .expect(404);

            expect(response.body).toEqual({
                success: false,
                message: "Task not found"
            });
        });
    });

    describe("PUT /api/tasks/:id", () => {
        test("should update an existing task", async () => {
            const createdTask = await createTask();

            const updateData = {
                title: "Updated task",
                description: "Updated description",
                priority: "High",
                deadline: "2026-08-20"
            };

            const response = await request(app)
                .put(`/api/tasks/${createdTask.id}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                "Task updated successfully"
            );

            expect(response.body.data).toEqual(
                expect.objectContaining({
                    id: createdTask.id,
                    title: updateData.title,
                    description: updateData.description,
                    priority: updateData.priority,
                    deadline: updateData.deadline
                })
            );
        });

        test("should reject update with an empty title", async () => {
            const createdTask = await createTask();

            const response = await request(app)
                .put(`/api/tasks/${createdTask.id}`)
                .send({
                    title: "   ",
                    priority: "High"
                })
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Title is required"
            });
        });

        test("should return 404 when updating a missing task", async () => {
            const response = await request(app)
                .put("/api/tasks/99999")
                .send({
                    title: "Missing task",
                    priority: "Medium"
                })
                .expect(404);

            expect(response.body).toEqual({
                success: false,
                message: "Task not found"
            });
        });
    });

    describe("PATCH /api/tasks/:id/complete", () => {
        test("should mark a pending task as completed", async () => {
            const createdTask = await createTask();

            const response = await request(app)
                .patch(`/api/tasks/${createdTask.id}/complete`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.message).toBe(
                "Task marked as completed"
            );

            expect(response.body.data.completed).toBe(1);
        });

        test("should mark a completed task as pending", async () => {
            const createdTask = await createTask();

            await request(app)
                .patch(`/api/tasks/${createdTask.id}/complete`)
                .expect(200);

            const response = await request(app)
                .patch(`/api/tasks/${createdTask.id}/complete`)
                .expect(200);

            expect(response.body.message).toBe(
                "Task marked as pending"
            );

            expect(response.body.data.completed).toBe(0);
        });

        test("should return 404 when toggling a missing task", async () => {
            const response = await request(app)
                .patch("/api/tasks/99999/complete")
                .expect(404);

            expect(response.body).toEqual({
                success: false,
                message: "Task not found"
            });
        });
    });

    describe("DELETE /api/tasks/:id", () => {
        test("should delete an existing task", async () => {
            const createdTask = await createTask();

            const response = await request(app)
                .delete(`/api/tasks/${createdTask.id}`)
                .expect(200);

            expect(response.body).toEqual({
                success: true,
                message: "Task deleted successfully",
                data: null
            });

            await request(app)
                .get(`/api/tasks/${createdTask.id}`)
                .expect(404);
        });

        test("should return 404 when deleting a missing task", async () => {
            const response = await request(app)
                .delete("/api/tasks/99999")
                .expect(404);

            expect(response.body).toEqual({
                success: false,
                message: "Task not found"
            });
        });

        test("should reject an invalid task ID", async () => {
            const response = await request(app)
                .delete("/api/tasks/not-a-number")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Invalid task ID"
            });
        });
    });

    describe("Unknown routes", () => {
        test("should return 404 for an unknown route", async () => {
            const response = await request(app)
                .get("/api/unknown")
                .expect(404);

            expect(response.body).toEqual({
                success: false,
                message: "Route GET /api/unknown not found"
            });
        });

        test("should return 404 for an unsupported method", async () => {
            const response = await request(app)
                .patch("/api/tasks")
                .expect(404);

            expect(response.body).toEqual({
                success: false,
                message: "Route PATCH /api/tasks not found"
            });
        });
    });
});