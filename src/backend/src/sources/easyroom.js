const fetch = require('node-fetch');
const parse = require('esprima').parse;
const static_eval = require('static-eval')

/**
 * Funzione che confronta due oggetti e indica se hanno lo stesso tipo e se oggetti le stesse chiavi e gli stessi valori corrispondenti
 *
 * @name _objectEqual
 * @function
 * @access private
 * @param {Object} a uno degli oggetti
 * @param {Object} b uno degli oggetti
 * @returns {boolean} vero se a e b sono tutti due oggetti e hanno le stesse chiavi con gli stessi valori corrispondenti, falso altrimenti
 */
function _objectEqual(a,b){
	// Se una delle due variabili non è un oggetto restituisco false
	if((typeof a !== 'object') || (typeof b !== 'object')){
		return false;
	}

	const aKeys = Object.getOwnPropertyNames(a);
	const bKeys = Object.getOwnPropertyNames(b);

	// Se ho un numero di chiavi diverse per ogni oggetto restituisco false
	if(aKeys.length != bKeys.length){
		return false;
	}

	// Per ogni chiave di a controllo che i valori corrispondenti in b sono uguali a quelli di a
	// Se in b la chiave non esiste ho che a[k] !== undefined
	const ris = !(aKeys.some((k) => {
		if(typeof a[k] === 'object'){
			if(_objectEqual(a[k],b[k]) === false) {
				return true;
			}
		} else if(a[k] !== b[k]){
			return true;
		}

		return false;
	}));

	return ris;
}

