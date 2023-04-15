//*** IMPORTANT!! : This is my own little module for generating the current date, its separated in another module because this code is not related to the route and shouldnt be cluttering the app inside the app.js file.

//this line is required to export this module´s function in order to use it inside app.js. For each funtcion I need to add one of these lines.
//module and exports are both objects {}, we can look at it by console logging module. Exports was empty so it wasnt exporting anything, so we need to specify what to export, in this case its a function what we need.
//console.log(module);
module.exports.getDate = getDate;
//NOTE: the function here is written without the () because we are not calling it to use it here inside the module, it needs to be activated inside app.js

//Date() gets the current DATE
//rest of the code changes the current DATE to a desired format (specified in the object "options") and .toLocaleDateString("region") converts a date to string. (Example: Tuesday, April 4)
function getDate() {

  const today = new Date();

  const options = {
    weekday: "long",
    day: "numeric",
    month: "long"
  };

  return today.toLocaleDateString("en-US", options);

}


//This is another way of declaring a JS function to shortern the code, by using an annonymous function and storing it.
//also, we can refer to exports without using module.
exports.getDay = function() {

  const today = new Date();

  const options = {
    weekday: "long"
  };

  return today.toLocaleDateString("en-US", options);

}
