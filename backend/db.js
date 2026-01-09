// const mongoose = require('mongoose');
// const mongoURI = "mongodb://localhost:27017/iNotebook";
const mongoose = require('mongoose');
const mongoURI = "mongodb+srv:/iNotebook?retryWrites=true&w=majority&appName=Cluster0";

// mongodb://localhost:27017/

async function connectToMongo() {
  await mongoose
    .connect(mongoURI)
    .then(() => console.log("Connected to Mongo Successfully"))
    .catch((err) => console.log(err.message));
}

module.exports = connectToMongo;
