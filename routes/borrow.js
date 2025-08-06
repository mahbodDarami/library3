const express = require("express");
const router = express.Router();
const Book = require("../models/Book");
const Client = require("../models/Client");

router.post("/borrow", async (req, res) => {
  if (!req.session.user) return res.redirect("/");

  const selected = req.body.books || [];
  const selectedIDs = Array.isArray(selected) ? selected.map(Number) : [Number(selected)];

  try {
    const user = req.session.user;

    await Book.updateMany(
      { _id: { $in: selectedIDs }, available: true },
      { $set: { available: false } }
    );

    await Client.updateOne(
      { username: user },
      { $addToSet: { IDBooksBorrowed: { $each: selectedIDs } } },
      { upsert: true }
    );

    res.redirect("/home");
  } catch (err) {
    res.status(500).send("Borrowing error");
  }
});

router.post("/return", async (req, res) => {
  if (!req.session.user) return res.redirect("/");

  const selected = req.body.books || [];
  const selectedIDs = Array.isArray(selected) ? selected.map(Number) : [Number(selected)];

  try {
    const user = req.session.user;

    await Book.updateMany(
      { _id: { $in: selectedIDs } },
      { $set: { available: true } }
    );

    await Client.updateOne(
      { username: user },
      { $pull: { IDBooksBorrowed: { $in: selectedIDs } } }
    );

    res.redirect("/home");
  } catch (err) {
    res.status(500).send("Return error");
  }
});

module.exports = router;
