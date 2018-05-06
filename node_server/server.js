var util = require('util');
var SerialPort = require('serialport');
var WebSocket = require('ws').Server;

var wss = new WebSocket({ port: 8085 });
var port = new SerialPort("COM4", {
    baudRate: 19200
});

var connections = [];
// Define Functions
port.on('open', showPortOpen);
port.on('data', sendSerialData);
port.on('close', showPortClose);
port.on('error', showError);

function showPortOpen() {
    console.log('port open. Data rate: ' + port.options.baudRate);
}

// Read Serial Data
function sendSerialData(data) {
    if (connections.length > 0) {
        broadcast(data);
    }
}

function showPortClose() {
    console.log('port closed.');
}

function showError(error) {
    console.log('Serial port error: ' + error);
}


// WebSockets
wss.on('connection', handleConnection);

function handleConnection(client) {
    console.log("New Connection");
    connections.push(client);
    client.on('close', function () {
        console.log("connection closed");
        var position = connections.indexOf(client);
        connections.splice(position, 1);
    });

    // Read Data from Client (web browser)
    client.on('message', function(e) {
        console.log('SENT DATA => ' + e);
        port.write(e, function(err, results) {
		    });
    });
}

// Send Data to Client (web browser)
function broadcast(data) {
    for (myConnection in connections) {
		console.log('READ DATA => ' + data.toString());
        connections[myConnection].send(data.toString());
    }
}


// UNCOMMENT FOR DEVELOPMENT TESTING
/*setInterval(function() {
	sendSerialData('sp'+ parseInt(Math.random() * (45 - 0) + 0)+ 'X');
}, 500);

setInterval(function() {
	sendSerialData('bv'+ (Math.floor(Math.random() * (675 - 435 + 1) ) + 435)+ 'X');
}, 5000);

setInterval(function() {
	sendSerialData('mt'+ (Math.floor(Math.random() * (100 - 1 + 1) ) + 1)+ 'X');
}, 7000);*/