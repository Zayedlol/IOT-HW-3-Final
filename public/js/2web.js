var wsbroker = "localhost"; //mqtt websocket enabled broker
var wsport = 9001 // port for above
var client = new Paho.MQTT.Client(wsbroker, wsport,"myclientid_" + parseInt(Math.random() * 100, 10));
var data; //to send to mqtt broker
client.onConnectionLost = function (responseObject) {
console.log("connection lost: " + responseObject.errorMessage);
};  
client.onMessageArrived = function (message) { //once the data arrives in the form of JSON string
data=JSON.parse(message);//convert
lat=data.initiallat;
long=data.initiallng;
finallat=data.destlat;
finallong=data.destlng;
longdiff= finallong-long;
latdiff= finallat-lat;
//to obtain the angle between them
var angle=Math.atan2(longdiff,latdiff) * 180 / Math.PI;
console.log("Going to rotate as the jpg  is at -45 deg. Hence rotate at an angle : " + angle);
var finalangle=-45+angle; 
$(".maparrow").css('transform', 'rotate('+finalangle+'deg)' ); //adjusts arrow pic accordingly
};
var options = {
timeout: 3,
onSuccess: function () {
console.log("mqtt connected");
client.subscribe("coe457/locations", { qos: 1 }); //subscribes to this topic to get the message
},
onFailure: function (message) {
console.log("Connection failed: " + message.errorMessage); 
}
};
function recievedata()
{
    //to get the values from the broker
    client.connect(options)  //calls options and prints the arrow in 2ndwebsite as the message arrives from the 1st website
}
