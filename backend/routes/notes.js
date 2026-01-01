const express = require("express");
const router = express.Router();
const Note = require("../models/Note");
const { body, validationResult } = require("express-validator");

const fetchUser = require("../middleware/fetchUser");
// 
const { Storage } = require('@google-cloud/storage');
const { BigQuery } = require('@google-cloud/bigquery');
const bodyParser = require('body-parser');
// const nodemailer = require('nodemailer');
// const port = 3001;

// // Initialize GCS client
// const storage = new Storage({
//   // keyFilename:"C:/Users/sajaysin/Desktop/Javascript/React/inotebook/backend/key-for-serviceaccount/sanket-348b6-2a7091892247.json", 
//   // Path to your GCP service account key file
// });
// const bucketName = 'mybuck01232';

// router.use(bodyParser.json());

// router.post("/upload", fetchUser,async (req, res) => {
 
//   try {
//     // Extract JSON data from the request body
//     const { jsonData } = await req.body;
//     console.log("data from backend", jsonData);
//     // Upload JSON data to GCS
//     const file = storage.bucket(bucketName).file('notes.json');
//     await file.save(JSON.stringify(jsonData), {
//       contentType: 'application/json',
//     });

//     res.status(200).send('JSON file uploaded to GCS successfully.');
//   } catch (error) {
//     console.error('Error uploading JSON file to GCS:', error);
//     res.status(500).send('Internal server error');
//   }
// });

let notes;
let pycodeforBackup =[
 {}
]
const port = 5000;

// Initialize Google Cloud Storage
const storage = new Storage({
  keyFilename: 'C:/Users/sanke/Desktop/inotebook/backend/key-for-serviceaccount/sanket-348b6-2a7091892247.json',
  projectId: 'sanket-348b6',
});
const bigquery = new BigQuery({
  keyFilename: 'C:/Users/sanke/Desktop/inotebook/backend/key-for-serviceaccount/sanket-348b6-2a7091892247.json',
  projectId: 'sanket-348b6',
});

// router.post('/upload', async (req, res) => {
//   try {
//     const bucketName = 'mybuck0123404321';
//     const bucket = storage.bucket(bucketName);
//     // const file = bucket.file('notes.json');
//     const file = bucket.file(`SavedNotes/notes${Math.floor(Math.random() * 100) + 1}.json`);
//     //console.log("notes:", notes);
//     await file.save(JSON.stringify(notes), {
//       contentType: 'application/json',
//     });

//     res.status(200).send('JSON file uploaded to GCS successfully.');
//   } catch (error) {
//     console.error('Error uploading JSON file to GCS:', error);
//     res.status(500).send('Internal server error');
//   }
// });

router.post('/upload', async (req, res) => {
  try {
    const bucketName1 = 'mybuck0123404321';  //bucket to store notes
    const bucket1 = storage.bucket(bucketName1);
    // const file = bucket.file('notes.json');
    const file1 = bucket1.file(`SavedNotes/notes${Math.floor(Math.random() * 100) + 1}.json`);
    //console.log("notes:", notes);
    await file1.save(JSON.stringify(notes), {
      contentType: 'application/json',
    });

    const pythoncode = `
from airflow import DAG
from airflow.operators.bash_operator import BashOperator
from airflow.utils.dates import datetime, timedelta

default_args = {
    'owner': 'airflow',
    'depends_on_past': False,
    'email_on_failure': False,
    'email_on_retry': False,
    'retries': 1,
}
    
with DAG(
    'cloud_storage_backup_dag',
    default_args=default_args,
    description='DAG for scheduling Cloud Storage data backup',
    start_date=datetime(2024, 3, 29),   #change date
    schedule="@continuous",
    max_active_runs=1, 
    dagrun_timeout=timedelta(minutes=2), 
    catchup=False,
) as dag:
    
    backup_task = BashOperator(
        task_id='backup_cloud_storage_data',
        bash_command='gsutil -m cp -r gs://mybuck0123404321/* gs://databackupbucket3122/',    
                                        # source bucket              destination bucket
    )
    
    backup_task
    `;
    const bucketName2 = 'us-central1-mycompo-c63ce491-bucket';  //DAG folder bucket name created by composer.
    const bucket2 = storage.bucket(bucketName2);
    const file2 = bucket2.file(`dags/cloud_storage_backup_dag.py`);   //dag folder/filename.py
    await file2.save(pythoncode, 'text/x-python');

    res.status(200).send('JSON file uploaded to GCS successfully.');
  } catch (error) {
    console.error('Error uploading JSON file to GCS:', error);
    res.status(500).send('Internal server error');
  }
});



