const express = require("express");
const cors = require("cors");

const taskRoutes = require("./routes/taskRoutes");
const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "Smart To-Do API is running"
    });
});

app.use("/api/tasks", taskRoutes);

app.use(notFound);

app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});