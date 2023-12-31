const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
app.use(cors());
app.use(express.json());
const jwt = require("jsonwebtoken");
const port = process.env.PORT || 5000;
app.get("/", (req, res) => {
  res.send("welcome to Techouse");
});

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://smsaikat000:${process.env.dbPass}@cluster0.qaxdq18.mongodb.net/?retryWrites=true&w=majority`;

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
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    // Send a ping to confirm a successful connection
    const Products = client.db("TecHouse").collection("Products");
    const Users = client.db("TecHouse").collection("Users");
    await client.db("admin").command({ ping: 1 });
    // !----------------- user related route --------------------
    // ! post user into data base
    app.post("/postUser", async (req, res) => {
      const data = req.body;
      const result = await Users.insertOne(data);
      res.send(result);
    });

    // ! -------------- Post jwt ----------------
    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT, { expiresIn: "1d" });
      res.send({ token });
    });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.listen(port);
