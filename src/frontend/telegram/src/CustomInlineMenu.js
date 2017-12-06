'use strict';
var scope;
var JsonData = require('./codes.json') //poi da togliere

class CustomInlineMenu {

    constructor($) {
        scope = $;

    }

    getJsonMenu() {

        var conteggioCorsi = 0;
        var datiCorsi = [];
        var tmp = [];
        for (var anno in JsonData.corsi) {
            for (var corso in JsonData.corsi[anno].elenco) {
                conteggioCorsi++;
                console.log(JsonData.corsi[anno].elenco[corso].label);
                tmp.push(JsonData.corsi[anno].elenco[corso].label);
                for (var annoCorso in JsonData.corsi[anno].elenco[corso].elenco_anni) {
                    var annoTmp = JsonData.corsi[anno].elenco[corso].elenco_anni[annoCorso][0].label;
                    console.log(annoTmp);
                    tmp.push(annoTmp);
                }


        
               console.log("DIOCANE :" + tmp + "\n")
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
            console.log("A" + datiCorsi[index]);
            const m = [];
            for (var anno = 0; anno < datiCorsi[index].length; ++anno) {
                console.log("***" + index)
                m.push(
                    {
                        text: "" + datiCorsi[index][anno],
                        callback: () => { scope.sendMessage("Eseguire chhiamata per orario con parametri " + "Corso:  " + datiCorsi[index][0] + "Anno: " + datiCorsi[index][anno]) }

                    }
                );
            }


            //            if (datiCorsi[index][0]) {
            jsonMenu[key].push(
                {
                    text: "" + datiCorsi[index][0],
                    message: "Quale anno?",
                    layout: 1,
                    menu: m
                }

            )
            //            }
        }
        //perché cazzo salta un ciclo ghesboro
        for (var index = 0; index < datiCorsi.length; index++) {
            console.log("---" + index)
            /*
                        for (var anno = 0; anno < datiCorsi[index].length; ++anno) {
                            console.log("***"+index)
                            if (jsonMenu[key][index] !== undefined && jsonMenu[key][index].menu !== undefined) {
                                
                                jsonMenu[key][index].menu.push(
                                    {
                                        text: "" + datiCorsi[index][anno],
                                        callback: () => { scope.sendMessage("Eseguire chhiamata per orario con parametri "+"Corso:  "+datiCorsi[index][0]+"Anno: " + datiCorsi[index][anno]) }
            
                                    }
                                );
                
                            }
                            
                        }*/
            console.log(index)
        }
        //console.log(JSON.stringify(jsonMenu))
        return jsonMenu
    }
}

module.exports = { CustomInlineMenu }
