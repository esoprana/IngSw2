const express = require('express');
const app = express();
const calendario_eventi = require('./sources/calendario_eventi.js');
const sessioni = require('./sources/sessioni.js');

app.get('/calendario_eventi.json',(req,res) => {
	calendario_eventi.getEvents()
		.then(generatedJSON => {
			res.writeHead(200, { 'Content-Type': 'application/json'});
			res.end(generatedJSON);
		});
});

app.get('/sessioni.json',(req,res) => {
	sessioni.getSessions(   /* dati di esempio */
		'et_cd1',
        '2016',
        '0428H',
        'Unico|1',
        '61',
        'it'
	).then(generatedJSON => {
		res.writeHead(200, { 'Content-Type': 'application/json'});
		res.end(generatedJSON);
	});

});


app.listen(3000);