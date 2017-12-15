const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const db = require('./db.js');
const initDB = require('./initDB.js').initDB;

const jsonParser = bodyParser.json({type: '*/*'});

const api = express.Router();

function logAndFowardError(res, err, def) {
	if ((typeof err === 'object') && (!(err instanceof Error))) {
		if (err.log === undefined || err.log == true) {
			console.log('err: ' + JSON.stringify(err));
		}
		return res.status(err.status).end(err.message);
	}

	console.log('err: ' + JSON.stringify(err));

	return res.status(def.status).end(def.err);
}

api.get('/orari/corsi/:anno/:codice_corso',
	(req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		return db.Corso.findOne({
			anno: req.params.anno,
			id: req.params.codice_corso
		}, {elenco_anni: 1}).then(corso => {
			if (corso === null) {
				return Promise.reject({
					status: 404,
					message: 'L\'elemento richiesto non è stato trovato',
					log: 0
				});
			}

			const richiesta = {
				anno: parseInt(req.params.anno),
				attivita: {
					$in: corso.elenco_anni.reduce((r, anno) =>
						r.concat(anno.elenco_attivita), [])
				}
			};

			if ((req.query.timestampInizio !== undefined) &&
				(req.query.timestampFine !== undefined)) {
				const timeInizio = new Date(req.query.timestampInizio);
				const timeFine = new Date(req.query.timestampFine);

				if ((timeInizio === 'Invalid Date') || (timeFine === 'Invalid Date')) {
					return Promise.reject({
						status: 400,
						message: 'Invalid timestampInizio/timestampFine',
						log: 0
					});
				}

				richiesta['timestamp.inizio'] = {
					$gte: timeInizio, $lte: timeFine
				};
			}

			return db.Orario.find(richiesta).sort({'timestamp.inizio': 1}).then(orari => {
				const ris = {
					elenco_lezioni: orari.map(orario => ({
						insegnamento: {
							codice_insegnamento: orario.attivita,
							docente: orario.docente
						},
						luogo: {
							codice_aula: orario.luogo.codice_aula,
							codice_sede: orario.luogo.codice_sede
						},
						timestamp: {
							inizio: orario.timestamp.inizio,
							fine: orario.timestamp.fine
						},
						tipo: orario.tipo
					})),
					anno: req.params.anno,
					codice_corso: req.params.codice_corso,
					codice_percorso: req.params.codice_percorso,
					timestampInizio: req.query.timestampInizio,
					timestampFine: req.query.timestampFine,
					deNorm: req.query.deNorm
				};

				if (req.query.deNorm !== undefined) {
					return db.Attivita.find({
						anno: req.params.anno,
						id: {$in: orari.map(orario => orario.attivita)}
					}, {
						id: 1,
						label: 1
					}).then(data => {
						const elencoAttivita = new Map(data.map(attivita => [attivita.id, attivita.label]));
						ris.elenco_lezioni.forEach(lezione => {
							lezione.insegnamento.nome_insegnamento =
								elencoAttivita.get(lezione.insegnamento.codice_insegnamento);
						});

						return Promise.resolve();
					}).then(() => {
						return db.Sede.find({
							id: {$in: orari.map(orario => orario.luogo.codice_sede)}
						}).then(sedi => {
							const elencoSedi = new Map(sedi.map(sede => [sede.id, sede.label]));
							ris.elenco_lezioni.forEach(lezione => {
								lezione.luogo.nome_sede = elencoSedi.get(lezione.luogo.codice_sede);
							});

							return Promise.resolve(ris);
						});
					});
				}

				return Promise.resolve(ris);
			});
		}).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile ottenere l\'elemento richiesto'
			})
		);
	}
);

