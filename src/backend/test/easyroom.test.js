jest.mock('node-fetch');
const fetchMock = require('node-fetch');
fetchMock.mockImplementation(global.fetch);

require('./error_matching.js');
const Codes = require('./../src/sources/easyroom.js').Codes;

const data = {
	i1: require('./data/i1.js').d,
	i2: require('./data/i2.js').d,

	double_anno_corso: require('./data/double_anno_corso.js').d,
	double_anno_attivita: require('./data/double_anno_attivita.js').d,
	double_anno_docenti: require('./data/double_anno_docenti.js').d,
	double_anno_cdl: require('./data/double_anno_cdl.js').d,
	double_anno_insegnamenti: require('./data/double_anno_insegnamenti.js').d,
	double_anno_et_docenti: require('./data/double_anno_et_docenti.js').d,

	combo_call: require('./data/combo_call.js').d,
	correct_with_no_PercorsoToInsegnamento: require('./data/double_corso_same_year_ris.json'),

	double_corso_same_year:  require('./data/double_corso_same_year.js').d,
	double_corso_different_percorsi: require('./data/double_corso_different_percorsi.js').d,

	double_attivita_same_year: require('./data/double_attivita_same_year.js').d,
	double_attivita_same_year_different_label: require('./data/double_attivita_same_year_different_label.js').d,

	double_docenti_same_year: require('./data/double_docenti_same_year.js').d,
	double_docenti_same_year_different_label: require('./data/double_docenti_same_year_different_label.js').d,

	double_cdl_same_year: require('./data/double_cdl_same_year.js').d,
	double_cdl_same_year_different_label : require('./data/double_cdl_same_year_different_label.js').d,
	double_cdl_same_year_double_object_in_elenco : require('./data/double_cdl_same_year_double_object_in_elenco.js').d,
	double_cdl_same_year_different_object_in_elenco : require('./data/double_cdl_same_year_different_object_in_elenco.js').d,
	double_cdl_same_year_same_sessione_different_label: require('./data/double_cdl_same_year_same_sessione_different_label.js').d,

	double_insegnamento_same_year: require('./data/double_insegnamento_same_year.js').d,
	double_insegnamento_same_year_different_label: require('./data/double_insegnamento_same_year_different_label.js').d,
	double_insegnamento_same_year_double_object_in_elenco: require('./data/double_insegnamento_same_year_double_object_in_elenco.js').d,
	double_insegnamento_same_year_different_object_in_elenco: require('./data/double_insegnamento_same_year_different_object_in_elenco.js').d,

	double_et_docenti_same_year: require('./data/double_et_docenti_same_year.js').d,
	double_et_docenti_same_year_different_label: require('./data/double_et_docenti_same_year_different_label.js').d,
	double_et_docenti_same_year_double_object_in_elenco: require('./data/double_et_docenti_same_year_double_object_in_elenco.js').d,
	double_et_docenti_same_year_different_object_in_elenco: require('./data/double_et_docenti_same_year_different_object_in_elenco.js').d,

	double_sedi: require('./data/double_sedi.js').d,
	double_sedi_different_label : require('./data/double_sedi_different_label.js').d
};

function fixDefaultDate(m){
	return {
		'2016': m[2016],
		'2017': m[2017],
		'sedi': m.sedi,
		'failed': m.failed.map( x => {
			const d = new Date();
			function pad(s) {
				return (s < 10) ? '0' + s : s;
			}
			x.date = [
				pad(d.getFullYear()),
				pad(d.getMonth() + 1),
				pad(d.getDate())
			].join('-');

			return x;
		})
	};
}

function addElencoAttivita(x){
	for (const k in x){
		if((k !== 'sedi')&&(k !== 'failed')){
			for(const corso in x[k].corsi){
				for(const percorso in x[k].corsi[corso].elenco_anni){
					x[k].corsi[corso]
						.elenco_anni[percorso]
						.elenco_attivita = ['attivitàFalse012'];
				}
			}
		}
	}

	delete x.failed;

	return x;
}

describe('Codes constructor' ,() => {
	test('Throw on undefined url', () => {
		return expect(() => (new Codes(undefined, x => x, 20))).toThrow();
	});

	test('Throw on promiseJSON undefined',() => {
		return expect(() => (new Codes('http://prova.test', undefined, 20))).toThrow();
	});

	test('Throw on typeof promiseJSON !==\'function\'', () => {
		return expect(() => (new Codes('http://prova.test', 'non una funzione', 20))).toThrow();
	});

	test('Throw on promiseJSON of wrong arity(with arity 2)', () => {
		return expect(() => (new Codes('http://prova.test', (x, w) => x + y, 20))).toThrow();
	});

	test('Throw on promiseJSON of wrong arity(with arity 0)', () => {
		return expect(() => (new Codes('http://prova.test', () => {}, 20))).toThrow();
	});

	test('Throw on maxReq undefined', () => {
		return expect(() => (new Codes('http://prova.test', x => x, undefined))).toThrow();
	});

	test('Throw on maxReq not finite number', () => {
		return expect(() => (new Codes('http://prova.test', x => x, 'ciao'))).toThrow();
	});

	test('Valid constructor(with maxReq string)', () => {
		return expect(() => (new Codes('http://prova.test', x => x, '12'))).not.toThrow();
	});

	test('Valid constructor(with maxReq number)', () => {
		return expect(() => (new Codes('http://prova.test', x => x, 12))).not.toThrow();
	});
});

