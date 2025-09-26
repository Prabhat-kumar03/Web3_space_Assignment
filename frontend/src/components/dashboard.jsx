import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const Dashboard = () => {
  const navigate = useNavigate();

  // posts + UI state
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false); // when creating/updating
  const [error, setError] = useState(null);

  // form/edit state
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [editingPostId, setEditingPostId] = useState(null);

  // UI navigation (profile / dashboard)
  const [activePage, setActivePage] = useState("dashboard");

  // read user from localStorage or decode JWT
  const accessToken = localStorage.getItem("ACCESS_TOKENS");
  const storedUser = (() => {
    try {
      const u = localStorage.getItem("user");
      if (!u) return null;
      return JSON.parse(u);
    } catch {
      return null;
    }
  })();

  const jwtPayload = (token) => {
    if (!token) return null;
    try {
      const payload = token.split(".")[1];
      const decoded = JSON.parse(atob(payload));
      return decoded;
    } catch {
      return null;
    }
  };

  const user = storedUser || jwtPayload(accessToken) || null;

  /* ----------------------
     Helper: safe JSON parse
     ---------------------- */
  const safeJson = async (res) => {
    try {
      return await res.json();
    } catch {
      return null;
    }
  };

  /* ------------------------------
     Helper: refresh access token
     (assumes backend has /api/token/refresh/)
     ------------------------------ */
  const tryRefresh = async () => {
    const refresh = localStorage.getItem("REFRESH_TOKENS");
    if (!refresh) return false;

    try {
      const resp = await fetch(`${API_BASE}/api/token/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });

      if (!resp.ok) {
        // refresh failed — clear tokens and force login
        localStorage.removeItem("ACCESS_TOKENS");
        localStorage.removeItem("REFRESH_TOKENS");
        return false;
      }

      const data = await safeJson(resp);
      if (data?.access) {
        localStorage.setItem("ACCESS_TOKENS", data.access);
        // some backends return new refresh token too
        if (data.refresh) localStorage.setItem("REFRESH_TOKENS", data.refresh);
        return true;
      }
      return false;
    } catch (err) {
      console.error("Refresh error:", err);
      return false;
    }
  };

  /* ------------------------------
     Centralized fetch wrapper
     - attaches Authorization
     - retries once on 401 with refresh flow
     ------------------------------ */
  const apiFetch = async (path, opts = {}) => {
    const url = path.startsWith("http") ? path : `${API_BASE}${path}`;
    const access = localStorage.getItem("ACCESS_TOKENS");
    const headers = { ...(opts.headers || {}) };

    // if JSON body and not FormData, ensure content-type
    if (opts.body && !(opts.body instanceof FormData)) {
      headers["Content-Type"] = "application/json";
      // ensure body is string
      if (typeof opts.body !== "string") opts.body = JSON.stringify(opts.body);
    }

    if (access) headers["Authorization"] = `Bearer ${access}`;

    let res;
    try {
      res = await fetch(url, { ...opts, headers });
    } catch (networkErr) {
      // network error (CORS, offline, etc.)
      console.error("Network error during fetch", networkErr);
      throw new Error("Network error — check backend or CORS");
    }

    // if unauthorized, try refresh once
    if (res.status === 401 && localStorage.getItem("REFRESH_TOKENS")) {
      const refreshed = await tryRefresh();
      if (refreshed) {
        const newAccess = localStorage.getItem("ACCESS_TOKENS");
        headers["Authorization"] = `Bearer ${newAccess}`;
        try {
          res = await fetch(url, { ...opts, headers });
        } catch (e) {
          console.error("Retry fetch failed", e);
          throw new Error("Request retry failed");
        }
      }
    }

    return res;
  };

  /* ------------------------------
     Fetch posts (on mount)
     ------------------------------ */
  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem("ACCESS_TOKENS");
      if (!token) {
        navigate("/login");
        return;
      }
      try {
        // ensure trailing slash (many Django APIs require it)
        const res = await apiFetch("/api/posts/", { method: "GET" });
        if (!res.ok) {
          // try without trailing slash if backend is different
          if (res.status === 404) {
            const alt = await apiFetch("/api/posts", { method: "GET" });
            if (!alt.ok) throw new Error("Failed to fetch posts");
            const dataAlt = await safeJson(alt);
            setPosts(Array.isArray(dataAlt) ? dataAlt : []);
          } else {
            const errBody = await safeJson(res);
            throw new Error(errBody?.detail || "Failed to fetch posts");
          }
        } else {
          const data = await safeJson(res);
          setPosts(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        setError(err.message || "Unknown error");
        console.error("fetchPosts error:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ------------------------------
     Logout
     ------------------------------ */
  const handleLogout = () => {
    localStorage.removeItem("ACCESS_TOKENS");
    localStorage.removeItem("REFRESH_TOKENS");
    localStorage.removeItem("user");
    navigate("/login");
  };

  /* ------------------------------
     Create / Update Post
     ------------------------------ */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const token = localStorage.getItem("ACCESS_TOKENS");
    if (!token) {
      navigate("/login");
      return;
    }

    try {
      let path = "/api/posts/";
      let method = "POST";

      if (editingPostId) {
        // ensure trailing slash for update
        path = `/api/posts/${editingPostId}/`;
        method = "PUT";
      }

      const res = await apiFetch(path, { method, body: formData });
      if (!res.ok) {
        const err = await safeJson(res);
        throw new Error(err?.detail || err?.message || "Failed to save post");
      }
      const saved = await safeJson(res);

      if (editingPostId) {
        setPosts((prev) => prev.map((p) => (p.id === editingPostId ? saved : p)));
      } else {
        setPosts((prev) => [...prev, saved]);
      }

      setFormData({ title: "", content: "" });
      setEditingPostId(null);
    } catch (err) {
      console.error("save error:", err);
      setError(err.message || "Unknown error while saving");
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (post) => {
    setFormData({ title: post.title || "", content: post.content || "" });
    setEditingPostId(post.id);
    setActivePage("dashboard");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    const token = localStorage.getItem("ACCESS_TOKENS");
    if (!token) {
      navigate("/login");
      return;
    }
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      // ensure trailing slash on delete
      const res = await apiFetch(`/api/posts/${id}/`, { method: "DELETE" });
      if (!res.ok && res.status !== 204) {
        throw new Error("Failed to delete post");
      }
      setPosts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("delete error:", err);
      setError(err.message || "Failed to delete post");
    }
  };

  /* ------------------------------
     UI
     ------------------------------ */
  return (
    <div className="flex min-h-screen bg-gradient-to-r from-sky-50 via-white to-purple-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 hidden md:block sticky top-4 h-[calc(100vh-32px)]">
        <h1 className="text-2xl font-bold text-indigo-700 mb-6">My Dashboard</h1>

        <nav className="flex flex-col gap-3">
          <button
            onClick={() => setActivePage("profile")}
            className={`px-4 py-2 rounded text-left transition-colors duration-150 ${
              activePage === "profile"
                ? "bg-indigo-600 text-white shadow-md transform scale-[1.01]"
                : "text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
            }`}
          >
            Profile
          </button>

          <button
            onClick={() => setActivePage("dashboard")}
            className={`px-4 py-2 rounded text-left transition-colors duration-150 ${
              activePage === "dashboard"
                ? "bg-indigo-600 text-white shadow-md transform scale-[1.01]"
                : "text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
            }`}
          >
            Posts
          </button>

          <button
            onClick={handleLogout}
            className="mt-6 px-4 py-2 rounded text-left text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors duration-150"
          >
            Logout
          </button>
        </nav>

        <div className="mt-6 border-t pt-4">
          <p className="text-sm text-gray-500">Signed in as</p>
          <p className="font-medium text-gray-800">{user?.username || "Unknown"}</p>
          <p className="text-xs text-gray-500">{user?.email || ""}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-grow p-6">
        {activePage === "profile" && (
          <div className="max-w-md bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold text-indigo-700 mb-4">Profile</h2>
            {user ? (
              <>
                <p className="mb-2">
                  <span className="font-medium">Username:</span> {user.username}
                </p>
                <p>
                  <span className="font-medium">Email:</span> {user.email}
                </p>
              </>
            ) : (
              <p className="text-red-600">No user saved in localStorage.</p>
            )}
          </div>
        )}

        {activePage === "dashboard" && (
          <>
            <h2 className="text-3xl font-bold text-gray-800 mb-6">Manage Posts</h2>

            {/* Create / Edit */}
            <form
              onSubmit={handleSubmit}
              className="mb-8 bg-white p-6 rounded-lg shadow-md max-w-xl"
            >
              <h3 className="text-xl font-semibold mb-4 text-indigo-700">
                {editingPostId ? "Edit Post" : "Create New Post"}
              </h3>

              {error && <div className="mb-3 text-red-600 font-medium">{error}</div>}

              <div className="mb-4">
                <label className="block mb-1 font-medium">Title</label>
                <input
                  value={formData.title}
                  onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="mb-4">
                <label className="block mb-1 font-medium">Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
                  rows="4"
                  required
                  className="w-full px-3 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>

              <div className="flex items-center">
                <button
                  type="submit"
                  disabled={saving}
                  className={`px-4 py-2 rounded text-white transition-transform duration-150 ${
                    saving ? "bg-indigo-400 cursor-wait" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
                  }`}
                >
                  {saving ? "Saving..." : editingPostId ? "Update Post" : "Create Post"}
                </button>

                {editingPostId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPostId(null);
                      setFormData({ title: "", content: "" });
                      setError(null);
                    }}
                    className="ml-4 px-4 py-2 rounded border border-gray-300 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>

            {/* Posts list */}
            {loading ? (
              <p>Loading posts...</p>
            ) : posts.length === 0 ? (
              <p>No posts found.</p>
            ) : (
              <div className="grid gap-4">
                {posts.map((post) => (
                  <article
                    key={post.id}
                    className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow transform hover:-translate-y-0.5"
                  >
                    <h3 className="text-lg font-semibold text-gray-800">{post.title}</h3>
                    <p className="text-gray-600 mt-2">{post.content}</p>

                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => handleEdit(post)}
                        className="px-3 py-1 rounded bg-yellow-500 text-white hover:bg-yellow-600 active:scale-95 transition-all"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(post.id)}
                        className="px-3 py-1 rounded bg-rose-600 text-white hover:bg-rose-700 active:scale-95 transition-all"
                      >
                        Delete
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
