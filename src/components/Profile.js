import React, { useContext, useEffect } from 'react';
import userContext from '../context/notes/noteContext1';
const Profile = () => {
  const context = useContext(userContext);
  let { fetchUser2, username, emailid, date } = context; // Make sure user is 
  useEffect(() => {
    fetchUser2();
    // eslint-disable-next-line
  }, []);
  const renderUserInfo = () => {
    if (!username || username.length === 0) {
      return <div>Loading...</div>;
    }
    return (
      <div className="card my-3  container text-bg-secondary"style={{width: "23rem"}}>
        <div className="card-body">
          <h5 className="card-title">Username: {username}</h5>
          <p className="card-text">Email ID: {emailid}</p>
          <p className="card-text">Joined on: {date}</p>
        </div>
      </div>
    );
  };

  return (
    <div className="container">
      {renderUserInfo()}
    </div>
  );
};


export default Profile;



// import React from 'react'

// const Profile = () => {

//   const { setUser } = useContext(userContext);

// const fetchUser2 = async () => {
//   const Host = "http://localhost:5001";
//   //API call
//   const url = `${Host}/api/auth/getuser`;
//   const response = await fetch(url, {
//     method: "POST",
//     headers: {
//       "auth-token": `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjp7ImlkIjoiNjVmMDUwZjJlMTY0ZGJhZTZmNDBkZjY2In0sImlhdCI6MTcxMDI0ODE3OH0.9eTYNg-ogG7qDES8Uz5W01snq6qyeXzUOzsBIBvhVbE`,
//     },
//   });
//   const users = await response.json();
//   setUser(users);
// };
//   return (
//     <div>Profile</div>
//   )
// }

// export default Profile
