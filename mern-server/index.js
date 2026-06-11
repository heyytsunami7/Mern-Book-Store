require('dotenv').config(); 
const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const cors = require("cors");


app.use(cors(
    {
        origin: ["http://localhost:5173", "https://mern-book-store-vszi.vercel.app"],
        credentials: true
    }
));


app.use(express.json());

app.get("/",(req,res)=>{
    res.send("hello");
})
//mongo config

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const uri = process.env.MONGODB_URI; 

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
    const bookCollections = client.db("BookInventory").collection("books");
    
    //insert a book
    app.post("/upload-book", async(req,res)=>{
        const data = req.body;
        const result = await bookCollections.insertOne(data);
        res.send(result);
    });

    // get all books from db
  //  app.get("/all-books", async(req,res)=>{
  //     const books = bookCollections.find();
  //     const result = await books.toArray();
  //     res.send(result);
  //  })

    // update a book data
    app.patch("/book/:id", async(req,res)=>{
        const id = req.params.id;
        const updateBookData = req.body;
        const filter =  {_id: new ObjectId(id)}
        const options = {upsert: true};

        const updateDoc = {
            $set:{
                ...updateBookData
            }
        }
        //update
        const result = await bookCollections.updateOne(filter,updateDoc,options);
        res.send(result);
    })

     // delete a book data
     app.delete("/book/:id", async(req,res)=>{
      const id = req.params.id;
      const filter =  {_id: new ObjectId(id)}
      const result  = await bookCollections.deleteOne(filter);
      res.send(result);
    })

    //find by category
    app.get("/all-books",async(req,res)=>{
      let query = {};
      if(req.query?.category){
        query = {category: req.query.category}
      }
      const result = await bookCollections.find(query).toArray();
      res.send(result);
    })

    //to get single book data
    app.get("/book/:id", async(req,res) => {
      const id = req.params.id;
      const filter = {_id: new ObjectId(id)};
      const result = await bookCollections.findOne(filter) 
      res.send(result);
    })

    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
  } finally {
      //await client.close();
  }
}
run().catch(console.dir);

app.listen(port,()=>{
    console.log(`connected on server ${port}`);
})

module.exports = app;