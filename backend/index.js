// const connectToMongo = require('./db')
// var cors = require('cors')
// //by using cors user will connect frontend and backend through API calls.

// // express hello world example
// const express = require('express')
// const app = express()
// const port = 5000

// app.use(cors())v

// app.use(express.json());

// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })


// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/notes', require('./routes/notes'));

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
  
// })

// connectToMongo();

const connectToMongo = require('./db')
var cors = require('cors')
//by using cors user will connect frontend and backend through API calls.

// express hello world example
const express = require('express')
const app = express()
const port = 5001

app.use(cors())

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})

connectToMongo();
