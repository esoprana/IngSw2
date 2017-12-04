const express = require('express');
const app = express();
const calendario_eventi = require('./sources/calendario_eventi.js');
const sessioni = require('./sources/sessioni.js');

app.get('/calendario_eventi.json',(req,res) => {
	calendario_eventi.getEvents(req.query.day)
		.then(generatedJSON => {
			res.writeHead(200, { 'Content-Type': 'application/json'});
			res.end(generatedJSON);
		});
});

app.get('/sessioni.json',(req,res) => {
	sessioni.getSessions(
		req.query.formtype,
        req.query.anno,
        req.query.cdl,
        req.query.annocdl,
        req.query.sessione,
        req.query._lang
	).then(generatedJSON => {
		res.writeHead(200, { 'Content-Type': 'application/json'});
		res.end(generatedJSON);
	});

});


app.listen(3000);