"use strict";

const express = require('express'),
	apicache = require('apicache'),
	cache = apicache.middleware,
	bodyParser = require('body-parser'),
	setTimeoutPromise = require('util').promisify(setTimeout);

const app = express();
const calendar = require('./sources/calendar.js');

app.get('/calendar.json',
	cache('30 seconds',(req,res) => res.statusCode === 200),
	(req,res) => {
		calendar.getCal(
			req.query.lang,
			req.query.anno,
			req.query.percorso,
			req.query.corso,
			req.query.date
		).then( generatedJSON => res.json(generatedJSON), reason => {
			res.status(500);
			console.log(reason);
			return res.end('Internal Server Error');
		});
	}
);

app.post('/fromPercorsoToInsegnamenti.json',bodyParser.json({type: 'application/json'}),(req,res) => {
	function getDDMMYYYYDate() {
		function pad(s) { return (s < 10) ? '0' + s : s; }
		var d = new Date();
		return [pad(d.getDate()), pad(d.getMonth()+1), d.getFullYear()].join('-');
	}

	return Promise.all(
		req.body.map( x => calendar.getCal(
				'it',
				x.anno,
				x.percorso,
				x.corso,
				getDDMMYYYYDate()
			).then( data =>
				({
					elenco_attivita : data.elenco_attivita,
					anno: data.annoScolastico,
					percorso: data.codice_percorso,
					corso: data.codice_corso,
					date: data.date
				})
			)
		)
	).then( cals => res.json(cals));
});

app.get('/force_cache/*',(req,res) => {
	const realUrl = req.originalUrl.substring(12,req.originalUrl.length);
	apicache.clear(realUrl);
	res.redirect(realUrl);
});

app.listen(3000);
