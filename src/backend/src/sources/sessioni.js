const fetch = require('node-fetch');
const FormData = require('form-data');

exports.getSessions = (formtype, anno, cdl, annocdl, sessione, _lang) => {
    const url = 'https://easyroom.unitn.it/Orario/test_call.php'
	
    const form = new FormData();
    form.append('form-type',formtype);
    form.append('anno',anno);
    form.append('cdl',cdl);
    form.append('annocdl',annocdl);
    form.append('sessione',sessione);
    form.append('_lang',_lang);
    
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
        
            elenco.infoSessione = {
                AnnoAccademico: json.AnnoAccademico.ID,
                NomeFacolta: json.FacoltaNome,
                Sessione: json.Sessione,
                DataInizioSessione: json.DataInizio,
                DataFineSessione: json.DataFine
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
                    elenco.listaAppelli[i].appelli.push({
                        data: json.Insegnamenti[i].Appelli[k].Data,
                        oraInizio: json.Insegnamenti[i].Appelli[k].OraInizio,
                        oraFine: json.Insegnamenti[i].Appelli[k].OraFine,
                        aula: json.Insegnamenti[i].Appelli[k].Aula,
                        sede: json.Insegnamenti[i].Appelli[k].Sede
                    });
                }
            }
        
            return JSON.stringify(elenco);
        })
        .catch( error => { // problemi di connessione oppure non ci sono sessioni corrispondenti ai parametri inseriti ('[]' è stato restituito).
            console.error('fetch failed: '.concat(error));
            return 'Problemi di acquisizione dati o nel trattamento dati. Controllare la connessione o i valori dei parametri della richiesta.' ;
        });
}