api.get('/orari/corsi/:anno/:codice_corso/:codice_percorso',
	(req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		return db.Corso.findOne({
			anno: req.params.anno,
			id: req.params.codice_corso,
			elenco_anni: {$elemMatch: {id: req.params.codice_percorso}}
		}, {elenco_anni: 1}).then(corso => {
			if (corso === null) {
				return Promise.reject({
					status: 404,
					message: 'L\'elemento richiesto non è stato trovato',
					log: 0
				});
			}

			const richiesta = {
				anno: parseInt(req.params.anno),
				attivita: {
					$in: corso.elenco_anni
						.find(percorso => percorso.id === req.params.codice_percorso)
						.elenco_attivita
				}
			};

			if ((req.query.timestampInizio !== undefined) &&
				(req.query.timestampFine !== undefined)) {
				const timeInizio = new Date(req.query.timestampInizio);
				const timeFine = new Date(req.query.timestampFine);

				if ((timeInizio == 'Invalid Date') || (timeFine == 'Invalid Date')) {
					return Promise.reject({
						status: 400,
						message: 'Invalid timestampInizio/timestampFine',
						log: 0
					});
				}

				richiesta['timestamp.inizio'] = {
					$gte: timeInizio, $lte: timeFine
				};
			}

			return db.Orario.find(richiesta).sort({'timestamp.inizio': 1}).then(orari => {
				const ris = {
					elenco_lezioni: orari.map(orario => ({
						insegnamento: {
							codice_insegnamento: orario.attivita,
							docente: orario.docente
						},
						luogo: {
							codice_aula: orario.luogo.codice_aula,
							codice_sede: orario.luogo.codice_sede
						},
						timestamp: {
							inizio: orario.timestamp.inizio,
							fine: orario.timestamp.fine
						},
						tipo: orario.tipo
					})),
					anno: req.params.anno,
					codice_corso: req.params.codice_corso,
					codice_percorso: req.params.codice_percorso,
					timestampInizio: req.query.timestampInizio,
					timestampFine: req.query.timestampFine,
					deNorm: req.query.deNorm
				};

				if (req.query.deNorm !== undefined) {
					return db.Attivita.find({
						anno: req.params.anno,
						id: {$in: orari.map(orario => orario.attivita)}
					}, {
						id: 1,
						label: 1
					}).then(data => {
						const elencoAttivita = new Map(data.map(attivita => [attivita.id, attivita.label]));
						ris.elenco_lezioni.forEach(lezione => {
							lezione.insegnamento.nome_insegnamento =
								elencoAttivita.get(lezione.insegnamento.codice_insegnamento);
						});

						return Promise.resolve();
					}).then(() => {
						return db.Sede.find({
							id: {$in: orari.map(orario => orario.luogo.codice_sede)}
						}).then(sedi => {
							const elencoSedi = new Map(sedi.map(sede => [sede.id, sede.label]));
							ris.elenco_lezioni.forEach(lezione => {
								lezione.luogo.nome_sede = elencoSedi.get(lezione.luogo.codice_sede);
							});

							return Promise.resolve(ris);
						});
					});
				}

				return Promise.resolve(ris);
			});
		}).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile ottenere l\'elemento richiesto'
			})
		);
	}
);

api.get('/attivita/:anno', (req, res) => {
	if (!isFinite(req.params.anno)) {
		return logAndFowardError(res, {
			status: 400,
			message: 'Il campo anno deve essere un numero finito',
			log: 0
		});
	}

	return db.Attivita.find({
		anno: req.params.anno
	}, {
		_id: 0,
		id: 1,
		label: 1
	})
	.then(
		result => res.json({
			anno: req.params.anno,
			elenco_attivita: result
		}),
		err => logAndFowardError(res, err, {
			status: 500,
			message: 'Impossibile trovare l\'elemento richiesto'
		})
	);
});

