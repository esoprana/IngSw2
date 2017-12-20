const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

const calendario_eventi = require('./sources/calendario_eventi.js');
const sessioni = require('./sources/sessioni.js');

const db = require('./db.js');
// const initDB = require('./initDB.js').initDB; Per inizializzare il db

function logAndFowardError(res, err, def) {
	if ((typeof err === 'object') && (!(err instanceof Error))) {
		if (err.log === undefined || err.log == true) {
			console.log('err: ' + JSON.stringify(err));
		}
		return res.status(err.status).end(err.message);
	}

	console.log('err: ' + JSON.stringify(err, null, 4));

	return res.status(def.status).end(def.err);
}

const jsonParser = bodyParser.json({type: '*/*'});
const api = express.Router();
api.route('/orari/corsi/:anno/:codice_corso/:codice_percorso')
	/**
	 * @name OrariWithCorso
	 * Permette di ottenere le informazioni riguardanti gli orari di un determinato
	 * (anno, corso, percorso)
	 * @route {GET} /orari/corsi/:anno/:codice_corso/:codice_percorso/
	 * @routeparam {Number} anno anno all'interno degl quale cercare il corso
	 * @routeparam {String} codice_corso codice che identifica il corso
	 * @routeparam {String} codice_percorso codice che identifica il percorso
	 */
	.get((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

		const richiestaOrari = {
			anno: parseInt(req.params.anno)
		};

		if ((req.query.timestampInizio !== undefined) &&
			(req.query.timestampFine !== undefined)) {
			const timeInizio = new Date(req.query.timestampInizio);
			const timeFine = new Date(req.query.timestampFine);

			if ((timeInizio == 'Invalid Date') || (timeFine == 'Invalid Date')) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Invalid timestampInizio/timestampFine',
					log: 0
				});
			}

			richiestaOrari['timestamp_inizio'] = {
				$gte: timeInizio, $lte: timeFine
			};
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

			richiestaOrari.attivita = {
				$in: corso.elenco_anni
					.find(percorso => percorso.id === req.params.codice_percorso)
					.elenco_attivita
			};

			return db.Orario.find(
				richiestaOrari, {
					_id: 0,
					__v:0,
					'luogo._id': 0
			})
			.sort({'timestamp_inizio': 1})
			.then(orari => {
				const ris = {
					elenco_lezioni: orari.map(orario => ({
						insegnamento: {
							codice_insegnamento: orario.attivita,
							docente: orario.docente
						},
						luogo: orario.luogo.map(x => ({
							codice_aula: x.codice_aula,
							codice_sede: x.codice_sede
						})),
						timestamp_inizio: orario.timestamp_inizio,
						timestamp_fine: orario.timestamp_fine,
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
							id: {$in: orari.map(orario => orario.luogo)
											.reduce((a, b) =>
												a.concat(b.map(x => x.codice_sede))
											, [])
							}
						}).then(sedi => {
							const elencoSedi = new Map(sedi.map(sede => [sede.id, sede.label]));
							ris.elenco_lezioni.forEach(lezione => {
								lezione.luogo.forEach(l => {
									l.nome_sede = elencoSedi.get(l.codice_sede);
								});
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
	});

api.route('/orari/:anno/:codice_attivita/:timestamp_inizio/:timestamp_fine')
	/**
	 * @name OrariComplete
	 * Permette di ottenere le informazioni rigurdanti un determinato orario
	 * @route {GET} /orari/:anno/:codice_attivita/:timestamp_inizio/:timestamp_fine
	 * @routeparam {Number} anno anno all'interno degl quale cercare l'attivita legata
	 * @routeparam {String} codice_attivita codice che identifica l'attivita legata all'orario
	 * @routeparam {Date} timestamp_inizio timestamp in ISO che identifica l'inizio dell'attivita
	 * @routeparam {Date} timestamp_fine timestamp in ISO che identifica l'inizio dell'attivita
	 */
	.get((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere di tipo Number'
			});
		}

		req.params.codice_attivita =
			req.params.codice_attivita.replace('^', '/');

		const tInizio = new Date(req.params.timestamp_inizio);
		const tFine = new Date(req.params.timestamp_fine);

		if ((tInizio == 'Invalid Date') || (tFine == 'Invalid Date')) {
			return logAndFowardError(res, {
				status: 400,
				message: 'I campi timestamp_inizio e timestamp_fine devono essere una data ISO'
			});
		}

		return db.Orario.findOne({
			anno: req.params.anno,
			attivita: req.params.codice_attivita,
			timestamp_inizio: tInizio,
			timestamp_fine: tFine
		}, {
			_id: 0,
			__v: 0,
			'luogo._id': 0
		})
		.then(orario => {
			if (orario === null) {
				return Promise.reject({
					status: 404,
					message: 'L\'elemento richiesto non è stato trovato',
					log: 0
				});
			}

			const ris = orario.toObject();

			if (req.query.deNorm !== undefined) {
				return db.Sede.find({
					id: {$in: orario.luogo.map(x => x.codice_sede)}
				}).then(sedi => {
					const elencoSedi = new Map(sedi.map(sede => [sede.id, sede.label]));
					ris.luogo.forEach(l => {
						l.nome_sede = elencoSedi.get(l.codice_sede);
					});

					return Promise.resolve(ris);
				});
			}

			return Promise.resolve(ris);
		})
		.then(
			result => res.json(result),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile ottenere l\'orario richiesto'
			})
		);
	})
	/**
	 * @name OrariComplete
	 * Permette di aggiornare le informazioni riguardanti un determinato orario
	 * @route {PUT} /orari/:anno/:codice_attivita/:timestamp_inizio/:timestamp_fine
	 * @routeparam {Number} anno anno all'interno degl quale cercare l'attivita legata
	 * @routeparam {String} codice_attivita codice che identifica l'attivita legata all'orario
	 * @routeparam {Date} timestamp_inizio timestamp in ISO che identifica l'inizio dell'attivita
	 * @routeparam {Date} timestamp_fine timestamp in ISO che identifica l'inizio dell'attivita
	 * @bodyparam {String} docente nome del docente
	 * @bodyparam {String} tipo tipo di attivita(lezione, esercitazione,ecc)
	 * @bodyparam Array.<{codice_aula: String, codice_sede: String}>
	 *			luogo luogo dove si svolge l'attivita
	 */
	.put(jsonParser, (req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere di tipo Number'
			});
		}

		req.params.codice_attivita =
			req.params.codice_attivita.replace('^', '/');

		const tInizio = new Date(req.params.timestamp_inizio);
		const tFine = new Date(req.params.timestamp_fine);

		if ((tInizio == 'Invalid Date') || (tFine == 'Invalid Date')) {
			return logAndFowardError(res, {
				status: 400,
				message: 'I campi timestamp_inizio e timestamp_fine devono ' +
							'essere una data ISO'
			});
		}

		if (req.body.docente !== undefined) {
			if (typeof req.body.docente !== 'string') {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo docente deve essere di tipo string'
				});
			}
		}

		if (req.body.tipo !== undefined) {
			if (typeof req.body.tipo !== 'string') {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo tipo deve essere di tipo string'
				});
			}
		}

		if (req.body.luogo !== undefined) {
			if (!Array.isArray(req.body.luogo)) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo luogo deve essere un array'
				});
			} else if (!req.body.luogo.every(x =>
				((x.codice_aula === undefined) ||
					(typeof x.codice_aula === 'string')) &&
				((x.codice_sede === undefined) ||
					(typeof x.codice_sede === 'string'))
			)) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo luogo deve avere struttura \n' +
								'[{codice_aula: string, codice_sede: string}...]',
					log: 0
				});
			}
		}

		return db.Orario.findOne({
			anno: req.params.anno,
			attivita: req.params.codice_attivita,
			timestamp_inizio: req.params.timestamp_inizio,
			timestamp_fine: req.params.timestamp_fine
		}).then(
			result => {
				if (result === null) {
					return Promise.reject({
						status: 404,
						message: 'Impossibile trovare l\'elemento richiesto',
						log: 0
					});
				}

				if (req.body.docente !== undefined) {
					result.docente = req.body.docente;
				}

				if (req.body.luogo !== undefined) {
					result.luogo = req.body.luogo;
				}

				if (req.body.tipo !== undefined) {
					result.tipo = req.body.tipo;
				}

				return result.save().then(res => Promise.resolve({status: 'ok'}));
			}
		).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile fare l\'update dell\'elemento richiesto'
			})
		);
	})
	/**
	 * @name OrariComplete
	 * Permette di aggiornare le informazioni riguardanti una determinato orario
	 * @route {POST} /orari/:anno/:codice_attivita/:timestamp_inizio/:timestamp_fine
	 * @routeparam {Number} anno anno all'interno degl quale cercare l'attivita legata
	 * @routeparam {String} codice_attivita codice che identifica l'attivita legata all'orario
	 * @routeparam {Date} timestamp_inizio timestamp in ISO che identifica l'inizio dell'orario
	 * @routeparam {Date} timestamp_fine timestamp in ISO che identifica l'inizio dell'orario
	 * @bodyparam {String} docente nome del docente
	 * @bodyparam {String} tipo tipo di attivita(lezione, esercitazione,ecc)
	 * @bodyparam Array.<{codice_aula: String, codice_sede: String}>
	 *			luogo luogo dove si svolge l'attivita
	 */
	.post(jsonParser, (req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere di tipo Number',
				log: 0
			});
		}

		req.params.codice_attivita =
			req.params.codice_attivita.replace('^', '/');

		const tInizio = new Date(req.params.timestamp_inizio);
		const tFine = new Date(req.params.timestamp_fine);

		if ((tInizio == 'Invalid Date') || (tFine == 'Invalid Date')) {
			return logAndFowardError(res, {
				status: 400,
				message: 'I campi timestamp_inizio e timestamp_fine devono ' +
							'essere una data ISO'
			});
		}

		if (req.body.docente === undefined) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo docente è mancante'
			});
		} else if (typeof req.body.docente !== 'string') {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo docente deve essere di tipo string'
			});
		}

		if (req.body.tipo === undefined) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo tipo è mancante'
			});
		} else if (typeof req.body.tipo !== 'string') {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo tipo deve essere di tipo string'
			});
		}

		if (req.body.luogo === undefined) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo luogo deve essere presente'
			});
		} else if (!Array.isArray(req.body.luogo)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo luogo deve essere un array'
			});
		} else if (!req.body.luogo.every(x =>
			((x.codice_aula === undefined) ||
				(typeof x.codice_aula === 'string')) &&
			((x.codice_sede === undefined) ||
				(typeof x.codice_sede === 'string'))
		)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo luogo deve avere struttura \n' +
							'[{codice_aula: string, codice_sede: string}...]'
			});
		}

		return new db.Orario({
			anno: req.params.anno,
			attivita: req.params.codice_attivita,
			docente: req.body.docente,
			luogo: req.body.luogo,
			timestamp_inizio: req.params.timestamp_inizio,
			timestamp_fine: req.params.timestamp_fine,
			tipo: req.body.tipo
		}).save().then(
			ok => res.json({status: 'ok'}),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile inserire l'
			})
		);
	})
	/**
	 * @name OrariWithAttivitaComplete
	 * Permette di cancellare un orario
	 * @route {DELETE} /orari/:anno/:codice_attivita/:timestamp_inizio/:timestamp_fine
	 * @routeparam {Number} anno anno all'interno degl quale cercare l'attivita legata
	 * @routeparam {String} codice_attivita codice che identifica l'attivita legata all'orario
	 * @routeparam {Date} timestamp_inizio timestamp in ISO che identifica l'inizio dell'attivita
	 * @routeparam {Date} timestamp_fine timestamp in ISO che identifica l'inizio dell'attivita
	 */
	.delete((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere di tipo Number'
			});
		}

		req.params.codice_attivita =
			req.params.codice_attivita.replace('^', '/');

		const tInizio = new Date(req.params.timestamp_inizio);
		const tFine = new Date(req.params.timestamp_fine);

		if ((tInizio == 'Invalid Date') || (tFine == 'Invalid Date')) {
			return logAndFowardError(res, {
				status: 400,
				message: 'I campi timestamp_inizio e timestamp_fine devono ' +
							'essere una data ISO'
			});
		}

		return db.Orario.deleteOne({
			anno: req.params.anno,
			attivita: req.params.codice_attivita,
			timestamp_inizio: req.params.timestamp_inizio,
			timestamp_fine: req.params.timestamp_fine
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

api.route('/orari/:anno/:codice_attivita')
	/**
	 * @name OrariWithAttivita
	 * Permette di ottenere tutte gli orari legati ad una attivita
	 * @route {GET} /orari/:anno/:codice_attivita
	 * @routeparam {Number} anno anno all'interno del quale cercare l'attivita legata
	 * @routeparam {String} codice_attivita codice che identifica l'attivita legata all'orario
	 */
	.get((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere di tipo Number'
			});
		}

		req.params.codice_attivita =
			req.params.codice_attivita.replace('^', '/');

		const richiesta = {
			anno: req.params.anno,
			attivita: req.params.codice_attivita
		};

		if ((req.query.timestampInizio !== undefined) &&
			(req.query.timestampFine !== undefined)) {
			const timeInizio = new Date(req.query.timestampInizio);
			const timeFine = new Date(req.query.timestampFine);

			if ((timeInizio == 'Invalid Date') || (timeFine == 'Invalid Date')) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Invalid timestampInizio/timestampFine',
					log: 0
				});
			}

			richiesta['timestamp_inizio'] = {
				$gte: timeInizio, $lte: timeFine
			};
		}

		return db.Orario.find(richiesta, {
			_id: 0,
			anno: 0,
			__v: 0,
			attivita: 0,
			'luogo._id': 0
		})
		.sort({'timestamp_inizio': 1})
		.then(orari => {
			const ris = orari.map(x => x.toObject());
			if (req.query.deNorm !== undefined) {
				return db.Sede.find({
					id: {$in: orari.map(orario => orario.luogo)
									.reduce((a, b) =>
										a.concat(b.map(x => x.codice_sede))
									, [])
					}
				}).then(sedi => {
					const elencoSedi = new Map(sedi.map(sede => [sede.id, sede.label]));
					ris.forEach(lezione => {
						lezione.luogo.forEach(l => {
							l.nome_sede = elencoSedi.get(l.codice_sede);
						});
					});

					return Promise.resolve(ris);
				});
			}

			return Promise.resolve(ris);
		})
		.then(
			result => res.json({
				anno: req.params.anno,
				attivita: req.params.codice_attivita,
				elenco_orari: result
			}),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile ottenere l\'orario richiesto'
			})
		);
	});

