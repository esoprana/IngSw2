const fetch = require('node-fetch');
const esprima = require('esprima');
const escodegen = require('escodegen');

function generateCorsi(elenco_corsi){
	const ris={};

	elenco_corsi.forEach((annoScolastico) => {
		if(ris[annoScolastico.label] === undefined){

			var elenco = {};
			annoScolastico.elenco.forEach((corso) => {
				if(elenco[corso.valore] === undefined){

					var anniCorso={};
					corso.elenco_anni.forEach((annoCorso) => {
						anniCorso[annoCorso.valore] = {
							label: annoCorso.label
						};
					});

					elenco[corso.valore] = {
						label: corso.label,
						elenco_anni: anniCorso
					};
				} else {
					console.log("Errore: Doppia occorrenza di codice corso in elenco_corsi(il secondo valore verrà scartato)");
				}
			});

			ris[annoScolastico.label] = {
				valore: annoScolastico.valore,
				elenco: elenco
			}
		} else {
			console.log("Errore: Doppia occorrenza di anni scolastici in elenco_corsi(il secondo valore verrà scartato)");
		}
	})

	return ris;
}

function generateSedi(elenco_sedi){
	const ris={};

	elenco_sedi.forEach((sedi) => {
		if(ris[sedi.valore] !== undefined) {
			if(ris[sedi.valore].label !== sedi.label) {
				console.log("Errore: Doppia occorrenza di valore sedi in elenco_sedi(il secondo valore verrà scartato)");
			}
		} else {
			ris[sedi.valore] = {
				label: sedi.label
			};
		}
	});

	return ris;
}

function generateActivities(elenco_attivita){
	const ris={};

	elenco_attivita.forEach((annoScolastico) => {
		if(ris[annoScolastico.label] !== undefined) {
			console.log("Errore: Doppia occorrenza di anni scolastici in elenco_attivita(il secondo valore verrà scartato)");
		} else {
			const elenco={};
			annoScolastico.elenco.forEach((attivita) => {
				if(elenco[attivita.valore] !== undefined){
					if(elenco[attivita.valore].label !== attivita.label){
						console.log("Errore: Doppia occorrenza di attività in elenco_attivita(il secondo valore verrà scartato)\n" + attivita.valore+"\t" + attivita.label);
					}
				} else {
					elenco[attivita.valore] = {
						label: attivita.label
					};
				}
			});

			ris[annoScolastico.label] = {
				valore: annoScolastico.valore,
				elenco: elenco
			}
		}
	});

	return ris;
}

function generateDocenti(elenco_docenti){
	const ris={};

	elenco_docenti.forEach((annoScolastico) => {
		if(ris[annoScolastico.label] !== undefined) {
			if(ris[annoScolastico.label].valore === annoScolastico.valore) { // TODO: Aggiungere elenco
				console.log("Errore: Doppia occorrenza di anni scolastici in elenco_docenti(il secondo valore verrà scartato)\n" + annoScolastico.valore+"\t" + annoScolastico.label);
			}
		} else {
			const elenco={};

			annoScolastico.elenco.forEach((docente) => {
				// Usiamo una versione modificata del codice docente per prevenire
				// conversioni a Number(perdendo i 0 all'inizio del numero es:"001")
				const codice_docente = "D".concat(docente.valore);
				if(elenco[codice_docente] !== undefined){
					if(elenco[codice_docente].label === docente.label) {
						console.log("Errore: Doppia occorrenza di docente in elenco_docenti(il secondo valore verrà scartato)\n" + docente.valore+"\t" + docente.label);
					}
				} else {
					elenco[codice_docente] = {
						label: docente.label
					};
				}
			});

			ris[annoScolastico.label] = {
				valore: annoScolastico.valore,
				elenco: elenco
			};
		}
	});

	return ris;
}

function generateCDL(et_elenco_cdl){
	const ris={};

	et_elenco_cdl.forEach((annoScolastico) => {
		if(ris[annoScolastico.label] !== undefined){
			if(ris[annoScolastico.label].valore !== annoScolastico.valore) { // TODO: Aggiungere elenco
				console.log("Errore: Doppia occorrenza di anni scolastici in et_elenco_cdl(il secondo valore verrà scartato)\n" + annoScolastico.valore+"\t" + annoScolastico.label);
			}
		} else {
			const cdls = {};

			annoScolastico.elenco.forEach((cdl) => {
				if(cdls[cdl.valore] !== undefined) {
					if(cdls[cdl.valore].label !== cdl.label) { // TODO: Aggiungere elenco
						console.log("Errore: Doppia occorrenza di codici cdl in et_elenco_cdl(il secondo valore verrà scartato)\n" + cdl.valore+"\t" + cdl.label);
					}
				} else {
					const anni_cdl={};
					cdl.elenco_anni.forEach((anno) => {
						if(anni_cdl[anno.valore] !== undefined){
							if(anni_cdl[anno.valore].label !== anno.label) { // TODO: Aggiungere elenco
								console.log("Errore: Doppia occorrenza di anni in cdl in et_elenco_cdl(il secondo valore verrà scartato)\n" + anno.valore+"\t" + anno.label);
							}
						} else {
							const sessioni = {};
							anno.elenco_sessioni.forEach((sessione) => {
								if(sessioni[sessione.valore] !== undefined){
									if(sessioni[sessione.valore].label !== sessione.label) {
										console.log("Errore: Doppia occorrenza di sessione in anno in cdl in et_elenco_cdl(il secondo valore verrà scartato)\n" + sessione.valore+"\t" + sessione.label);
									}
								} else {
									sessioni[sessione.valore] = {
										label: sessione.label
									};
								}
							});
							anni_cdl[anno.valore] = {
								label: anno.label,
								elenco_sessioni: sessioni
							};
						}
					});

					cdls[cdl.valore] = {
						label: cdl.label,
						elenco: anni_cdl
					};
				}
			});

			ris[annoScolastico.label] = {
				valore: annoScolastico.valore,
				elenco: cdls
			};
		}
	});

	return ris;
}

