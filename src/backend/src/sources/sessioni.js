const fetch = require('node-fetch');
const FormData = require('form-data');

exports.getSessions = (formtype, anno, cdl, annocdl, sessione) => {
    const url = 'https://easyroom.unitn.it/Orario/test_call.php'
	
    const form = new FormData();
    form.append('form-type',formtype);
    form.append('anno',anno);
    form.append('cdl',cdl);
    form.append('annocdl',annocdl);
    form.append('sessione',sessione);
    form.append('_lang', 'it');
    
    return fetch(url,{
			method: 'POST',
			body: form
		})
        .then(data => {
             if (data.ok) { return data.text(); }
            else { return Promise.reject('fetch response status: '.concat(data.status)); }
        })
        .then(text => {
            var json;
            try{
                json = JSON.parse(text);
            } catch(e) { return Promise.reject('parse to JSON failed')}
        
            var elenco = {};
            
            const dataInizioSessioneSplit = json.DataInizio.split('-');  // ***********AGGIUNTO**********
            const dataFineSessioneSplit = json.DataFine.split('-');      // ***********AGGIUNTO**********
        
            elenco.infoSessione = {
                AnnoAccademico: json.AnnoAccademico.ID,
                AnnoCdl: annocdl, //json.Insegnamenti[0].Manifesto[0].Codice.concat('|').concat(json.Insegnamenti[0].Manifesto[0].AnnoCorso), //nome o codice??
                Cdl: cdl, //json.Insegnamenti[0].Manifesto[0].LaureaCodice,    //****AGGIUNTO****
                IdSessione: json.IdSessione,            // ******AGGIUNTO*****
                NomeFacolta: json.FacoltaNome,
                Sessione: json.Sessione,
                DataInizioSessione: new Date(dataInizioSessioneSplit[2], dataInizioSessioneSplit[1] - 1, dataInizioSessioneSplit[0]),//json.DataInizio, 05-06-2017
                DataFineSessione: new Date(dataFineSessioneSplit[2], dataFineSessioneSplit[1] - 1, dataFineSessioneSplit[0]) //json.DataFine 16-09-2017 
            }
            
            elenco.listaAppelli = [];
            
            for(let i=0; i<json.Insegnamenti.length; i++) {
                elenco.listaAppelli.push({
                    nomeCorso: json.Insegnamenti[i].DatiInsegnamento.Nome,
                    codiceGenerale: json.Insegnamenti[i].DatiInsegnamento.CodiceGenerale,
                    crediti: parseInt(json.Insegnamenti[i].DatiInsegnamento.Crediti),
                    tipoEsame: json.Insegnamenti[i].DatiInsegnamento.TipoEsame,
                    nomeDocente: json.Insegnamenti[i].DatiDocente.Nome.concat(" " + json.Insegnamenti[i].DatiDocente.Cognome),
                    matricolaDocente: json.Insegnamenti[i].DatiDocente.Matricola,
                    numeroAppelli: parseInt(json.Insegnamenti[i].DatiInsegnamento.NumeroAppelli),
                    appelli: []
                });
                
                
                for(let k=0; k<json.Insegnamenti[i].Appelli.length; k++) {
                    var dataSplit = json.Insegnamenti[i].Appelli[k].Data.split('-');         //********AGGIUNTO********
                    var oraInizioSplit = json.Insegnamenti[i].Appelli[k].OraInizio.split(':');     //********AGGIUNTO********
                    var oraFineSplit = json.Insegnamenti[i].Appelli[k].OraFine.split(':');         //********AGGIUNTO********
                    
                    elenco.listaAppelli[i].appelli.push({
                        //data: json.Insegnamenti[i].Appelli[k].Data,            29-08-2017
                        //oraInizio: json.Insegnamenti[i].Appelli[k].OraInizio,  14:30
                        //oraFine: json.Insegnamenti[i].Appelli[k].OraFine,      18:00
                        dataInizio: new Date(dataSplit[2], dataSplit[1] - 1, dataSplit[0], oraInizioSplit[0], oraInizioSplit[1]),  //*****AGGIUNTO*****
                        dataFine: new Date(dataSplit[2], dataSplit[1] - 1, dataSplit[0], oraFineSplit[0], oraFineSplit[1]),        //*****AGGIUNTO*****
                        aula: json.Insegnamenti[i].Appelli[k].Aula,
                        sede: json.Insegnamenti[i].Appelli[k].Sede
                    });
                }
            }
        
            return elenco;//JSON.stringify(elenco);
        })
        .catch( error => { // problemi di connessione oppure non ci sono sessioni corrispondenti ai parametri inseriti ('[]' è stato restituito).
            console.error('fetch failed: '.concat(error));
            return 'Problemi di acquisizione dati o nel trattamento dati. Controllare la connessione o i valori dei parametri della richiesta.' ;
        });
}
