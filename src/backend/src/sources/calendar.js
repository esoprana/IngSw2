const fetch = require('node-fetch');
const FormData = require('form-data');

/**
 * @typedef Evento
 * @type {object}
 * @property {{codice_insegnamento: string, docente: string}} insegnamento
 * @property {{codice_dipartimento: string, codice_aula: string}} luogo
 * @property {{inizio: string, fine: string}} timestamp
 * @property {string} tipo
 *
 */

/**
 * @typedef CalObj
 * @type {object}
 * @property {Evento[]} elenco_lezioni
 * @property {string[]} elenco_insegnamenti
 * @property {string} annoScolastico
 * @property {string} codice_percorso
 * @property {string} codice_corso
 * @property {string} data Data in formato DD-MM-YYYY
 */

/**
 * Restituisce una struttura che indica l'orario secondo i parametri indicati
 *
 * @name getCal
 * @function
 * @access public
 * @param lang Lingua richiesta
 * @param anno Anno scolastico(es: 2017)
 * @param codice_percorso Percorso seguito(es: P0003|2)
 * @param codice_corso Corso di laurea seguito(es: 0115G)
 * @param date Data
 * @returns {IdsObj} Struttura che indica l'orario secondo i parametri indicati
 */

exports.getCal = (lang,anno,codice_percorso,codice_corso,date) => {
	if ((lang === undefined) ||
		(anno === undefined) ||
		(codice_percorso === undefined) ||
		(codice_corso === undefined) ||
		(date === undefined)
	) {
		return Promise.reject(
			new Error('Paramentri mancanti nella richiesta.\n' +
				' I parametri necessari sono _lang,anno,codice_percorso,codice_corso,date'
		));
	}

	const url = 'https://easyroom.unitn.it/Orario/grid_call.php';
	const form = new FormData();
	form.append('_lang',lang);
	form.append('anno',anno);
	form.append('anno2',codice_percorso);
	form.append('corso',codice_corso);
	form.append('date',date);
	form.append('all_events',1);
	form.append('form-type','corso');

	return fetch(url,{
			method: 'POST',
			body: form
		})
		.then(data => data.json())
		.then(json => {
			try{
				const elenco_lez = json.celle.map(cella => {
					const dataSplit = cella.data.split('-');
					const orarioInizioSplit = cella.ora_inizio.split(':');
					const orarioFineSplit = cella.ora_fine.split(':');
					const begTimestamp = new Date(
						dataSplit[2],dataSplit[1],dataSplit[0],
						orarioInizioSplit[0],orarioInizioSplit[1]
					);
					const endTimestamp = new Date(
						dataSplit[2],dataSplit[1],dataSplit[0],
						orarioFineSplit[0],orarioFineSplit[1]
					);
					const codiceAulaSplit = cella.codice_aula.split('/');

					return {
						attivita: {
							codice_attivita: cella.codice_insegnamento,
							docente: cella.docente
						},
						luogo:{
							codice_dipartimento: codiceAulaSplit[0],
							codice_aula: codiceAulaSplit[1],
						},
						timestamp: {
							inizio: begTimestamp,
							fine: endTimestamp,
						},
						tipo: cella.tipo
					}
				});

				return {
					elenco_lezioni: elenco_lez,
					elenco_attivita: json.legenda.map(corso => corso.codice),
					annoScolastico: anno,
					codice_percorso: codice_percorso,
					codice_corso: codice_corso,
					date: date
				};
			} catch(err){
				return Promise.reject(new Error(err));
			}
		});
}