/**
 * @typedef {Object.<
 *				anno,
 *				{{
 *					label : string,
 *					elenco:
 *						Array.<
 *							{Object.<
 *								codice_cdl,
 *								{{
 *									label: string,
 *									elenco_anni:
 *										{Object.<
 *											codice_percorso,
 *											Array.<{label: string}>
 *											>
 *										}
 *								}}>
 *							}>
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
function _generateCorsi(elenco_anni_corsi){
	// Trasformo elenco_anni_corsi da
	// [{
	//		label: <label>,
	//		valore: <anno>,
	//		elenco: <elenco_corsi_di_laurea>
	//	},...]
	// a
	// { <anno>: {label: <label>, elenco: <trasformazione elenco_corsi_di_laurea>},... }
	return elenco_anni_corsi.reduce((anni,annoScolastico) => {
		// Trasformo elenco_corsi_di_laurea da
		// [{
		//		label: <nome_corso>,
		//		valore: <codice_corso>,
		//		elenco_anni: <elenco_anni>
		//	},...]
		// a
		// { <codice_corso>: {label: <nome_corso>, elenco_anni: <trasformazione elenco_anni>},... }
		const corsi = annoScolastico.elenco.reduce((elenco,corso) => {
			// Trasformo elenco_anni da
			// [{
			//		label: <label_anno>,
			//		valore: <codice_anno_corso>,
			//	},...]
			// a
			// { <codice_anno_corso>: [{label: <label_anno>},...],... }
			const anniCorso = corso.elenco_anni.reduce((x,annoCorso) => {
				const nuovoValore = {
					label: annoCorso.label
				};

				// Se il codice_anno_corso è già presente non creo un nuovo array ma aggiungo i dati
				// a quello esistente mentre se codice_anno_corso non è già esistene creo un nuovo array
				if (x[annoCorso.valore] !== undefined){
					if(!x[annoCorso.valore].some((el)=> _objectEqual(el,nuovoValore))){
						x[annoCorso.valore].push(nuovoValore);
					}
				} else {
					x[annoCorso.valore] = [nuovoValore];
				}

				return x;
			},{});

			const nuovoValore = {
				label: corso.label,
				elenco_anni: anniCorso
			};

			if (elenco[corso.valore] !== undefined){
				if(!_objectEqual(elenco[corso.valore],nuovoValore)) {
					// In caso di codici duplicati che non hanno valori corrispondenti identici
					// restituisco un errore
					throw "Doppia occorrenza del corso " + corso.valore +
						" nell'anno " + annoScolastico.valore +
						" con oggetti diversi.\n";
				}
			} else {
				elenco[corso.valore] = nuovoValore;
			}

			return elenco;
		},{});

		const nuovoValore = {
			label: annoScolastico.label,
			elenco: corsi
		};

		if(anni[annoScolastico.valore] !== undefined) {
			if(!_objectEqual(anni[annoScolastico.valore],nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw "Doppia occorrenza dell'anno " + annoScolastico.valore +
					" con oggetti diversi.\n";
			}
		} else {
			anni[annoScolastico.valore] = nuovoValore;
		}

		return anni;
	},{});
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
function _generateSedi(elenco_sedi){
	// Trasformo elenco_sedi da
	 // [{
	//		label: <nome_sede>,
	//		valore: <codice_sede>
	//	},...]
	// a
	// { <codice_sede>: {label: <nome_sede>},... }
	return elenco_sedi.reduce((ris,sede) => {
		const nuovoValore = {
			label: sede.label
		};

		if(ris[sede.valore] !== undefined) {
			if(!_objectEqual(ris[sede.valore],nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw "Doppia occorrenza della sede " + sede.valore +
					" con oggetti diversi.\n";
			}
		} else {
			ris[sede.valore] = nuovoValore;
		}

		return ris;
	},{});
}


/**
 * @typedef {Object.<
 *				anno,
 *				{{
 *					label : string,
 *					elenco :
 *						{Object.<
 *							codice_corso,
 *							{{label: string}}
 *						>}
 *				}}
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
function _generateActivities(elenco_anni_attivita){
	// Trasformo elenco_anni_attivita da
	// [{
	//		label: <label_anno>,
	//		valore: <anno>,
	//		elenco: <elenco_attivita>
	//	},...]
	// a
	// { <anno>: {label: <label_anno>, elenco: <trasformazione elenco_attivita>},... }
	return elenco_anni_attivita.reduce((ris,annoScolastico) => {
		// Trasformo da elenco_attivita
		// [{
		//		label: <label_attivita>,
		//		valore: <codice_attivita>,
		//	},...]
		// a
		// { <codice_attivita>: {label: <label_attivita>},... }
		const elenco_anni = annoScolastico.elenco.reduce((elenco,attivita) => {
			const nuovoValore = {
				label: attivita.label
			};

			if(elenco[attivita.valore] !== undefined){
				if(!_objectEqual(elenco[attivita.valore],nuovoValore)) {
					// In caso di codici duplicati che non hanno valori corrispondenti
					// identici restituisco un errore
					throw "Doppia occorrenza dell'attività " + attivita.valore +
						" nell'anno " + annoScolastico.valore +
						" con oggetti diversi.\n";
				}
			} else {
				elenco[attivita.valore] = nuovoValore;
			}

			return elenco;
		},{});

		const nuovoValore = {
			label: annoScolastico.label,
			elenco: elenco_anni
		};

		if(ris[annoScolastico.valore] !== undefined) {
			if(!_objectEqual(ris[annoScolastico.valore],nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw "Doppia occorrenza dell'anno " + annoScolastico.valore +
					" con oggetti diversi.\n";
			}
		} else {
			ris[annoScolastico.valore] = nuovoValore;
		}

		return ris;
	},{});
}

/**
 * @typedef {Object.<
 *				anno,
 *				{{
 *					label : string,
 *					elenco :
 *						{Object.<
 *							codice_docente,
 *							{{label: string}}
 *						>}
 *				}}
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
function _generateDocenti(elenco_anni_docenti){
	// Trasformo da elenco_anni_docenti
	// [{
	//		label: <label_anno>,
	//		valore: <anno>,
	//		elenco: <elenco_docenti>
	//	},...]
	// a
	// { <anno>: {label: <label_anno>, elenco: <trasformazione elenco_docenti>},... }
	return elenco_anni_docenti.reduce((ris,annoScolastico) => {
		// Trasformo da elenco_docenti
		// [{
		//		label: <nome_docente>,
		//		valore: <codice_docente>,
		//	},...]
		// a
		// { <codice_docente>: {label: <nome_docente>},... }
		const elenco_docenti = annoScolastico.elenco.reduce((elenco,docente) => {
			// Usiamo una versione modificata del codice docente per prevenire
			// conversioni a Number(perdendo i 0 all'inizio del numero es:"001")
			const codice_docente = "D".concat(docente.valore);
			const nuovoValore = {
				label: docente.label,
			};

			if(elenco[codice_docente] !== undefined){
				if(!_objectEqual(elenco[codice_docente],nuovoValore)) {
					// In caso di codici duplicati che non hanno valori corrispondenti
					// identici restituisco un errore
					throw "Doppia occorrenza del docente " + codice_docente +
						" nell'anno " +  annoScolastico.valore +
						" con oggetti diversi.\n";
				}
			} else {
				elenco[codice_docente] = nuovoValore;
			}

			return elenco;
		},{});

		const nuovoValore = {
			label: annoScolastico.label,
			elenco: elenco_docenti
		};

		if(ris[annoScolastico.valore] !== undefined) {
			if(!_objectEqual(ris[annoScolastico.valore],nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw "Doppia occorrenza dell'anno" + annoScolastico.valore +
					" con oggetti diversi.\n";
			}
		} else {
			ris[annoScolastico.valore] = nuovoValore;
		}

		return ris;
	},{});
}

/**
 * @typedef {Object.<
 *				anno,
 *				{{
 *					label : string,
 *					elenco :
 *						{Object.<
 *							codice_cdl,
 *							{{
 *								label: string,
 *								elenco:
 *									{Object.<
 *										codice_percorso,
 *										{{
 *											label: string,
 *											elenco_sessioni:
 *												{Object.<
 *													codice_sessione,
 *													{{label: string}}
 *												>}
 *										}}
 *									>}
 *							}}
 *						>}
 *				}}
 *			>} CDLObj
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
	//		label: <label_anno>,
	//		valore: <anno>,
	//		elenco: <elenco_cdl>
	//	},...]
	// a
	// { <anno>: {label: <label_anno>, elenco: <trasformazione elenco_cdl>},... }
	return et_anni_elenco_cdl.reduce((ris,annoScolastico) => {
		// Trasformo elenco_cdl da
		// [{
		//		label: <label_cdl>,
		//		valore: <codice_cdl>,
		//		elenco: <elenco_anni>
		//	},...]
		// a
		// { <codice_cdl>: {label: <label_cdl>, elenco: <trasformazione elenco_anni>},... }
		const elenco = annoScolastico.elenco.reduce((cdls,cdl) => {
			// Trasformo elenco_anni da
			// [{
			//		label: <label_anno_cdl>,
			//		valore: <codice_anno_cdl>,
			//		elenco_sessioni: <elenco_sessioni>
			//	},...]
			// in
			// { <codice_anno_cdl>: {label: <label_anno_cdl>, elenco: <trasformazione elenco_sessioni>},... }
			const anni_cdl = cdl.elenco_anni.reduce((anni,anno) => {
				// Trasformo elenco_sessioni da
				// [{
				//		label: <label_sessione>,
				//		valore: <codice_sessione>
				//	},...]
				// in
				// { <codice_sessione>: {label: <label_sessione>},... }
				const elenco_sessioni = anno.elenco_sessioni.reduce((sessioni,sessione) => {
					const nuovoValore = {
						label: sessione.label
					};

					if(sessioni[sessione.valore] !== undefined){
						if(!_objectEqual(sessioni[sessione.valore],nuovoValore)) {
							// In caso di codici duplicati che non hanno valori corrispondenti
							// identici restituisco un errore
							throw "Doppia occorrenza della sessione" + sessione.valore +
								" nell'anno/percorso " +  anno.valore +
								" del cdl "+ cdl.valore +
								" dell'anno "+ annoScolastico.valore +
								" con oggetti diversi.\n";
						}
					} else {
						sessioni[sessione.valore] = nuovoValore;
					}

					return sessioni;
				},{});

				const nuovoValore = {
					label: anno.label,
					elenco_sessioni: elenco_sessioni
				};

				if(anni[anno.valore] !== undefined){
					if(!_objectEqual(anni[anno.valore],nuovoValore)) {
						// In caso di codici duplicati che non hanno valori corrispondenti
						// identici restituisco un errore
						throw "Doppia occorrenza dell'anno/percorso " +  anno.valore
							+ " del cdl "+ cdl.valore +
							" dell'anno "+ annoScolastico.valore +
							" con oggetti diversi.\n";
					}
				} else {
					anni[anno.valore] = nuovoValore;
				}

				return anni;
			},{});

			const nuovoValore = {
				label: cdl.label,
				elenco: anni_cdl
			};

			if(cdls[cdl.valore] !== undefined) {
				if(!_objectEqual(cdls[cdl.valore],nuovoValore)) {
					// In caso di codici duplicati che non hanno valori corrispondenti
					// identici restituisco un errore
					throw "Doppia occorrenza del cdl "+ cdl.valore +
						" dell'anno "+ annoScolastico.valore +
						" con oggetti diversi.\n";
				}
			} else {
				cdls[cdl.valore] = nuovoValore;
			}

			return cdls;
		},{});

		const nuovoValore = {
			label: annoScolastico.label,
			elenco: elenco
		};


		if(ris[annoScolastico.valore] !== undefined){
			if(!_objectEqual(ris[annoScolastico.valore],nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw "Doppia occorrenza dell'anno" + annoScolastico.valore +
					" con oggetti diversi.\n";
			}
		} else {
			ris[annoScolastico.valore] = nuovoValore;
		}

		return ris;
	},{});
}

/**
 * @typedef {Object.<
 *				anno,
 *				{{
 *					label : string,
 *					elenco :
 *						{Object.<
 *							codice_docente,
 *							{{
 *								label: string,
 *								elenco:
 *									{Object.<
 *										codice_sessione,
 *										{{label: string}}
 *									>}
 *							}}
 *						>}
 *				}}
 *			>} EtDocentiObj
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
function _generateETDocenti(et_anni_elenco_docenti){
	// Trasformo et_anni_elenco_cdl da
	// [{
	//		label: <label_anno>,
	//		valore: <anno>,
	//		elenco: <elenco_et_docenti>
	//	},...]
	// a
	// { <anno>: {label: <label_anno>, elenco: <trasformazione elenco_et_docenti>},... }
	return et_anni_elenco_docenti.reduce((ris,annoScolastico) => {
		// Trasformo et_anni_elenco_cdl da
		// [{
		//		label: <nome_docente>,
		//		valore: <codice_docente>,
		//		elenco: <elenco_sessioni>
		//	},...]
		// a
		// { <codice_docente>: {label: <nome_docente>, elenco: <trasformazione elenco_sessioni>},... }
		const elenco_docenti = annoScolastico.elenco.reduce((docenti,docente) => {
			const codice_docente="D"+docente.valore;

			// Trasformo elenco_sessioni da
			// [{
			//		label: <label_sessione>,
			//		valore: <codice_sessione>,
			//	},...]
			// a
			// { <codice_sessione>: {label: <label_sessione>},... }
			const elenco_sessioni = docente.elenco.reduce((sessioni,sessione) => {
				const nuovoValore = {
					label: sessione.label
				};

				if(sessioni[sessione.valore] !== undefined){
					if(!_objectEqual(sessioni[sessione.valore],nuovoValore)) {
						// In caso di codici duplicati che non hanno valori corrispondenti
						// identici restituisco un errore
						throw "Doppia occorrenza della sessione" + sessione.valore +
							" del docente " +  docente.valore +
							" dell'anno "+ annoScolastico.valore +
							" con oggetti diversi.\n";
					}
				} else {
					sessioni[sessione.valore] = nuovoValore;
				}

				return sessioni;
			},{});

			const nuovoValore = {
				label: docente.label,
				elenco: elenco_sessioni
			};

			if(docenti[codice_docente] !== undefined){
				if(!_objectEqual(docenti[codice_docente],nuovoValore)) {
					// In caso di codici duplicati che non hanno valori corrispondenti
					// identici restituisco un errore
					throw "Doppia occorrenza del docente " +  docente.valore +
						" dell'anno "+ annoScolastico.valore +
						" con oggetti diversi.\n";
				}
			} else {
				docenti[codice_docente] = nuovoValore;
			}

			return docenti;
		},{});

		const nuovoValore = {
			label: annoScolastico.label,
			elenco: elenco_docenti
		};

		if(ris[annoScolastico.valore] !== undefined){
			if(!_objectEqual(ris[annoScolastico.valore],nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw "Doppia occorrenza dell'anno" + annoScolastico.valore +
					" con oggetti diversi.\n";
			}
		} else {
			ris[annoScolastico.valore] = nuovoValore;
		}

		return ris;
	},{});
}

/**
 * @typedef {Object.<
 *				anno,
 *				{{
 *					label : string,
 *					elenco :
 *						{Object.<
 *							codice_insegnamento,
 *							{{
 *								label: string,
 *								elenco:
 *									{Object.<
 *										codice_sessione,
 *										{{label: string}}
 *									>}
 *							}}
 *						>}
 *				}}
 *			>} InsegnamentiObj
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
function _generateETInsegnamenti(et_anni_elenco_insegnamenti){
	// Trasformo et_anni_elenco_insegnamenti da
	// [{
	//		label: <label_anno>,
	//		valore: <anno>,
	//		elenco: <elenco_insegnamenti>
	//	},...]
	// a
	// { <anno>: {label: <label_anno>, elenco: <trasformazione elenco_insegnamenti>},... }
	return et_anni_elenco_insegnamenti.reduce((ris,annoScolastico) => {
		// Trasformo elenco_insegnamenti da
		// [{
		//		label: <nome_insegnamento>,
		//		valore: <codice_insegnamento>,
		//		elenco: <elenco_sessioni>
		//	},...]
		// a
		// { <codice_insegnamento>: {label: <nome_insegnamento>, elenco: <trasformazione elenco_sessioni>},... }
		const elenco_insegnamenti = annoScolastico.elenco.reduce((insegnamenti,insegnamento) => {
			// Trasformo elenco_sessioni da
			// [{
			//		label: <label_sessione>,
			//		valore: <codice_sessione>
			//	},...]
			// a
			// { <codice_sessione>: {label: <label_sessione>},... }
			const elenco_sessioni = insegnamento.elenco.reduce((sessioni,sessione) => {
				const nuovoValore = {
					label: sessione.label
				};

				if(sessioni[sessione.valore] !== undefined){
					if(!_objectEqual(sessioni[sessione.valore],nuovoValore)) {
						// In caso di codici duplicati che non hanno valori corrispondenti
						// identici restituisco un errore
						throw "Doppia occorrenza della sessione" + sessione.valore +
							" dell'insegnamento " +  insegnamento.valore +
							" dell'anno "+ annoScolastico.valore +
							" con oggetti diversi.\n";
					}
				} else {
					sessioni[sessione.valore] = nuovoValore;
				}

				return sessioni;
			},{});

			const nuovoValore = {
				label: insegnamento.label,
				elenco: elenco_sessioni
			};

			if(insegnamenti[insegnamento.valore] !== undefined) {
				if(!_objectEqual(insegnamenti[insegnamento.valore],nuovoValore)) {
					// In caso di codici duplicati che non hanno valori corrispondenti
					// identici restituisco un errore
					throw "Doppia occorrenza dell'insegnamento " +  insegnamento.valore +
						" dell'anno "+ annoScolastico.valore +
						" con oggetti diversi.\n";
				}
			} else {
				insegnamenti[insegnamento.valore] = nuovoValore;
			}

			return insegnamenti;
		},{});

		const nuovoValore = {
			label: annoScolastico.label,
			elenco: elenco_insegnamenti
		};

		if(ris[annoScolastico.valore] !== undefined) {
			if(!_objectEqual(ris[annoScolastico.valore],nuovoValore)) {
				// In caso di codici duplicati che non hanno valori corrispondenti
				// identici restituisco un errore
				throw "Doppia occorrenza dell'anno" + annoScolastico.valore +
					" con oggetti diversi.\n";
			}
		} else {
			ris[annoScolastico.valore] = nuovoValore;
		}

		return ris;
	},{});
}

/**
 * @typedef IdsObj
 * @type {object}
 * @property {CorsiObj} corsi
 * @property {SediObj} sedi
 * @property {AttivitaObj} attivita
 * @property {DocentiObj} docenti
 * @property {CDLObj} cdl
 * @property {InsegnamentiObj} insegnamenti
 */

