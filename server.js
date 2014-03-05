
var express = require('express');
var cors = require('cors');

var app = express(), 
	server = require('http').createServer(app), 
	io = require('socket.io').listen(server);

var idNum = 6;

var shortens = [
	{ id:'id1', url:'www.google.es', count:0 },
	{ id:'id2', url:'www.google.pt', count:0 },
	{ id:'id3', url:'www.google.co.uk', count:0 },
	{ id:'id4', url:'www.google.br', count:0 },
	{ id:'id5', url:'www.google.it', count:0 }
];

var listSockets = [];

app.use( express.urlencoded() );
app.use( cors() );

app.get('/', function(req, res){
	res.send(shortens);
});

//curl localhost:8000/aaa
app.get('/:url', function(req, res){
	var parm = req.params['url'];

	var link = '';
	for (var i=0; i<shortens.length; i++){
		if (shortens[i].id == parm){
			link = shortens[i].url;
			break;
		}
	}
	console.log(link);
	if (link != ''){
		var aux = link.indexOf("http:");
		if (aux == -1){
			res.redirect('http://' + link);
		}
		else{
			res.redirect(link);
		}
		
		shortens[i].count++;
	}
	// console.log(req.params);
	res.send('url: ' + link);
});

app.post('/', function(req, res){
	if(req.body.hasOwnProperty('url')){

		var shorten = undefined;

		for(var i = 0; i < shortens.length; i++){
			if (shortens[i].url == req.body['url']){
				shorten = shortens[i];
				break;
			}
		}

		if (shorten === undefined){
			shorten = {
				id: 'id' + idNum++, 
				url: req.body['url'], 
				count: 0
			};
			shortens.push(shorten);
		}

		console.log('ok');
		res.send(req.body);
	}
	else{
		console.log('invalid');
		res.send('Invalid shorten');
	}
});

io.sockets.on('connection', function (socket) {
	listSockets.push(socket);

	socket.emit('saudacoes', { hello: 'olá amigo, nao metas imagens nos shortens please.' });
}


//app.listen(8000);
server.listen(8000);


