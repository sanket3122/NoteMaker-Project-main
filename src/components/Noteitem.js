import React, { useContext } from "react";
import noteContext from "../context/notes/noteContext1";

const Noteitem = (props) => {
  const { note, updateNote } = props;
  const context = useContext(noteContext);
  const { deleteNote } = context;

  const onClick = () => {
    deleteNote(note._id);
    props.showAlert("Deleted successfully", "success");
  };

  // const onClick = () => {
  //   console.log(note._id);
  // }

  return (
    <div className="note-col">
      <div className="note-card p-3">
        <div className="d-flex justify-content-between align-items-start gap-2">
          <div>
            <div className="note-title">{note.title}</div>
            <div className="note-tag">
              <i className="fa-solid fa-tag"></i>
              {note.tag || "default"}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span
              className="icon-btn"
              title="Edit"
              onClick={() => updateNote(note)}
            >
              <i className="fa-regular fa-pen-to-square"></i>
            </span>
            <span
              className="icon-btn"
              title="Delete"
              onClick={onClick}
            >
              <i className="fa-solid fa-trash-can"></i>
            </span>
          </div>
        </div>

        <div className="note-desc mt-3">{note.description}</div>
      </div>
    </div>
  );
};

export default Noteitem;