/**
 * Restituisce una struttura contenete le associazioni (codice -> oggetto) utilizzate da easyroom
 *
 * @name getIds
 * @function
 * @access public
 * @returns {IdsObj} oggetto contenente le associazioni (codice -> oggetto) utilizzate da easyroom
 */

exports.getIds = () => {
	const url = 'https://easyroom.unitn.it/Orario/combo_call.php';
	return fetch(url)
		.then(data => data.text())
		.then(data => {
			const variables_to_obtain = new Set([
				'elenco_corsi',
				'elenco_attivita',
				'elenco_docenti',
				'et_elenco_cdl',
				'et_elenco_docenti',
				'et_elenco_insegnamenti',
				'elenco_sedi',
			]);

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
			const props = parse(data)
				.body
				.filter(obj => obj.type === 'VariableDeclaration' )
				.map(x => x.declarations)
				.reduce( (a,b) => {return a.concat(b);})
				.filter( variable => variables_to_obtain.has(variable.id.name))
				.reduce( (ris,varDeclarator) => {
					ris[varDeclarator.id.name] = static_eval(varDeclarator.init);

					return ris;
				},{});

			try{
				const ris = JSON.stringify({
					corsi: _generateCorsi(props.elenco_corsi),
					sedi: _generateSedi(props.elenco_sedi),
					attivita: _generateActivities(props.elenco_attivita),
					docenti: _generateDocenti(props.elenco_docenti),
					cdl: _generateCDL(props.et_elenco_cdl),
					insegnamenti: _generateETInsegnamenti(props.et_elenco_insegnamenti),
					et_docenti: _generateETDocenti(props.et_elenco_docenti)
				});
				return ris;
			}
			catch(err){
				return Promise.reject(new Error(err));
			}
		});
}

