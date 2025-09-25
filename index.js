const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.oesmq38.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();

    const db = client.db('parcelXDB');
    const parcelCollection = db.collection('parcels');

    // GET all parcels or by user email and sorted by latest
    app.get('/parcels', async (req, res) => {
      try {
        const email = req.query.email;
        const query = email ? { created_by: email } : {};
        const options = {
          sort: { createdAt: -1 }
        };

        const parcels = await parcelCollection.find(query, options).toArray();
        res.send(parcels);
      } catch (error) {
        console.error("Error fetching parcels:", error);
        res.status(500).send("Error fetching parcels");
      }
    });

    // add a new parcel
    app.post('/parcels', async (req, res) => {
      try {
        const newParcel = req.body;
        const result = await parcelCollection.insertOne(newParcel);
        res.send(result);
      } catch (error) {
        console.error("Error adding parcel:", error);
        res.status(500).send("Error adding parcel");
      }
    });

    // delete a parcel by _id
    app.delete('/parcels/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const result = await parcelCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error("Error deleting parcel:", error);
        res.status(500).send("Error deleting parcel");
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



// Routes
app.get('/', (req, res) => {
    res.send('Welcome to ParcelX API');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

