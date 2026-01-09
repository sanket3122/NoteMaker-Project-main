import "./App.css";
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import Navbar from "./components/Navbar1";
import Home from "./components/Home1";
import Upload from "./components/Upload";
import NoteState from "./context/notes/NoteState";
import Alert from "./components/Alert";
import Login from "./components/Login";
import Signup from "./components/Signup";
import Profile from "./components/Profile";
import "./styles/global.css";

// import { Upload } from "@google-cloud/storage/build/cjs/src/resumable-upload";
// import Remainders from "./components/Remainders";
// for V5 version of react-router-dom to V6 version ref below link
//https://stackoverflow.com/questions/63124161/attempted-import-error-switch-is-not-exported-from-react-router-dom 

function App() {
  const [alert, setAlert] = useState(null);

  const showAlert = (message, type) => {
    setAlert({
      msg: message,
      type: type
    })
    setTimeout(() => {
      setAlert(null);
    }, 3000);
  }

  return (
    <>
      <NoteState>
        {/* <ChatBot/> */}
        <Router>
          <Navbar />
          <Alert alert={alert}></Alert>
          <Routes>
            <Route path="/" element={<Home showAlert={showAlert} />} />
          </Routes>
          <Routes>
            <Route path="/home" element={<Home showAlert={showAlert} />} />
          </Routes>
          <Routes>
            <Route path="/Upload" element={<Upload />} />
          </Routes>
          <Routes>
            <Route path="/login" element={<Login showAlert={showAlert} />} />
          </Routes>
          <Routes>
            <Route path="/signup" element={<Signup showAlert={showAlert} />} />
          </Routes>
          <Routes>
            <Route path="/profile" element={<Profile />} />
          </Routes>
        </Router>
      </NoteState>
    </>
  );
}

export default App;
