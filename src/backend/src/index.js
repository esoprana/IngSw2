const express = require('express');
const app = express();
const easyroom = require('./sources/easyroom.js')

app.get('/easyroom.json',(req,res) => {
	easyroom.getIds()
		.then(generatedJSON => {
			res.writeHead(200, { 'Content-Type': 'application/json'});
			res.end(generatedJSON);
		});
});

app.listen(3000);
