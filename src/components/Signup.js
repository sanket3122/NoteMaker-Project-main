import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';

const Signup = (props) => {
  let navigate = useNavigate();
  const [credentials, setcredentials] = useState({ name: "", email: "", password: "", cpassword: "" });

  const HanldeOnsubmit = async (e) => {
    e.preventDefault();   //prevent from reloading the page.
    const { name, email, password } = credentials;
    const url = "http://localhost:5001/api/auth/createUser";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ name, email, password }),
    });

    const json = await response.json();
    console.log(json);
    if (json.success) {
      //redirect
      localStorage.setItem("token", json.authtoekn);
      navigate("/");
      props.showAlert("Account created successfully", "success");
    }
    else {
      props.showAlert("Invalid Details", "danger");
    }
  }
  const onChange = (e) => {
    setcredentials({ ...credentials, [e.target.name]: e.target.value });
  };
  return (
    <div className='container card border-secondary' style={{width: "30rem", padding:"10px"}}>
      <h3>Enter details to use MyNotebook</h3>

      <form onSubmit={HanldeOnsubmit}>
        <div className="mb-3">
          <label htmlFor="name" className="form-label my-2">Name</label>
          <input type="text" className="form-control" onChange={onChange} id="name" name="name" />
        </div>
        <div className="mb-3">
          <label htmlFor="email" className="form-label">Email address</label>
          <input type="email" className="form-control" onChange={onChange} id="email" name="email" minLength={5} required />
        </div>
        <label htmlFor="password" className="form-label">Password</label>
        <input type="password" id="password" name="password" onChange={onChange} className="form-control" aria-describedby="passwordHelpBlock" minLength={5} required />
        <label htmlFor="cpassword" className="form-label">Confirm Password</label>
        <input type="password" id="cpassword" name="cpassword" onChange={onChange} className="form-control" aria-describedby="passwordHelpBlock" />
        <div className="col-auto my-2">
          <button type="submit" className=" btn btn-primary mb-3 d-grid gap-2 col-12 my-4 mx-auto">Sign up</button>
        </div>
      </form>

    </div>
  )
}

export default Signup