api.route('/attivita/:anno')
	/**
	 * @name AttivitaWithAnno
	 * Permette di ottenere tutte le attivita di un anno
	 * @route {GET} /attivita/:anno
	 * @routeparam {Number} anno anno di cui visualizzare le attivita
	 */
	.get((req, res) => {
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
	/**
	 * @name AttivitaComplete
	 * Permette di ottenere una determinata attivita
	 * @route {GET} /attivita/:anno/:codice_attivita
	 * @routeparam {Number} anno anno dell'attivita
	 * @routeparam {String} codice_attivita codice che identifica l'attività
	 */
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
	/**
	 * @name AttivitaComplete
	 * Permette di modificare una determinata attivita
	 * @route {PUT} /attivita/:anno/:codice_attivita
	 * @routeparam {Number} anno anno dell'attivita
	 * @routeparam {String} codice_attivita codice che identifica l'attività
	 * @bodyparam {String} label label da attribuire all'attività
	 */
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

		return db.Attivita.findOne({
			anno: req.params.anno,
			id: req.params.codice_attivita
		})
		.then(
			result => {
				if (result === null) {
					return Promise.reject({
						status: 400,
						message: 'L\'elemento richiesto non è stato trovato',
						log: 0
					});
				}

				result.label = req.body.label;

				return result.save().then(
					result => Promise.resolve({status: 'ok'})
				);
			}
		).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile trovare l\'elemento richiesto'
			})
		);
	})
	/**
	 * @name AttivitaComplete
	 * Permette di create un'attivita
	 * @route {POST} /attivita/:anno/:codice_attivita
	 * @routeparam {Number} anno anno dell'attivita
	 * @routeparam {String} codice_attivita codice che identifica l'attività
	 * @bodyparam {String} label label da attribuire all'attività
	 */
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
	/**
	 * @name AttivitaComplete
	 * Permette di cancellare un'attivita
	 * @route {DELETE} /attivita/:anno/:codice_attivita
	 * @routeparam {Number} anno anno dell'attivita
	 * @routeparam {String} codice_attivita codice che identifica l'attività
	 */
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
					log: 1
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