api.route('/attivita/:anno/:codice_attivita')
	.get((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		return db.Attivita.findOne({
			anno: req.params.anno,
			id: req.params.codice_attivita
		}, {
			_id: 0,
			anno: 1,
			id: 1,
			label: 1
		})
		.then(
			result => {
				if (result === null) {
					return Promise.reject({
						status: 404,
						message: 'L\'elemento richiesto non è stato trovato',
						log: 0
					});
				}

				return Promise.resolve(result);
			}
		).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile trovare l\'elemento richiesto'
			})
		);
	})
	.post(jsonParser, (req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		if (req.body.label === undefined) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo label deve essere definito',
				log: 0
			});
		} else if (typeof req.body.label !== 'string') {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo label deve essere di tipo string',
				log: 0
			});
		} else if (req.body.label === '') {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo label deve essere una stringa non vuota',
				log: 0
			});
		}

		return db.Attivita.findOne({
			anno: req.params.anno,
			id: req.params.codice_attivita
		})
		.then(
			result => {
				if (result === null) {
					return Promise.rejct({
						status: 400,
						message: 'L\'elemento richiesto non è stato trovato',
						log: 0
					});
				}

				result.label = req.body.label;

				return result.save().then(
					result => res.json({status: 'ok'}),
					err => Promise.reject({
						status: 500,
						message: 'Impossibile fare l\'update dell\'elemento richiesto',
						log: 1
					})
				);
			},
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile trovare l\'elemento richiesto'
			})
		);
	})
	.put(jsonParser, (req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		if (req.body.label === undefined) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo label deve essere definito',
				log: 0
			});
		} else if (typeof req.body.label !== 'string') {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo label deve essere di tipo string',
				log: 0
			});
		} else if (req.body.label === '') {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo label deve essere una stringa non vuota',
				log: 0
			});
		}

		return new db.Attivita({
			anno: req.params.anno,
			id: req.params.codice_attivita,
			label: req.body.label
		}).save().then(
			result => res.json({status: 'ok'}),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile inserire l\'elemento richiesto'
			})
		);
	})
	.delete((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		return db.Attivita.deleteOne({
			anno: req.params.anno,
			id: req.params.codice_attivita
		}).then(
			r => {
				if ((r.result.ok === 1) && (r.result.n === 1)) {
					return Promise.resolve({status: 'ok'});
				}

				return Promise.reject({
					status: 500,
					message: 'Impossibile eliminare l\'oggetto richiesto',
					log: 0
				});
			})
		.then(
			r => res.json(r),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile eliminare l\'oggetto richiesto'
			})
		);
	});

api.get('/docenti/:anno', (req, res) => {
	if (!isFinite(req.params.anno)) {
		return logAndFowardError(res, {
			status: 400,
			message: 'Il campo anno deve essere un numero finito',
			log: 0
		});
	}

	return db.Docente.find({
		anno: req.params.anno
	}, {
		_id: 0,
		anno: 0,
		__v: 0,
		'sessioni._id': 0
	}).then(
		result => res.json({anno: req.params.anno, elenco_docenti: result}),
		err => logAndFowardError(res, err, {
			status: 500,
			message: 'Impossibile recuperare l\'elemento richiesto'
		})
	);
});

api.route('/docenti/:anno/:codice_docente')
	.get((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		return db.Docente.findOne({
			anno: req.params.anno,
			id: req.params.codice_docente
		}, {
			_id: 0,
			id: 0,
			anno: 0,
			__v: 0,
			'sessioni._id': 0
		}).then(
			result => {
				if (result === null) {
					return Promise.rejects({
						status: 404,
						message: 'L\'elemento richiesto non è stato trovato',
						log: 0
					});
				}

				return res.json({
					docente: result,
					anno: req.params.anno,
					id: req.params.codice_docente
				});
			},
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile trovare l\'elemento richiesto'
			})
		);
	})
	.post(jsonParser, (req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError({
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		if (req.body.label !== undefined) {
			if (typeof req.body.label !== 'string') {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo label deve essere di tipo string',
					log: 0
				});
			} else if (req.body.label === '') {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo label deve essere una stringa non vuota',
					log: 0
				});
			}
		}

		if (req.body.sessioni !== undefined) {
			if (!Array.isArray(req.body.sessioni)) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo sessioni deve essere un array',
					log: 0
				});
			} else if (req.body.sessioni
								.every(x => (x.label !== undefined) &&
											(typeof x.label === 'string') &&
											(x.valore !== undefined) &&
											(isFinite(x.valore))
			)) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo sessioni deve avere struttura:\n' +
								'[{label: string, valore: number},...]',
					log: 0
				});
			}
		}

		return db.Docente.findOne({
			anno: req.params.anno,
			id: req.params.codice_docente
		}).then(
			result => {
				if (result === null) {
					return Promise.rejects({
						status: 404,
						message: 'L\'elemento richiesto non è stato trovato',
						log: 0
					});
				}

				if (req.body.sessioni !== undefined) {
					result.sessioni = req.body.sessioni;
				}

				if (req.body.label !== undefined) {
					result.label = req.body.label;
				}

				return result.save().then(
					ok => Promise.resolve({status: 'ok'}),
					err => Promise.rejects({
						status: 500,
						message: 'Impossibile fare l\'update dell\'elemento richiesto',
						log: 0
					})
				);
			},
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile fare l\'update dell\'elemento richiesto'
			})
		);
	})
	.put(jsonParser, (req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		if (req.body.label === undefined) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo label deve essere presente',
				log: 0
			});
		} else if (typeof req.body.label !== 'string') {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo label deve essere di tipo string',
				log: 0
			});
		} else if (req.body.label === '') {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo label deve essere una stringa non vuota',
				log: 0
			});
		}

		if (req.body.sessioni !== undefined) {
			if (!Array.isArray(req.body.sessioni)) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo sessioni deve essere un array',
					log: 0
				});
			} else if (req.body.sessioni
								.every(x => (x.label !== undefined) &&
											(typeof x.label === 'string') &&
											(x.valore !== undefined) &&
											(isFinite(x.valore))
			)) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo sessioni deve avere struttura:\n' +
								'[{label: string, valore: number},...]',
					log: 0
				});
			}
		}

		return new db.Docente({
			anno: req.params.anno,
			id: req.params.codice_docente,
			label: req.body.label,
			sessioni: req.body.sessioni
		}).save().then(
			ok => res.json({status: 'ok'}),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile inserire l\'elemento richiesto'
			})
		);
	})
	.delete((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		return db.Docente.deleteOne({
			anno: req.params.anno,
			id: req.param.codice_docente
		}).then(
			r => {
				if ((r.result.ok === 1) && (r.result.n === 1)) {
					return Promise.resolve({status: 'ok'});
				}

				return Promise.reject({
					status: 500,
					message: 'Impossibile eliminare l\'oggetto richiesto',
					log: 0
				});
			}
		).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message:'Impossibile eliminare l\'oggetto richiesto'
			})
		);
	});


