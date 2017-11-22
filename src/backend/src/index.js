const express = require('express');
const app = express();
const calendar = require('./sources/calendar.js')

app.get('/calendar.json',(req,res) => {
	calendar.getCal(
		req.query._lang,
		req.query.anno,
		req.query.anno2,
		req.query.codes,
		req.query.corso,
		req.query.date
	).then(generatedJSON => {
		res.writeHead(200, { 'Content-Type': 'application/json'});
		res.end(generatedJSON);
	});

});

app.listen(3000);
