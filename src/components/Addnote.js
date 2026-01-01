import React, { useContext, useState } from "react";
import noteContext from "../context/notes/noteContext1";

const Addnote = (props) => {
  const context = useContext(noteContext)
  const { addNote } = context;

  const [note, setNote] = useState({ title: "", description: "", tag: "default" })
  const handleclick = (e) => {
    e.preventDefault();
    addNote(note.title, note.description, note.tag);
    props.showAlert("Added successfully", "success");

  }
  
  const onChange = (e) => {
    setNote({ ...note, [e.target.name]: e.target.value })
  }
  return (
    <div>
      <div className="container">
        <h2>Add a note</h2>
      </div>
      <div className="container my-3">
        <div className="mb-3">
          <label htmlFor="title" className="form-label">
            Enter Title
          </label>
          <input type="text" className="form-control" id="title" name="title" onChange={onChange} />
        </div>
        <div className="mb-3">
          <label htmlFor="description" className="form-label">
            Enter Description
          </label>
          <input type="text" className="form-control" id="description" name="description" onChange={onChange} />
        </div>
        {/* <div className="mb-3">
          <label htmlFor="tag" className="form-label">
            Enter tag
          </label>
          <input type="text" className="form-control" id="tag" name="tag"  onChange={onChange}/>
        </div> */}
        <div className="col-auto my-3">
          <button disabled={note.title.length < 3 || note.description.length < 5} type="submit" className="btn btn-primary mb-3" onClick={handleclick}>
            Add note
          </button>
        </div>
      </div>
    </div>
  );
};

export default Addnote;
