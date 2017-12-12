const fetch = require('node-fetch'),
	FormData = require('form-data');

function pad(s) { return (s < 10) ? '0' + s : s; }

/**
 * Classe che permette di accedere al calendario
 *
 * @name Calendar
 * @class
 * @access public
 * @param {string|String} url Url da cui prendere i dati
 */
class Calendar{
	constructor(url) {
		if ((url === undefined) || ((typeof url !== 'string') && !(url instanceof String))) {
			throw new Error('È necessario specificare un\'url e che sia di tipo string o String');
		}

		// Assegno _url in modo da ottenere typeof _url === 'string' anche se url instanceof String
		this._url = (typeof url !== 'string')? url: url.toString();
	}

	/**
	 * @typedef Evento
	 * @type {Object}
	 * @property {{codice_attivita: string, docente: string}} attivita Informazioni sull'attività
	 * @property {{codice_dipartimento: string, codice_aula: string}} luogo Informazioni sul luogo di svolgimento
	 * @property {{inizio: string, fine: string}} timestamp Informazioni su orario di inizio e fine
	 * @property {string} tipo Tipo di arrività
	 */

	/**
	 * @typedef CalObj
	 * @type {Object}
	 * @property {Evento[]} elenco_lezioni Elenco delle attività/lezioni
	 * @property {string[]} elenco_attivita Elenco dei codici identificativi delle attività
	 * @property {number} annoScolastico Anno considerato
	 * @property {string} codice_percorso Codice identificativo del percorso
	 * @property {string} codice_corso Codice identificativo del corso
	 * @property {string} data Data in formato YYYY-MM-DD(ISO)
	 */

	/**
	 * Restituisce una promise contenente una struttura che indica l'orario secondo i parametri indicati
	 *
	 * @param {string} lang Lingua richiesta
	 * @param {number} anno Anno scolastico (es: 2017)
	 * @param {string} codice_percorso Percorso seguito (es: P0003|2)
	 * @param {string} codice_corso Corso di laurea seguito (es: 0115G)
	 * @param {string} date Data nel formato ISO o timestamp in millisecondi
	 * @returns {Promise<CalObj>|Promise<Error>} In caso di successo una {Promise} contenente {@link CalObj}, una promise contenente {Error} altrimenti
	 */
	getCal(lang, anno, codice_percorso, codice_corso, date) {
		const errors = [];
		let formDate;
		if (lang === undefined) {
			errors.push('Il parametro lang è undefined');
		} else if (lang instanceof String) {
			lang = lang.toString();
		} else if (typeof lang !== 'string') {
			errors.push('Il parametro deve essere di tipo \'string\' o instanceof String');
		}

		if (anno === undefined) {
			errors.push('Il parametro anno è undefined');
		} else if (!isFinite(anno)) {
			errors.push('Il paramentro anno deve essere un numero');
		}

		if (codice_percorso === undefined) {
			errors.push('Il parametro codice_percorso è undefined');
		}

		if (codice_corso === undefined) {
			errors.push('Il parametro codice_corso è undefined');
		}

		if (date === undefined) {
			errors.push('Il parametro date è undefined');
		} else {
			date = new Date(date);
			if (date == 'Invalid Date') {
				errors.push(
					'Il parametro date deve essere una data in formato ' +
					'ISO(YYYY-MM-DD) o numero di millisecondi dopo il 1970-01-01'
				);
			} else {
				formDate = [
						pad(date.getDate()),
						pad(date.getMonth() + 1),
						date.getFullYear()
					].join('-');
			}
		}

		if (errors.length > 0) {
			return Promise.reject(new Error(errors.join('\n')));
		}

		const form = new FormData();
		form.append('_lang', lang);
		form.append('aa', anno);
		form.append('anno', anno);
		form.append('anno2', codice_percorso);
		form.append('corso', codice_corso);
		form.append('date', formDate);
		form.append('all_events', 1);
		form.append('form-type', 'corso');

		return fetch(this._url, {
				method: 'POST',
				body: form
			})
			.then(data => data.json())
			.then(json => {
				try{
					const elenco_lez = ((json.celle === undefined)||(json.celle === null))?
						[]:
						json.celle.map(cella => {
							const dataSplit = cella.data.split('-');
							const orarioInizioSplit = cella.ora_inizio.split(':');
							const orarioFineSplit = cella.ora_fine.split(':');
							const begTimestamp = new Date(
								dataSplit[2], dataSplit[1] - 1, dataSplit[0],
								orarioInizioSplit[0], orarioInizioSplit[1]
							);
							const endTimestamp = new Date(
								dataSplit[2], dataSplit[1] - 1, dataSplit[0],
								orarioFineSplit[0], orarioFineSplit[1]
							);
							const codiceAulaSplit = cella.codice_aula.split('/');

							return {
								attivita: {
									codice_attivita: cella.codice_insegnamento,
									docente: cella.docente
								},
								luogo: {
									codice_dipartimento: codiceAulaSplit[0],
									codice_aula: codiceAulaSplit[1]
								},
								timestamp: {
									inizio: begTimestamp.toISOString(),
									fine: endTimestamp.toISOString()
								},
								tipo: cella.tipo
							}
						});

					return Promise.resolve({
						elenco_lezioni: elenco_lez,
						elenco_attivita: json.legenda.map(corso => corso.codice),
						annoScolastico: anno,
						codice_percorso: codice_percorso,
						codice_corso: codice_corso,
						date: [
							date.getFullYear(),
							pad(date.getMonth()+1),
							pad(date.getDate())
						].join('-')
					});
				} catch(err) {
					// err è già di tipo errrore quindi non lo incapsulo
					return Promise.reject(err);
				}
			}, reason => Promise.reject(reason));
	}

	/**
	 * @typedef AssocPercorsoAttivita
	 * @type {Object}
	 * @property {string[]} elenco_attivita Elenco dei codici identificativi delle attività
	 * @property {number} annoScolastico Anno considerato
	 * @property {string} codice_percorso Codice identificativo del percorso
	 * @property {string} codice_corso Codice identificativo del corso
	 * @property {string} data Data in formato YYYY-MM-DD(ISO)
	 */

	/**
	 * Restituisce una promise contenente una struttura che indica l'associazione tra
	 * (anno,codice_corso,codice_percorso) -> codice_attivita[]
	 *
	 * @param {string} lang Lingua richiesta
	 * @param {number} anno Anno scolastico (es: 2017)
	 * @param {string} codice_percorso Percorso seguito (es: P0003|2)
	 * @param {string} codice_corso Corso di laurea seguito (es: 0115G)
	 * @param {string} date Data nel formato ISO o timestamp in millisecondi
	 * @returns {Promise<AssocPercorsoAttivita>|Promise<Error>} In caso di successo una {Promise} contenente {@link AssocPercorsoAttivita}, una promise contenente {Error} altrimenti
	 */
	getAssoc(lang,anno,codice_percorso,codice_corso,date) {
		return this.getCal(lang,anno,codice_percorso,codice_corso,date)
			.then(data => Promise.resolve({
					elenco_attivita : data.elenco_attivita,
					anno: data.annoScolastico,
					percorso: data.codice_percorso,
					corso: data.codice_corso,
					date: data.date
				}),
				reason => Promise.reject(reason)
			);
	}
}

exports.Calendar=Calendar;

