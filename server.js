
var express = require('express');
var cors = require('cors');
var crypto = require('crypto');
var assert = require('assert');

var HMAC_ALG = 'sha1';
// var HMAC_KEY = process.env.KEY;
var HMAC_KEY = 'glorioso';

//var MAX_SESSION_SECONDS = 60 * 60 * 2;
var MAX_SESSION_SECONDS = 60;

assert(HMAC_KEY, 'KEY is not defined!');

var app = express(), 
	server = require('http').createServer(app), 
	io = require('socket.io').listen(server);

var EventEmitter = require('events').EventEmitter;
var ee = new EventEmitter();

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

// ----- Tratamento validação
app.post('/login', function(req, res){
	var user = req.body['user'];
	var pass = req.body['password'];
	var resp = {token: '', erro: ''}

	console.log('user: ' + user + ', pass: ' + pass);

	if(! validate(user, pass)){
		resp.erro = 'Password inválida';
		res.send(resp)
	}

	resp.token = generateToken(user);
	res.send(resp);
});

function generateToken(username) {
	var now = Math.floor(Date.now() / 1000);

	var sign = crypto.createHmac(HMAC_ALG, HMAC_KEY).update(username+':'+now).digest('base64');

	return JSON.stringify({ ts: now, username: username, sign: sign });
}

function validate(username, password) {
	return username.substring(0, 3) === password;
}
// ----- Fim tratamento validação

app.post('/', function(req, res){
	var resposta = {obj: {}, erro: ''}

	// só permite inserção de shortens se tiver um token válido
	var token = req.header('X-Auth-Token');

	if(! validateToken(token)){
		console.log('Token inválido');
		resposta.erro = 'Invalid token, not authorized';
		res.send(resposta);
		return;
	}

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

			ee.emit('newShorten', shorten);
		}

		console.log('ok');
		resposta.obj = req.body;
		res.send(resposta);
	}
	else{
		console.log('invalid');
		esposta.erro = 'Invalid shorten';
		res.send(resposta);
	}
});

function validateToken(token){
	var obj;
	try {
		obj = JSON.parse(token);
	} catch(ex) {
		return false;
	}

	if (Math.floor(Date.now()/1000) - obj.ts > MAX_SESSION_SECONDS)
		return false;

	return obj.sign === generateSign(obj.username, obj.ts);
};

function generateSign(username, ts) {
	var sign = crypto.createHmac(HMAC_ALG, HMAC_KEY).update(username+':'+ts).digest('base64');
	return sign;
}

io.sockets.on('connection', function (socket) {

	function emitShorten(pShort){ socket.emit('respNewShorten', pShort); }

	ee.addListener('newShorten', emitShorten);

	socket.on('disconnect', function(){
		ee.removeListener('newShorten', emitShorten);
	});

	socket.emit('saudacoes', { hello: 'olá amigo, nao metas imagens nos shortens please.' });

	/*socket.on('pedidoShortens', function (socket){
		socket.emit('listShortens', shortens);
	});*/
});


//app.listen(8000);
server.listen(8000);


