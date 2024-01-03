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

const VerifyJwt = (req, res, next) => {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res
      .status(401)
      .send({ error: true, message: "unauthorized access" });
  }
  const token = authorization.split(" ")[1];
  jwt.verify(token, process.env.JWT, (error, decode) => {
    if (error) {
      return res
        .status(401)
        .send({ error: true, message: "unauthorized access" });
    }
    req.decode = decode;

    next();
  });
};

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
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
    const AddToCart = client.db("TecHouse").collection("AddToCart");
    const SellerRequest = client.db("TecHouse").collection("SellerRequest");
    await client.db("admin").command({ ping: 1 });
 
    //* ----------------- user related route --------------------
    // ! post user into data base
    app.post("/postUser", async (req, res) => {
      const data = req.body;
      const result = await Users.insertOne(data);
      res.send(result);
    });
    app.get('/getUser/:email',async(req,res)=>{
      const email=req.params.email 
      const query={email}
      const result=await Users.findOne(query)
      res.send(result)
    })
    // * -------------------- Products related route --------------
    // ! get all Products
    app.get("/getAllProducts",async (req, res) => {
      const result = await Products.find().toArray();
      res.send(result);
    });
    // ! get single product
    app.get('/singleProduct/:id',VerifyJwt,async(req,res)=>{
      const id=req.params.id 
      const query={_id:new ObjectId(id)}
      const result=await Products.findOne(query)
      res.send(result)
    })

    // * -------------------- Add To Card related route ------------------------
    app.post('/addToCard/:id',VerifyJwt,async(req,res)=>{
      const data=req.body
      const result=await AddToCart.insertOne(data)
      res.send(result)
    })
    // * ---------------------- Seller Related Route ---------------------
    // ! applySeller
    app.post('/applySeller',async(req,res)=>{
      const data=req.body
      const result=await SellerRequest.insertOne(data)
      res.send(result)
    })
    // * -------------- Post jwt ----------------
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
