const express = require('express')
const app = express()
const path = require('path')
const mustacheExpress = require('mustache-express');
const bodyParser = require('body-parser')
const config = require('config')
const mysql = require('mysql')

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.engine('mustache', mustacheExpress())
app.set('views', './views')
app.set('view engine', 'mustache')
app.use(express.static(path.join(__dirname, 'static')))

// before you use this, make sure to update the default.json file in /config
const conn = mysql.createConnection({
  host: config.get('db.host'),
  database: config.get('db.database'),
  user: config.get('db.user'),
  password: config.get('db.password')
})

app.get("/", function(req, res, next){
  res.render("index", {appType:"Express"})
})

//A customer gets a list of the current items, their costs,
//and quantities of those items
app.get("/items/all", function(req, res, next){
   const sql =  `
    Select * FROM items
   `
   conn.query(sql, [req.params.id], function(err, results, fields){
     res.json(results)
   })
})
//       Not needed for project////
// THIS RETURNS 1 ITEM BY ID NUMBER
//METHOD: getURL: /ITEMS/{ID}
//RESPONSE: {ID: INTEGER}, DESCRIPTION, COST QUANTITIY
//}
// app.get("/items/:id", function(req, res, next){
//    const sql =  `
//     Select * FROM items id = ?
//    `
//    conn.query(sql, [req.params.id], function(err, results, fields){
//      res.json(results[0])
//      if (!err) {
//        res.json({
//          success: true,
//          message: "item was created",
//          id: results.insertId
//        })
//      } else {
//          console.log(err + " return 1 item by id number")
//          res.json({
//            success: false,
//            data:(results),
//            message: "did not return 1 item by id number",
//          })
//        }
//    })
// })

//A customer should be able to buy an item using money
//Making a purchase nd get correct change///

//the following is not neede for project as per Ryan 8/18
// the current code will return change as success but also
//asks for money due (a negative number) as a success. In
//the future update the method when more money is due as a fail.

app.post("/items/money/:itemid", function(req, res, next){
  const itemid1 = req.params.itemid

  const sql0= `
      SELECT (50 - cost) AS sum
      from items
      where id = ?
  `

  conn.query(sql0, [req.params.itemid], function(err, results, fields){
    if (err) {
      res.json({
        status: "fail",
        data:(err),
        message: "Please add additional change",
      })

    } else{
  conn.query(sql0, [req.params.itemid], function(err, results, fields){
           res.json({
            status: "success",
            data:(results),
            message: "Please take your change",

          })
      })
    }
  })
})
////////
//Customer purchasing an item
app.post("/items/purch/:itemid", function(req, res, next){
  const itemid = req.params.itemid

//A customer should not be able to buy items that are not in the machine
// but instead get an error
//verify the item is in the machine, if the item is not
//in the machine return a message to purchase something else

  const sql = `
      SELECT * FROM items
      WHERE quantity = 0 and id = ?
  `
  conn.query(sql, [req.params.itemid], function(err, results, fields){
    if (err || results.length > 0){
      res.json({
        status: "fail",
        data:(results),
        message: "Currently your item is out of stock, please make a different purchase",
      })
    } else {
//Item is in the machine:
//subtract 1 from quantity and add 1 to the purchase column
   const sql1 =  `
      UPDATE items
      SET quantity = quantity - 1,
          purchased = purchased + 1
      WHERE id = ?
   `
   conn.query(sql1, [req.params.itemid], function(err, results, fields){
     if (err){
       console.log(err + " sql1")
       res.json({
         status: "fail",
         data:(results),
         message: "purchase was not completed",
       })
     } else {
//Insert the purchased item into the purchase table
  const sql2 = `
    INSERT INTO purchases (itemid)
    VALUES (?)
  `
  conn.query(sql2, [itemid], function (err, results, fields) {
      res.json({
        status: "success",
        data:(results),
        message: "purchased item was placed in the purchased table",
            })
          })
        }
      })
    }
  })
})
//A vendor should be able to see total amount of money in machine
app.get("/purchased/total", function(req, res, next){
   const sql =  `
    SELECT SUM(purchased * cost) AS sum
    FROM items
   `
   conn.query(sql, [req.params.id], function(err, results, fields){
     res.json(results)
   })
})

//A vendor should be able to see a list of all purchases
//with their time of purchase
app.get("/purchases/all", function(req, res, next){
   const sql =  `
    Select * FROM purchases
   `
   conn.query(sql, [req.params.id], function(err, results, fields){
     res.json(results)
   })
})

//A vendor should be able to update the description,
//quantity, and costs of items in the machine

//This will update an existing item in the item table
app.put("/items/:id", function(req, res, next){
  const description = req.body.description
  const cost = req.body.cost
  const quantity = req.body.quantity

  const sql = `
    UPDATE items
    SET description = ?, cost = ?, quantity = ?
    WHERE id = ?
  `
  conn.query(sql, [description, cost, quantity, req.params.id], function (err, results, fields){
    if (!err) {
      res.json({
        status: "success",
        message: "item was updated",
        description:  description,
        cost: cost,
        quantity: quantity,
        id: results.insertId
      })
    } else {
        console.log(err + " update of an existing record")
        res.json({
          status: "fail",
          data: (results),
          message: "update of an existing record did not occur",
        })
    }
  })
})

//A vendor should be able to add a new item to the machine
//Add a new item in the vending machine
app.post("/items/add", function(req, res, next){
  const description = req.body.description
  const cost = req.body.cost
  const quantity = req.body.quantity

  const sql = `
    INSERT INTO items (description, cost, quantity)
    VALUES (?, ?, ?)
  `
  conn.query(sql, [description, cost, quantity], function (err, results, fields){
    if (!err) {
      res.json({
        status: "success",
        message: "item was added to the vending machine",
        id: results.insertId
      })
    } else {
        console.log(err + " add a new item in the vending machine")
        res.json({
          status: "fail",
          data:(results),
          message: " new item was not created",
        })
    }
  })
})

app.listen(3000, function(){
  console.log("App running on port 3000")
})