function generateETDocenti(et_elenco_docenti){
	const ris={};
	et_elenco_docenti.forEach((annoScolastico) => {
		if(ris[annoScolastico.label] !== undefined){
			if(ris[annoScolastico.label].valore !== annoScolastico.valore) {
				console.log("Errore: Doppia occorrenza di anno scolastico in et_elenco_docenti(il secondo valore verrà scartato)\n" + sessione.valore+"\t" + sessione.label);
			}
		} else {
			const docenti={};

			annoScolastico.elenco.forEach((docente) => {
				const codice_docente="D"+docente.valore;
				if(docenti[codice_docente] !== undefined){
					if(docenti[codice_docente].label === docente.label){ //TODO: Agggiungi elenco sessioni
						console.log("Errore: Doppia occorrenza di codice docente in et_elenco_docenti(il secondo valore verrà scartato)\n" + sessione.valore+"\t" + sessione.label);
					}
				} else {
					const sessioni={};
					docente.elenco.forEach((sessione) => {
						if(sessioni[sessione.valore] !== undefined){
							if(sessioni[sessione.valore].label !== sessione.label){
								console.log("Errore: Doppia occorrenza di sessione in docente in et_elenco_docenti(il secondo valore verrà scartato)\n" + sessione.valore+"\t" + sessione.label);
							}
						} else {
							sessioni[sessione.valore] = {
								label: sessione.label
							};
						}
					});

					docenti[codice_docente] = {
						label: docente.label,
						elenco: sessioni
					}
				}
			});

			ris[annoScolastico.label] = {
				valore: annoScolastico.valore,
				elenco: docenti
			};
		}
	});

	return ris;
}

function generateETInsegnamenti(et_elenco_insegnamenti){
	const ris={};
	et_elenco_insegnamenti.forEach((annoScolastico) => {
		const insegnamenti={};
		annoScolastico.elenco.forEach((insegnamento) => {
			if(insegnamenti[insegnamento.valore] !== undefined) {
				if(insegnamenti[insegnamento.valore].label !== insegnamento.label) { // TODO: Aggiungere elenco sessioni
					console.log("Errore: Doppia occorrenza di codice insegnamento in elenco_insegnamenti(il secondo valore verrà scartato)");
				}
			} else {
				const sessioni={};
				insegnamento.elenco.forEach((sessione) => {
					if(sessioni[sessione.valore] !== undefined){
						if(sessioni[sessione.valore].label !== sessone.label) {
							console.log("Errore: Doppia occorrenza di codice sessione in elenco_insegnamenti(il secondo valore verrà scartato)");
						}
					} else {
						sessioni[sessione.valore] = {
							label: sessione.label
						};
					}
				});

				insegnamenti[insegnamento.valore] = {
					label: insegnamento.label,
					elenco: sessioni
				}
			}
		});

		ris[annoScolastico.label] = {
			valore: annoScolastico.valore,
			elenco: insegnamenti
		};
	});

	return ris;
}

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
			 *  3. Trasformo ogni variabile in una proprietà con uguale nome e valore
			 *  4. Metto tutte le proprietà in un oggetto
			 */
			const props = esprima.parse(data)
				.body
				.filter(obj => obj.type === 'VariableDeclaration' )
				.map(x => x.declarations)
				.reduce( (a,b) => {return a.concat(b);})
				.filter( variable => variables_to_obtain.has(variable.id.name))
				.map(varDeclarator => {
					return {
						type: "Property",
						key: {
							type: "Literal",
							value: varDeclarator.id.name,
//							raw: "\"" + varDeclarator.id.name +"\""
						},
//						computed: false,
						value: varDeclarator.init,
//						kind: "init",
//						method: false,
//						shorthand: false
					};
				});

			// Converto tutto in un oggetto JSON
			var json = JSON.parse(escodegen.generate(
				{
					type: "ObjectExpression",
					properties: props
				},
				{
					format: {
						json: true,
						compact: true
					}
				}));


			return JSON.stringify({
				corsi: generateCorsi(json.elenco_corsi),
				sedi: generateSedi(json.elenco_sedi),
				attivita: generateActivities(json.elenco_attivita),
				docenti: generateDocenti(json.elenco_docenti),
				cdl: generateCDL(json.et_elenco_cdl),
				insegnamenti: generateETInsegnamenti(json.et_elenco_insegnamenti),
				et_docenti: generateETDocenti(json.et_elenco_docenti)
			});
		});
}

