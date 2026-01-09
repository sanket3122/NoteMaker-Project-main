// const mongoose = require('mongoose');
// const mongoURI = "mongodb://localhost:27017/iNotebook";
const mongoose = require('mongoose');
// const mongoURI = "mongodb+srv:/iNotebook?retryWrites=true&w=majority&appName=Cluster0";
// const mongoURI = "mongodb+srv://sanketbendale25:fkDs7iPlBvtnXIIj@cluster0.rumcmgj.mongodb.net/iNotebook?retryWrites=true&w=majority&appName=Cluster0";

async function connectToMongo() {
  await mongoose
    .connect(mongoURI)
    .then(() => console.log("Connected to Mongo Successfully"))
    .catch((err) => console.log(err.message));
}

module.exports = connectToMongo;