api.get('/corsi', (req, res) => {
	return db.Corso.distinct('anno')
		.then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile recuperare la lista degli anni'
			})
		);
});

api.get('/corsi/:anno', (req, res) => {
	if (!isFinite(req.params.anno)) {
		return logAndFowardError(res, {
			status: 400,
			message: 'Il campo anno deve essere un numero finito',
			log: 0
		});
	}

	let promise = Promise.resolve();

	if (req.query.deNorm !== undefined) {
		promise = promise.then(() => {
			return db.Attivita.find({
				anno: req.params.anno
			}, {
				_id: 0,
				id: 1,
				label: 1
			}).then(x => Promise.resolve(new Map(
				x.map(k => [k.id, {label: k.label}])
			)));
		});
	}

	return promise.then(attMap => {
		return db.Corso.find({
			anno: req.params.anno
		}, {
			_id: 0,
			anno: 0,
			codice_cdl: 0,
			__v: 0,
			'elenco_anni.elenco_sessioni._id': 0,
			'elenco_anni.codice_percorso_cdl': 0,
			'elenco_anni._id': 0
		})
		.then(corsi => {
			const newCorsi = corsi.reduce((corsi, corso) => {
				const newElencoAnni =
					corso.elenco_anni.reduce((percorsi, percorso) => {
						let newElencoAttivita;
						if (req.query.deNorm !== undefined) {
							newElencoAttivita = {};
							percorso.elenco_attivita.forEach(codice_attivita => {
								if (attMap.has(codice_attivita)) {
									newElencoAttivita[codice_attivita] =
										attMap.get(codice_attivita);
								}
							});
						} else {
							newElencoAttivita = percorso.elenco_attivita;
						}

						const newElencoSessioni =
							percorso.elenco_sessioni.reduce((r, sessione) => {
								r[sessione.id] = {
									label: sessione.label
								};

								return r;
							}, {});

						percorsi[percorso.id] = {
							label: percorso.label,
							elenco_sessioni: newElencoSessioni,
							elenco_attivita: newElencoAttivita
						};
						return percorsi;
					}, {});

				corsi[corso.id] = {
					label: corso.label,
					elenco_anni: newElencoAnni
				};

				return corsi;
			}, {});

			return Promise.resolve({
				anno: req.params.anno,
				corsi: newCorsi,
				deNorm: req.query.deNorm
			});
		});
	}).then(
		json => res.json(json),
		err => logAndFowardError(res, err, {
			status: 500,
			message: 'Impossibile recuperare la lista dei corsi dell\'anno richiesto'
		})
	);
});

