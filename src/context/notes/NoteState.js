import { useState } from "react";
import NoteContext from "./noteContext1";

const NoteState = (props) => {
  const Host = "http://localhost:5001";
  const initialNotes = [];
  let initialUser = {};
  let userDataArray = [];

  const [notes, setnotes] = useState(initialNotes);
  const [username, setusername] = useState('');
  const [emailid, setemailid] = useState('');
  const [date, setdate] = useState('');

  const handleUploadClick = async () => {
    const jsonData = {
      notes: [
        { id: 1, text: 'Note 1' },
        { id: 2, text: 'Note 2' },
        // Add more notes as needed
      ],
    };
  
    try {
      console.log("data from backend", jsonData);
      // Upload JSON data to GCS
     
      const storage = new Storage();
      const bucketName = 'mybuck01232';
      const bucket = storage.bucket(bucketName);
      const file = bucket.file('notes.json');
      await file.save(JSON.stringify(jsonData), {
        contentType: 'application/json',
      });
  
      console.log('JSON file uploaded to GCS successfully.');
      // Handle success here, such as updating UI or showing a message
    } catch (error) {
      console.error('Error uploading JSON file to GCS:', error);
      // Handle error here, such as showing an error message to the user
    }
  };
  

  

  // const MyComponent = () => {
  //   // JSON data containing notes
    // const jsonData = {
    //   notes: [
    //     { id: 1, text: 'Note 1' },
    //     { id: 2, text: 'Note 2' },
    //     // Add more notes as needed
    //   ],
    // };
  
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
  
  






const fetchUser2 = async () => {
  const Host = "http://localhost:5001";
  //API call
  const url = `${Host}/api/auth/getuser`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "auth-token": `${localStorage.getItem('token')}`,
    },
  });
  initialUser = await response.json();

 Object.keys(initialUser).forEach(key => {
  const value = initialUser[key];
  userDataArray.push([key, value]);
});
setusername(userDataArray[1][1]);
setemailid(userDataArray[2][1]);
setdate(userDataArray[3][1]);


};



  //fetch all note function
  const fetchallNote = async () => {
    //API call
    const url = `${Host}/api/notes/fetchAllNotes`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "auth-token": `${localStorage.getItem('token')}`,
      },
    });
    const json = await response.json();
    //console.log(json);
    setnotes(json);
  };

  //Add note function
  const addNote = async (title, description, tag) => {
    //API call
    const url = `${Host}/api/notes/addnotes/`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "auth-token": `${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ title, description, tag }),
    });
    console.log(response);
    const note = await response.json();
    setnotes(notes.concat(note));

  };

  //Delete note function

  //It creates a new array newNOTE using the filter method on the notes array.
  //The filter method iterates over each element in the notes array and creates a
  //new array that contains only the elements for which the callback function returns true.
  //In the filter callback function, it checks if the _id property of each note object in the notes array is not equal to the id passed to the deleteNote function. If the _id of a note is not equal to the id being deleted, it returns true, indicating that this note should be kept in the new array. If it is equal, it returns false, indicating that this note should be excluded from the new array.
  //After filtering, newNOTE will contain all the notes except the one with the specified id.

  const deleteNote = async (id) => {
    //API Call:
    const url = `${Host}/api/notes/deletenote/${id}`;
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        "auth-token": `${localStorage.getItem('token')}`,
      },
    }
    ); console.log(response)
    // logic for DeleteNote function
    //console.log("deleting id" + id);
    const newNOTE = notes.filter((notes) => {
      return notes._id !== id;
    });
    // console.log(newNOTE);
    setnotes(newNOTE);
  };

  // edit note function
  const editNote = async (id, title, description, tag) => {
    //API call
    const url = `${Host}/api/notes/updatenote/${id}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "auth-token": `${localStorage.getItem('token')}`,
      },
      body: JSON.stringify({ title, description, tag }),
    });
    console.log(response)
    //const json = await response.json();

    // logic for EditNote function
    for (let index = 0; index < notes.length; index++) {
      const element = notes[index];
      if (notes._id === id) {
        element.title = title;
        element.description = description;
        element.tag = tag;
        break;
      }
    }
  };
  return (
    <NoteContext.Provider
    value={{
      // uploadToGCS,
      // MyComponent,
      handleUploadClick,
      notes,
      username,
      emailid,
      date,
      fetchallNote,
      addNote,
      deleteNote,
      editNote,
      fetchUser2,
    }}
    >
      {props.children}
    </NoteContext.Provider>
  );
};

// const NoteState = (props)=>{
//     const s1 = {
//         "name": "sanket",
//         "class": "10th"
//     }

//     const update = ()=>{
//         setTimeout(() => {
//             setstate({
//                 "name": "harry",
//                 "class": "12th"
//             })
//         }, 3000);
//     }
//     const [state, setstate] = useState(s1);
//     return(
//         <NoteContext.Provider value={{state, update}}>
//             {props.children}
//         </NoteContext.Provider>
//     )
// }

export default NoteState;
