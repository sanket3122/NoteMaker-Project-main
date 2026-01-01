import React, { useContext, useEffect, useRef, useState } from "react";
import noteContext from "../context/notes/noteContext1";
import Noteitem from "./Noteitem";
import Addnote from "./Addnote";
import { useNavigate } from "react-router-dom";
const Notes = (props) => {
  const [note, setNote] = useState({
    id: "",
    etitle: "",
    edescription: "",
    etag: "default",
  });
  const context = useContext(noteContext);
  const { notes, fetchallNote, editNote } = context;

  let navigate = useNavigate();

  useEffect(() => {
    if (localStorage.getItem("token")) {
      fetchallNote();
    }
    else {
      navigate("/login");
    }
    //eslint-disable-next-line
  }, []);
  const updateNote = (currentnote) => {
    ref.current.click();
    setNote({
      id: currentnote._id,
      etitle: currentnote.title,
      edescription: currentnote.description,
      etag: currentnote.tag,
    });

  };
  const ref = useRef(null);
  const refclose = useRef(null);

  const handleclick = (e) => {
    e.preventDefault();
    editNote(note.id, note.etitle, note.edescription, note.etag);
    refclose.current.click();
    props.showAlert("Updated successfully", "success")
  };
  const onChange = (e) => {
    setNote({ ...note, [e.target.name]: e.target.value });
  };

  // const MyComponent = () => {
  //   // JSON data containing notes


  //   // Upload JSON data to GCS when component mounts
  //   React.useEffect(() => {
  //     uploadToGCS(jsonData);
  //   }, []);

  //   return (
  //     <div>
  //       <h1>Uploading JSON to GCS</h1>
  //       {/* Add your component content here */}
  //     </div>
  //   );
  // };
  // const handleclickUpload = async (e) => {
  //   e.preventDefault();
  //   const jsonData = {
  //     notes: [
  //       { id: 1, text: 'Note 1' },
  //       { id: 2, text: 'Note 2' },
  //       // Add more notes as needed
  //     ],
  //   };

  //   //  await uploadToGCS(jsonData);
  //   //console.log("upload: ", uploadstat);
  // };

  const handleclickUpload1 = async (e) => {
    e.preventDefault();
    const Host = "http://localhost:5001";
    try {
      const response = await fetch(`${Host}/api/notes/upload`, {
        method: 'POST',
        contentType: 'application/json'
      });

      if (response.ok) {
        console.log('JSON file uploaded to server successfully.');
        props.showAlert("Notes Uploaded to bucket successfully", "success");
      } else {
        console.error('Failed to upload JSON file to server.');
        props.showAlert("Failed to upload Notes to the bucket.", "danger");
      }
    } catch (error) {
      console.error('Error uploading JSON file to server:', error);
      props.showAlert("Error uploading Notes to bucket.", "danger");
    }
  }

  const handleclickUploadtobq = async (e) => {
    e.preventDefault();
    const Host = "http://localhost:5001";
    try {
      const response = await fetch(`${Host}/api/notes/uploadtobq`, {
        method: 'POST',
        contentType: 'application/json',
      });

      if (response.ok) {
        // console.log('JSON file uploaded to server successfully.');
        props.showAlert("Notes Uploaded to BigQuery successfully", "success");
      } else {
        // console.error('Failed to upload JSON file to server.');
        props.showAlert("Failed to upload Notes to the BigQuery.", "danger");
      }
    } catch (error) {
      // console.error('Error uploading JSON file to server:', error);
      props.showAlert("Error uploading Notes to BigQuery.", "danger");
    }

  }
  return (
    <div className="row">
      <Addnote showAlert={props.showAlert} />
      <button type="button" ref={ref} className="btn btn-primary d-none" data-bs-toggle="modal" data-bs-target="#exampleModal">Launch demo modal</button>

      <div
        className="modal fade"
        id="exampleModal"
        tabIndex="-1"
        aria-labelledby="exampleModalLabel"
        aria-hidden="true"
      >
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h1 className="modal-title fs-5" id="exampleModalLabel">
                Modal title
              </h1>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              ></button>
            </div>
            <div className="modal-body">
              <div className="mb-3">
                <label htmlFor="title" className="form-label">
                  Enter Title
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="etitle"
                  name="etitle"
                  value={note.etitle}
                  onChange={onChange}
                />
              </div>
              <div className="mb-3">
                <label htmlFor="description" className="form-label">
                  Enter Description
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="edescription"
                  name="edescription"
                  value={note.edescription}
                  onChange={onChange}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                ref={refclose}
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
              <button type="button" className="btn btn-primary" onClick={handleclick}>Update note</button>
            </div>
          </div>
        </div>
      </div>

      <div className="container">
        <h2>Your notes</h2>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {notes.length > 0 && (
            <>
            <div className="container card border-secondary" style={{ display: 'inline-block' }}>
              <i style={{ marginLeft: '20px' }} className="fa-solid fa-cloud-arrow-up fa-xl" onClick={handleclickUpload1}></i>
              <h3 style={{ marginLeft: '10px', marginRight: '10px'  ,   display:'inline-block'}}>Upload to cloud</h3>
            </div>
       
            <div className="container card border-secondary" style={{ display: 'inline-block' }}>
              <i style={{ marginLeft: '10px', marginRight: '20px' }} className="fa-solid fa-cloud-arrow-up fa-xl" onClick={handleclickUploadtobq}></i>
              <h3 style={{ marginLeft: '10px', marginRight: '10px'  ,   display:'inline-block'}}>Upload to BQ</h3>
            </div>
          </>
          
          )}
        </div>
        {notes.length === 0 && "No notes to display."}
      </div>


      {Array.isArray(notes) && notes.map((note) => {
        return (
          <Noteitem key={note._id} note={note} updateNote={updateNote} showAlert={props.showAlert}></Noteitem>
        );
      })}
    </div>


  );
};

export default Notes;
