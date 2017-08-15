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

// THIS RETURNS ALL ITEM BY ID NUMBER
//METHOD: getURL: /ITEMS/{ID}
//RESPONSE: {ID: INTEGER}, DESCRIPTION, COST QUANTITIY
//}
app.get("/items/all", function(req, res, next){
   const sql =  `
    Select * FROM items
   `
   conn.query(sql, [req.params.id], function(err, results, fields){
     res.json(results)
   })
})
// THIS RETURNS 1 ITEM BY ID NUMBER
//METHOD: getURL: /ITEMS/{ID}
//RESPONSE: {ID: INTEGER}, DESCRIPTION, COST QUANTITIY
//}
app.get("/items/:id", function(req, res, next){
   const sql =  `
    Select * FROM items id = ?
   `
   conn.query(sql, [req.params.id], function(err, results, fields){
     res.json(results[0])
     if (!err) {
       res.json({
         success: true,
         message: "item was created",
         id: results.insertId
       })
     } else {
         console.log(err + " return 1 item by id number")
         res.json({
           success: false,
           message: "did not return 1 item by id number",
         })
       }
   })
})
//Add a new item in the vending machine
// description
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
        success: true,
        message: "item was created",
        id: results.insertId
      })
    } else {
        console.log(err + " add a new item in the vending machine")
        res.json({
          success: false,
          message: " new item was not created",
        })
    }
  })
})
//This will update an existing record
app.put("/items/:id", function(req, res, next){
  const description = req.body.description
  const cost = req.body.cost
  const quantity = req.body.quantity

  const sql = `
    UPDATE items
    SET description = ?, cost = ?, quantity = ?
    WHERE ID = ?
  `
  conn.query(sql, [description, cost, quantity], function (err, results, fields){
    if (!err) {
      res.json({
        success: true,
        message: "item was created",
        id: results.insertId
      })
    } else {
        console.log(err + " update of an existing record")
        res.json({
          success: false,
          message: "update of an existing record did not occur",
        })
    }
  })
})

//Add a purchased item into the purchased table of the vending machine
app.post("/item/purch/:itemid", function(req, res, next){
  const itemid = req.params.itemid

   const sql =  `
   SELECT * FROM Items
      where quantity > 0 and id = ?
   `
   conn.query(sql, [req.params.itemid], function(err, results, fields){
     if (err){
       console.log(err + " sql1")
       res.json({
         success: false,
         message: "purchase was not created",
       })
     } else {
  const sql2 = `
    INSERT INTO purchases (itemid)
    VALUES (?)
  `
  conn.query(sql2, [itemid], function (err, results, fields) {
       console.log(err + " sql2" , results, fields)
      res.json({
        success: true,
        message: "purchased item was created",
      //  id: results.insertId
        })
      })
    }
  })
})

app.listen(3000, function(){
  console.log("App running on port 3000")
})
