const express = require("express");
const router = express.Router();
const { pool } = require("../db");

// Get all posts
router.get("/", async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT * FROM posts ORDER BY created_at DESC"
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single post
router.get("/:id", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM posts WHERE id = ?", [
      req.params.id,
    ]);
    if (rows.length === 0) return res.status(404).json({ error: "Not found" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create post
router.post("/", async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }
    const [result] = await pool.query(
      "INSERT INTO posts (title, content, author) VALUES (?, ?, ?)",
      [title, content, author || "Anonymous"]
    );
    const [rows] = await pool.query("SELECT * FROM posts WHERE id = ?", [
      result.insertId,
    ]);
    res.status(201).json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update post
router.put("/:id", async (req, res) => {
  try {
    const { title, content, author } = req.body;
    if (!title || !content) {
      return res.status(400).json({ error: "Title and content are required" });
    }
    const [result] = await pool.query(
      "UPDATE posts SET title = ?, content = ?, author = ? WHERE id = ?",
      [title, content, author || "Anonymous", req.params.id]
    );
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Not found" });
    const [rows] = await pool.query("SELECT * FROM posts WHERE id = ?", [
      req.params.id,
    ]);
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete post
router.delete("/:id", async (req, res) => {
  try {
    const [result] = await pool.query("DELETE FROM posts WHERE id = ?", [
      req.params.id,
    ]);
    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Not found" });
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
