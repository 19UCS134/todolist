//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

// const items = ["Buy Food", "Cook Food", "Eat Food"];
// const workItems = [];

//****************************************************************************** */
mongoose.connect(
  "mongodb+srv://admin-timothy:mongo.1A@cluster0.nl9vm9d.mongodb.net/todolistDB"
);
//******************************************************************************* */
const itemsSchema = new mongoose.Schema({
  name: String,
});
const Items = new mongoose.model("Item", itemsSchema);
const item1 = new Items({ name: "Welcome to your Todo-List" });
const item2 = new Items({ name: "Hit + button to Add item" });
const item3 = new Items({ name: "<- Hit this to Delete item" });

const defaultitems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema],
};
const List = mongoose.model("List", listSchema);

app.get("/", function (req, res) {
  Items.find(function (err, founditems) {
    if (founditems.length === 0) {
      Items.insertMany(defaultitems, function (err) {
        if (err) {
          console.log(err);
        } else {
          console.log("Successfully saved Defaultitems");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", { listTitle: "Today", newListItems: founditems });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;
  const listName = req.body.list;

  const newitem = new Items({
    name: itemName,
  });
  if (listName === "Today") {
    newitem.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listName }, function (err, foundList) {
      if (!err) {
        foundList.items.push(newitem);
        foundList.save();
        res.redirect("/" + listName);
      }
    });
  }
});
app.post("/delete", function (req, res) {
  const checkedItem = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Items.findByIdAndRemove(checkedItem, function (err) {
      if (!err) {
        console.log("Deleted checked item");
        res.redirect("/");
      }
    });
  } else {
    List.findOneAndUpdate(
      { name: listName },
      { $pull: { items: { _id: checkedItem } } },
      function (err, foundList) {
        if (!err) {
          console.log("Deleted checked item form: " + listName);
          res.redirect("/" + listName);
        }
      }
    );
  }
});

app.get("/:customListName", function (req, res) {
  const customListName = _.capitalize(req.params.customListName);
  List.findOne({ name: customListName }, function (err, result) {
    if (!err) {
      if (!result) {
        //Create a new list
        const list = new List({
          name: customListName,
          items: defaultitems,
        });
        list.save();
        res.redirect("/" + customListName);
      } else {
        //Show an existing list\
        res.render("list", {
          listTitle: result.name,
          newListItems: result.items,
        });
      }
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server started succesfully");
});