api.route('/docenti/:anno')
	/**
	 * @name DocentiWithAnno
	 * Permette di ottenere la lista dei docenti di un anno
	 * @route {GET} /docenti/:anno
	 * @routeparam {Number} anno anno del quale restituire la lista docenti
	 */
	.get((req, res) => {
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
			result => Promise.resolve({
				anno: req.params.anno,
				elenco_docenti: result
			}
		)).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile recuperare l\'elemento richiesto'
			})
		);
	});

api.route('/docenti/:anno/:codice_docente')
	/**
	 * @name DocentiComplete
	 * Permette di ottenere informazioni su un determinato docente
	 * @route {GET} /docenti/:anno/:codice_docente
	 * @routeparam {Number} anno anno del quale restituire la lista docenti
	 * @routeparam {String} codice_docente codice che identifica il docente
	 */
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
					return Promise.reject({
						status: 404,
						message: 'L\'elemento richiesto non è stato trovato',
						log: 0
					});
				}

				return Promise.resolve({
					docente: result,
					anno: req.params.anno,
					id: req.params.codice_docente
				});
			})
		.then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile trovare l\'elemento richiesto'
			})
		);
	})
	/**
	 * @name DocentiComplete
	 * Permette di modificare le informazioni su un determinato docente
	 * @route {PUT} /docenti/:anno/:codice_docente
	 * @routeparam {Number} anno anno del quale restituire la lista docenti
	 * @routeparam {String} codice_docente codice che identifica il docente
	 * @bodyparam {String} label nome del docente(opzionale)
	 * @bodyparam {Array<{id: number, label: String}> sessioni elenco delle
	 *			sessioni in cui è presente il docente(opzionale)
	 */
	.put(jsonParser, (req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
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
			} else if (!req.body.sessioni
								.every(x => (x.label !== undefined) &&
											(typeof x.label === 'string') &&
											(x.id !== undefined) &&
											(isFinite(x.id))
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
					return Promise.reject({
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
					ok => Promise.resolve({status: 'ok'})
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
	/**
	 * @name DocentiComplete
	 * Permette di aggiungere informazioni su un docente
	 * @route {POST} /docenti/:anno/:codice_docente
	 * @routeparam {Number} anno anno del quale restituire la lista docenti
	 * @routeparam {String} codice_docente codice che identifica il docente
	 * @bodyparam {String} label nome del docente(obbligatorio)
	 * @bodyparam {Array<{id: number, label: String}> sessioni elenco delle
	 *			sessioni in cui è presente il docente(opzionale)
	 */
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
			} else if (!req.body.sessioni
								.every(x => (x.label !== undefined) &&
									(typeof x.label === 'string') &&
									(x.id !== undefined) &&
									(isFinite(x.id))
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
	/**
	 * @name DocentiComplete
	 * Permette di cancellare le informazioni su un docente
	 * @route {DELETE} /docenti/:anno/:codice_docente
	 * @routeparam {Number} anno anno del quale restituire la lista docenti
	 * @routeparam {String} codice_docente codice che identifica il docente
	 * @bodyparam {String} label nome del docente(obbligatorio)
	 * @bodyparam {Array<{id: number, label: String}> sessioni elenco delle
	 *			sessioni in cui è presente il docente(opzionale)
	 */
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

api.route('/corsi')
	/**
	 * @name Corsi
	 * Permette di ottenere la lista degli anni nei quali ci sono stati corsi
	 * @route {GET} /corsi
	 */
	.get((req, res) => {
		return db.Corso.distinct('anno')
			.then(
				json => res.json(json),
				err => logAndFowardError(res, err, {
					status: 500,
					message: 'Impossibile recuperare la lista degli anni'
				})
			);
	});

api.route('/corsi/:anno')
	/**
	 * @name CorsiWithAnno
	 * Permette di ottenere le informazioni di tutti i corsi di un anno
	 * @route {GET} /corsi/:anno
	 * @routeparam {Number} anno anno del quale restituire la lista docenti
	 * @queryparams {} deNorm se presente i dati vengono restituiti denormalizzati
	 */
	.get((req, res) => {
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
					x.map(k => [k.id, k.label])
				)));
			});
		}

		return promise.then(attMap => {
			return db.Corso.find({
				anno: req.params.anno
			}, {
				_id: 0,
				anno: 0,
				//codice_cdl: 0,
				__v: 0,
				'elenco_anni.elenco_sessioni._id': 0,
				//'elenco_anni.codice_percorso_cdl': 0,
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
									newElencoAttivita[codice_attivita] = {
										label: attMap.get(codice_attivita)
									};
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
								elenco_attivita: newElencoAttivita,
								//TODO: Da togliere
								codice_percorso_cdl: percorso.codice_percorso_cdl
							};
							return percorsi;
						}, {});

					corsi[corso.id] = {
						label: corso.label,
						elenco_anni: newElencoAnni,
						//TODO: Da togliere
						codice_cdl: corso.codice_cdl
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
	/**
	 * @name CorsiComplete
	 * Permette di ottenere informazioni riguardo a un determinato corso
	 * @route {GET} /corsi/:anno/:codice_corso
	 * @routeparam {Number} anno annoScolastico al quale il corso da cercare appartiene
	 * @routeparam {String} codice_corso codice che identifica il corso
	 * @queryparams {} deNorm se presente i dati vengono restituiti denormalizzati
	 */
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

			const elencoAttivita = [];

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
					percorso.elenco_attivita.forEach(codice_attivita => {
						elencoAttivita.push(codice_attivita);
					});
				}

				r[percorso.id].elenco_attivita = percorso.elenco_attivita;

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
					id: {$in: elencoAttivita}
				}, {
					_id: 0,
					id: 1,
					label: 1
				}).then(data => {
					const mapAttivita =
						new Map([...(data.map(x => [x.id, x.label]))]);

					for (const codice_percorso in  ris.corso.elenco_anni) {
						ris.corso.elenco_anni[codice_percorso]
							.elenco_attivita =
								ris.corso
								.elenco_anni[codice_percorso]
								.elenco_attivita
								.reduce((r, codice_attivita) => {
									r[codice_attivita] = {
										label: mapAttivita.get(codice_attivita)
									};

									return r;
								}, {});
					}

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
	/**
	 * @name CorsiComplete
	 * Permette di inserire un nuovo corso
	 * @route {POST} /corsi/:anno/:codice_corso
	 * @routeparam {Number} anno anno nel quel inserire il corso
	 * @routeparam {String} codice_corso codice che identifica il corso
	 * @bodyparam {String} label nome del corso
	 * @bodyparam {String} codice_cdl codice che identifica il corso negli esami
	 * @bodyparam {Array.<{
	 *					id: String,
	 *					label: String,
	 *					codice_percorso_cdl: String,(opzionale)
	 *					elenco_attivita: Array.<String>,(opzionale)
	 *					elenco_sessioni: Array.<{id: Number, label: String}>(opzionale)
	 *				}>} elenco_anni lista degli anni+percorsi presenti e delle
	 *				loro proprietà
	 */
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
				message: 'Il campo label non è presente',
				log: 0
			});
		} else if (typeof req.body.label !== 'string') {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo label deve essere di tipo string',
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
		} else if (!req.body.elenco_anni.every(
				x => ((x.id !== undefined) && (typeof x.id === 'string') &&
					(x.label !== undefined) && (Array.isArray(x.label)) &&
					(x.label.every(l => typeof l === 'string')) &&
					((x.codice_percorso_cdl === undefined) ||
					(typeof x.codice_percorso_cdl === 'string')) &&
					((x.elenco_attivita === undefined) ||
					(Array.isArray(x.elenco_attivita) &&
					(x.elenco_attivita.every(att => typeof att === 'string')))) &&
					((x.elenco_sessioni === undefined) ||
					(Array.isArray(x.elenco_sessioni) &&
					(x.elenco_sessioni.every(s => (s.id !== undefined) &&
					(isFinite(s.id) && (s.label !== undefined) &&
					(typeof s.label === 'string'))))))
				))) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo elenco_anni deve avere struttura\n' +
						'[{\n' +
						'\tid: string, \n' +
						'\tlabel:[string,...], \n' +
						'\telenco_attivita: [string,...], \n' +
						'\tcodice_percorso_cdl: string,\n' +
						'\telenco_sessioni: [{ \n' +
						'\t\tid: number,\n' +
						'\t\tlabel: string\n' +
						'\t}]' +
						'},...] con solo id e label obbligatori',
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
	/**
	 * @name CorsiComplete
	 * Permette di modificare un corso
	 * @route {PUT} /corsi/:anno/:codice_corso
	 * @routeparam {Number} anno anno nel quel inserire il corso
	 * @routeparam {String} codice_corso codice che identifica il corso
	 * @bodyparam {String} label nome del corso(opzionale)
	 * @bodyparam {String} codice_cdl codice che identifica il corso negli esami(opzionale)
	 * @bodyparam {Array.<{
	 *					id: String,
	 *					label: String,
	 *					codice_percorso_cdl: String,(opzionale)
	 *					elenco_attivita: Array.<String>,(opzionale)
	 *					elenco_sessioni: Array.<{id: Number, label: String}>(opzionale)
	 *				}>} elenco_anni lista degli anni+percorsi presenti e delle
	 *				loro proprietà(opzionale)
	 */
	.put(jsonParser, (req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

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
			} else if (!req.body.elenco_anni.every(
				x => ((x.id !== undefined) && (typeof x.id === 'string') &&
					(x.label !== undefined) && (Array.isArray(x.label)) &&
					(x.label.every(l => typeof l === 'string')) &&
					((x.codice_percorso_cdl === undefined) ||
					(typeof x.codice_percorso_cdl === 'string')) &&
					((x.elenco_attivita === undefined) ||
					(Array.isArray(x.elenco_attivita) &&
					(x.elenco_attivita.every(att => typeof att === 'string')))) &&
					((x.elenco_sessioni === undefined) ||
					(Array.isArray(x.elenco_sessioni) &&
					(x.elenco_sessioni.every(s => (s.id !== undefined) &&
					(isFinite(s.id) && (s.label !== undefined) &&
					(typeof s.label === 'string'))))))
			))) {
				return logAndFowardError(res, {
					status: 400,
					message: 'Il campo elenco_anni deve avere struttura\n' +
							'[{\n' +
							'\tid: string, \n' +
							'\tlabel:[string,...], \n' +
							'\telenco_attivita: [string,...], \n' +
							'\tcodice_percorso_cdl: string,\n' +
							'\telenco_sessioni: { \n' +
							'\t\tid: number,\n' +
							'\t\tlabel: string\n' +
							'\t}' +
							'},...] con solo id e label obbligatori',
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
					result => Promise.resolve({status: 'ok'})
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
	/**
	 * @name CorsiComplete
	 * Permette di cancellare un corso
	 * @route {DELETE} /corsi/:anno/:codice_corso
	 * @routeparam {Number} anno anno nel quel inserire il corso
	 * @routeparam {String} codice_corso codice che identifica il corso
	 */
	.delete((req, res) => {
		if (!isFinite(req.params.anno)) {
			return logAndFowardError(res, {
				status: 400,
				message: 'Il campo anno deve essere un numero finito',
				log: 0
			});
		}

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
	/**
	 * @name CorsiWithPercorso
	 * Permette di ottenere le informazioni riguardanti un (anno,corso,percorso)
	 * @route {GET} /corsi/:anno/:codice_corso/:codice_percorso
	 * @routeparam {Number} anno anno nel quel inserire il corso
	 * @routeparam {String} codice_corso codice che identifica il corso
	 * @routeparam {String} codice_percorso codice che identifica il percorso
	 */
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
				ris.percorso.elenco_attivita = {};
				return db.Attivita.find({
					anno: req.params.anno,
					id: {$in: tmpPercorso.elenco_attivita}
				}, {
					_id: 0,
					id: 1,
					label: 1
				}).then(data => {
					const mapAttivita = new Map(data.map(x => [x.id, x.label]));
					tmpPercorso.elenco_attivita.forEach(codice_attivita => {
						ris.percorso.elenco_attivita[codice_attivita] = {
							label: mapAttivita.get(codice_attivita)
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

api.route('/calendario_eventi.json')
	.get((req, res) => {
		if (Object.keys(req.query).length != 1) {
			console.log('numero parametri sbagliato');
			res.end('ParameterNumberException: numero parametri sbagliato');
		} else {
			calendario_eventi.getEvents(req.query.day)
				.then(generatedJSON => {
					res.status(200).json(generatedJSON);
				});
		}
	});

api.route('/esami/corsi/:anno/:codice_corso/:codice_percorso/:id_sessione')
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
			codice_cdl: 1,
			'elenco_anni.id': 1,
			'elenco_anni.codice_percorso_cdl': 1
		}).then(corso => {
			if ((corso === null)||(corso.codice_cdl === undefined)) {
				return Promise.reject({
					status: 404,
					message: 'L\'elemento richiesto non è stato trovato',
					log: 0
				});
			}

			const tmpPercorso =
				corso.elenco_anni
					.find(percorso => percorso.id == req.params.codice_percorso);

			if ((tmpPercorso === undefined)||
				(tmpPercorso.codice_percorso_cdl === undefined)) {
				return Promise.reject({
					status: 404,
					message: 'L\'elemento richiesto non è stato trovato',
					log: 0
				});
			}

			return db.Esame.find({
				anno: req.params.anno,
				anno_cdl: tmpPercorso.codice_percorso_cdl,
				cdl: corso.codice_cdl,
				id_sessione: req.params.id_sessione
			}).then(
				esame =>  {
					if (esame === null) {
						return Promise.reject({
							status: 404,
							message: 'Nessun elemento trovato',
							log: 0
						});
					}

					return Promise.resolve(esame);
				});
		}).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile recuperare il percorso indicato'
			})
		);
	});

api.route('/esami/:anno/:cdl/:annocdl/:idSessione/:codiceGenerale')
	.get((req, res) => {
		return db.Esame.findOne({
			anno: req.params.anno,
			anno_cdl: req.params.annocdl,
			cdl: req.params.cdl,
			id_sessione: req.params.idSessione,
			codice_generale: req.params.codiceGenerale
		}).then(
			esame =>  {
				if (esame === null) {
					return Promise.reject({
						status: 404,
						message: 'Nessun elemento trovato',
						log: 0
					});
				}

				return Promise.resolve(esame);
			})
		.then(
			r => res.json(r),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile trovare l\'elemento richiesto'
			})
		);
	})
	.put(jsonParser, (req, res) => {
		return db.Esame.findOne({
			anno: req.params.anno,
			anno_cdl: req.params.annocdl,
			cdl: req.params.cdl,
			id_sessione: req.params.idSessione,
			codice_generale: req.params.codiceGenerale
		}).then(esame => {
			if (esame === null) {
				return Promise.reject({
					status: 404,
					message: 'Impossibile trovare l\'elemento richiesto',
					log: 0
				});
			}

			esame.anno = parseInt(req.body.annoAccademico);
			esame.anno_cdl = req.body.annoCdl;
			esame.cdl = req.body.cdl;
			esame.id_sessione = parseInt(req.body.idSessione);
			esame.codice_generale = req.body.codiceGenerale;
			esame.crediti = req.body.crediti;
			esame.tipo_esame = req.body.tipoEsame;
			esame.matricola_docente = req.body.matricolaDocente;
			esame.numero_appelli = req.body.numeroAppelli;

			return esame.save();
		}).then(
			ok => res.json({status: 'ok'}),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile fare l\'update dell\'elemento richiesto'
			})
		);
	})
	.delete(jsonParser, (req, res) => {
		return db.Esame.remove({
			anno: req.params.anno,
			anno_cdl: req.params.annocdl,
			cdl: req.params.cdl,
			id_sessione: req.params.idSessione,
			codice_generale: req.params.codiceGenerale
		}).then(
			r => {
				if ((r.result.ok === 1) && (r.result.n === 1)) {
					return Promise.resolve({status: 'ok'});
				}

				return Promise.reject({
					status: 500,
					message: 'Impossibile trovare l\'oggetto richiesto',
					log: 1
				});
			}
		).then(
			json => res.json(json),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Impossibile eliminare l\'elemento richiesto'
			})
		);
	});

api.route('/esami')
	.get((req, res) => {
		return db.Esame.find({})
			.then(
				json => res.json(json),
				err => logAndFowardError(res, err, {
					status: 500,
					message: 'Impossibile ottenere gli elementi di sessioni'
				})
			);
	})
	.post(jsonParser, (req, res) => {
		return sessioni.getSessions(
			'et_cdl',
			req.body.anno,
			req.body.cdl,
			req.body.annocdl,
			req.body.sessione
		).then(generatedJSON => {
			return Promise.all(
				generatedJSON.listaAppelli.map(appelloLista => {
					return new db.Esame({
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
					}).save();
				})
			);
		}).then(
			ok => res.json({status: 'ok'}),
			err => logAndFowardError(res, err, {
				status: 500,
				message: 'Alcuni save sono falliti'
			})
		);
	});

const app = express();
app.use('/api', api);
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

const expressServer = app.listen(process.env.PORT || 8080);



// export necessario per poter chiudere express in jest a fine test
exports.expressServer = expressServer;
