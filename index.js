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
    const orderCollection = database.collection('orders');
    /* ------------------------------------- 
    GET Products API
    ------------------------------------- */
    app.get('/products', async (req, res) => {
      const cursor = productCollection.find({});
      const count = await cursor.count();
      // console.log(req.query);
      const page = req.query.page;
      const size = parseInt(req.query.size);
      let products;
      if (page) {
        products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }

      res.send({
        count,
        products,
      });
    });
    /* ------------------------------------- 
    Use post to get data by keys
    ------------------------------------- */
    app.post('/products/bykeys', async (req, res) => {
      const keys = req.body;
      console.log(keys);
      const query = { key: { $in: keys } };
      const products = await productCollection.find(query).toArray();
      res.json(products);
    });
    /* ------------------------------------- 
    Add order API
    ------------------------------------- */
    app.post('/orders', async (req, res) => {
      const order = req.body;
      const result = await orderCollection.insertOne(order);
      res.json(result);
    });

    /* ------------------------------------- 
    Check API
    ------------------------------------- */
    app.get('/', (req, res) => {
      res.send('Running Server');
    });
  } finally {
    // await client.close();
  }
}

mongodbCURD().catch(console.dir);

app.listen(port, () => console.log(`Server running on port ${port}`));
