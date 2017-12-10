'use strict';

const fetch = require('node-fetch');
const parse = require('esprima').parse;
const staticEval = require('static-eval');

/**
 * Funzione che confronta due oggetti e indica se hanno lo stesso tipo e se hanno stesse chiavi e gli stessi valori corrispondenti
 *
 * @name _objectEqual
 * @function
 * @access private
 * @param {Object} a uno degli oggetti
 * @param {Object} b uno degli oggetti
 * @returns {boolean} vero se a e b sono tutti due oggetti e hanno le stesse chiavi con gli stessi valori corrispondenti, falso altrimenti
 */
function _objectEqual(a, b) {
	// Se una delle due variabili non è un oggetto restituisco false
	if ((typeof a !== 'object') || (typeof b !== 'object')) {
		return false;
	}

	const aKeys = Object.getOwnPropertyNames(a);
	const bKeys = Object.getOwnPropertyNames(b);

	// Se ho un numero di chiavi diverse per ogni oggetto restituisco false
	if (aKeys.length !== bKeys.length) {
		return false;
	}

	// Per ogni chiave di a controllo che i valori corrispondenti in b sono uguali a quelli di a
	// Se in b la chiave non esiste ho che a[k] !== undefined
	const ris = !(aKeys.some(k => {
		if (typeof a[k] === 'object') {
			if (_objectEqual(a[k], b[k]) === false) {
				return true;
			}
		} else if (a[k] !== b[k]) {
			return true;
		}

		return false;
	}));

	return ris;
}

/**
 * @typedef {Object.<
 *				codice_cdl,
 *				{{
 *					label: string,
 *					elenco_anni:
 *						{Object.<
 *							codice_percorso,
 *							{{
 *								label: string[],
 *								elenco_insegnamenti: string[]
 *							}}
 *							>
 *						}
 *				}}>
 *			} CorsiObj
 */

/**
 * Funzione che mappa i valori di elenco_anni_corsi in una struttura predefinita
 *
 * @name _generateCorsi
 * @function
 * @access private
 * @param elenco_anni_corsi
 * @returns {CorsiObj} Oggetto che indica i corsi e le loro proprietà
 * @throws stringa con descrizione dell'errore
 */
