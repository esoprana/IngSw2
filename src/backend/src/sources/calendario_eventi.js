var http = require('http');
var fetch = require('node-fetch');
var cheerio = require('cheerio');

exports.getEvents = (day) => {
    const url = 'http://webmagazine.unitn.it/calendario/ateneo/day/'.concat(day);
    var json = [];
    var promises = [];
    return fetch(url)
        .then(data => data.text())
        .then(data => {  
            $ = cheerio.load(data);

            $('.item .cal-ateneo-visible a').each(function(i, elem) {
                json.push({
                    titolo_evento: $(this).children('span').children('p').text(),
					href: $(this).attr('href'),
					image_scr: 'http://webmagazine.unitn.it/'.concat($(this).children('img').attr('src'))
				});
                promises.push(
                    fetch($(this).attr('href'))
                        .then(data => data.text())
                        .then(data => {
                            $ = cheerio.load(data);
                            if($('.nome-struttura p a').text().length == 0) {
                                dipartimento = 'NON DEFINITO';
                            } else {
                                dipartimento = $('.nome-struttura p a').text();
                            }
                            json[i].dipartimento = dipartimento;
                            if($('.views-field-field-evento-data-in-testata').children().text().length == 0) {
                                data_stringa = 'NON DEFINITA';
                            } else {
                                data_stringa = $('.views-field-field-evento-data-in-testata').children().text();
                            }
                            json[i].data_stringa = data_stringa;
                        })
                );
            });
            return json;
        })
        .then(jsonData => {
            return Promise.all(promises).then(data => {return JSON.stringify(json);});
        })
        .catch( error => console.error(error) );
}
    