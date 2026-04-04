import { Routes, Route, Link } from "react-router-dom";
import PostList from "./components/PostList";
import PostForm from "./components/PostForm";
import PostDetail from "./components/PostDetail";

export default function App() {
  return (
    <div className="app">
      <header>
        <nav>
          <Link to="/" className="logo">
            Blog
          </Link>
          <Link to="/new" className="btn btn-primary">
            + New Post
          </Link>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<PostList />} />
          <Route path="/new" element={<PostForm />} />
          <Route path="/edit/:id" element={<PostForm />} />
          <Route path="/post/:id" element={<PostDetail />} />
        </Routes>
      </main>
    </div>
  );
}
