const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
//This is to require the module date.js, which binds all of the exports (its functionality) to this constant called date. (Since its a local module its being called different from the modules above.)
const date = require (__dirname + "/date.js");
const _ = require("lodash");
const app = express();

//this line says run whatever is bound to "date" module and stores it in a variable.
//so "day" is now bound to the output of the "date" module, which is the function that gets the current date or day.
const day = date.getDate();
const today = date.getDay();

app.set('view engine', 'ejs');

//this is needed in order to use the POST request
app.use(bodyParser.urlencoded({extended: true}));

//this line is required in order to Express to access the CSS file, otherwise it doesnt work, because normally Express ignores the other folders besides views.
//"public" is the location of the static files, in this case its a folder called "public".
app.use(express.static("public"));

//create the new database (todolistDB) and connects to it.
mongoose.connect("mongodb+srv://admin-susan:Test123@cluster0.rmg8ltp.mongodb.net/todolistDB");

//create the schema for my collection of items (the structure that I want it to have).
const itemsSchema = new mongoose.Schema({
  name: String
});

//create the model based on the schema itemsSchema
const Item = mongoose.model("item", itemsSchema);

//Create the documents for the default items of the list.
const item1 = new Item ({
  name: "Welcome to your to-do list!"
});

const item2 = new Item ({
  name: "Hit the + button to add a new item"
});

const item3 = new Item ({
  name: "<-- Hit this to delete an item"
});

//Store the documents in an array
const defaultItems = [item1, item2, item3];

//Create the schema that will have every new custom list created
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema]
});

//Create the model based on the schema for every new custom list.
const List = mongoose.model("list", listSchema);


//                       *************** HOME ROUTE  ******************
app.get("/", function(req, res) {

  //Read the items in the collection to pass the value of the newListItems, which is an array of item documents, to the list.ejs
  Item.find()
  .then(foundItems => {

    //after looking for the items in the array, we insert the default items in the collection. (validating first if the array foundItems is empty)
    if (foundItems.length === 0) {
      Item.insertMany(defaultItems)
      .then(result => {
        console.log("Successfully inserted all the default items: " + result);
      })
      .catch(err => {
        console.log("An error ocurred inserting the items: " + err);
      })
      //After inserting the items for the first time, we redirect to the home page so this time it goes directly to the else statement and render the items to the list
      res.redirect("/");
    } else {
      //list = .ejs file that needs to be inside a folder called "views"
      //through the variable kindOfDay we are passing the value of the variable day to my template file (ejs).
      //render is an express method.
      res.render("list", {listTitle: day, newListItems: foundItems});
    }
  })
  .catch(err => {
    console.log("An error ocurred finding the items: " + err);
  })


});

//                       *************** Dynamic routes (Expres routing parameters)  ******************
app.get("/:customListName", function(req, res){
  //Route that the user tries to access (name of the custom list)
  const customListName = _.capitalize(req.params.customListName); //.capitalize is a lodash module method that Converts the first character of string to upper case and the remaining to lower case.

  //Validate if exists or doesn't exist a list with the same name as the custom list that the user entered in the route
  // The find() method returns an ARRAY as the result, but the findOne() method ONLY returns a single OBJECT (one document), thats why we cant check its lenght and instead we use the symbol " ! " , to say if it exists or not
  List.findOne({name: customListName})
  .then(foundList => {

    if (!foundList) {
      //Create a new list if there were no list found that have the same name entered
      const list = new List({
        name: customListName,
        items: defaultItems
      });

      list.save();
      res.redirect("/"+customListName);

    } else {
      //Show an existing list
      res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
    }

  })
  .catch(err => {
    console.log("An error ocurred trying to render the items in the custom list: " + err);
  })

});


//       *****LOGIC TO CHECK IF THE NEW ITEM WAS CREATED INSIDE THE WORK LIST OR THE DEFAULT LIST, TO POST IT IN THE CORRESPONDING LIST. IT DOES IT BY TAPPING INTO THE BUTTON VALUE (look the form in list.ejs file)  ********

app.post("/", function(req, res) {

  //These 2 things are getting pass back from list.ejs (based on the current list that the user is trying to add an item to.)
  const itemName = req.body.newTask; //value of the input (name of the item)
  const listName = req.body.list; //value of the button + (name of the list)


  //Create the document for the new item added to the list by the user, which is required in order to insert it into the collection of items.
  const newItem = new Item ({
    name: itemName
  });

  //Check if the list name that triggered the post request is equal to today, which means we're in the default list, if not, the new item comes from a custom list.
  if (listName === today + ","){ //here I had to use the variable today instead of day because listName only contains the current day plus a ","  and not the whole date
    //Save the document in the items collection
    newItem.save();
    res.redirect("/");

  } else {
    //Inside the lists collection, look for the document with the same name as the list where the user is trying to add the item to. (this document/record is created once the user access to that custom list route)
    //Once found, we add the item and embed it into the existing array of items, inside the lists collection (for that we have to use the .push method besides the .save because we're adding an item to an ARRAY that is a field in a document)
    List.findOne({name: listName})
    .then(foundList => {
      foundList.items.push(newItem);
      //the .save is needed to update the document with the new data in our database.
      foundList.save();
      //redirects to the route where the user came
      res.redirect("/" + listName);
    })
    .catch(err => {
      console.log("An error ocurred trying to add the new items to the list: " + err);
    })

  }

});

app.post("/delete", function(req, res){
  //ID of the checked item
  const checkedItemId = req.body.checkbox; //input inside the /delete form (list.ejs)
  //Name of the list where the user is trying to delete the item from
  const listName = req.body.listName; //input inside the /delete form (list.ejs)

  //Check if the list name that triggered the post request is equal to today, which means we're in the default list, if not, the new item comes from a custom list.
  if (listName === day){

    //Delete the checked item on the list by its ID
    Item.findByIdAndRemove(checkedItemId)
    .then(result => {
      console.log("Successfully deleted the checked item from the default list: " + result.name);
      //Redirect to refresh the page
      res.redirect("/");
    })
    .catch(err => {
      console.log("An error ocurred deleting the checked item from the default list: " + err)
    })

  } else {
    //Look for the document in the lists collection with the same name as the custom list where the user is trying to delete the item from, and then removes the checked item from the array of items inside the document in the lists collection (that is being done by the $pull operator from mongoDB, which is used for removing elements in arrays)
    List.findOneAndUpdate(
      {name: listName}, // parameter 1: condition
      {$pull: {items: {_id: checkedItemId}}} //parameter 2: what update we wanna make
    )
    .then(result => {
      console.log("Successfully deleted the checked item from the custom list " + result.name);
      res.redirect("/" + listName);
    })
    .catch(err => {
      console.log("An error ocurred deleting the checked item from the custom list: " + err);
    })

  }
  // ALTERNATIVE WAY OF THE ELSE: (but for complex/large/multi-nested arrays its better to use the one from above with the $pull )
  // } else {
  //           List.findOne({name: listName}, function(err, result){
  //               result.items.pull(checkedItemId);
  //               result.save();
  //               res.redirect("/" + listName);
  //
  //       });
  //   }

});

//              *************** ABOUT ROUTE  ******************

app.get("/about", function(req, res){
  res.render("about");

});

app.listen(3000, function() {
  console.log("Server started on port 3000");
});
