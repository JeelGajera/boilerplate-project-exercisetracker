/*************/

const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

// Basic Configs 
const app = express();
const mySecret = process.env['MONGO_URI'];
mongoose.connect(mySecret, { useNewUrlParser: true, useUnifiedTopology: true });
app.use(cors());
app.use(bodyParser.urlencoded({extended:false}));
app.use(express.json());

app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// DB: Schema define 
const { Schema } = mongoose;

 const userSchema = new Schema ({
   "username": { type : String, qnique : true},
 });

const exerciseSchema = new Schema({
  "username": String,
  "date": String,
  "duration": Number,
  "description": String,
});

const logSchema = new Schema({
  "username": String,
  "count": Number,
  "log": Array,
});

// DB: Model define 
const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model('exerciseInfo', exerciseSchema);
const Log = mongoose.model('logInfo', logSchema);

// POST: New User 
app.post('/api/users', (req, res) => {
  const newUser = new User({ username : req.body.username });
  newUser.save((err, data) => {
    if(err) {
      res.send("Username Already Taken :)")
    } else {
      res.json({
        username : data.username,
        _id : data.id
      });
    }
  })
});

// Get: All Users 
app.get("/api/users", (req, res) => {
  User.find({}, (err, data) => {
    if(err || !data) {
      console.log(err);
      res.json("User Data Not Found :(")
    } else {
      res.json(data);
    }
  })
})

// POST: Add Excersices 
app.post("/api/users/:_id/exercises", (req, res) => {
  try {
    const { _id } = req.params;
  let validDate = new Date(req.body.date);
  let handleDate = () => {
    if(validDate) {
      return validDate.toDateString();
    } else {
      validDate = new Date().toISOString().slice(0, 10).toDateString();
    }
  }
  User.findById(_id, (err, data) => {
    handleDate(validDate);
    if(err || !data) { 
      console.log(err);
      res.send("Unknown UserID :("); 
    } else {
      const newExercise = new Exercise({
        username : data.username,
        description : req.body.description,
        duration : req.body.duration,
        date : validDate
      });
      newExercise.save((err, data) => {
        if(err) {
          return console.log(err);
        } else {
          res.json({
            _id : _id,
            username : data.username,
            description : data.description,
            duration : data.duration,
            date : data.date
          });
        }
      })
    }
  });
  } catch(e) {
    console.log(e);
  }
});

// Get: User full Logs 
app.get('/api/users/:_id/logs', (req, res) => {
  try {
    let dFrom = req.query.from;
  let dTo = req.query.to;
  let limit = req.query.limit;
  let idJson = { "id": req.params._id };
  let idToCheck = idJson.id;
  User.findById(idToCheck, (err, data) => {
    var query = {
      username: data.username
    }
    if (dFrom !== undefined && dTo === undefined) {
      query.date = { $gte: new Date(dFrom)}
    } else if (dTo !== undefined && dFrom === undefined) {
      query.date = { $lte: new Date(dTo) }
    } else if (dFrom !== undefined && dTo !== undefined) {
      query.date = { $gte: new Date(dFrom), $lte: new Date(dTo)}
    }

    let limitChecker = (limit) => {
      let maxLimit = 100;
      if (limit) {
        return limit;
      } else {
        return maxLimit
      }
    }
    
    if(err || !data) {
      res.send("User Not Found :(");
    } else {
      Exercise.find((query), null, {limit: limitChecker(+limit)}, (err, exData) => {
        if(err || !data) {
          console.log(err);
          res.send("User Info Not Found :(");
        } else {
          let logArr = exData.map((i) => {
            return {
              description : i.description,
              duration : i.duration,
              date : i.date
            }
          })
          const newLog = new Log({
            username : data.username,
            count : logArr.length,
            log : logArr
          })
          newLog.save((err, data) => {
            if(err) {
              console.log(err);
              res.send("User Info Not Found :(");
            } else {
              res.json({
                _id : idToCheck,
                username : data.username,
                count : data.count,
                log : logArr
              })
            }
          })
        }
      })
    }
  });
  } catch(e) {
    console.log(e);
  }
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
});
/************/