api.route('/corsi/:anno/:codice_corso')
	.get((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		return db.Corso.findOne({
			anno: req.params.anno,
			id: req.params.codice_corso
		}, {
			_id: 0,
			__v: 0,
			'elenco_anni._id': 0,
			'elenco_anni.codice_percorso_cdl': 0,
			'elenco_anni.elenco_attivita._id': 0,
			'elenco_anni.elenco_sessioni._id': 0
		}).then(json => {
			if (json === null) {
				return Promise.reject({
					status: 404,
					message: 'L\'elemento richiesto non è stato trovato',
					log: 0
				});
			}

			const elencoAttivita = new Map();

			const newElencoAnni = json.elenco_anni.reduce((r, percorso) => {
				const newElencoSessioni =
					percorso.elenco_sessioni.reduce((r, sessione) => {
						r[sessione.id] = {
							label: sessione.label
						};

						return r;
					}, {});

				r[percorso.id] = {
					label: percorso.label,
					elenco_sessioni: newElencoSessioni
				};

				if (req.query.deNorm !== undefined) {
					r[percorso.id].elenco_attivita = {};
					percorso.elenco_attivita.forEach(codice_attivita => {
						if (!elencoAttivita.has(codice_attivita)){
							elencoAttivita.set(codice_attivita, []);
						}

						elencoAttivita.get(codice_attivita).push({
							codice_percorso: percorso.id
						});
					});
				} else {
					r[percorso.id].elenco_attivita = percorso.elenco_attivita;
				}

				return r;
			}, {});

			const ris = {
				corso: {
					label: json.label,
					elenco_anni: newElencoAnni
				},
				anno: json.anno,
				id: json.id,
				deNorm: req.query.deNorm
			};

			if (req.query.deNorm !== undefined) {
				return db.Attivita.find({
					anno: req.params.anno,
					id: {$in: [...elencoAttivita.keys()]}
				}, {
					_id: 0,
					id: 1,
					label: 1
				}).then(data => {
					data.forEach(attivita => {
						elencoAttivita.get(attivita.id).forEach(pos => {
							ris.corso
								.elenco_anni[pos.codice_percorso]
								.elenco_attivita[attivita.id] = {
									label: attivita.label
								};
						});
					});

					return Promise.resolve(ris);
				});
			}

			return Promise.resolve(ris);
		}).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile recuperare il corso indicato'
			})
		);
	})
	.put(jsonParser, (req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		if (req.body.elenco_anni === undefined) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo elenco_anni non è presente',
				log: 0
			});
		} else if (!Array.isArray(req.body.elenco_anni)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo elenco_anni deve essere un array',
				log: 0
			});
		} else if (req.body.elenco_anni.every(
				x => ((x.id !== undefined) && (typeof x.id === 'string') &&
					(x.label !== undefined) && (Array.isArray(x.label)) &&
					(x.label.every(l => typeof l === 'string'))))) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo elenco_anni deve avere struttura\n' +
						'[{id: string, label:[string,...]},...]',
				log: 0
			});
		}

		const toinsert = {
			anno: req.params.anno,
			id: req.params.codice_corso,
			label: req.body.label,
			elenco_anni: req.body.elenco_anni
		};

		if (req.body.codice_cdl !== undefined) {
			if (typeof req.body.codice_cdl !== 'string') {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo codice_cdl deve essere di tipo string',
					log: 0
				});
			}

			toinsert.codice_cdl = req.body.codice_cdl;
		}

		return new db.Corso(toinsert).save()
			.then(
				result => res.json({status: 'ok'}),
				err => logAndFowardError(res, err, {
					status: 500,
					message: 'Impossibile inserire l\'elemento richiesto'
				})
			);
	})
	.post(jsonParser, (req, res) => {
		const toSet = {};

		if (req.body.codice_cdl !== undefined) {
			if (typeof req.body.codice_cdl !== 'string') {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo codice_cdl deve essere di tipo string',
					log: 0
				});
			}

			toSet.codice_cdl = req.body.codice_cdl;
		}

		if (req.body.label !== undefined) {
			if (typeof req.body.label !== 'string') {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo label deve essere di tipo string',
					log: 0
				});
			}

			toSet.label = req.body.label;
		}

		if (req.body.elenco_anni !== undefined) {
			if (!Array.isArray(req.body.elenco_anni)) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo elenco_anni deve essere un array',
					log: 0
				});
			} else if (req.body.elenco_anni.every(
					x => ((x.id !== undefined) && (typeof x.id === 'string') &&
						(x.label !== undefined) && (Array.isArray(x.label)) &&
						(x.label.every(l => typeof l === 'string'))))) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo elenco_anni deve avere struttura\n' +
							'[{id: string, label:[string,...]},...]',
					log: 0
				});
			}

			toSet.elenco_anni = req.body.elenco_anni;
		}

		// Update non valida l'input mentre findOne e successivamente save si
		return db.Corso.findOne({
			anno: req.params.anno,
			id: req.params.codice_corso
		})
		.then(
			result => {
				if (result === null) {
					return Promise.reject({
						status: 400,
						message: 'Impossibile trovare l\'elemento richiesto',
						log: 0
					});
				}

				if (toSet.codice_cdl !== undefined) {
					if (toSet.codice_cdl === '') {
						result.codice_cdl = undefined;
					} else {
						result.codice_cdl = toSet.codice_cdl;
					}
				}

				if (toSet.elenco_anni !== undefined) {
					result.elenco_anni = toSet.elenco_anni;
				}

				if (toSet.label !== undefined) {
					result.label = toSet.label;
				}

				return result.save().then(
					result => Promise.resolve({status: 'ok'}),
					err => Promise.rejects({
						status: 500,
						message: 'Impossibile fare l\'update dell\'elemento richiesto',
						log: 1
					})
				);
			}
		).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile fare l\'update dell\'elemento richiesto'
			})
		);
	})
	.delete((req, res) => {
		return db.Corso.deleteOne({
			anno: req.params.anno,
			id: req.params.codice_corso
		}).then(
			r => {
				if ((r.result.ok === 1) && (r.result.n === 1)) {
					return Promise.resolve({status: 'ok'});
				}

				return Promise.reject({
					status:500,
					message: 'Impossibile eliminare l\'oggetto richiesto',
					log: 1
				});
			}
		).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile eliminare l\'oggetto richiesto'
			})
		);
	});

