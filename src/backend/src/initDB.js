const db = require('./db.js');
const Codes = require('./sources/easyroom.js').Codes;
const Calendar = require('./sources/calendar.js').Calendar;
const Sessioni = require('./sources/sessioni.js');

function insertCorsi(corsi, anno) {
	const promises = [];

	for (const codice_corso in corsi) {
		const elenco_anni = [];
		for (const codice_anno in corsi[codice_corso].elenco_anni) {
			const elenco_sessioni = [];
			if (corsi[codice_corso]
					.elenco_anni[codice_anno]
					.elenco_sessioni !== undefined) {
				for (const codice_sessione in corsi[codice_corso]
												.elenco_anni[codice_anno]
												.elenco_sessioni) {
					elenco_sessioni.push({
						id: codice_sessione,
						label: corsi[codice_corso]
							.elenco_anni[codice_anno]
							.elenco_sessioni[codice_sessione]
							.label
					});
				}
			}

			elenco_anni.push({
				id: codice_anno,
				label: corsi[codice_corso]
					.elenco_anni[codice_anno]
					.label,
				elenco_attivita: corsi[codice_corso]
					.elenco_anni[codice_anno]
					.elenco_attivita,
				codice_percorso_cdl: corsi[codice_corso]
					.elenco_anni[codice_anno]
					.codice_percorso_cdl,
				elenco_sessioni
			});
		}

		const corso = new db.Corso({
			anno,
			id: codice_corso,
			label: corsi[codice_corso].label,
			codice_cdl: corsi[codice_corso].codice_cdl,
			elenco_anni
		});

		promises.push(corso.save());
	}

	return promises;
}

function insertAttivita(attivita, anno) {
	const promises = [];

	for (const codice_attivita in attivita) {
		const att = new db.Attivita({
			anno,
			id: codice_attivita,
			label: attivita[codice_attivita].label
		});

		promises.push(att.save());
	}

	return promises;
}

function insertDocenti(docenti, anno) {
	const promises = [];

	for (const codice_docente in docenti) {
		const sessioni = [];
		if (docenti[codice_docente].elenco !== undefined) {
			for (const codice_sessione in docenti[codice_docente].elenco) {
				sessioni.push({
					id: codice_sessione,
					label: docenti[codice_docente].elenco[codice_sessione].label
				});
			}
		}

		const docente = new db.Docente({
			anno,
			id: codice_docente,
			label: docenti[codice_docente].label,
			sessioni
		});

		promises.push(docente.save());
	}

	return promises;
}

function insertInsegnamenti(insegnamenti, anno) {
	const promises = [];

	for (const codice_insegnamento in insegnamenti) {
		const elenco = [];
		for (const codice_sessione in insegnamenti[codice_insegnamento].elenco) {
			elenco.push({
				id: codice_sessione,
				label: insegnamenti[codice_insegnamento]
					.elenco[codice_sessione]
					.label
			});
		}

		const insegnamento = new db.Insegnamento({
			anno,
			id: codice_insegnamento,
			label: insegnamenti[codice_insegnamento].label,
			elenco
		});

		promises.push(insegnamento.save());
	}

	return promises;
}

function insertSedi(sedi) {
	const promises = [];

	for (const codice_sede in sedi) {
		const sede = new db.Sede({
			id: codice_sede,
			label: sedi[codice_sede].label
		});

		promises.push(sede.save());
	}

	return promises;
}

function insertCodes(r) {
	let promise = Promise.all(insertSedi(r.sedi));

	for (const anno in r) {
		if (isFinite(anno)) {
			const iAnno = parseInt(anno);
			if (r[anno].corsi !== undefined) {
				promise =
					promise.then(x => Promise.all(
						insertCorsi(r[anno].corsi, iAnno)
					));
			}

			if (r[anno].attivita !== undefined) {
				promise =
					promise.then(x => Promise.all(
						insertAttivita(r[anno].attivita, iAnno)
					));
			}

			if (r[anno].docenti !== undefined) {
				promise =
					promise.then(x => Promise.all(
						insertDocenti(r[anno].docenti, iAnno)
					));
			}

			if (r[anno].insegnamenti !== undefined) {
				promise =
					promise.then(x => Promise.all(
						insertInsegnamenti(r[anno].insegnamenti, iAnno)
					));
			}
		}
	}

	return promise.then(x => Promise.resolve(r)); // Porto avanti r
}