/*
 * Il Content-Type è volutamente sbagliato per riflettere l'errore presente su easyroom(dove
 * Content-Type viene impostato a application/json nonostante il contenuto è un file javascript
 */
describe('Error on invalid data', () => {
	test('Error on invalid fetch(500 code)', () => {
		fetch.mockResponse('', {
			status: 500,
			header: {'Content-Type': 'application/json'}
		});

		return expect(
				(new Codes('http://prova.test', x => x, 12)).getIds()
			).rejects.toBeInstanceOf(Error);
	})

	test('Error on not js file', () => {
		fetch.mockResponse('Questo per certo non è un js infatti è una string', {
			status: 200,
			header: {'Content-Type': 'application/json'}
		});

		return expect(
				(new Codes('http://prova.test', x => x, 12)).getIds()
			).rejects.toBeInstanceOf(Error);
	});

	test('Error on incomplete js', () => {
		fetch.mockResponse(data.i1, {
			status: 200,
			header: {'Content-Type': 'application/json'}
		});

		return expect(
				(new Codes('http://prova.test', x => x, 12)).getIds()
			).rejects.toMatchError('Il file .js è incompleto' +
				'(manca elenco_attivita)');
	});

	test('Error on invalid js', () => {
		fetch.mockResponse(data.i2, {
			status: 200,
			header: {'Content-Type': 'application/json'}
		});

		return expect(
				(new Codes('http://prova.test', x => x, 12)).getIds()
			).rejects.toBeInstanceOf(Error);
	});

	describe('AnnoScolastico collision', () => {
		test('AnnoScolastico collision(on corsi)', () => {
			fetch.mockResponseOnce(data.double_anno_corso, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			return expect(
				(new Codes('http://prova.test', x => x, 12)).getIds()
			).rejects.toBeInstanceOf(Error);
		});

		test('AnnoScolastico collision(on attivita)', () => {
			fetch.mockResponseOnce(data.double_anno_attivita, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			return expect(
				(new Codes('http://prova.test', x => x, 12)).getIds()
			).rejects.toBeInstanceOf(Error);
		});

		test('AnnoScolastico collision(on docenti)', () => {
			fetch.mockResponseOnce(data.double_anno_docenti, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			return expect(
				(new Codes('http://prova.test', x => x, 12)).getIds()
			).rejects.toBeInstanceOf(Error);
		});

		test('AnnoScolastico collision(on cdl)', () => {
			fetch.mockResponseOnce(data.double_anno_cdl, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			return expect(
				(new Codes('http://prova.test', x => x, 12)).getIds()
			).rejects.toBeInstanceOf(Error);
		});

		test('AnnoScolastico collision(on insegnamenti)', () => {
			fetch.mockResponseOnce(data.double_anno_insegnamenti, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			return expect(
				(new Codes('http://prova.test', x => x, 12)).getIds()
			).rejects.toBeInstanceOf(Error);
		});

		test('AnnoScolastico collision(on et_docenti)', () => {
			fetch.mockResponse(data.double_anno_et_docenti, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			return expect(
				(new Codes('http://prova.test', x => x, 12)).getIds()
			).rejects.toBeInstanceOf(Error);
		});
	});

	describe('Check\'corsi\'',() => {
		test('Not error on double course', () => {
			fetch.mockResponse(data.double_corso_same_year, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12))
				.getIds()
			).resolves.toEqual(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento));
		});

		test('Error on corso.valore collision with different percorsi', () => {
			fetch.mockResponse(data.double_corso_different_percorsi, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
				/Doppia occorrenza del corso .*? con oggetti diversi.\n/
			);
		});
	});

	describe('Check \'attivita\'', () => {
		// In realtà già presente
		test('Not error on double activity',() => {
			fetch.mockResponse(data.double_attivita_same_year, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).resolves.toEqual(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento));
		});

		test('Error on attivita.valore collision with different content',() => {
			fetch.mockResponse(data.double_attivita_same_year_different_label, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
				/Doppia occorrenza dell'attività .*? con oggetti diversi.\n/
			);
		});
	});

	describe('Check \'docenti\'', () => {
		// In realtà già presente
		test('Not error on double activity',() => {
			fetch.mockResponse(data.double_docenti_same_year, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).resolves.toEqual(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento));
		});

		test('Error on attivita.valore collision with different content',() => {
			fetch.mockResponse(data.double_docenti_same_year_different_label, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
				/Doppia occorrenza del docente .*? con oggetti diversi.\n/
			);
		});
	});

	describe('Check \'cdl\'',() => {
		test('Not error on double cdl',() => {
			fetch.mockResponse(data.double_cdl_same_year, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).resolves.toEqual(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento));
		});

		test('Error on cdl.valore collision with different label',() => {
			fetch.mockResponse(data.double_cdl_same_year_different_label, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
				/Doppia occorrenza del cdl .*? con oggetti diversi.\n/
			);
		});

		test('Not error on cdl.valore collision with double object in elenco_anni',() => {
			fetch.mockResponse(data.double_cdl_same_year_double_object_in_elenco, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).resolves.toEqual(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento));
		});

		test('Error on cdl.valore collision with different object in elenco_anni',() => {
			fetch.mockResponse(data.double_cdl_same_year_different_object_in_elenco, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
				/Doppia occorrenza dell'anno\/percorso .*? del cdl .*? con oggetti diversi.\n/
			);
		});

		test('Error on cdl.valore collision with different sessioni in elenco_anni->elenco',() => {
			fetch.mockResponse(data.double_cdl_same_year_same_sessione_different_label, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
					/Doppia occorrenza della sessione .*? nell\'anno\/percorso .*? del cdl .*? con oggetti diversi.\n/
			);
		});
	});

	describe('Check \'insegnamenti\'', () => {
		test('Not error on double insegnamenti',() => {
			fetch.mockResponse(data.double_insegnamento_same_year, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).resolves.toEqual(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento));
		});

		test('Error on insegnamento.valore collision with different label',() => {
			fetch.mockResponse(data.double_insegnamento_same_year_different_label, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
				/Doppia occorrenza dell'insegnamento .*? con oggetti diversi.\n/
			);
		});

		test('Not error on insegnamento.valore collision with double object in elenco_anni',() => {
			fetch.mockResponse(data.double_insegnamento_same_year_double_object_in_elenco, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).resolves.toEqual(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento));
		});

		test('Error on insegnamento.valore collision with different object in elenco',() => {
			fetch.mockResponse(data.double_insegnamento_same_year_different_object_in_elenco, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
				/Doppia occorrenza della sessione .*? con oggetti diversi.\n/
			);
		});
	});

	describe('Check \'et_docenti\'', () => {
		test('Not error on double et_docenti',() => {
			fetch.mockResponse(data.double_et_docenti_same_year, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).resolves.toEqual(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento));
		});

		test('Error on et_docente.valore collision with different label',() => {
			fetch.mockResponse(data.double_et_docenti_same_year_different_label, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
				/Doppia occorrenza del docente .*? con oggetti diversi.\n/
			);
		});

		test('Not error on et_docente.valore collision with double object in elenco',() => {
			fetch.mockResponse(data.double_et_docenti_same_year_double_object_in_elenco, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).resolves.toEqual(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento));
		});

		test('Error on insegnamento.valore collision with different object in elenco',() => {
			fetch.mockResponse(data.double_et_docenti_same_year_different_object_in_elenco, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
				/Doppia occorrenza della sessione .*? del docente .*? con oggetti diversi.\n/
			);
		});
	});

	describe('Check \'sedi\'',() => {
		test('Not error on double sedi',() => {
			fetch.mockResponse(data.double_sedi, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).resolves.toEqual(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento));
		});

		test('Error on sede.valore collision with different label',() => {
			fetch.mockResponse(data.double_sedi_different_label, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			// Faccio fallire le promise successive per non fare tutto
			// il procedimento ma solo il pezzo necessario per verificare il
			// comportamento nel caso di un corso duplicato
			return expect(
				(new Codes('http://prova.test', x => Promise.reject(), 12)).getIds()
			).rejects.toMatchError(
				/Doppia occorrenza della sede .*? con oggetti diversi.\n/
			);
		});
	});

	describe('Test on valid data', () => {
		test('1',() => {
			fetch.mockResponseOnce(data.combo_call, {
				status: 200,
				header: {'Content-Type': 'application/json'}
			});

			return expect(
				(new Codes('http://prova.test',
					x => Promise.resolve(x.map(l => ({
						anno: l.anno,
						corso: l.corso,
						percorso: l.percorso,
						date: '2017-12-09',
						elenco_attivita: ['attivitàFalse012']
					}))),
					12)).getIds()
			).resolves.toEqual(addElencoAttivita(fixDefaultDate(data.correct_with_no_PercorsoToInsegnamento)));
		});
	});
});
