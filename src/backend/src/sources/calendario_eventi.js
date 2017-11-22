/*var http = require('http');
var cheerio = require('cheerio');

const options = {
    hostname: 'webmagazine.unitn.it',
    path: '/calendario/ateneo/day/2017-10-24',
    port: 80,
    method: 'GET'
};

exports.getEvents = () => {
    const req = http.request(options, (res) => {
        res.setEncoding('utf8');

		var json = [];
        res.on('data', (chunk) => {
            $ = cheerio.load(chunk);

            $('.item a').each(function(i, elem) {
				console.log($(this).attr('href'));
				console.log($(this).children('img')[0]);
				json.push({
					href: $(this).attr('href'),
					image_scr: $(this).children('img').eq(0).attr('src')
				});
            });
        });
        res.on('end', () => {
			return JSON.stringify(json);
        });
    });

    req.on('error', (e) => {
        console.error('ERRORE: ' + e.message);
    });

    req.end();

}*/

var http = require('http');
var fetch = require('node-fetch');
var cheerio = require('cheerio');



exports.getEvents = () => {
    const url = 'http://webmagazine.unitn.it/calendario/ateneo/day/2017-10-24';
    return fetch(url)
        .then(data => data.text())
        .then(data => {
          console.log(data);  
		  var json = [];
            $ = cheerio.load(data);

            $('.item a').each(function(i, elem) {
				console.log($(this).attr('href'));
				console.log($(this).children('img')[0]);
				json.push({
					href: $(this).attr('href'),
					image_scr: $(this).children('img').eq(0).attr('src')
				});
        });
			return JSON.stringify(json);
    });

}

    