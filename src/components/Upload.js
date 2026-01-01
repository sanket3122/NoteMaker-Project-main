import React from 'react'
//import noteContext from '../context/notes/noteContext1'

const Upload = () => {

  const handleUploadClick = async () => {
    try {
      const jsonData = {
        notes: [
          { id: 1, text: 'Note 1' },
          { id: 2, text: 'Note 2' },
          // Add more notes as needed
        ],
      };
  
      const response = await fetch('http://localhost:5001/api/notes/upload', { // Replace with your server endpoint
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jsonData }),
      });
  
      if (response.ok) {
        console.log('JSON file uploaded to server successfully.');
      } else {
        console.error('Failed to upload JSON file to server.');
      }
    } catch (error) {
      console.error('Error uploading JSON file to server:', error);
    }
  };
  
  return (
    <button onClick={handleUploadClick}>Upload Sample Note to GCS</button>
  );


  // const a = useContext(noteContext);
  //   useEffect(() => {
  //     a.update();
  //     // eslint-disable-next-line
  //   }, [])

}

export default Upload