function _generateCorsi(elenco_anni_corsi) {
	// Funzione per accedere all'ultimo elemento di un array
	function last(arr) {
		return arr[arr.length - 1];
	}

	// Trasformo elenco_anni_corsi da
	// [{
	//		label: <nome_corso>,
	//		valore: <codice_corso>,
	//		elenco_anni: <elenco_anni>
	//	},...]
	// a
	// { <codice_corso>: {label: <nome_corso>, elenco_anni: <trasformazione elenco_anni>},... }
	return elenco_anni_corsi.reduce((elenco, corso) => {
		// Trasformo elenco_anni da
		// [{
		//		label: <label_anno>,
		//		valore: <codice_anno_corso>,
		//	},...]
		// a
		// { <codice_anno_corso>: {label: <label_anno>[]},... }
		const anniCorso = corso.elenco_anni
			.filter(codice => (last(codice.valore.split('|')) != 0))
			.reduce((x, annoCorso) => {
				// Se il codice_anno_corso è già presente non creo un nuovo array ma aggiungo i dati
				// a quello esistente mentre se codice_anno_corso non è già esistene creo un nuovo array
				if (x[annoCorso.valore] !== undefined) {
					if (!x[annoCorso.valore].label.some(el => _objectEqual(el, annoCorso.label))) {
						x[annoCorso.valore].label.push(annoCorso.label);
					}
				} else {
					x[annoCorso.valore] = {
						label: [annoCorso.label]
					};
				}

				return x;
			}, {});

		const nuovoValore = {
			label: corso.label,
			elenco_anni: anniCorso
		};

		if (elenco[corso.valore] !== undefined) {
			if (!_objectEqual(elenco[corso.valore], nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti identici
				// restituisco un errore
				throw new Error('Doppia occorrenza del corso ' + corso.valore +
					' con oggetti diversi.\n');
			}
		} else {
			elenco[corso.valore] = nuovoValore;
		}

		return elenco;
	}, {});
}

/**
 * @typedef {Object.<
 *				codice_sede,
 *				{{
 *					label : string
 *				}}
 *			>} SediObj
 */

/**
 * Funzione cha mappa i valori di elenco_sedi in una struttura predefinita
 *
 * @name _generateSedi
 * @function
 * @access private
 * @param elenco_sedi
 * @returns {SediObj} Oggetto che indica le sedi/dipartimenti dell'università e le loro caratteristiche(nome del dipartimento)
 * @throws stringa con descrizione dell'errore
 */
function _generateSedi(elenco_sedi) {
	// Trasformo elenco_sedi da
	// [{
	//		label: <nome_sede>,
	//		valore: <codice_sede>
	//	},...]
	// a
	// { <codice_sede>: {label: <nome_sede>},... }
	return elenco_sedi.reduce((ris, sede) => {
		const nuovoValore = {
			label: sede.label
		};

		if (ris[sede.valore] !== undefined) {
			if (!_objectEqual(ris[sede.valore], nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw new Error('Doppia occorrenza della sede ' + sede.valore +
					' con oggetti diversi.\n');
			}
		} else {
			ris[sede.valore] = nuovoValore;
		}

		return ris;
	}, {});
}

/**
 * @typedef {Object.<
 *				codice_attivita,
 *				{{label: string}}
 *			>} AttivitaObj
 */

/**
 * Funzione che mappa i valori di elenco_anni_attivita in una struttura predefinita
 *
 * @name _generateActivities
 * @function
 * @access private
 * @param elenco_anni_attivita
 * @returns {AttivitaObj} Oggetto che indica le attività e le loro caratteristiche
 * @throws stringa con descrizione dell'errore
 */
function _generateActivities(elenco_anni_attivita) {
	// Trasformo da elenco_anni_attivita
	// [{
	//		label: <label_attivita>,
	//		valore: <codice_attivita>,
	//	},...]
	// a
	// { <codice_attivita>: {label: <label_attivita>},... }
	return elenco_anni_attivita.reduce((elenco, attivita) => {
		const nuovoValore = {
			label: attivita.label
		};

		if (elenco[attivita.valore] !== undefined) {
			if (!_objectEqual(elenco[attivita.valore], nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw new Error('Doppia occorrenza dell\'attività ' +
					attivita.valore + ' con oggetti diversi.\n');
			}
		} else {
			elenco[attivita.valore] = nuovoValore;
		}

		return elenco;
	}, {});
}

/**
 * @typedef {Object.<
 *				codice_docente,
 *				{{label: string}}
 *			>} DocentiObj
 */

/**
 * Funzione che mappa i valori di elenco_anni_docenti in una struttura predefinita
 *
 * @name _generateDocenti
 * @function
 * @access private
 * @param elenco_anni_docenti
 * @returns {DocentiObj} Oggetto che indica i docenti e le loro caratteristiche
 * @throws stringa con descrizione dell'errore
 */
function _generateDocenti(elenco_anni_docenti) {
	// Trasformo da elenco_anni_docenti
	// [{
	//		label: <nome_docente>,
	//		valore: <codice_docente>,
	//	},...]
	// a
	// { <codice_docente>: {label: <nome_docente>},... }
	return elenco_anni_docenti.reduce((elenco, docente) => {
		// Usiamo una versione modificata del codice docente per prevenire
		// conversioni a Number(perdendo i 0 all'inizio del numero es:"001")
		const codice_docente = 'D'.concat(docente.valore);
		const nuovoValore = {
			label: docente.label
		};

		if (elenco[codice_docente] !== undefined) {
			if (!_objectEqual(elenco[codice_docente], nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw new Error('Doppia occorrenza del docente ' +
					codice_docente + ' con oggetti diversi.\n');
			}
		} else {
			elenco[codice_docente] = nuovoValore;
		}

		return elenco;
	}, {});
}

/**
 * @typedef
 *	{Object.<
 *		codice_cdl,
 *		{{
 *			label: string[],
 *			elenco:
 *				{Object.<
 *					codice_percorso,
 *					{{
 *						label: string,
 *						elenco_sessioni:
 *							{Object.<
 *								codice_sessione,
 *								{{label: string}}
 *							>}
 *					}}
 *				>}
 *		}}
 *	>} CDLObj
 */

/**
 * Funzione che mappa i valori di et_anni_elenco_cdl in una struttura predefinita
 *
 * @name _generateCDL
 * @function
 * @access private
 * @param et_anni_elenco_cdl
 * @returns {CDLObj} Oggetto che indica i corsi di laurea e le loro caratteristiche
 * @throws stringa con descrizione dell'errore
 */
function _generateCDL(et_anni_elenco_cdl){
	// Trasformo et_anni_elenco_cdl da
	// [{
	//		label: <label_cdl>,
	//		valore: <codice_cdl>,
	//		elenco: <elenco_anni>
	//	},...]
	// a
	// { <codice_cdl>: {label: <label_cdl>, elenco: <trasformazione elenco_anni>},... }
	return et_anni_elenco_cdl.reduce((cdls, cdl) => {
		// Trasformo elenco_anni da
		// [{
		//		label: <label_anno_cdl>,
		//		valore: <codice_anno_cdl>,
		//		elenco_sessioni: <elenco_sessioni>
		//	},...]
		// in
		// { <codice_anno_cdl>: {label: <label_anno_cdl>, elenco: <trasformazione elenco_sessioni>},... }
		const anni_cdl = cdl.elenco_anni.reduce((anni, anno) => {
			// Trasformo elenco_sessioni da
			// [{
			//		label: <label_sessione>,
			//		valore: <codice_sessione>
			//	},...]
			// in
			// { <codice_sessione>: {label: <label_sessione>},... }
			const elenco_sessioni = anno.elenco_sessioni.reduce((sessioni, sessione) => {
				const nuovoValore = {
					label: sessione.label
				};

				if (sessioni[sessione.valore] !== undefined) {
					if (!_objectEqual(sessioni[sessione.valore], nuovoValore)) {
						// In caso di codici duplicati che non hanno valori corrispondenti
						// identici restituisco un errore
						throw new Error('Doppia occorrenza della sessione ' +
							sessione.valore + ' nell\'anno/percorso ' +
							anno.valore + ' del cdl ' + cdl.valore +
							' con oggetti diversi.\n');
					}
				} else {
					sessioni[sessione.valore] = nuovoValore;
				}

				return sessioni;
			}, {});

			const nuovoValore = {
				label: anno.label,
				elenco_sessioni: elenco_sessioni
			};

			if (anni[anno.valore] !== undefined) {
				if (!_objectEqual(anni[anno.valore], nuovoValore)) {
					// In caso di codici duplicati che non hanno valori corrispondenti
					// identici restituisco un errore
					throw new Error('Doppia occorrenza dell\'anno/percorso ' +
						anno.valore + ' del cdl ' + cdl.valore +
						' con oggetti diversi.\n');
				}
			} else {
				anni[anno.valore] = nuovoValore;
			}

			return anni;
		}, {});

		const nuovoValore = {
			label: cdl.label,
			elenco: anni_cdl
		};

		if (cdls[cdl.valore] !== undefined) {
			if (!_objectEqual(cdls[cdl.valore], nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw new Error('Doppia occorrenza del cdl ' + cdl.valore +
					' con oggetti diversi.\n');
			}
		} else {
			cdls[cdl.valore] = nuovoValore;
		}

		return cdls;
	}, {});
}

/**
 * @typedef EtDocentiObj
 * @type {object}
 * @property {string} label
 * @property {Object.<
 *				codice_docente,
 *				{{
 *					label: string,
 *					elenco:
 *						{Object.<
 *							codice_sessione,
 *							{{label: string}}
 *						>}
 *				}}
 *			>} elenco
 */

/**
 * Funzione che mappa i valori di et_anni_elenco_docenti in una struttura predefinita
 *
 * @name _generateETDocenti
 * @function
 * @access private
 * @param et_anni_elenco_docenti
 * @returns {EtDocentiObj} Oggetto che indica i docenti e le loro caratteristiche
 * @throws stringa con descrizione dell'errore
 */
function _generateETDocenti(et_anni_elenco_docenti) {
	// Trasformo et_anni_elenco_docenti da
	// [{
	//		label: <nome_docente>,
	//		valore: <codice_docente>,
	//		elenco: <elenco_sessioni>
	//	},...]
	// a
	// { <codice_docente>: {label: <nome_docente>, elenco: <trasformazione elenco_sessioni>},... }
	return et_anni_elenco_docenti.reduce((docenti, docente) => {
		const codice_docente = 'D' + docente.valore;

		// Trasformo elenco_sessioni da
		// [{
		//		label: <label_sessione>,
		//		valore: <codice_sessione>,
		//	},...]
		// a
		// { <codice_sessione>: {label: <label_sessione>},... }
		const elenco_sessioni = docente.elenco.reduce((sessioni, sessione) => {
			const nuovoValore = {
				label: sessione.label
			};

			if (sessioni[sessione.valore] !== undefined) {
				if (!_objectEqual(sessioni[sessione.valore], nuovoValore)) {
					// In caso di codici duplicati che non hanno valori corrispondenti
					// identici restituisco un errore
					throw new Error('Doppia occorrenza della sessione ' +
						sessione.valore + ' del docente ' + docente.valore +
						' con oggetti diversi.\n');
				}
			} else {
				sessioni[sessione.valore] = nuovoValore;
			}

			return sessioni;
		}, {});

		const nuovoValore = {
			label: docente.label,
			elenco: elenco_sessioni
		};

		if (docenti[codice_docente] !== undefined) {
			if (!_objectEqual(docenti[codice_docente], nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw new Error('Doppia occorrenza del docente ' +
					docente.valore + ' con oggetti diversi.\n');
			}
		} else {
			docenti[codice_docente] = nuovoValore;
		}

		return docenti;
	}, {});
}

/**
 * @typedef InsegnamentiObj
 * @type {object}
 * @property {string} label
 * @property {Object.<
 *				codice_insegnamento,
 *				{{
 *					label: string,
 *					elenco:
 *						{Object.<
 *							codice_sessione,
 *							{{label: string}}
 *						>}
 *				}}
 *			>} elenco
 */

/**
 * Funzione che mappa i valori di et_anni_elenco_insegnamenti in una struttura predefinita
 *
 * @name _generateETInsegnamenti
 * @function
 * @access private
 * @param et_anni_elenco_insegnamenti
 * @returns {InsegnamentiObj} Oggetto che indica gli insegnamenti e le loro caratteristiche
 * @throws stringa con descrizione dell'errore
 */
function _generateETInsegnamenti(et_anni_elenco_insegnamenti) {
	// Trasformo et_anni_elenco_insegnamenti da
	// [{
	//		label: <nome_insegnamento>,
	//		valore: <codice_insegnamento>,
	//		elenco: <elenco_sessioni>
	//	},...]
	// a
	// { <codice_insegnamento>: {label: <nome_insegnamento>, elenco: <trasformazione elenco_sessioni>},... }
	return et_anni_elenco_insegnamenti.reduce((insegnamenti, insegnamento) => {
		// Trasformo elenco_sessioni da
		// [{
		//		label: <label_sessione>,
		//		valore: <codice_sessione>
		//	},...]
		// a
		// { <codice_sessione>: {label: <label_sessione>},... }
		const elenco_sessioni = insegnamento.elenco.reduce((sessioni, sessione) => {
			const nuovoValore = {
				label: sessione.label
			};

			if (sessioni[sessione.valore] !== undefined) {
				if (!_objectEqual(sessioni[sessione.valore], nuovoValore)) {
					// In caso di codici duplicati che non hanno valori corrispondenti
					// identici restituisco un errore
					throw new Error('Doppia occorrenza della sessione ' +
						sessione.valore + ' dell\'insegnamento ' +
						insegnamento.valore + ' con oggetti diversi.\n');
				}
			} else {
				sessioni[sessione.valore] = nuovoValore;
			}

			return sessioni;
		}, {});

		const nuovoValore = {
			label: insegnamento.label,
			elenco: elenco_sessioni
		};

		if (insegnamenti[insegnamento.valore] !== undefined) {
			if (!_objectEqual(insegnamenti[insegnamento.valore], nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw new Error('Doppia occorrenza dell\'insegnamento ' +
					insegnamento.valore + ' con oggetti diversi.\n');
			}
		} else {
			insegnamenti[insegnamento.valore] = nuovoValore;
		}

		return insegnamenti;
	}, {});
}

const variables_to_obtain = new Set([
	'elenco_corsi',
	'elenco_attivita',
	'elenco_docenti',
	'et_elenco_cdl',
	'et_elenco_docenti',
	'et_elenco_insegnamenti',
	'elenco_sedi'
]);

/**
 * Classe che ottiene i codici che identificano: corsi, percorso,attività,docenti,..
 * @class
 */
class Codes {

	/**
	 * @type AssociazionePercorsoAttivita
	 * @property {number} anno Anno considerato
	 * @property {string} corso Codice del corso considerato
	 * @property {string} percorso Codice del percorso considerato
	 * @property {Date} date data
	 * @property {string[]} elenco_attivita Elenco dei codici delle attivita
	 */

	/**
	 * Callback usato ottenere i dati riguardati l'associazione percorso -> attività
	 * @callback Codes~promiseJSONCallback
	 * @returns {Promise<AssociazionePercorsoAttivita>|Promise<Error>}
	 *		Promise contenente {@link AssociazionePercorsoAttivita} in caso di successo,
	 *		altrimenti contenente {Error}
	 */

	/**
	 * Costruisce un'istanza della classe constant
	 * @constructor
	 *
	 * @param {string} url stringa contenente l'url alla quale ottenere i dati
	 * @param {Codes~promiseJSONCallback} promiseJSON Callback che viene
	 *		chiamato per ottenere i dati riguardati l'associazione percorso->attività
	 * @param {number} maxReq Numero massimo di richieste(chiamate a promiseJSON) in ogni istante
	 * @returns {Codes}
	 * @throws {Error} Errore contenete il motivo per cui la costruzione
	 *		dell'istanza è fallita
	 */
	constructor(url, promiseJSON, maxReq) {
		const errors = [];

		if (url === undefined) {
			errors.push('L\'url non può essere undefined');
		}

		if (promiseJSON === undefined) {
			errors.push('La funzione promiseJSON non può essere undefined');
		} else if (typeof promiseJSON !== 'function') {
			errors.push(
				'promiseJSON deve essere una funzione di tipo ' +
				'([{lang: codice_lingua, anno: number, corso: codice, ' +
				'percorso: codice,date: date},...]) => Promise'
			);
		} else if (promiseJSON.length !== 1) {
			errors.push('La funzione deve avere arietà 1');
		}

		if (maxReq === undefined) {
			errors.push('maxReq non può essere undefined');
		} else if (!isFinite(maxReq)) {
			errors.push('maxReq deve essere un numero finito');
		} else {
			maxReq = Number(maxReq);
		}

		if (errors.length > 0) {
			throw new Error(errors.join('\n'));
		}

		this._url = url;
		this._promiseJSON = promiseJSON;
		this._maxReq = maxReq;
	}

	/**
	 * @typedef {Object.<
	 *				anno,
	 *				{{
	 *					corsi: {CorsiObj},
	 *					sedi: {SediObj},
	 *					attivita: {AttivitaObj},
	 *					docenti: {DocentiObj},
	 *					cdl: {CDLObj},
	 *					insegnamenti: {InsegnamentiObj}
	 *				}}
	 *			>} IdsObj
	 */

	/**
	 * Restituisce una struttura contenete le associazioni (codice -> oggetto)
	 * utilizzate da easyroom
	 *
	 * @name getIds
	 * @function
	 * @access public
	 * @returns {IdsObj} oggetto contenente le associazioni (codice -> oggetto)
	 *		utilizzate da easyroom
	 */
	getIds() {
		const nReq = this._maxReq;
		const pJSON = this._promiseJSON;

		function createPromise(tmp) {
			if (tmp.ar.length > 0) {
				const thisRequest = tmp.ar.slice(0, nReq);
				const otherRequest = tmp.ar.slice(nReq, undefined);

				return pJSON(thisRequest)
				.then(data => {
					for (let idx = 0; idx < data.length; ++idx) {
						tmp.r[data[idx].anno]
							.corsi[data[idx].corso]
							.elenco_anni[data[idx].percorso]
							.elenco_attivita = data[idx].elenco_attivita;
					}

					return Promise.resolve({
						ar: otherRequest,
						r: tmp.r,
						i: tmp.i + 1
					}).then(createPromise);
				}, reason => {
					// In caso di fallimento della richiesta indico in
					// tmp.r.failed la richiesta fallita
					if (tmp.r.failed === undefined) {
						tmp.r.failed = [];
					}

					tmp.r.failed = tmp.r.failed.concat(thisRequest);
					return Promise.resolve({
						ar: otherRequest,
						r: tmp.r,
						i: tmp.i + 1
					}).then(createPromise);
				});
			}

			return Promise.resolve(tmp.r);
		}

		function gen(oldName, newName, fun, oldVar, newVar) {
			oldVar[oldName].forEach(x => {
				const obj = fun(x.elenco);
				if (newVar[x.valore] === undefined) {
					newVar[x.valore] = {};
				}

				if (newVar[x.valore][newName] !== undefined) {
					if (!_objectEqual(newVar[x.valore][newName], obj)) {
						throw new Error('Doppia occorrenza di ' + newName +
							' per l\'anno ' + x.valore + ' con valori diversi');
					}
				} else {
					newVar[x.valore][newName] = obj;
				}
			});
		}

		// Funzione per ottenere la data in formato italiano data una data javascript
		function getYYYYMMDDDate(d) {
			function pad(s) {
				return (s < 10) ? '0' + s : s;
			}
			return [
				d.getFullYear(),
				pad(d.getMonth() + 1),
				pad(d.getDate())
			].join('-');
		}

		return fetch(this._url)
			.then(data => data.text())
			.then(data => {
				const ris = {};

				try {
					/*
					 * Converto le variabili globali in proprietà di un oggetto JSON
					 * Procedimento:
					 *  1. Faccio il parsing e prendo il body del file
					 *  2. Individuo le variabili "immediatamente disponibili",
					 *     ovvero le variabili globali
					 *  3. Ogni dichiarazione può contenere più variabili (es: var x,y)
					 *     quindi trasformo l'array di dichiarazioni
					 *     (con dentro più varibili) a un singolo array di variabili
					 *  4, Filtro in modo da ottenere unicamente le variabili che mi interassano
					 *  5. Trasformo ogni variabile in una proprietà con uguale nome e valore
					 */
					const parsed = parse(data);
					if (parsed.body.length === 0) {
						throw new Error(
							'L\'oggetto letto non è un file .js parsabile'
						);
					}

					const props = parsed
						.body
						.filter(obj => obj.type === 'VariableDeclaration')
						.map(x => x.declarations)
						.reduce((a, b) => a.concat(b))
						.filter(variable => variables_to_obtain.has(variable.id.name))
						.reduce((ris, varDeclarator) => {
							ris[varDeclarator.id.name] = staticEval(varDeclarator.init);

							return ris;
						}, {});

					let complete_js = true;
					for(const x of variables_to_obtain) {
						if(props[x] === undefined){
							throw new Error('Il file .js è incompleto(manca ' +
								x + ')');
						}
					}

					gen('elenco_corsi', 'corsi', _generateCorsi, props, ris);
					gen('elenco_attivita', 'attivita', _generateActivities, props, ris);
					gen('elenco_docenti', 'docenti', _generateDocenti, props, ris);
					gen('et_elenco_cdl', 'cdl', _generateCDL, props, ris);
					gen('et_elenco_insegnamenti', 'insegnamenti', _generateETInsegnamenti, props, ris);
					gen('et_elenco_docenti', 'et_docenti', _generateETDocenti, props, ris);

					ris.sedi = _generateSedi(props.elenco_sedi);
				} catch (err) {
					// Errore durante la conversione dei dati
					return Promise.reject(err);
				}

				// Creo un array contenente le triple (annoScolastico,corso,percorso+anno)
				// per richiedere successivamente associazione con gli insegnamenti
				const request = [];
				const date = getYYYYMMDDDate(new Date());
				for (const annoScolastico in ris) {
					for (const corso in ris[annoScolastico].corsi) {
						for (const percorso in ris[annoScolastico].corsi[corso].elenco_anni) {
							request.push({
								lang: 'it',
								anno: annoScolastico,
								corso: corso,
								percorso: percorso,
								date: date
							});
						}
					}
				}

				return Promise.resolve({ar: request, r: ris, i: 0})
					.then(createPromise);
			}).catch( reason => Promise.reject(reason)); // Do not fail silently
	}
}

exports.Codes = Codes;
