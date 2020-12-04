var cookieParser = require('cookie-parser');
var express = require('express');
var session = require('express-session'); // for session page views.
var app = express();
app.set('port', process.env.PORT || 1234);
app.use(cookieParser()); //to initialize cookies

//session page views
app.use(session({
    name : 'tempcookie',
    secret : 'we all love coe457',
    resave :true, // have to do with saving session under various conditions
    saveUninitialized: true, // just leave them as is
    cookie : {
    maxAge:(30 * 60 * 24 * 60)
    }
})); 
 // need

app.use(express.static(__dirname + '/public'));

var wsbroker = "localhost"; //mqtt websocket enabled broker
var wsport = 9001 // port for above

//mongodb
const mongoose = require('mongoose');

//logins
mongoose.connect('mongodb://localhost:27017/logins', { useNewUrlParser: true, useUnifiedTopology: true });
// we create a scheme first 
const userschema = new mongoose.Schema({
    Username: String,
    Email: String,
    Password: String,
    initial:String,
    destination:String
}) //the schema

// we create a collection called usercollection with the userSchema
const users = mongoose.model("Usercollection", userschema);


// create client using the Paho library
var client = new Paho.MQTT.Client(wsbroker, wsport,
    "myclientid_" + parseInt(Math.random() * 100, 10));

var bodyParser = require('body-parser');
// Create application/x-www-form-urlencoded parser
var urlencodedParser = bodyParser.urlencoded({ extended: false }) //for post in express

app.post('/login_post', urlencodedParser, function(req, res) {
    var responselogin = {
    Usernamelogin: req.body.inputUsername,
    Emaillogin: req.body.inputEmail,
    Passwordlogin: req.body.inputPassword,
    Rememberlogin: req.body.inputRemember,
    }
    //res.cookie('userid', Usernamelogin,{maxAge: 2592000}).send('Cookie for '+Usernamelogin+ 'has been set'); //30 days one cookie //one way
    users.find({ Username: responselogin.Usernamelogin, Email: responselogin.Emaillogin, Password: responselogin.Passwordlogin}, function (err, docs) {//checks the database if the credentials are present
        if (err)
            {
                console.log("No such entry");
                res.send("Invalid Password Entry");
            }
        else
            { //if found in the database
                res.sendFile(__dirname+'/1stwebsite.html'); //redirect to this file if present
                $("#username").html("<b>"+responselogin.Usernamelogin+"</b>"); //to print username in the navbar
                checkCookie("userid",responselogin.Usernamelogin); //sets cookie if not done yet, otherwise prints "welcome back to them"
            }
    });
    function leave() // when logout is clicked it redirects to the login page and clears cookie as well 
    {
        res.clearCookie('userid');
    }
});
//a function to set cookie
function setCookie(cname, cvalue, exdays) {
    var d = new Date();
    d.setTime(d.getTime() + (exdays*24*60*60*1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
//a function to get the cookie from the user
function getCookie(cname) {
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
      var c = ca[i];
      while (c.charAt(0) == ' ') {
        c = c.substring(1);
      }
      if (c.indexOf(name) == 0) {
        return c.substring(name.length, c.length);
      }
    }
    return "";
}
//to check if cookie has been assigned and if the user is signing in again
function checkCookie(username,loginname) {
    var username = getCookie("userid");
    if (username != "") {
     $(".username").html("Welcome back " + username); // welcomes the user back if already signed in
    } else {
      if (loginname != "" && loginname != null) {
        setCookie("userid", loginname, 30); //sets the cookie otherwise with the passed username
        $(".username").html(username); //just prints username in navbar
      }
    }
}

app.post('/create_post', urlencodedParser, function(req, res) {
    var responsecreate = {
    Usernamecreate: req.body.inputUsername,
    Emailcreate: req.body.inputEmail,
    Passwordcreate: req.body.inputPassword,
    }
    const userid= new users ({
        Username:responsecreate.Usernamecreate,
        Email:responsecreate.Emailcreate,
        Password:responsecreate.Passwordcreate
    });
    userid.save();//when creating an account. it gets saved in database 
    res.sendFile(__dirname+'1stwebsite.html')//gets redirected to the map
    setCookie('userid',responsecreate.username,30); //sets cookie for 30 days with that username
});

app.post('/locations', urlencodedParser, function(req, res) {
    datanew=JSON.parse(req.data); //parsing the JSON to datanew
    lat=datanew.initiallat;
    long=datanew.initiallng;
    finallat=datanew.destlat;
    finallong=datanew.destlng; //obtaining the latitude and longitude details from the JSON
    var locations = 
    {
    initialloc:lat+long,
    finalloc:finallat+finallong
    } //saving the locations
    const userid= new users ({
        initial:locations.initialloc,
        destination:locations.finalloc
    }); //saving the location to the database
    userid.save();//the locations gets saved to the database
});


client.onConnectionLost = function (responseObject) {
console.log("connection lost: " + responseObject.errorMessage);
};

client.onMessageArrived = function (message) {
console.log(message.destinationName, ' -- ', message.payloadString);
};

var options = {
timeout: 3,
onSuccess: function () {
console.log("mqtt connected");
client.subscribe("coe457/locations", { qos: 1 });
},
onFailure: function (message) {
console.log("Connection failed: " + message.errorMessage);
}
};


// custom 404 page 
app.use(function(req, res) {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not Found');
});

// custom 500 page 
app.use(function(err, req, res, next) {
    console.error(err.stack);
    res.type('text/plain');
    res.status(500);
    res.send('500 - Server Error');
});

app.listen(app.get('port'), function() {
    console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});