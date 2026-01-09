import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path) => (location.pathname === path ? "active" : "");

  return (
    <nav className="navbar navbar-expand-lg">
      <div className="container-fluid position-relative px-3">

        {/* Left: Brand */}
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/home">
          <span
            style={{
              width: 10,
              height: 10,
              borderRadius: 999,
              background: "linear-gradient(135deg, #2563eb, #38bdf8)",
              display: "inline-block",
            }}
          />
          iNoteBook
          <span className="badge ms-2">Mongo + BigQuery</span>
        </Link>

        {/* Center: Nav */}
        <div className="position-absolute start-50 translate-middle-x">
          <ul className="navbar-nav flex-row gap-2">
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/home")}`} to="/home">Home</Link>
            </li>
            <li className="nav-item">
              <Link className={`nav-link ${isActive("/Remainders")}`} to="/Remainders">Reminders</Link>
            </li>
          </ul>
        </div>

        {/* Right: Actions */}
        <div className="nav-actions ms-auto d-flex align-items-center gap-2">
          {localStorage.getItem("token") ? (
            <>
              <Link className="btn btn-outline-dark" to="/profile" role="button">
                <i className="fa-solid fa-user" />
              </Link>
              <button className="btn btn-primary" onClick={handleLogout}>
                Logout <i className="fa-solid fa-right-from-bracket" style={{ marginLeft: 6 }} />
              </button>
            </>
          ) : (
            <>
              <Link className="btn btn-outline-dark" to="/login" role="button">Login</Link>
              <Link className="btn btn-primary" to="/signup" role="button">Signup</Link>
            </>
          )}
        </div>

      </div>
    </nav>
  );
};

export default Navbar;
