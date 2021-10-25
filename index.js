require('dotenv').config();
const express = require('express');
const cors = require('cors');

const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const app = express();
const port = 5000;

//MiddleWare
app.use(cors());
app.use(express.json());

// MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.${process.env.DB_CLUSTERS}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function mongodbCURD() {
  try {
    /* ------------------------------------- 
     checking connection with DB
    ------------------------------------- */
    await client.connect();
    console.log('db connected');
    /* ------------------------------------- 
    database name and collection init
    ------------------------------------- */
    const database = client.db('ema_jhon');
    const productCollection = database.collection('products');
    /* ------------------------------------- 
    GET Products API
    ------------------------------------- */
    app.get('/products', async (req, res) => {
      const cursor = productCollection.find({});
      const products = await cursor.toArray();
      res.send(products);
    });
  } finally {
    // await client.close();
  }
}

mongodbCURD().catch(console.dir);

app.get('/', (req, res) => {
  res.send('Running Server at', port);
});

app.listen(port, () => console.log(`Server running on port ${port}`));
