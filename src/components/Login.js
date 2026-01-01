import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom';


const Login = (props) => {
  let navigate = useNavigate();
  const [credentials, setcredentials] = useState({ email: "", password: "" });

  const HanldeOnsubmit = async (e) => {
    e.preventDefault();   //prevent from reloading the page.
    const url = "http://localhost:5001/api/auth/login";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email: credentials.email, password: credentials.password }),
    });

    const json = await response.json();

    console.log(json.authToken);
    console.log(json);
    if (json.success) {
      //redirect

      localStorage.setItem('token', json.authToken);

      navigate("/home");
      props.showAlert("logged in successfully", "success");
    }
    else {
      props.showAlert("Invalid Credentials", "danger");
    }
  }
  const onChange = (e) => {
    setcredentials({ ...credentials, [e.target.name]: e.target.value });
  };
  return (
    <div className='container card border-secondary ' style={{width: "25rem", padding:"10px"}}>
      <form onSubmit={HanldeOnsubmit}>
        <h3 className='my-2'>Login to use MyNotebook</h3>
        <div className="mb-3">
          <label htmlFor="exampleFormControlInput1" className="form-label my-3">Email address</label>
          <input type="email" className="form-control" onChange={onChange} value={credentials.email} id="email" name="email"  />
        </div>
        <label htmlFor="inputPassword5" className="form-label">Password</label>
        <input type="password" id="password" name="password" onChange={onChange} value={credentials.password} className="form-control" aria-describedby="passwordHelpBlock" />
        <div className="col-auto my-2">
          <button type="submit" className="btn btn-primary mb-3 d-grid gap-2 col-12 my-4 mx-auto">Log in</button>
        </div>
        
      </form>

    </div>
  )
}

export default Login