function insertOrari(r, pJSON, nReq) {
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

	function createPromise(tmp) {
		if (tmp.ar.length > 0) {
			const thisRequest = tmp.ar.slice(0, nReq);
			const otherRequest = tmp.ar.slice(nReq, undefined);

			return pJSON(thisRequest)
			.then(data => {
				for (let idx = 0; idx < data.length; ++idx) {
					tmp.orari = tmp.orari.concat(
						data[idx].elenco_lezioni.map(att => {
							// In caso esistano più luoghi in cui viene
							// fatta la stessa lezione li uniamo
							return db.Orario.update({
								anno: data[idx].annoScolastico,
								attivita: att.attivita.codice_attivita,
								timestamp_inizio: new Date(att.timestamp.inizio),
								timestamp_fine: new Date(att.timestamp.fine)
							}, {
								anno: data[idx].annoScolastico,
								attivita: att.attivita.codice_attivita,
								timestamp_inizio: new Date(att.timestamp.inizio),
								timestamp_fine: new Date(att.timestamp.fine),
								docente: att.attivita.docente,
								tipo: att.tipo,
								luogo: att.luogo.map(x => ({
									codice_sede: x.codice_dipartimento,
									codice_aula: x.codice_aula
								}))
							}, {
								upsert: true
							});
						})
					);
				}

				return Promise.resolve({
					ar: otherRequest,
					r: tmp.r,
					orari: tmp.orari
				}).then(createPromise);
			}, reason => {
				// In caso di fallimento della richiesta indico in
				// tmp.r.failed la richiesta fallita
				if (tmp.r.failed_orari === undefined) {
					tmp.r.failed_orari = [];
				}

				tmp.r.failed_orari = tmp.r.failed_orari.concat(thisRequest);
				return Promise.resolve({
					ar: otherRequest,
					r: tmp.r,
					orari: tmp.orari
				}).then(createPromise);
			});
		}

		return Promise.resolve({
			r: tmp.r,
			orari: tmp.orari
		});
	}

	const requests = [];
	const date = getYYYYMMDDDate(new Date());

	for (const anno in r) {
		if (isFinite(anno)) {
			const iAnno = parseInt(anno);
			for (const codice_corso in r[anno].corsi) {
				for (const codice_anno in r[anno].corsi[codice_corso].elenco_anni) {
					requests.push({
						lang: 'it',
						anno: iAnno,
						corso: codice_corso,
						percorso: codice_anno,
						date: date
					});
				}
			}
		}
	}

	return Promise.resolve({
		ar: requests,
		r,
		orari: []
	}).then(createPromise);
}

