import React from "react";
import { Link, useNavigate } from "react-router-dom";


const Navbar = () => {
  let navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate("/login");
  }

  return (
    <nav className="navbar navbar-expand-lg navbar navbar-dark bg-dark border-bottom">
      <div className="container-fluid">
        <Link className="navbar-brand" to="/">
          iNoteBook
        </Link>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav">
            <li className="nav-item">
              <Link className="nav-link active" aria-current="page" to="/home">
                Home
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/Remainders">
                Remainders
              </Link>
            </li>
          </ul>
        </div>
      </div>
      
      {localStorage.getItem('token') ? 
      <form className="d-flex">
        <Link className="btn btn-outline-light mx-1" to="/profile" role="button"><i className="fa-solid fa-user" style={{color: "ffffff"}}></i></Link>
        <button className="btn btn-outline-light mx-1" onClick={handleLogout}>Logout<i className="fa-solid fa-right-from-bracket" style={{display: "inline", padding: "4px"}}></i></button>
      </form>

        : <form className="d-flex">
          <Link className="btn btn-outline-light mx-1" to="/login" role="button">Login</Link>
          <Link className="btn btn-outline-light mx-1" to="/signup" role="button">Signup</Link>
        </form>}

    </nav>
  );
};

export default Navbar;
