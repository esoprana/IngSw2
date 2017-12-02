const express = require('express'),
	apicache = require('apicache'),
	easyroom = require('./sources/easyroom.js');

const app = express();
const cache = apicache
	.options({ headers: {'cache-control': 'no-cache' }})
	.middleware;

app.get('/codes.json',cache('1 day'),(req,res) => {
	easyroom.getIds()
		.then(json => res.json(json));
});

app.get('/force_cache/*',(req,res) => {
	const realUrl = req.originalUrl.substring(12,req.originalUrl.length);
	apicache.clear(realUrl);
	res.redirect(realUrl);
});


app.listen(3000);
