const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
dotenv.config();
const stripe = require("stripe")(process.env.PAYMENT_GATEWAY_KEY);
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(cors());

const serviceAccount = require("./firebase-admin-key.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.oesmq38.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    await client.connect();

    const db = client.db("parcelXDB");
    const parcelCollection = db.collection("parcels");
    const paymentCollection = db.collection("payments");
    const trackingCollection = db.collection("trackings");
    const userCollection = db.collection("users");
    const riderCollection = db.collection("riders");

    // custom middlewares

    // verify Token
    const verifyToken = async (req, res, next) => {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).send({ message: "Unauthorized" });
      }
      const token = authHeader.split(" ")[1];

      if (!token) {
        return res.status(401).send({ message: "Unauthorized" });
      }

      try {
        const decodedUser = await admin.auth().verifyIdToken(token);
        req.decodedUser = decodedUser;
        next();
      } catch (error) {
        console.error("Error verifying token:", error);
        res.status(403).send({ message: "Forbidden" });
      }
    };

    // verify Admin
    const verifyAdmin = async (req, res, next) => {
      const email = req.decodedUser.email;
      const user = await userCollection.findOne({ email });
      if (!user || user.role !== "admin") {
        return res.status(403).send({ message: "Forbidden" });
      }
      next();
    };

    // riders collection---------------------
    //POST: add a new rider
    app.post("/riders", async (req, res) => {
      try {
        const newRider = req.body;
        const result = await riderCollection.insertOne(newRider);
        res.send(result);
      } catch (error) {
        console.error("Error adding rider:", error);
        res.status(500).send("Error adding rider");
      }
    });

    // GET: riders by district
    app.get("/riders", async (req, res) => {
      try {
        const { district } = req.query;
        if (!district)
          return res.status(400).send({ message: "District is required" });

        const riders = await riderCollection
          .find({ district: district, status: "approved" }) // only approved riders
          .toArray();

        res.send(riders);
      } catch (error) {
        console.error("Error fetching riders by district:", error);
        res.status(500).send({ message: "Error fetching riders" });
      }
    });

    // POST: assign rider to a parcel
    // POST: assign rider to a parcel
    app.post(
      "/parcels/:id/assign-rider",
      verifyToken,
      verifyAdmin,
      async (req, res) => {
        try {
          const { id } = req.params;
          const { riderId } = req.body;

          if (!riderId)
            return res.status(400).send({ message: "Rider ID is required" });

          const rider = await riderCollection.findOne({
            _id: new ObjectId(riderId),
          });
          if (!rider)
            return res.status(404).send({ message: "Rider not found" });

          // Update parcel
          const parcelUpdateResult = await parcelCollection.updateOne(
            { _id: new ObjectId(id) },
            {
              $set: {
                assignedRider: {
                  id: rider._id,
                  name: rider.name,
                  email: rider.email,
                },
                delivery_status: "in_transit",
              },
            }
          );

          // Update rider work status
          const riderUpdateResult = await riderCollection.updateOne(
            { _id: new ObjectId(riderId) },
            { $set: { work_status: "in_delivery" } }
          );

          if (parcelUpdateResult.modifiedCount === 0) {
            return res
              .status(404)
              .send({ message: "Parcel not found or already assigned" });
          }

          res.send({
            success: true,
            message:
              "Rider assigned, parcel is now in transit, rider in delivery",
          });
        } catch (error) {
          console.error("Error assigning rider:", error);
          res.status(500).send({ message: "Error assigning rider" });
        }
      }
    );

    // GET: all pending riders
    app.get("/riders/pending", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const pendingRiders = await riderCollection
          .find({ status: "pending" })
          .toArray();
        res.send(pendingRiders);
      } catch (error) {
        console.error("Error fetching pending riders:", error);
        res.status(500).send("Error fetching pending riders");
      }
    });

    // GET: all approved riders
    app.get("/riders/approved", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const approvedRiders = await riderCollection
          .find({ status: "approved" })
          .toArray();
        res.send(approvedRiders);
      } catch (error) {
        console.error("Error fetching approved riders:", error);
        res.status(500).send("Error fetching approved riders");
      }
    });

    // PATCH: update rider status by id

    app.patch("/riders/:id/status", async (req, res) => {
      try {
        const { id } = req.params;
        const { status, email } = req.body;

        const result = await riderCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { status } }
        );

        // update user role for accepting riders
        if (status == "approved") {
          const useQuery = { email: email };
          const updateDoc = {
            $set: { role: "rider" },
          };
          await userCollection.updateOne(useQuery, updateDoc);
        }

        res.send(result);
      } catch (error) {
        console.error(error);
        res.status(500).send({ error: "Something went wrong" });
      }
    });

    // users collection---------------------

    // GET:users/search
    app.get("/users/search", async (req, res) => {
      try {
        const email = req.query.email;
        const regex = new RegExp(email, "i");
        const users = await userCollection
          .find({ email: { $regex: regex } })
          .limit(10)
          .toArray();
        res.send(users);
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).send("Error fetching users");
      }
    });

    // GET: users/:email/role
    app.get("/users/:email/role", async (req, res) => {
      try {
        const email = req.params.email;
        const user = await userCollection.findOne({ email });
        if (!user) {
          return res.status(404).send({ message: "User not found" });
        }
        res.send({ role: user.role });
      } catch (error) {
        console.error("Error fetching user role:", error);
        res.status(500).send("Error fetching user role");
      }
    });

    // PATCH: users/:id/role
    app.patch("/users/:id/role", verifyToken, verifyAdmin, async (req, res) => {
      try {
        const { id } = req.params;
        const { role } = req.body;

        const result = await userCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { role } }
        );

        res.send(result);
      } catch (error) {
        console.error("Error updating user role:", error);
        res.status(500).send("Error updating user role");
      }
    });

    // POST: add a new user if not exists
    app.post("/users", async (req, res) => {
      try {
        const newUser = req.body;
        const query = { email: newUser.email };
        const existingUser = await userCollection.findOne(query);
        if (existingUser) {
          // update last_login time
          const updateDoc = {
            $set: { last_login: new Date().toISOString() },
          };
          await userCollection.updateOne(query, updateDoc);
          return res
            .status(200)
            .send({ message: "User already exists", inserted: false });
        }
        const result = await userCollection.insertOne(newUser);
        res.send(result);
      } catch (error) {
        console.error("Error adding user:", error);
        res.status(500).send("Error adding user");
      }
    });

    // parcel collection routes---------------------
    // GET all parcels or by user email and sorted by latest
    app.get("/parcels", verifyToken, async (req, res) => {
      try {
        const { email, payment_status, delivery_status } = req.query;
        let query = {};
        if (email) {
          query = { created_by: email };
        }
        if (payment_status) {
          query.payment_status = payment_status;
        }
        if (delivery_status) {
          query.delivery_status = delivery_status;
        }

        const options = {
          sort: { createdAt: -1 },
        };

        const parcels = await parcelCollection.find(query, options).toArray();
        res.send(parcels);
      } catch (error) {
        console.error("Error fetching parcels:", error);
        res.status(500).send("Error fetching parcels");
      }
    });

    // get a single parcel by id
    app.get("/parcels/:id", async (req, res) => {
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
    app.post("/parcels", async (req, res) => {
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
    app.delete("/parcels/:id", async (req, res) => {
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

    // Trackings
    app.post("/tracking", async (req, res) => {
      const {
        tracking_id,
        parcel_id,
        status,
        message,
        updated_by = "",
      } = req.body;

      const log = {
        tracking_id,
        parcel_id: parcel_id ? new ObjectId(parcel_id) : undefined,
        status,
        message,
        time: new Date(),
        updated_by,
      };

      const result = await trackingCollection.insertOne(log);
      res.send({ success: true, insertedId: result.insertedId });
    });

    // payment collection routes-------------------
    // GET: get payment by email or all payments also sorted by latest
    app.get("/payments", verifyToken, async (req, res) => {
      try {
        const email = req.query.email;
        if (req.decodedUser.email !== email) {
          return res.status(403).send({ message: "Forbidden" });
        }
        const query = email ? { email } : {};
        const options = {
          sort: { paid_at: -1 },
        };
        const payments = await paymentCollection.find(query, options).toArray();
        res.send(payments);
      } catch (error) {
        console.error("Error fetching payments:", error);
        res.status(500).send("Error fetching payments");
      }
    });

    // POST: record payment and update parcel status
    app.post("/payments", async (req, res) => {
      try {
        const { id, email, amount, paymentMethod, transactionId } = req.body;

        const updateResult = await parcelCollection.updateOne(
          { _id: new ObjectId(id) },
          { $set: { payment_status: "paid" } }
        );

        if (updateResult.modifiedCount === 0) {
          return res.status(404).send("Parcel not found or already paid");
        }

        const paymentDoc = {
          parcelId: id,
          email,
          amount,
          paymentMethod,
          transactionId,
          paid_at_string: new Date().toISOString(),
          paid_at: new Date(),
        };
        const paymentResult = await paymentCollection.insertOne(paymentDoc);

        res.status(201).send({
          message: "Payment recorded and parcel updated",
          updateResult,
          insertedId: paymentResult.insertedId,
        });
      } catch (error) {
        console.error("Error processing payment:", error);
        res.status(500).send("Error processing payment");
      }
    });

    // create payment intent
    app.post("/create-payment-intent", async (req, res) => {
      try {
        const { amount } = req.body;

        // Create a payment intent using Stripe API
        const paymentIntent = await stripe.paymentIntents.create({
          amount,
          currency: "usd",
          payment_method_types: ["card"],
        });

        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error) {
        console.error("Error creating payment intent:", error);
        res.status(500).send("Error creating payment intent");
      }
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// Routes
app.get("/", (req, res) => {
  res.send("Welcome to ParcelX API");
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
