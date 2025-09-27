const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);

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
    const paymentCollection = db.collection('payments');

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

    // get a single parcel by id
    app.get('/parcels/:id', async (req, res) => {
      try {
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const parcel = await parcelCollection.findOne(query);
        res.send(parcel);
      } catch (error) {
        console.error("Error fetching parcel:", error);
        res.status(500).send("Error fetching parcel");
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

    // GET: get payment by email or all payments also sorted by latest
    app.get('/payments', async (req, res) => {
      try {
        const email = req.query.email;
        const query = email ? { email } : {};
        const options = {
          sort: { paid_at: -1 }
        };
        const payments = await paymentCollection.find(query, options).toArray();
        res.send(payments);
      } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).send("Error fetching payments");
      }
    });

    // POST: record payment and update parcel status
    app.post('/payments', async (req, res) => {
      try {
        const {id, email, amount, paymentMethod, transactionId } = req.body;

        const updateResult = await parcelCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { payment_status: 'paid'} }
        );

        if(updateResult.modifiedCount === 0) {
          return res.status(404).send("Parcel not found or already paid");
        }

        const paymentDoc = {
          parcelId: id,
          email,
          amount,
          paymentMethod,
          transactionId,
          paid_at_string: new Date().toISOString(),
          paid_at: new Date()
        }
        const paymentResult = await paymentCollection.insertOne(paymentDoc);

        res.status(201).send({
          message: "Payment recorded and parcel updated",
          updateResult,
          insertedId: paymentResult.insertedId
         });
       
      } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).send("Error processing payment");
      }
    });



    // create payment intent
    app.post('/create-payment-intent', async (req, res) => {
      try {
        const { amount } = req.body;

        // Create a payment intent using Stripe API
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: 'usd', 
          payment_method_types: ['card'],

        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).send("Error creating payment intent");
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

