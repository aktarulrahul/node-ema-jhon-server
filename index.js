require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Firebase Admin initialization
var admin = require('firebase-admin');
var serviceAccount = require('./react-ema-john-4b2de-firebase-adminsdk-mwc8u-10dec5ab44.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const app = express();
const port = process.env.PORT || 5000;

//MiddleWare
app.use(cors());
app.use(express.json());

// MongoDB
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.${process.env.DB_CLUSTERS}.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  if (req.headers.authorization?.startsWith('Bearer ')) {
    const idToken = req.headers.authorization.split('Bearer ')[1];
    try {
      const decodedUser = await admin.auth().verifyIdToken(idToken);
      req.decodedUserEmail = decodedUser.email;
    } catch (error) {
      console.log('You are not Authorized');
    }
  }
  next();
}

async function mongodbCURD() {
  try {
    /* ------------------------------------- 
     checking connection with DB
    ------------------------------------- */
    await client.connect();
    // console.log('db connected');
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
      // console.log(keys);
      const query = { key: { $in: keys } };
      const products = await productCollection.find(query).toArray();
      res.json(products);
    });
    /* ------------------------------------- 
    Add order API
    ------------------------------------- */
    app.post('/orders', async (req, res) => {
      const order = req.body;
      order.createdAt = new Date();
      const result = await orderCollection.insertOne(order);
      res.json(result);
    });

    /* ------------------------------------- 
    GET all orders of an individual user API
    ------------------------------------- */
    app.get('/orders', verifyToken, async (req, res) => {
      const email = req.query.email;
      if (req.decodedUserEmail === email) {
        const query = { email: email };
        const cursor = orderCollection.find(query);
        const orders = await cursor.toArray();
        res.json(orders);
      } else {
        res.status(401).json({ message: 'User not authorized' });
      }
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
