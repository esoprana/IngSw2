'use strict';
var scope;
var JsonData = require('./codes.json') //poi da togliere
const Calendar = require('../../../backend/src/sources/calendar.js')


class CustomInlineMenu {

    constructor($) {
        scope = $;

    }

    getJsonMenu() {


        var datiCorsi = [];
        var tmp = [];
        var codici = []
        for (var anno in JsonData.corsi) {
            for (var corso in JsonData.corsi[anno].elenco) {
                var codiciCorso = []
                codiciCorso.push(anno)
                codiciCorso.push(corso);
                tmp.push(JsonData.corsi[anno].elenco[corso].label);
                for (var annoCorso in JsonData.corsi[anno].elenco[corso].elenco_anni) {
                    var annoTmp = JsonData.corsi[anno].elenco[corso].elenco_anni[annoCorso][0].label;
                    tmp.push(annoTmp);
                    codiciCorso.push(annoCorso)

                }

                codici.push(codiciCorso)
                datiCorsi.push(tmp)

                tmp = [];

            }

        }

        var jsonMenu = {
            layout: 1,
            method: "sendMessage",
            params: ["Quale Corso?"],

        }
        var key = 'menu';
        jsonMenu[key] = [];

        for (var index = 0; index < datiCorsi.length; index++) {
            var m = [];
            var codice_anno = codici[index][0]
            var codice_corso = codici[index][1]

            for (var anno = 1; anno < datiCorsi[index].length; anno++) {
                var codice_percorso = codici[index][anno + 1]
                var ghesboro = this;
                var calendarJson
                var jsonData = JsonData


                m.push(
                    {
                        text: "" + datiCorsi[index][anno],
                        callback: (req, res) => {

                            calendarJson = Calendar.getCal(
                                'it', codice_anno, codice_percorso, codice_corso, new Date().toISOString())
                                .then(function (result) {
                                    var i = 0
                                    var jsonCalendar = JSON.parse(JSON.stringify(result))
                                    var orario = []

                                    for (var i = 0; i < result.elenco_lezioni.length; i++) {
                                        var tmp = []

                                        var codiceCorso = jsonCalendar.elenco_lezioni[i].attivita.codice_attivita
                                        //boh ci sono altre aule misteriose....
                                        //console.log(jsonCalendar.elenco_lezioni[i].luogo.codice_aula)
                                        var nomeCorso = jsonData.attivita[codice_anno].elenco[codiceCorso].label

                                        //i corsi non sono ordinati per data
                                        //devo prenderli tutti dividerli per giorno per ora poi associarli al label del corso e formattare il testo 
                                        //poi già che son divisi e data la data ci sarebbbe da prendere da la settimana in corso o dall inizio settimana 
                                        //fatto ciò c'è da ristrutturare tutto il codice e fare le varie associazioni

                                        //mettere anno solo se diverso dal corrente?
                                        var dataInizio = jsonCalendar.elenco_lezioni[i].timestamp.inizio
                                        var dataFine = jsonCalendar.elenco_lezioni[i].timestamp.fine
                                        var anno = dataInizio.substring(0, 4)
                                        var mese = dataInizio.substring(5, 7)
                                        var giorno = dataInizio.substring(8, 10)
                                        var oraInizio = dataInizio.substring(11, 16)
                                        var oraFine = dataFine.substring(11, 16)
                                        var dataFormattata = oraInizio + "-" + oraFine + "\t" + giorno + "/" + mese
                                        tmp.push(nomeCorso)
                                        tmp.push(dataInizio)
                                        tmp.push(dataFormattata)

                                        orario.push(tmp)
                                        tmp = []

                                        i++
                                    }
                                    orario.sort(function (a, b) {

                                        if (a[1] > b[1]) {
                                            return 1
                                        }
                                        if (a[1] < b[1]) {
                                            return -1
                                        }
                                        if (a[1] === b[1]) {
                                            if ((Number.parseInt(a[2].substring(0, 2))) > (Number.parseInt(a[2].substring(0, 2)))) {
                                                return 1
                                            }
                                            if ((Number.parseInt(a[2].substring(0, 2))) < (Number.parseInt(a[2].substring(0, 2)))) {
                                                return -1
                                            }
                                            if ((Number.parseInt(a[2].substring(0, 2))) === (Number.parseInt(a[2].substring(0, 2)))) {
                                                return 0
                                            }


                                        }

                                    })
                                    //console.log(orario)
                                    var giorno_lezione="" 
                                    var messaggio=""
                                
                                    for(var i=0; i< orario.length; i++){
                                        console.log(orario[i][2])

                                        if(orario[i][2].substring(13)!==giorno_lezione && messaggio!==""){
                                            //mettere uno sleep
                                            scope.sendMessage(messaggio)
                                            giorno_lezione=orario[i][2].substring(13)
                                            messaggio+=orario[i][2]+ "\n"+ orario[i][0]+"\n\n"

                                            
                                        }
                                        else{messaggio+=orario[i][2]+ "\n"+ orario[i][0]+"\n\n"}

                                    }




                                    
                                    return
                                });




                            // 

                        }

                    }
                );

            }

            jsonMenu[key].push(
                {
                    text: "" + datiCorsi[index][0],
                    message: "Quale anno?",
                    layout: 1,
                    menu: m
                }

            )
        }
        return jsonMenu
    }
}

module.exports = { CustomInlineMenu }

/*

    
    -chiedere per sessioni eventi e orario
    -chiedere giorno settimana mese
    -chiedere corso, etc
    - Salvare dati utenti


*/