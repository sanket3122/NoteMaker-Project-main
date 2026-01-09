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

  // ✅ Defensive: ensure notes is always an array
  const { notes: ctxNotes, fetchallNote, editNote } = context;
  const notes = Array.isArray(ctxNotes) ? ctxNotes : [];

  const token = localStorage.getItem("token"); // ✅ single source of truth
  let navigate = useNavigate();

  useEffect(() => {
    if (token) fetchallNote();
    else navigate("/login");
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
    props.showAlert("Updated successfully", "success");
  };

  const onChange = (e) => setNote({ ...note, [e.target.name]: e.target.value });

  const handleclickUpload1 = async (e) => {
    e.preventDefault();
    const Host = "http://localhost:5001";

    try {
      const response = await fetch(`${Host}/api/notes/upload`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
      });

      if (response.ok) props.showAlert("Notes Uploaded to bucket successfully", "success");
      else props.showAlert("Failed to upload Notes to the bucket.", "danger");
    } catch (error) {
      props.showAlert("Error uploading Notes to bucket.", "danger");
    }
  };

  const handleclickUploadtobq = async (e) => {
    e.preventDefault();
    const Host = "http://localhost:5001";

    try {
      const response = await fetch(`${Host}/api/notes/uploadtobq`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "auth-token": token,
        },
      });

      if (response.ok) props.showAlert("Notes Uploaded to BigQuery successfully", "success");
      else props.showAlert("Failed to upload Notes to the BigQuery.", "danger");
    } catch (error) {
      props.showAlert("Error uploading Notes to BigQuery.", "danger");
    }
  };

return (
  <div className="app-shell">
    <div className="two-pane">

      {/* LEFT: Workspace + Add Note */}
      <div className="panel panel-sticky">
        <div className="accent-bar" />
        <h3 className="section-title">Your Note Workspace</h3>
        <p className="section-sub">
          Quick notes backed by MongoDB. Optional exports to Cloud Storage and BigQuery for analytics.
        </p>

        <div className="kpi">
          <span className="pill">JWT Auth</span>
          <span className="pill">MongoDB Atlas</span>
          <span className="pill">GCS Export</span>
          <span className="pill">BigQuery Insert</span>
        </div>

        <div className="divider" />

        {/* Addnote stays on the left */}
        <Addnote showAlert={props.showAlert} />

        {/* Your edit modal trigger stays (hidden) */}
        <button
          type="button"
          ref={ref}
          className="btn btn-primary d-none"
          data-bs-toggle="modal"
          data-bs-target="#exampleModal"
        >
          Launch demo modal
        </button>

        {/* Keep your modal exactly same */}
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
                  Edit note
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
                  className="btn btn-outline-dark"
                  data-bs-dismiss="modal"
                >
                  Close
                </button>
                <button type="button" className="btn btn-primary" onClick={handleclick}>
                  Update note
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT: Notes + Upload actions */}
      <div className="panel">
        <div className="right-head">
          <div>
            <h3 className="section-title">Your notes</h3>
            <div className="count">{notes.length} notes loaded</div>
          </div>

          {notes.length > 0 && (
            <div className="upload-row">
              <div className="upload-card" onClick={handleclickUpload1}>
                <i className="fa-solid fa-cloud-arrow-up" />
                <div>
                  <p className="label">Upload to Cloud</p>
                  <p className="sub">Export JSON to GCS</p>
                </div>
              </div>

              <div className="upload-card" onClick={handleclickUploadtobq}>
                <i className="fa-solid fa-database" />
                <div>
                  <p className="label">Upload to BigQuery</p>
                  <p className="sub">Insert rows for analytics</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="notes-area">
          {notes.length === 0 ? (
            <div className="hint">No notes to display. Add your first one on the left.</div>
          ) : (
            <div className="notes-grid">
              {notes.map((note) => (
                <Noteitem
                  key={note._id}
                  note={note}
                  updateNote={updateNote}
                  showAlert={props.showAlert}
                />
              ))}
            </div>
          )}
        </div>
      </div>

    </div>
  </div>
);

};

export default Notes;
