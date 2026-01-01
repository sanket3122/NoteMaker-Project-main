import React from 'react';

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
    const file = storage.bucket(bucketName).file('notes.json');
    await file.save(JSON.stringify(jsonData), {
      contentType: 'application/json',
    });

    res.status(200).send('JSON file uploaded to GCS successfully.');
  } catch (error) {
    console.error('Error uploading JSON file to GCS:', error);
    res.status(500).send('Internal server error');
  }
};

export default handleUploadClick;
