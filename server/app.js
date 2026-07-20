const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

const taskRoutes = require("./routes/taskRoutes");

app.use("/api/tasks", taskRoutes);

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});