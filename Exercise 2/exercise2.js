// 2nd Exercise using NodeJS, MongoDB, Mongoose and HTTP Server

// 1) Create Mongoose Schema for User with fields like First Name, Last Name, Email and Password

// 2) Create API using HTTP Server which accepts HTTP Post and returns JSON response

// 3) Create API for /register and /login

// 4) /register API will accept POST parameters as Schema fields above mentioned, will check for unique email and if none found then will save the value to Mongodb and reutrn success

// 5) /login API will accept POST parameters as email and password and return JSON response if the email and password matches

// 6) the response has to be in this JSON format {success: true/false, data: [if success is true], error: [if success is false]}



var http = require('http');
var User = require('./user');       //Mongoose Schema for User 
var client = require('mongodb').MongoClient;

var uri = 'mongodb://@127.0.0.1:27017/users';

var result = { 
    success: false, 
    data: '',
    error:''
};

client.connect(uri, function(error, db) {
  if (error) return console.error(error);

  var collection = db.collection('users');
  var port = 3000;

  var app = http.createServer(function (request, response) {

    if (request.method === 'GET') {
      collection.find().toArray(function(error,results) {
        if (error) return console.error(error);

        var body = JSON.stringify(results);
        response.writeHead(200,{
          'Content-Type':'application/JSON',
          'Content-Length':body.length
        });
        console.log('LIST OF OBJECTS: ');
        console.dir(results);
        response.end(body);
      })
      
    } else if (request.method === 'POST' && (request.url === '/register' || request.url === '/register/')) {
      request.on('data', function(data) {
        console.log('RECEIVED DATA:');
        data = data.toString('utf-8');
        console.log(data);

        try {
          data = JSON.parse(data);
        }
        catch (error) {
          if (error) return console.error(error)
        }

        console.log('email verification: ' + data.email);
        var check_email = data.email;

        collection.find({
            email: check_email
        }).toArray(function(err, docs) {
            if (err) throw err;

            if(docs.length >= 1) {
                console.log('Email ID already exist');
                //console.log(docs);
                response.writeHead(200,{
                    'Content-Type':'application/JSON'
                  });
                  result.success = false;
                  result.data = '';
                  result.error = 'Email ID already exist';
                response.end(JSON.stringify(result));
            }

            else {
                //insert into db
                var newUser = new User(data);
                collection.insert(newUser, function(error, obj) {
                    if (error) return console.error(error);
          
                    console.log('OBJECT IS SAVED: ');
                    console.log(JSON.stringify(obj));
                    var body = JSON.stringify(obj);
                    response.writeHead(200,{
                      'Content-Type':'application/JSON'
                    });
                    result.success = true;
                    result.data = body;
                    result.error = '';
                    response.end(JSON.stringify(result));
                  })
            }
            
        })

        
      })
    } else if (request.method === 'POST' && (request.url === '/login' || request.url === '/login/')) {
        request.on('data', function(data) {
            console.log('RECEIVED DATA:');
            data = data.toString('utf-8');
            console.log(data);
    
            try {
              data = JSON.parse(data);
            }
            catch (error) {
              if (error) return console.error(error)
            }

            var check_email = data.email;
            var check_password = data.password;
            collection.find({
                email: check_email,
                password: check_password
            }).toArray(function(err, docs) {
                if(err) throw err;

                if(docs.length >= 1) {
                    console.log('LOGIN SUCCESSFUL');
                    result.success = true;
                    result.data = JSON.stringify(docs);
                    result.error = '';
                    response.end(JSON.stringify(result));
                } else {
                    console.log('INVALID LOGIN DETAILS');
                    result.success = false;
                    result.data = '';
                    result.error = 'Invalid login details';
                    response.end(JSON.stringify(result));
                }
                
            })
        })

    } else {
    	response.end('This endpoint not supported \n')
    }
  })
  
  app.listen(port)
})
