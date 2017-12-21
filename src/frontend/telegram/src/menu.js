'use strict';
var scope;
var codiceAnno = '';
var codiceCorso = '';
var codicePercorso = '';
var sessione = false;



function init($, _sessione = false) {

    scope = $;
    sessione = _sessione
    backendHttpRequest('/api/corsi', getAnni);

}
function isoWeek(date = new Date()) {

    var day = date.getDay()
    var diff = date.getDate() - day + (day == 0 ? -6 : 1);

    let isoTime = '00:00:00.000Z'

    let timestampInizio = new Date(date.setDate(diff)).toISOString()
    timestampInizio = timestampInizio.substring(0, timestampInizio.length - 13) + isoTime;

    let timestampFine = new Date(date.setDate(diff + 5)).toISOString()//5 =giorni da lunedì di settimana universitaria
    timestampFine = timestampFine.substring(0, timestampFine.length - 13) + isoTime;

    return ("timestampInizio=" + timestampInizio + "&timestampFine=" + timestampFine)
}
function backendHttpRequest(path, handler) {
    var http = require('http');
    var options = {
        host: 'shielded-brook-92534.herokuapp.com',
        path: path,
        port: '80'
    };

    var req = http.get(options, function (res) {
        var body = '';
        res.on('data', function (chunk) {
            body += chunk;
        });
        res.on('end', function () {
            handler(body);

        });
    }).on('error', function (e) {
        console.log("Got error: " + e.message);
    });


}

function getAnni(jsonAnni) {


    let jsonMenu = {
        layout: 1,
        method: "sendMessage",
        params: ["Corso di quale anno?"],// si potrebbe sostituire con una variabile
    }

    jsonMenu['menu'] = []
    var jsonAnni = JSON.parse(jsonAnni)

    for (let i = 0; i < jsonAnni.length; i++) {
        let j = i;
        jsonMenu['menu'].push(
            {
                text: jsonAnni[j],
                callback: (callbackQuery, message) => {
                    codiceAnno = jsonAnni[j]
                    backendHttpRequest("/api/corsi/" + jsonAnni[j] + "/", getCorsi)
                }
            });
    }

    scope.runInlineMenu(jsonMenu)
}
function getCorsi(jsonCorsi) {

    let jsonMenu = {
        layout: 1,
        method: "sendMessage",
        params: ["Quale corso?"],// si potrebbe sostituire con una variabile
    }
    jsonMenu['menu'] = []
    var jsonCorsi = JSON.parse(jsonCorsi)
    //poi modificare da gruppi di 5 in 5, per il momento solo un listone

    for (let corso in jsonCorsi.corsi) {

        var labelCorso = JSON.stringify(jsonCorsi.corsi[corso].label);
        var labelCorso = labelCorso.substring(1, labelCorso.length - 1)
        jsonMenu['menu'].push(
            {
                text: labelCorso,
                callback: (callbackQuery, message) => {
                    codiceCorso = corso
                    getPercorso(jsonCorsi)
                }
            });
    }
    scope.runInlineMenu(jsonMenu)
}

function getPercorso(jsonCorsi) {

    let jsonMenu = {
        layout: 1,
        method: "sendMessage",
        params: ["Quale percorso?"],
    }
    jsonMenu['menu'] = []

    for (let percorso in jsonCorsi.corsi[codiceCorso].elenco_anni) {
        let labelPercorso = JSON.stringify(jsonCorsi.corsi[codiceCorso].elenco_anni[percorso].label)
        labelPercorso = labelPercorso.substring(2, labelPercorso.length - 2)

        jsonMenu['menu'].push(
            {
                text: labelPercorso,
                callback: (callbackQuery, message) => {

                    codicePercorso = percorso
                    if (!sessione) {
                        backendHttpRequest('/api/orari/corsi/' + codiceAnno + '/' + codiceCorso + '/' + codicePercorso + '?' + isoWeek() + '&deNorm', getOrario);
                    }
                    else {
                        backendHttpRequest('/api/corsi/' + codiceAnno + '/' + codiceCorso + '/' + codicePercorso + '?' + '&deNorm', getSessione);

                    }
                }
            });
    }


    scope.runInlineMenu(jsonMenu)
}
function getSessione(jsonSessione) {
    let messaggio = '';

    jsonSessione = JSON.parse(jsonSessione)
   if(jsonSessione.percorso.label!==undefined)
   {messaggio+=jsonSessione.percorso.label+"\n\n"}
    for (let sessione in jsonSessione.percorso.elenco_sessioni) {
        if (sessione !== undefined) { messaggio += jsonSessione.percorso.elenco_sessioni[sessione].label + "\n" }
    }
    messaggio += "\n"
    for (let attivita in jsonSessione.percorso.elenco_attivita) {
        if (attivita !== undefined) { messaggio += jsonSessione.percorso.elenco_attivita[attivita].label + "\n" }
    }
    
    if(messaggio!==''){
        scope.sendMessage(messaggio)
    }
    else{
        scope.sendMessage("Non ci sono dati sulle sessioni... :(")
    }
}

function getOrario(jsonOrario) {
    let giornoPrecedente = '';
    let messaggio = '';
    jsonOrario = JSON.parse(jsonOrario);
    if ((jsonOrario.elenco_lezioni).length === 0) {
        scope.sendMessage('Non ci sono dati per questo percorso, nella settimana corrente! :(')
    }
    for (let i = 0; i < (jsonOrario.elenco_lezioni).length; i++) {




        let corso = JSON.stringify((jsonOrario.elenco_lezioni[i].insegnamento.nome_insegnamento))
        let data = JSON.stringify((jsonOrario.elenco_lezioni[i].timestamp_inizio)).substring(0, 11);
        let anno = data.substring(1, 5)
        let mese = data.substring(6, 8)
        let giorno = data.substring(9, 11)
        let oraInizio = JSON.stringify((jsonOrario.elenco_lezioni[i].timestamp_inizio)).substring(12, 17)
        let oraFine = JSON.stringify((jsonOrario.elenco_lezioni[i].timestamp_fine)).substring(12, 17)
        let aula = JSON.stringify((jsonOrario.elenco_lezioni[i].luogo[0].codice_aula))
        let sede = JSON.stringify((jsonOrario.elenco_lezioni[i].luogo[0].nome_sede))


        if (giorno !== giornoPrecedente) {
            if (messaggio !== '') {
                scope.sendMessage(messaggio)
                messaggio = '';
            }
            giornoPrecedente = giorno;
            messaggio += "Data:  " + giorno + "-" + mese + "-" + anno + "\n\n\n"

        }
        else {
            messaggio += oraInizio + " - " + oraFine + "\n" + corso + "\n" + aula + "-" + sede + "\n\n\n";

        }

    }
}


module.exports = { init };