router.post('/uploadtobq', async (req, res) => {
  // const schema = [
  //   { name: '_id', type: 'STRING' },
  //   { name: 'user', type: 'STRING' },
  //   { name: 'title', type: 'STRING' },
  //   { name: 'description', type: 'STRING' },
  //   { name: 'tag', type: 'STRING' },
  //   { name: '__v', type: 'INTEGER' } 
  // ];
  // const rows = [
  //   { _id: '65fd264813f7781297809fe2', user: '65fc5d9a3c7528471a24a1c6', title: 'im a sanket', description: 'hey there only', tag: 'default', __v: 0 },
  //   { _id: '65fd4e7f6aac4b6509b96027', user: '65fc5d9a3c7528471a24a1c6', title: 'saaaaaaaaaaa', description: 'aaaaaaaaaaaa', tag: 'default', __v: 0 },
 
  // ];
  // const options = {
  //   schema: schema 
  // };

  try {
    const datasetId = 'WebApp_Notes';
    const tableId = 'Notes';
  //   { name: 'title', type: 'STRING' },
  //   { name: 'description', type: 'STRING' },
  //   { name: 'tag', type: 'STRING' },
    const dataset = bigquery.dataset(datasetId);
    const table = dataset.table(tableId);
    // console.log("from bq:", notes);
    const dataToInsert = notes.map(note => ({
      title: note.title,
      description: note.description,
      tag: note.tag
    }));

    await table.insert(dataToInsert);
    console.log('Inserted data into BigQuery.');
  } catch (error) {
    console.error('Error uploading file:', error);
  }



// const transporter = nodemailer.createTransport({
//   service: 'gmail',
//   auth: {
//     user: 'your-email@gmail.com',
//     pass: 'your-password'
//   }
// });

// Endpoint to handle reminder requests
// app.post('/sendReminder', (req, res) => {
//   const { email, note, time } = req.body;

//   // Logic to send reminder email
//   const mailOptions = {
//     from: 'your-email@gmail.com',
//     to: email,
//     subject: 'Reminder',
//     text: `Note: ${note}`
//   };

//   transporter.sendMail(mailOptions, (error, info) => {
//     if (error) {
//       console.error(error);
//       res.status(500).send('Error sending reminder');
//     } else {
//       console.log('Reminder sent: ' + info.response);
//       res.status(200).send('Reminder sent successfully');
//     }
//   });
// });




  // try {
  //   const datasetId = 'WebApp_Notes';
  //   const tableId = 'Notes';

  //   const dataset = bigquery.dataset(datasetId);
  //   const table = dataset.table(tableId);
  //   console.log("from bq:",notes)
  //   await table.insert(notes);
  //   console.log('Inserted data into BigQuery.');
  //   res.status(200).send('File uploaded successfully');
  // } catch (error) {
  //   console.error('Error uploading file:', error);
  //   res.status(500).send('Internal server error');
  // }
});


//ROUTE 1 : Get all notes: Get "/api/notes/fetchAllNotes". login is required

router.get("/fetchAllNotes", fetchUser, async (req, res) => {
  try {
    notes = await Note.find({ user: req.user.id });
    res.json(notes);
  } catch (error) {
    console.error(error.message);
    res.sendStatus(500).send("Some error occur");
  }
});

//ROUTE 2: Add notes: Post "/api/notes/addNotes". login is required
//localhost:5001/api/notes/addNotes

router.post("/addnotes", fetchUser, [
    body('title', 'Use valid title').isLength({ min: 3 }),
  body('description', 'description contains more than 5 character').isLength({ min: 5 })
], async (req, res) => {
  try {
    const { title, description, tag } = req.body;
    const errors = validationResult(req);
    // if there are error return bad request.
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
  
    const note = new Note({
      title, description, tag, user: req.user.id
    });
    const saveNotes = await note.save();

    res.json(saveNotes);
  } catch (error) {
    console.error(error.message);
    res.sendStatus(500).send("Some error occur");
  }
});

//ROUTE 3: update notes: put "/api/notes/updatenote". login is required

router.put("/updatenote/:id", fetchUser, async (req, res) => {
    const { title, description, tag } = req.body;
    //create new note object
    try {
        const Newnote = {};
        if (title) { Newnote.title = title }
        if (description) { Newnote.description = description }
        if (tag) { Newnote.tag = tag }
    
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not found") }
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not allowed");
        }
    
        note = await Note.findByIdAndUpdate(req.params.id, { $set: Newnote }, { new: true })
        res.json({ note });
    
    } catch (error) {
        console.error(error.message);
        res.sendStatus(500).send("Some error occur");
      }
   
}

)

//ROUTE 4: Delete notes: put "/api/notes/deletenote". login is required

router.delete("/deletenote/:id", fetchUser, async (req, res) => {
    const { title, description, tag } = req.body;
    try {
        let note = await Note.findById(req.params.id);
        if (!note) { return res.status(404).send("Not found") }
        if (note.user.toString() !== req.user.id) {
            return res.status(401).send("Not allowed");
        }
    
        note = await Note.findByIdAndDelete(req.params.id)
        res.json({ "success": "Note has been deleted.", note: note });
    
    } catch (error) {
        console.error(error.message);
        res.sendStatus(500).send("Some error occur");
      }
   
}

)

module.exports = router;
