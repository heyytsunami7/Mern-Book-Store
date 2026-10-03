require('dotenv').config(); 
const express = require("express");
const app = express();
const port = process.env.PORT || 3001;
const cors = require("cors");
const admin = require("firebase-admin");

// --- Firebase Admin Init ---
const serviceAccountRaw = (process.env.FIREBASE_SERVICE_ACCOUNT_KEY || "").trim();
if (serviceAccountRaw.length > 0) {
  try {
    const serviceAccount = JSON.parse(serviceAccountRaw);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  } catch (err) {
    console.error("⚠️ Failed to initialize Firebase Admin:", err.message);
  }
} else {
  console.warn("⚠️  FIREBASE_SERVICE_ACCOUNT_KEY not set – auth middleware will reject all requests.");
  admin.initializeApp();
}

// --- CORS ---
const allowedOrigins = (process.env.CORS_ORIGINS || "http://localhost:5173")
  .split(",")
  .map(s => s.trim());

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());

// --- Auth Middleware ---
async function verifyToken(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  try {
    const token = header.split("Bearer ")[1];
    req.user = await admin.auth().verifyIdToken(token);
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

// Optional: restrict to specific admin emails
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean);

function requireAdmin(req, res, next) {
  if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ error: "Forbidden – not an admin" });
  }
  next();
}

// --- Validation helper ---
const REQUIRED_BOOK_FIELDS = ["bookTitle", "authorName", "imageURL", "category", "bookDescription", "bookPDFUrl"];

function validateBook(body) {
  const missing = REQUIRED_BOOK_FIELDS.filter(f => !body[f] || typeof body[f] !== "string" || !body[f].trim());
  return missing;
}

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
    
    // --- Insert a book (auth + admin required) ---
    app.post("/upload-book", verifyToken, requireAdmin, async(req,res)=>{
      try {
        const missing = validateBook(req.body);
        if (missing.length) {
          return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
        }
        // Only allow known fields
        const data = {};
        REQUIRED_BOOK_FIELDS.forEach(f => { data[f] = req.body[f].trim(); });
        const result = await bookCollections.insertOne(data);
        res.send(result);
      } catch (err) {
        res.status(500).json({ error: "Failed to upload book" });
      }
    });

    // --- Update a book (auth + admin, no upsert) ---
    app.patch("/book/:id", verifyToken, requireAdmin, async(req,res)=>{
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid book ID" });
        }
        const missing = validateBook(req.body);
        if (missing.length) {
          return res.status(400).json({ error: `Missing fields: ${missing.join(", ")}` });
        }
        const updateData = {};
        REQUIRED_BOOK_FIELDS.forEach(f => { updateData[f] = req.body[f].trim(); });

        const filter = { _id: new ObjectId(id) };
        // upsert: false – do NOT create junk documents from bad IDs
        const result = await bookCollections.updateOne(filter, { $set: updateData });
        if (result.matchedCount === 0) {
          return res.status(404).json({ error: "Book not found" });
        }
        res.send(result);
      } catch (err) {
        res.status(500).json({ error: "Failed to update book" });
      }
    });

    // --- Delete a book (auth + admin) ---
    app.delete("/book/:id", verifyToken, requireAdmin, async(req,res)=>{
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid book ID" });
        }
        const filter = { _id: new ObjectId(id) };
        const result = await bookCollections.deleteOne(filter);
        if (result.deletedCount === 0) {
          return res.status(404).json({ error: "Book not found" });
        }
        res.send(result);
      } catch (err) {
        res.status(500).json({ error: "Failed to delete book" });
      }
    });

    // --- Get all books (public, with optional category filter + pagination) ---
    app.get("/all-books", async(req,res)=>{
      try {
        let query = {};
        if (req.query?.category) {
          query = { category: req.query.category };
        }
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
        const skip = (page - 1) * limit;

        const [books, total] = await Promise.all([
          bookCollections.find(query).skip(skip).limit(limit).toArray(),
          bookCollections.countDocuments(query),
        ]);
        res.json({ books, total, page, limit, totalPages: Math.ceil(total / limit) });
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch books" });
      }
    });

    // --- Get single book (public) ---
    app.get("/book/:id", async(req,res) => {
      try {
        const id = req.params.id;
        if (!ObjectId.isValid(id)) {
          return res.status(400).json({ error: "Invalid book ID" });
        }
        const filter = {_id: new ObjectId(id)};
        const result = await bookCollections.findOne(filter);
        if (!result) {
          return res.status(404).json({ error: "Book not found" });
        }
        res.send(result);
      } catch (err) {
        res.status(500).json({ error: "Failed to fetch book" });
      }
    });

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