function insertEsami(r, pJSON, nReq) {
	function createPromise(tmp) {
		if (tmp.ar.length > 0) {
			const thisRequest = tmp.ar.slice(0, nReq);
			const otherRequest = tmp.ar.slice(nReq, undefined);

			return pJSON(thisRequest)
			.then(data => {
				for (let idx = 0; idx < data.length; ++idx) {
					const sessioni = data.reduce((a, generatedJSON) => {
						const ar = [];
						generatedJSON.listaAppelli.forEach(appelloLista => {
							if (appelloLista.codiceGenerale !== undefined &&
								appelloLista.codiceGenerale !== null &&
								appelloLista.codiceGenerale !== ''
							) {
								const e = new db.Esame({
									anno: parseInt(generatedJSON.infoSessione.AnnoAccademico),
									anno_cdl: generatedJSON.infoSessione.AnnoCdl,
									cdl: generatedJSON.infoSessione.Cdl,
									id_sessione: parseInt(generatedJSON.infoSessione.IdSessione),
									codice_generale: appelloLista.codiceGenerale,
									crediti: appelloLista.crediti,
									tipo_esame: appelloLista.tipoEsame,
									matricola_docente: appelloLista.matricolaDocente,
									numero_appelli: appelloLista.numeroAppelli,
									appelli: appelloLista.appelli.map(appello => ({
										timestamp: {
											inizio: appello.dataInizio,
											fine: appello.dataFine
										},
										aula: appello.aula,
										sede: appello.sede
									}))
								});

								ar.push(e.save());
							}
						});

						return a.concat(ar);
					}, []);

					tmp.sessioni =
						tmp.sessioni.concat(sessioni);
				}

				return Promise.resolve({
					ar: otherRequest,
					r: tmp.r,
					sessioni: tmp.sessioni
				}).then(createPromise);
			}, reason => {
				// In caso di fallimento della richiesta indico in
				// tmp.r.failed la richiesta fallita
				if (tmp.r.failed_esami === undefined) {
					tmp.r.failed_esami = [];
				}

				tmp.r.failed_orari = tmp.r.failed_esami.concat(thisRequest);
				return Promise.resolve({
					ar: otherRequest,
					r: tmp.r,
					sessioni: tmp.sessioni
				}).then(createPromise);
			});
		}

		return Promise.resolve({
			r: tmp.r,
			sessioni: tmp.sessioni
		});
	}

	const requests = [];

	for (const anno in r) {
		if (isFinite(anno)) {
			const iAnno = parseInt(anno);
			for (const codice_corso in r[anno].corsi) {
				if (r[anno].corsi[codice_corso]
						.codice_cdl !== undefined) {
					for (const codice_anno in r[anno].corsi[codice_corso]
												.elenco_anni) {
						if(r[anno].corsi[codice_corso]
								.elenco_anni[codice_anno]
								.codice_percorso_cdl !== undefined) {
							for (const codice_sessione in r[anno].corsi[codice_corso]
															.elenco_anni[codice_anno]
															.elenco_sessioni) {
								requests.push({
									anno: iAnno,
									cdl: r[anno].corsi[codice_corso]
											.codice_cdl,
									annocdl: r[anno].corsi[codice_corso]
												.elenco_anni[codice_anno]
												.codice_percorso_cdl,
									sessione: codice_sessione
								});
							}
						}
					}
				}
			}
		}
	}

	return Promise.resolve({
		ar: requests,
		r,
		sessioni: []
	}).then(createPromise);
}

function initDB() {
	const calendar = new Calendar(
		'https://easyroom.unitn.it/Orario/grid_call.php'
	);

	const codes = new Codes(
		'https://easyroom.unitn.it/Orario/combo_call.php',
		requests => Promise.all(
			requests.map(
				request => calendar.getAssoc(
					request.lang,
					request.anno,
					request.percorso,
					request.corso,
					request.date
				)
		)),
		10
	);

	return codes.getIds()
		.then(insertCodes)
		.then(r => {
			console.log(r.failed);

			return insertOrari(
				r,
				requests => Promise.all(
					requests.map(
						request => calendar.getCal(
							request.lang,
							request.anno,
							request.percorso,
							request.corso,
							request.date
						)
				)),
				1
			)
			.then(tmp => {
				return Promise.all(tmp.orari)
					.then(x => Promise.resolve(tmp.r));
			});
		})
		.then(r => {
			console.log(r.failed_orari);
			return insertEsami(
				r,
				requests => Promise.all(
					requests.map(
						request => Sessioni.getSessions(
							'et_cdl',
							request.anno,
							request.cdl,
							request.annocdl,
							request.sessione
						)
					)
				),
				10
			)
			.then(tmp => {
				console.log(r.failed_esami);
				return Promise.all(tmp.sessioni)
					.then(x => Promise.resolve(tmp.r));
			});
		});
}

module.exports = {
	initDB,
	subcommands: {
		insertCodes,
		codes: {
			insertCorsi,
			insertAttivita,
			insertDocenti,
			insertInsegnamenti,
			insertSedi
		},
		insertOrari,
		insertEsami
	}
};
