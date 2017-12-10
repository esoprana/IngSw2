var http = require('http');
var fetch = require('node-fetch');
var cheerio = require('cheerio');

exports.getEvents = (day) => { // se day è undefined o non corrisponde ad un giorno possibile, ritorna gli eventi del giorno attuale
    const url = 'http://webmagazine.unitn.it/calendario/ateneo/day/'.concat(day);
    var json = [];
    var promises = [];
    
    return fetch(url)
        .then(data => {
            if (data.ok) { return data.text(); }
            else { return Promise.reject('fetch response status: '.concat(data.status)); }
        })
        .then(data => {
            try{
                $ = cheerio.load(data);
            }catch(e) {return Promise.reject('error to load data')}
            
            $('.item .cal-ateneo-visible a').each(function(i, elem) {
                json.push({
                    titolo_evento: $(this).children('span').children('p').text(),
					href: $(this).attr('href'),
					image_src: 'http://webmagazine.unitn.it/'.concat($(this).children('img').attr('src'))
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
                            if($('.views-field-field-evento-data-in-testata').children().text().length == 0) { // data_stringa non definita viene mappata
                                var arraySplit = day.split('-');                                               // nel parametro day dd-mm-yyyy
                                var dataDDMMYYYY = arraySplit.reverse().join('-');
                                data_stringa = dataDDMMYYYY;    
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
            if(json.length == 0) {
                return JSON.stringify('nessun evento in programma per oggi');
            } else {
                return Promise.all(promises).then(data => {
                    return JSON.stringify(json);
                });
            }
        })
        .catch( error => { 
            console.error('errore nel trattamento dati: '.concat(error));
            return 'Problemi di acquisizione dati o nel trattamento dati. Controllare la connessione o i valori dei parametri della richiesta.' ;
        });
}
    