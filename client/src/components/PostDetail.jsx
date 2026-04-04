import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { fetchPost, deletePost } from "../api";

export default function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPost(id)
      .then(setPost)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleDelete() {
    if (!window.confirm("Delete this post?")) return;
    try {
      await deletePost(id);
      navigate("/");
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) return <p className="loading">Loading...</p>;
  if (error) return <p className="error">{error}</p>;
  if (!post) return <p className="error">Post not found</p>;

  return (
    <article className="post-detail">
      <h1>{post.title}</h1>
      <p className="post-meta">
        By <strong>{post.author}</strong> &middot;{" "}
        {new Date(post.created_at).toLocaleDateString()}
        {post.updated_at !== post.created_at && (
          <span>
            {" "}
            &middot; Updated {new Date(post.updated_at).toLocaleDateString()}
          </span>
        )}
      </p>
      <div className="post-content">
        {post.content.split("\n").map((para, i) => (
          <p key={i}>{para}</p>
        ))}
      </div>
      <div className="post-actions">
        <Link to={`/edit/${post.id}`} className="btn">
          Edit
        </Link>
        <button onClick={handleDelete} className="btn btn-danger">
          Delete
        </button>
        <Link to="/" className="btn">
          Back
        </Link>
      </div>
    </article>
  );
}
