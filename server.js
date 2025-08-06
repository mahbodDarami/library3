require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const session = require("express-session");
const randomstring = require("randomstring");
const mongoose = require("mongoose");
const exphbs = require("express-handlebars");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: randomstring.generate(),
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3 * 60 * 1000 }
  })
);

// DB Connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.log(err));

// View Engine
app.engine("hbs", exphbs.engine({ extname: ".hbs", partialsDir: "views/partials" }));
app.set("view engine", "hbs");

// Models
const Book = require("./models/Book");
const Client = require("./models/Client");

// Routes
const borrowRoutes = require("./routes/borrow");
app.use("/", borrowRoutes);

// Paths
const usersPath = path.join(__dirname, "data", "users.json");

app.get("/", (req, res) => {
  res.render("landing");
});

app.get("/signin", (req, res) => {
  res.render("signin", { error: null });
});

app.post("/signin", (req, res) => {
  const { username, password } = req.body;
  const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));

  if (!users[username]) return res.render("signin", { error: "Not a registered username" });
  if (users[username] !== password) return res.render("signin", { error: "Invalid password" });

  req.session.user = username;
  res.redirect("/home");
});

app.get("/home", async (req, res) => {
  if (!req.session.user) return res.redirect("/");

  try {
    console.log("Fetching books...");
    const allBooks = await Book.find({}).lean(); // Add .lean() here
    console.log("Found books:", allBooks.length);

    console.log("Fetching client:", req.session.user);
    const client = await Client.findOne({ username: req.session.user }).lean(); // Add .lean() here
    console.log("Found client:", client);

    const borrowedBookIds = client?.IDBooksBorrowed || [];
    console.log("Borrowed book IDs:", borrowedBookIds);
    
    // Get the actual borrowed books
    const borrowedBooks = allBooks.filter(book => 
      borrowedBookIds.includes(book._id)
    );
    
    const availableBooks = allBooks.filter(book => 
      book.available && !borrowedBookIds.includes(book._id)
    );
    
    console.log("Borrowed books:", borrowedBooks.length);
    console.log("Available books:", availableBooks.length);

    res.render("home", {
      user: req.session.user,
      availableBooks,
      borrowedBooks
    });
  } catch (err) {
    console.error("Error loading books:", err);
    res.status(500).send("Error loading books: " + err.message);
  }
});


app.get("/signout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
