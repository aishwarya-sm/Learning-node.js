// Exercise 3:
// 1) Replace HTTP Server Library used in the previous exercise with Express
// 2) Use Express Middleware to create a Security API Endpoint
// 3) Create a new API in the previous exercise `/user-info/{:userId}` which returns User Information for the given user id
// 4) Make sure the above endpoint is secure, and no one can call it without setting an Authorisation Header value
// 5) Validate the incoming Authorization Header value, and it should match the Master key for validation




var express = require('express');
var app = express();

var User = require('./user');       //Mongoose Schema for User 
var client = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectID;

var jwt = require('jsonwebtoken');

var uri = 'mongodb://localhost:27017/users';

var result = { 
    success: false, 
    data: '',
    error:''
};


app.use(require('body-parser').json())

client.connect(uri, function(error, db) {
    if(error) throw error;

    var collection = db.collection('users');

    //just to take email and password for login
    //not specified in the problem statement
    app.get('/', function(req,res,next) {
        collection.find().toArray(function(error,results) {
            if (error) return console.error(error);

            res.send(results);
        })
    })

    //register a new user with unique email id
    app.post('/register', function(req,res,next) {
        console.log('verification: ' + JSON.stringify(req.body));
        var check_email =  req.body.email;
        
        collection.find({
            email: check_email
        }).toArray(function(err, docs) {
                    if (err) throw err;
        
                    if(docs.length >= 1) {
                        console.log('Email ID already exist');
                          result.success = false;
                          result.data = '';
                          result.error = 'Email ID already exist';
                          res.json(result);
                    } else {
                        //register a new user in db
                        var newUser = new User(req.body);
                        collection.insert(newUser, function(error, obj) {
                            if (error) return console.error(error);
                  
                            console.log('OBJECT IS SAVED: ');
                            console.log(JSON.stringify(obj));
                            
                            result.success = true;
                            result.data = req.body;
                            result.error = '';
                            res.json(result);
                          })
                    }
                })
    })


    var apiRoutes = express.Router(); 
 
    
    // route to authenticate a user
    apiRoutes.post('/login', function(req, res,next) {
    
      // find the user
      collection.findOne({
        email: req.body.email
      }, function(err, user) {
    
        if (err) throw err;
    
        if (!user) {
          res.json({ success: false, message: 'Authentication failed. User not found.' });
        } else if (user) {
    
          // check if password matches
          if (user.password != req.body.password) {
            res.json({ success: false, message: 'Authentication failed. Wrong password.' });
          } else {
    
            // if user is found and password is right
            // create a token
            var token = jwt.sign(user,'key');
    
            // return the information including token as JSON
            res.json({
              success: true,
              message: 'Use this token',
              token: token
            });
          }   
    
        }
    
      });

    });

    

    // route middleware to verify a token
    apiRoutes.use(function(req, res, next) {
    
      // check header or url parameters or post parameters for token
      var token = req.body.token || req.query.token || req.headers['x-access-token'];
    
      // decode token
      if (token) {
    
        // verifies secret and checks exp
        jwt.verify(token, 'key', function(err, decoded) {      
          if (err) {
            return res.json({ success: false, message: 'Failed to authenticate token.' });    
          } else {
            // if everything is good, save to request for use in other routes
            req.decoded = decoded;   
            next();
          }
        });
    
      } else {
    
        // if there is no token
        // return an error
        return res.status(403).send({ 
            success: false, 
            message: 'No token provided.' 
        });
    
      }
    });

    apiRoutes.get('/', function(req, res) {
        res.json({ message: 'You are authenticated!' });
      });


    //provide _id of a user to see user details
    apiRoutes.get('/user-info/:userId', function(req, res){
        //res.send('The id you specified is ' + req.params.userId);

        var idSent = req.params.userId;
        
        collection.find(
            {
                _id: ObjectId(idSent)
                
            }
         ).toArray(function(error,results) {
            if (error) return console.error(error);

            res.send('User details for the given user ID: \n' + JSON.stringify(results[0]));
        })
     });
  
    app.use('/api', apiRoutes);

})

app.listen(3000);