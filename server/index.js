const express = require("express");
const cors = require("cors");
const { initDB } = require("./db");
const postsRouter = require("./routes/posts");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/posts", postsRouter);

app.get("/", (req, res) => {
  res.json({ message: "Blog API is running" });
});

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("Failed to initialize database:", err.message);
    process.exit(1);
  });
