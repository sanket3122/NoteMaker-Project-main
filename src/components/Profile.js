import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const Profile = (props) => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // ✅ keep your backend host same as the rest of the app
  const Host = useMemo(() => "http://localhost:5001", []);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);
        setErr("");

        const res = await fetch(`${Host}/api/auth/getuser`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            // ✅ IMPORTANT: must match fetchUser middleware key
            "auth-token": token,
          },
        });

        if (!res.ok) {
          const msg = await res.text();
          throw new Error(`Profile API failed (${res.status}): ${msg}`);
        }

        const data = await res.json();
        setUser(data);
      } catch (e) {
        setErr(e.message || "Failed to load profile");
        props?.showAlert?.("Profile not loaded. Check token / API.", "danger");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    // eslint-disable-next-line
  }, []);

  const initials = (user?.name || "User")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0]?.toUpperCase())
    .join("");

  return (
    <div className="page-shell">
      <div className="page-inner">
        <div className="profile-grid">
          {/* LEFT CARD */}
          <div className="cardx profile-card">
            <div className="profile-top">
              <div className="avatarx">{initials || "U"}</div>
              <div className="profile-meta">
                <div className="profile-name">
                  {loading ? "Loading..." : user?.name || "Unknown User"}
                </div>
                <div className="profile-email">
                  {loading ? "Fetching email..." : user?.email || "—"}
                </div>
              </div>
            </div>

            <div className="dividerx" />

            <div className="chip-row">
              <span className="chipx">
                <i className="fa-solid fa-shield-halved"></i> JWT Auth
              </span>
              <span className="chipx">
                <i className="fa-solid fa-database"></i> MongoDB Atlas
              </span>
              <span className="chipx">
                <i className="fa-solid fa-cloud"></i> GCS Export
              </span>
              <span className="chipx">
                <i className="fa-solid fa-chart-line"></i> BigQuery Insert
              </span>
            </div>

            {err && (
              <div className="alertx danger">
                <div className="alert-title">Profile failed to load</div>
                <div className="alert-text">{err}</div>
              </div>
            )}

            {!loading && !err && (
              <div className="profile-actions">
                <button
                  className="btnx btnx-primary"
                  onClick={() => navigator.clipboard.writeText(user?._id || "")}
                >
                  Copy User ID
                </button>
                <button
                  className="btnx btnx-ghost"
                  onClick={() => window.location.reload()}
                >
                  Refresh
                </button>
              </div>
            )}
          </div>

          {/* RIGHT CARD */}
          <div className="cardx profile-card">
            <div className="section-title">Account</div>

            <div className="kv">
              <div className="kv-k">User ID</div>
              <div className="kv-v">
                {loading ? "Loading..." : user?._id || "—"}
              </div>
            </div>

            <div className="kv">
              <div className="kv-k">Email</div>
              <div className="kv-v">
                {loading ? "Loading..." : user?.email || "—"}
              </div>
            </div>

            <div className="kv">
              <div className="kv-k">Status</div>
              <div className="kv-v">
                {loading ? "Loading..." : <span className="pillx ok">Active</span>}
              </div>
            </div>

            <div className="dividerx" />

            <div className="section-title">What to add next</div>
            <ul className="nice-list">
              <li>LLM “Ask my notes” (RAG over BigQuery + embeddings)</li>
              <li>Realtime collab notes (WebSocket + CRDT)</li>
              <li>Queue-based exports (Pub/Sub + worker autoscaling)</li>
              <li>Analytics dashboard (BQ scheduled queries + charts)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
