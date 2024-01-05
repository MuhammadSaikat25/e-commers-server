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
    const Payment = client.db("TecHouse").collection("Payment");
    await client.db("admin").command({ ping: 1 });
    //! ---------------------------Verify admin
    const VerifyAdmin = async (req, res, next) => {
      const email = req.decode.email;
      const query = { email };
      const findUser = await Users.findOne(query);
      const admin = findUser.role === "admin";
      if (!admin) {
        return res.status(401).send("forbidden access");
      }
      next();
    };
    const verifySeller = async (req, res, next) => {
      const email = req.decode.email;
      const query = { email };
      const findSeller = await Users.findOne(query);
      const seller = findSeller.role === "seller";
      if (!seller) {
        return res.status(401).send("forbidden access");
      }
      next();
    };
    //* ----------------- user related route --------------------
    // ! post user into data base
    app.post("/postUser", async (req, res) => {
      const data = req.body;
      const result = await Users.insertOne(data);
      res.send(result);
    });
    // ! get a single user
    app.get("/getUser/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const result = await Users.findOne(query);
      res.send(result);
    });
    // ! make user to seller
    app.patch(
      "/makeUserToSeller/:email",
      VerifyJwt,
      VerifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const updateDoc = {
          $set: {
            role: "seller",
          },
        };
        const result = await Users.updateOne(query, updateDoc);
        res.send(result);
      }
    );
    app.patch(
      "/makeUserToStillUser/:email",
      VerifyJwt,
      VerifyAdmin,
      async (req, res) => {
        const email = req.params.email;
        const query = { email };
        const updateDoc = {
          $set: {
            role: "user",
          },
        };
        const result = await Users.updateOne(query, updateDoc);
        res.send(result);
      }
    );
    // * -------------------- Products related route --------------
    // ! get all Products
    app.get("/getAllProducts", async (req, res) => {
      const result = await Products.find().toArray();
      res.send(result);
    });
    // ! get single product
    app.get("/singleProduct/:id", VerifyJwt, async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await Products.findOne(query);
      res.send(result);
    });
    // ! increase sell product sell number after payment
    app.patch(`/incSellNumber/:id`,VerifyJwt,async(req,res)=>{
      const id=req.params.id 
      const   {quantity}=req.body
      const query = {_id:new ObjectId(id)}
      const findData=await Products.findOne(query)
      const updatedDoc={
        $set:{
          selling:findData.selling+quantity,
          quantity:findData.quantity-quantity
        }
      }
      const result=await Products.updateOne(query,updatedDoc)
      res.send(result)
    })
    // * -------------------- Add To Card related route ------------------------
    // ! add cart data into database
    app.put("/addToCard/:id", VerifyJwt, async (req, res) => {
      const data = req.body;
      const { proId, user } = req.body;
      const query = { proId, user };
      const findData = await AddToCart.findOne(query);
      console.log(findData);
      if (findData) {
        const updateDoc = {
          $set: {
            ...findData,
            quantity: findData.quantity + data.quantity,
          },
        };
        const updateRes = await AddToCart.updateOne(query, updateDoc);
        res.send(updateDoc);
        return;
      }
      const result = await AddToCart.insertOne(data);
      res.send(result);
    });
    // ! get user cart data
    app.get("/getAllCardData/:email", VerifyJwt, async (req, res) => {
      const email = req.params.email;
      const query = { user: email };
      const result = await AddToCart.find(query).toArray();
      res.send(result);
    });
    // ! update cart data
    app.patch("/updatedCart/:id", async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          quantity:data.quantity+1
        },
      };
      const result = await AddToCart.updateOne(query, updatedDoc);
      res.send(result);
    });
    app.patch("/updatedDecCart/:id", async (req, res) => {
      const data = req.body;
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          quantity:data.quantity-1
        },
      };
     
      const result = await AddToCart.updateOne(query, updatedDoc);
      res.send(result);
    });
    // ! delete cart item 
    app.delete("/deleteCart/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await AddToCart.deleteOne(query);
      res.send(result);
    });
    // * ----------------------------- payment related route---------------------
    //  ! post payment
    app.post('/payment',VerifyJwt,async(req,res)=>{
      const data=req.body 
      const result=await Payment.insertOne(data)
      res.send(result)
    })
    // * ---------------------- Seller Related Route ---------------------
    // ! put Seller request
    app.put("/applySeller/:email", async (req, res) => {
      const data = req.body;
      const email = req.params.email;
      const query = { email };
      const findData = await SellerRequest.findOne(query);
      if (findData) {
        return;
      }
      const result = await SellerRequest.insertOne(data);
      res.send(result);
    });
    // ! get All Seller Request
    app.get("/getSellerRequest", VerifyJwt, VerifyAdmin, async (req, res) => {
      const result = await SellerRequest.find().toArray();
      res.send(result);
    });
    // ! accept and reject seller request
    app.patch(
      "/acceptRequest/:id",
      VerifyJwt,
      VerifyAdmin,
      async (req, res) => {
        const data = req.body;
        const id = req.params.id;
        const query = { _id: new ObjectId(id) };
        const updateDoc = {
          $set: {
            ...data,
          },
        };
        const result = await SellerRequest.updateOne(query, updateDoc);

        res.send(result);
      }
    );
    // ! add product by seller
    app.post(
      "/addedProductBySeller",
      VerifyJwt,
      verifySeller,
      async (req, res) => {
        const data = req.body;
        const result = await Products.insertOne(data);
        res.send(result);
      }
    );
    // * -------------- Post jwt ----------------
    // ! post jwt
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