api.route('/corsi/:anno/:codice_corso/:codice_percorso')
	.get((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		return db.Corso.findOne({
			anno: req.params.anno,
			id: req.params.codice_corso,
			elenco_anni: {$elemMatch: {id: req.params.codice_percorso}}
		}, {
			_id: 0,
			anno: 1,
			id: 1,
			'elenco_anni.id': 1,
			'elenco_anni.label': 1,
			'elenco_anni.elenco_attivita': 1,
			'elenco_anni.elenco_sessioni': 1
		}).then(corso => {
			if (corso === null) {
				return Promise.reject({
					status: 404,
					message: 'L\'elemento richiesto non è stato trovato',
					log: 0
				});
			}

			const tmpPercorso =
				corso.elenco_anni
					.find(percorso => percorso.id == req.params.codice_percorso);

			const newElencoSessioni =
				tmpPercorso.elenco_sessioni.reduce((r, sessione) => {
					r[sessione.id] = {
						label: sessione.label
					};

					return r;
				}, {});

			const ris = {
				percorso: {
					label: tmpPercorso.label,
					elenco_sessioni: newElencoSessioni
				},
				anno: corso.anno,
				id: corso.id,
				id_percorso: tmpPercorso.id,
				deNorm: req.query.deNorm
			};

			if (req.query.deNorm !== undefined) {
				return db.Attivita.find({
					anno: req.params.anno,
					id: {$in: tmpPercorso.elenco_attivita}
				}, {
					_id: 0,
					id: 1,
					label: 1
				}).then(data => {
					ris.percorso.elenco_attivita = {};
					data.forEach(attivita => {
						ris.percorso.elenco_attivita[attivita.id] = {
							label: attivita.label
						};
					});

					return Promise.resolve(ris);
				});
			}

			ris.percorso.elenco_attivita = tmpPercorso.elenco_attivita;

			return Promise.resolve(ris);
		}).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile recuperare il percorso indicato'
			})
		);
	});

const app = express();
app.use('/api', api);
app.listen(3000);
