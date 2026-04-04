import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { fetchPosts, deletePost } from "../api";

export default function PostList() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadPosts();
  }, []);

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await fetchPosts();
      setPosts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(id);
      setPosts(posts.filter((p) => p.id !== id));
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="loading">Loading posts...</p>;
  if (error) return <p className="error">{error}</p>;

  if (posts.length === 0) {
    return (
      <div className="empty">
        <h2>No posts yet</h2>
        <p>
          <Link to="/new">Create your first post</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="post-list">
      <h1>All Posts</h1>
      {posts.map((post) => (
        <article key={post.id} className="post-card">
          <h2>
            <Link to={`/post/${post.id}`}>{post.title}</Link>
          </h2>
          <p className="post-meta">
            By <strong>{post.author}</strong> &middot;{" "}
            {new Date(post.created_at).toLocaleDateString()}
          </p>
          <p className="post-excerpt">
            {post.content.length > 200
              ? post.content.substring(0, 200) + "..."
              : post.content}
          </p>
          <div className="post-actions">
            <Link to={`/post/${post.id}`} className="btn">
              Read
            </Link>
            <Link to={`/edit/${post.id}`} className="btn">
              Edit
            </Link>
            <button
              onClick={() => handleDelete(post.id)}
              className="btn btn-danger"
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
