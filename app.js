const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));


uri = "mongodb+srv://george:myadItRRZxlSTNPC@cluster0.ug2plyn.mongodb.net/?retryWrites=true&w=majority"
mongoose.connect(uri);

const itemsSchema = {
  name: String
};
const Item = mongoose.model("Item", itemsSchema);

const listsSchema = {
  name: String,
  items: [itemsSchema]
};
const List = mongoose.model("List", listsSchema);

const buyFood = new Item({
  name: "Buy food"
});
const cookFood = new Item({
  name: "Cook food"
});
const eatFood = new Item({
  name: "Eat food"
});
const defaultItems = [buyFood, cookFood, eatFood];

app.get("/", function(req, res) {
  Item.find({}, (err, foundItems) => {
      if (err) {
        console.error(err);
      } else {
        if (foundItems.length === 0) {
          Item.insertMany(defaultItems, (err) => {
            if (err) {
              console.error(err);
            } else {
              console.log("Uploaded default items to database");
            }
          })
          res.redirect("/");
        }
        res.render("list", {listTitle: "Today", items: foundItems});
    }
  });
});

app.post("/", function(req, res){
  const listName = req.body.listName;
  const itemName = req.body.newItem;
  const newItem = new Item({
    name: itemName
  });
  if (listName === "Today") {
    newItem.save();
    res.redirect("/");
  } else {
    List.findOne({name: listName}, (err, foundList) => {
      if (err) {
        console.error(err);
      } else {
        foundList.items.push(newItem);
        foundList.save();
        res.redirect("/" + listName);
      }
    })
  }
});

app.post("/delete", (req, res) => {
  const id = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.deleteOne({_id: id}, (err) => {
      if (err) {
        console.error(err);
      } else {
        console.log(`Item with ID ${id} deleted`);
      }
    })
    res.redirect("/");
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: id}}}, (err, result) => {
      if (!err) {
        console.log(`Item with ID ${id} deleted`);
        res.redirect("/" + listName);
      } else {
        console.error(err);
      }
    })
  }
});

app.get("/about", function(req, res){
  res.render("about");
});

app.get("/:listName", (req, res) => {
  const listName = _.capitalize(req.params.listName);
  List.findOne({name: listName}, (err, foundList) => {
    if (err) {
      console.error(err);
    } else {
      if (!foundList) {
        const list = new List({
          name: listName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + listName);
      } else {
        if (foundList.items.length === 0) {
          foundList.items = defaultItems;
          foundList.save();
          res.redirect("/" + listName);
        } else {
          res.render("list", {listTitle: foundList.name, items: foundList.items});
        }
      }
    }
  });
})

app.listen(process.env.PORT || 3000, function() {
  console.log("Server started successfully.");
});
