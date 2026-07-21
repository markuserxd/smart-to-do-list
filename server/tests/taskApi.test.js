const request = require("supertest");
const app = require("../app");

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
});