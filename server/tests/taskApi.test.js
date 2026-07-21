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

    describe("Task search", () => {
        test("should search tasks by title", async () => {
            await createTask({
                title: "Learn Node.js",
                description: "Backend development"
            });

            await createTask({
                title: "Buy groceries",
                description: "Milk and bread"
            });

            const response = await request(app)
                .get("/api/tasks?search=node")
                .expect(200);

            expect(response.body.data.tasks).toHaveLength(1);
            expect(response.body.data.tasks[0].title).toBe(
                "Learn Node.js"
            );

            expect(
                response.body.data.pagination.totalItems
            ).toBe(1);
        });

        test("should search tasks by description", async () => {
            await createTask({
                title: "Study",
                description: "Practice Express API"
            });

            await createTask({
                title: "Exercise",
                description: "Run for thirty minutes"
            });

            const response = await request(app)
                .get("/api/tasks?search=express")
                .expect(200);

            expect(response.body.data.tasks).toHaveLength(1);
            expect(response.body.data.tasks[0].title).toBe(
                "Study"
            );
        });

        test("should return an empty list when no task matches", async () => {
            await createTask({
                title: "Existing task"
            });

            const response = await request(app)
                .get("/api/tasks?search=nonexistent")
                .expect(200);

            expect(response.body.data.tasks).toEqual([]);
            expect(
                response.body.data.pagination.totalItems
            ).toBe(0);
        });
    });

    describe("Task status filter", () => {
        test("should return only pending tasks", async () => {
            const firstTask = await createTask({
                title: "Pending task"
            });

            const secondTask = await createTask({
                title: "Completed task"
            });

            await request(app)
                .patch(`/api/tasks/${secondTask.id}/complete`)
                .expect(200);

            const response = await request(app)
                .get("/api/tasks?status=pending")
                .expect(200);

            expect(response.body.data.tasks).toHaveLength(1);
            expect(response.body.data.tasks[0]).toEqual(
                expect.objectContaining({
                    id: firstTask.id,
                    title: "Pending task",
                    completed: 0
                })
            );
        });

        test("should return only completed tasks", async () => {
            const pendingTask = await createTask({
                title: "Pending task"
            });

            const completedTask = await createTask({
                title: "Completed task"
            });

            await request(app)
                .patch(`/api/tasks/${completedTask.id}/complete`)
                .expect(200);

            const response = await request(app)
                .get("/api/tasks?status=completed")
                .expect(200);

            expect(response.body.data.tasks).toHaveLength(1);
            expect(response.body.data.tasks[0]).toEqual(
                expect.objectContaining({
                    id: completedTask.id,
                    title: "Completed task",
                    completed: 1
                })
            );

            expect(response.body.data.tasks[0].id).not.toBe(
                pendingTask.id
            );
        });

        test("should reject an invalid status", async () => {
            const response = await request(app)
                .get("/api/tasks?status=done")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Status must be completed or pending"
            });
        });
    });

    describe("Task priority filter", () => {
        test("should return only high-priority tasks", async () => {
            await createTask({
                title: "Low task",
                priority: "Low"
            });

            await createTask({
                title: "High task",
                priority: "High"
            });

            await createTask({
                title: "Medium task",
                priority: "Medium"
            });

            const response = await request(app)
                .get("/api/tasks?priority=High")
                .expect(200);

            expect(response.body.data.tasks).toHaveLength(1);

            expect(response.body.data.tasks[0]).toEqual(
                expect.objectContaining({
                    title: "High task",
                    priority: "High"
                })
            );
        });

        test("should reject an invalid priority filter", async () => {
            const response = await request(app)
                .get("/api/tasks?priority=Urgent")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Priority must be Low, Medium, or High"
            });
        });
    });

    describe("Task sorting", () => {
        test("should sort tasks by priority", async () => {
            await createTask({
                title: "Low task",
                priority: "Low"
            });

            await createTask({
                title: "High task",
                priority: "High"
            });

            await createTask({
                title: "Medium task",
                priority: "Medium"
            });

            const response = await request(app)
                .get("/api/tasks?sort=priority")
                .expect(200);

            const priorities = response.body.data.tasks.map(
                (task) => task.priority
            );

            expect(priorities).toEqual([
                "High",
                "Medium",
                "Low"
            ]);
        });

        test("should sort tasks by deadline", async () => {
            await createTask({
                title: "Later deadline",
                deadline: "2026-12-20"
            });

            await createTask({
                title: "Earlier deadline",
                deadline: "2026-08-01"
            });

            await createTask({
                title: "No deadline",
                deadline: null
            });

            const response = await request(app)
                .get("/api/tasks?sort=deadline")
                .expect(200);

            const titles = response.body.data.tasks.map(
                (task) => task.title
            );

            expect(titles).toEqual([
                "Earlier deadline",
                "Later deadline",
                "No deadline"
            ]);
        });

        test("should reject an invalid sort value", async () => {
            const response = await request(app)
                .get("/api/tasks?sort=random")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message:
                    "Sort must be newest, oldest, deadline, or priority"
            });
        });
    });

    describe("Task pagination", () => {
        test("should return the requested page and limit", async () => {
            for (let index = 1; index <= 12; index += 1) {
                await createTask({
                    title: `Task ${index}`
                });
            }

            const response = await request(app)
                .get("/api/tasks?page=2&limit=5")
                .expect(200);

            expect(response.body.data.tasks).toHaveLength(5);

            expect(response.body.data.pagination).toEqual({
                page: 2,
                limit: 5,
                totalItems: 12,
                totalPages: 3
            });
        });

        test("should return remaining tasks on the last page", async () => {
            for (let index = 1; index <= 12; index += 1) {
                await createTask({
                    title: `Task ${index}`
                });
            }

            const response = await request(app)
                .get("/api/tasks?page=3&limit=5")
                .expect(200);

            expect(response.body.data.tasks).toHaveLength(2);

            expect(response.body.data.pagination).toEqual({
                page: 3,
                limit: 5,
                totalItems: 12,
                totalPages: 3
            });
        });

        test("should return an empty list for a page beyond the last page", async () => {
            await createTask({
                title: "Only task"
            });

            const response = await request(app)
                .get("/api/tasks?page=10&limit=5")
                .expect(200);

            expect(response.body.data.tasks).toEqual([]);

            expect(response.body.data.pagination).toEqual({
                page: 10,
                limit: 5,
                totalItems: 1,
                totalPages: 1
            });
        });
    });

    describe("Pagination validation", () => {
        test("should reject page zero", async () => {
            const response = await request(app)
                .get("/api/tasks?page=0")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Page must be a positive integer"
            });
        });

        test("should reject a non-numeric page", async () => {
            const response = await request(app)
                .get("/api/tasks?page=abc")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message: "Page must be a positive integer"
            });
        });

        test("should reject limit zero", async () => {
            const response = await request(app)
                .get("/api/tasks?limit=0")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message:
                    "Limit must be an integer between 1 and 100"
            });
        });

        test("should reject a limit greater than 100", async () => {
            const response = await request(app)
                .get("/api/tasks?limit=101")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message:
                    "Limit must be an integer between 1 and 100"
            });
        });

        test("should reject a decimal limit", async () => {
            const response = await request(app)
                .get("/api/tasks?limit=5.5")
                .expect(400);

            expect(response.body).toEqual({
                success: false,
                message:
                    "Limit must be an integer between 1 and 100"
            });
        });
    });

    describe("Combined task queries", () => {
        test("should combine search, status, priority, sort, and pagination", async () => {
            const matchingTaskOne = await createTask({
                title: "Learn API testing",
                description: "Practice backend tests",
                priority: "High",
                deadline: "2026-08-10"
            });

            const matchingTaskTwo = await createTask({
                title: "Build API project",
                description: "Portfolio backend",
                priority: "High",
                deadline: "2026-08-05"
            });

            const completedTask = await createTask({
                title: "Completed API task",
                priority: "High",
                deadline: "2026-08-01"
            });

            await request(app)
                .patch(`/api/tasks/${completedTask.id}/complete`)
                .expect(200);

            await createTask({
                title: "Low-priority API task",
                priority: "Low",
                deadline: "2026-08-02"
            });

            await createTask({
                title: "Unrelated task",
                priority: "High"
            });

            const response = await request(app)
                .get(
                    "/api/tasks" +
                    "?search=api" +
                    "&status=pending" +
                    "&priority=High" +
                    "&sort=deadline" +
                    "&page=1" +
                    "&limit=5"
                )
                .expect(200);

            expect(response.body.data.tasks).toHaveLength(2);

            expect(
                response.body.data.tasks.map((task) => task.id)
            ).toEqual([
                matchingTaskTwo.id,
                matchingTaskOne.id
            ]);

            expect(response.body.data.pagination).toEqual({
                page: 1,
                limit: 5,
                totalItems: 2,
                totalPages: 1
            });
        });
    });
});