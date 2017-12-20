const fetch = require('node-fetch');
const expressServer = require('./../src/index.js').expressServer;

{
	const data = {
		o11: require('./data/routes/o11.json')
	};

	describe('route /api/attivita/:anno', () => {
		test('Invalid anno', () => {
			return expect(
					fetch('http://localhost:3000/api/attivita/NonAnno')
					.then(x => x.text()))
				.resolves.toEqual('Il campo anno deve essere un numero finito');
		});

		test('Valid query', () => {
			return expect(
					fetch('http://localhost:3000/api/attivita/2016')
					.then(x => x.json()))
				.resolves.toEqual(data.o11);
		});
	});
}

{
	const data = {
		o12: require('./data/routes/o12.json')
	};

	describe('route /api/attivita/:anno/:codice_attivita', () => {
		describe('Get', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/attivita/NonAnno/ECCose')
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			test('non-exitent attivita', () => {
				return expect(
						fetch('http://localhost:3000/api/attivita/2999/ECCose')
						.then(x => x.text()))
					.resolves.toEqual('L\'elemento richiesto non è stato trovato');
			});

			test('Valid query', () => {
				return expect(
						fetch('http://localhost:3000/api/attivita/2016/EC0422H_130247_DADE')
						.then(x => x.json()))
					.resolves.toEqual(data.o12);
			});
		});

		describe('Post', () => {
			test('Invalid anno', () => {
				return expect(
					fetch('http://localhost:3000/api/attivita/NonAnno/ECCose',{
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l'
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			describe('Check label', () => {
				test('undefined label', () => {
					return expect(
						fetch('http://localhost:3000/api/attivita/2999/ECCose',{
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo label deve essere definito');
				});

				test('label not string', () => {
					return expect(
						fetch('http://localhost:3000/api/attivita/2999/ECCose',{
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 213
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo label deve essere di tipo string');
				});

				test('label empty', () => {
					return expect(
						fetch('http://localhost:3000/api/attivita/2999/ECCose',{
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: ''
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo label deve essere una stringa non vuota');
				});
			});

			test('Valid query', () => {
				return expect(
						fetch('http://localhost:3000/api/attivita/2999/ECProva', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'lProva'
							})
						})
						.then(x => x.json()))
					.resolves.toEqual({status: 'ok'});
			});
		});

		describe('Put', () => {
			test('Invalid anno', () => {
				return expect(
					fetch('http://localhost:3000/api/attivita/NonAnno/ECCose',{
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l'
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			describe('Check label', () => {
				test('label not string', () => {
					return expect(
						fetch('http://localhost:3000/api/attivita/2999/ECCose',{
							method: 'PUT',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 213
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo label deve essere di tipo string');
				});

				test('label empty', () => {
					return expect(
						fetch('http://localhost:3000/api/attivita/2999/ECCose',{
							method: 'PUT',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: ''
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo label deve essere una stringa non vuota');
				});
			});

			test('non-existent attivita', () => {
				return expect(
						fetch('http://localhost:3000/api/attivita/3094/ECProva', {
							method: 'PUT',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'lProva'
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('L\'elemento richiesto non è stato trovato');
			})

			test('Valid query', () => {
				return expect(
						fetch('http://localhost:3000/api/attivita/2999/ECProva', {
							method: 'PUT',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'lProva'
							})
						})
						.then(x => x.json()))
					.resolves.toEqual({status: 'ok'});
			});
		});

		describe('Delete', () => {
			test('Invalid anno', () => {
				return expect(
					fetch('http://localhost:3000/api/attivita/NonAnno/ECCose',{
						method: 'DELETE'
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			test('Delete non-existent attivita', () => {
				return expect(
					fetch('http://localhost:3000/api/attivita/3999/ECCoseProve',{
						method: 'DELETE'
					})
					.then(x => x.text()))
				.resolves.toEqual('Impossibile eliminare l\'oggetto richiesto');
			});

			test('Valid query', () => {
				return expect(
					fetch('http://localhost:3000/api/attivita/2999/ECProva',{
						method: 'DELETE'
					})
					.then(x => x.json()))
				.resolves.toEqual({status: 'ok'});
			});
		});
	});
}


{
	describe('route /api/corsi', () => {
		test('Valid query', () => {
			return expect(
					fetch('http://localhost:3000/api/corsi')
					.then(x => x.json()))
				.resolves.toEqual([2016, 2017]);
		});
	});
}

{
	const data = {
		o15: require('./data/routes/o15.json'),
		o16: require('./data/routes/o16.json')
	};

	describe('route /api/corsi/:anno', () => {
		test('Invalid anno', () => {
			return expect(
					fetch('http://localhost:3000/api/corsi/nonAnno')
					.then(x => x.text()))
				.resolves.toEqual('Il campo anno deve essere un numero finito');
		});

		test('Valid query', () => {
			return expect(
					fetch('http://localhost:3000/api/corsi/2016')
					.then(x => x.json()))
				.resolves.toEqual(data.o15);
		});

		test('Valid query deNorm', () => {
			return expect(
					fetch('http://localhost:3000/api/corsi/2016?deNorm')
					.then(x => x.json()))
				.resolves.toEqual(data.o16);
		});

	});
}


{
	const data = {
		o17: require('./data/routes/o17.json'),
		o18: require('./data/routes/o18.json')
	};

	describe('route /api/corsi/:anno/:codice_corso', () => {
		describe('Get', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/corsi/nonAnno/0115G')
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			test('non-existent corso', () => {
				return expect(
						fetch('http://localhost:3000/api/corsi/2094/0115G')
						.then(x => x.text()))
					.resolves.toEqual('L\'elemento richiesto non è stato trovato');
			});

			test('existent corso', () => {
				return expect(
						fetch('http://localhost:3000/api/corsi/2016/0422H')
						.then(x => x.json()))
					.resolves.toEqual(data.o17);
			});

			test('existent corso json', () => {
				return expect(
						fetch('http://localhost:3000/api/corsi/2016/0422H?deNorm')
						.then(x => x.json()))
					.resolves.toEqual(data.o18);
			});
		});

		describe('Post', () => {
			test('Invalid anno', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/nonAnno/0115G1', {
						method: 'POST'
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			test('label undefined', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G2', {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							codice_cdl: '31d213',
							elenco_anni: [{
								id: 'a1',
								label: ['la1'],
								codice_percorso_cdl: 'dasd231',
								elenco_attivita: ['AA','BB','CC'],
								elenco_sessioni: [{
									id: 71,
									label: 's71'
								}]
							}]
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo label non è presente');
			});

			test('label not string', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G3', {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							'label': [1,2,3],
							'codice_cdl': '31d213',
							'elenco_anni': [{
								id: 'a1',
								label: ['la1'],
								codice_percorso_cdl: 'dasd231',
								elenco_attivita: ['AA','BB','CC'],
								elenco_sessioni: [{
									id: 71,
									label: 's71'
								}]
							}]
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo label deve essere di tipo string');
			});

			test('elenco_anni undefined', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G4', {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l431',
							codice_cdl: '31d213'
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo elenco_anni non è presente');
			});

			test('elenco_anni not array', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G5', {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l431',
							codice_cdl: '31d213',
							elenco_anni: 'dasd'
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo elenco_anni deve essere un array');
			});

			test('Invalid elenco_anni', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G5', {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l431',
							codice_cdl: '31d213',
							elenco_anni: [{
								id: 'a1',
								label: ['la1'],
								codice_percorso_cdl: 'dasd231',
								elenco_attivita: ['AA','BB','CC'],
								elenco_sessioni: [{
									id: 'dasda1',
									label: 's71'
								}]
							}]
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo elenco_anni deve avere struttura\n' +
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
				);
			});

			test('codice_cdl not string', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G7', {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l',
							codice_cdl: 3123,
							elenco_anni: [{
								id: 'a1',
								label: ['la1'],
								codice_percorso_cdl: 'dasd231',
								elenco_attivita: ['AA','BB','CC'],
								elenco_sessioni: [{
									id: 71,
									label: 's71'
								}]
							}]
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo codice_cdl deve essere di tipo string');
			});

			test('Valid query', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G8', {
						method: 'POST',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l',
							codice_cdl: '31d213',
							elenco_anni: [{
								id: 'a1',
								label: ['la1'],
								codice_percorso_cdl: 'dasd231',
								elenco_attivita: ['AA', 'BB', 'CC'],
								elenco_sessioni: [{
									id: 71,
									label: 's71'
								}]
							}]
						})
					})
					.then(x => x.json()))
				.resolves.toEqual({status: 'ok'});
			});
		});

		describe('Put', () => {
			test('Invalid anno', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/nonAnno/0115G1', {
						method: 'PUT'
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			test('codice_cdl not string', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G4', {
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l431',
							codice_cdl: 93
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo codice_cdl deve essere di tipo string');
			});

			test('label not string', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G4', {
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 431,
							codice_cdl: 'dsa93'
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo label deve essere di tipo string');
			});

			test('elenco_anni not array', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G4', {
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'dsa431',
							codice_cdl: 'dsa93',
							elenco_anni: 12
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo elenco_anni deve essere un array');
			});

			test('elenco_anni not array', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G4', {
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l',
							codice_cdl: '31d213',
							elenco_anni: [{
								id: 'a1',
								label: ['la1'],
								codice_percorso_cdl: 'dasd231',
								elenco_attivita: ['AA','BB','CC'],
								elenco_sessioni: [{
									id: 71,
									label: 3213
								}]
							}]
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo elenco_anni deve avere struttura\n' +
							'[{\n' +
							'\tid: string, \n' +
							'\tlabel:[string,...], \n' +
							'\telenco_attivita: [string,...], \n' +
							'\tcodice_percorso_cdl: string,\n' +
							'\telenco_sessioni: { \n' +
							'\t\tid: number,\n' +
							'\t\tlabel: string\n' +
							'\t}' +
							'},...] con solo id e label obbligatori');
			});

			test('Non existent corso', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/7094/0115G8', {
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l2',
							codice_cdl: '31d213',
							elenco_anni: [{
								id: 'a1',
								label: ['la1'],
								codice_percorso_cdl: 'dasd231',
								elenco_attivita: ['AA', 'BB', 'CC'],
								elenco_sessioni: [{
									id: 71,
									label: 's71'
								}]
							}]
						})
					})
					.then(x => x.text()))
				.resolves.toEqual('Impossibile trovare l\'elemento richiesto');
			});

			test('Valid query', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G8', {
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'l2',
							codice_cdl: '31d213',
							elenco_anni: [{
								id: 'a1',
								label: ['la1'],
								codice_percorso_cdl: 'dasd231',
								elenco_attivita: ['AA', 'BB', 'CC'],
								elenco_sessioni: [{
									id: 71,
									label: 's71'
								}]
							}]
						})
					})
					.then(x => x.json()))
				.resolves.toEqual({status: 'ok'});
			});

			test('valid query', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115g8', {
						method: 'PUT',
						headers: {'content-type': 'application/json'},
						body: json.stringify({
							label: 'l2',
							codice_cdl: '',
							elenco_anni: [{
								id: 'a1',
								label: ['la1'],
								codice_percorso_cdl: 'dasd231',
								elenco_attivita: ['aa', 'bb', 'cc'],
								elenco_sessioni: [{
									id: 71,
									label: 's71'
								}]
							}]
						})
					})
					.then(x => x.json()))
				.resolves.toEqual({status: 'ok'});
			});
		});

		describe('Delete', () => {
			test('Invalid anno', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/nonAnno/0115G1', {
						method: 'DELETE'
					})
					.then(x => x.text()))
				.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			test('Non existent corso', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/4092/0115g8', {
						method: 'DELETE'
					})
					.then(x => x.text()))
				.resolves.toEqual('Impossibile eliminare l\'oggetto richiesto');
			});

			test('Valid query', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2999/0115G8', {
						method: 'DELETE'
					})
					.then(x => x.json()))
				.resolves.toEqual({status: 'ok'});
			});
		});
	});
}

{
	const data = {
		o19: require('./data/routes/o19.json'),
		o20: require('./data/routes/o20.json')
	};

	describe('route /api/corsi/:anno/:codice_corso/:codice_percorso', () => {
		describe('Get', () => {
			test('Invalid anno', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/NonAnno/axsd/sda')
					.then(x => x.text()))
				.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			test('Corso non esiste', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2017/axsd/sda')
					.then(x => x.text()))
				.resolves.toEqual('L\'elemento richiesto non è stato trovato');
			});

			test('Percorso non esiste', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2016/0422H/nonEsiste')
					.then(x => x.text()))
				.resolves.toEqual('L\'elemento richiesto non è stato trovato');
			});

			test('Valid query', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2016/0422H/P0004D1|1')
					.then(x => x.json()))
				.resolves.toEqual(data.o19);
			});

			test('Valid query denorm', () => {
				return expect(
					fetch('http://localhost:3000/api/corsi/2016/0422H/P0004D1|1?deNorm')
					.then(x => x.json()))
				.resolves.toEqual(data.o20);
			});

		});
	});
}

{
	const data = {
		o13: require('./data/routes/o13.json')
	};

	describe('route /api/docenti/:anno', () => {
		test('Invalid anno', () => {
			return expect(
					fetch('http://localhost:3000/api/docenti/NonAnno')
					.then(x => x.text()))
				.resolves.toEqual('Il campo anno deve essere un numero finito');
		});

		test('Valid query', () => {
			return expect(
					fetch('http://localhost:3000/api/docenti/2016')
					.then(x => x.json()))
				.resolves.toEqual(data.o13);
		});
	});
}

{
	const data = {
		o14: require('./data/routes/o14.json')
	};

	describe('route /api/docenti/:anno/:codice_docente', () => {
		describe('Get', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/docenti/nonAnno/D000058')
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			test('non-existent docente', () => {
				return expect(
						fetch('http://localhost:3000/api/docenti/20999/DocenteNonEsiste')
						.then(x => x.text()))
					.resolves.toEqual('L\'elemento richiesto non è stato trovato');
			});

			test('Valid query', () => {
				return expect(
						fetch('http://localhost:3000/api/docenti/2016/D000058')
						.then(x => x.json()))
					.resolves.toEqual(data.o14);
			});
		});

		describe('Post', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/docenti/nonAnno/D000058', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			describe('Check label', () => {
				test('label undefined', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n1', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo label deve essere presente');
				});

				test('label not string', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n2', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 3213
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo label deve essere di tipo string');
				});

				test('label empty string', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n3', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: ''
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo label deve essere una stringa non vuota');
				});
			});

			describe('Check sessioni', () => {
				test('sessioni structure(not array)', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n4', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'dsa',
								sessioni: 97
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo sessioni deve essere un array');
				});

				test('sessioni structure(label undefined)', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n4', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'dsa',
								sessioni: [{
									id: 71
								}]
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo sessioni deve avere struttura:\n' +
										'[{label: string, valore: number},...]');
				});

				test('sessioni structure(id undefined)', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n4', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'dsa',
								sessioni: [{
									label: 'dsa'
								}]
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo sessioni deve avere struttura:\n' +
										'[{label: string, valore: number},...]');
				});
			});

			describe('Valid data', () => {
				test('new Docente', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n14', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'dsa',
								sessioni: [{
									id: 3,
									label: 'dsa'
								}]
							})
						})
						.then(x => x.json()))
					.resolves.toEqual({status: 'ok'});
				});

				test('new Docente', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n24', {
							method: 'POST',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'dsa',
								sessioni: [{
									id: 3,
									label: 'dsa'
								}]
							})
						})
						.then(x => x.json()))
					.resolves.toEqual({status: 'ok'});
				});
			});
		});

		describe('Put', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/docenti/nonAnno/D000058', {
							method: 'PUT',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({label: 'l'})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			describe('Check label', () => {
				test('label not string', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n2', {
							method: 'PUT',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 3213
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo label deve essere di tipo string');
				});

				test('label empty string', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n3', {
							method: 'PUT',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: ''
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo label deve essere una stringa non vuota');
				});
			});

			describe('Check sessioni', () => {
				test('sessioni structure(not array)', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n4', {
							method: 'PUT',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'dsa',
								sessioni: 97
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo sessioni deve essere un array');
				});

				test('sessioni structure(label undefined)', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n4', {
							method: 'PUT',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'dsa',
								sessioni: [{
									id: 71
								}]
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo sessioni deve avere struttura:\n' +
										'[{label: string, valore: number},...]');
				});

				test('sessioni structure(id undefined)', () => {
					return expect(
						fetch('http://localhost:3000/api/docenti/2999/n4', {
							method: 'PUT',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({
								label: 'dsa',
								sessioni: [{
									label: 'dsa'
								}]
							})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo sessioni deve avere struttura:\n' +
										'[{label: string, valore: number},...]');
				});
			});

			test('non-existing Docente', () => {
				return expect(
					fetch('http://localhost:3000/api/docenti/3999/n14', {
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'dsa',
							sessioni: [{
								id: 3,
								label: 'dsa'
							}]
						})
					})
				.then(x => x.text()))
				.rejects.toEqual('L\'elemento richiesto non è stato trovato');
			});

			test('new Docente', () => {
				return expect(
					fetch('http://localhost:3000/api/docenti/2999/n24', {
						method: 'PUT',
						headers: {'Content-Type': 'application/json'},
						body: JSON.stringify({
							label: 'dsa',
							sessioni: [{
								id: 4,
								label: 'dsa'
							}]
						})
					})
					.then(x => x.json()))
				.rejects.toEqual({status: 'ok'});
			});
		});

		describe('Delete', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/docenti/nonAnno/D000058', {
							method: 'DELETE',
							headers: {'Content-Type': 'application/json'},
							body: JSON.stringify({label: 'l'})
						})
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			test('non-existing docente', () => {
				return expect(
					fetch('http://localhost:3000/api/docenti/4097/n24', {
						method: 'DELETE'
					})
					.then(x => x.json()))
				.resolves.toEqual('Impossibile eliminare l\'oggetto richiesto');
			});

			test('Valid query', () => {
				return expect(
					fetch('http://localhost:3000/api/docenti/2999/n14', {
						method: 'DELETE'
					})
					.then(x => x.json()))
				.resolves.toEqual({status: 'ok'});
			});
		});
	});
}

{
	const data = {
		o1: require('./data/routes/o1.json'),
		o2: require('./data/routes/o2.json'),
		o3: require('./data/routes/o3.json'),
		o4: require('./data/routes/o4.json')
	};

	describe('route /api/orari/corsi/:anno/:codice_corso/:codice_percorso', () => {
		describe('Get', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/corsi/NonAnno/axsd/sda')
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere un numero finito');
			});

			test('Invalid timestampInizio', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/corsi/2017/0115G/P0001|1?' +
							'timestampInizio=2017-as-09T02:00:00.000Z&' +
							'timestampFine=2017-10-19T02:00:00.000Z'
							)
						.then(x => x.text()))
					.resolves.toEqual('Invalid timestampInizio/timestampFine');
			});

			test('Invalid timestampFine', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/corsi/2017/0115G/P0001|1?' +
							'timestampInizio=2017-10-09T02:00:00.000Z&' +
							'timestampFine=2017-1*-19T02:00:00.000Z'
							)
						.then(x => x.text()))
					.resolves.toEqual('Invalid timestampInizio/timestampFine');
			});

			test('Non-existent course', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/corsi/2019/nonesiste/neanche')
						.then(x => x.text()))
					.resolves.toEqual('L\'elemento richiesto non è stato trovato');
			});

			test('existent course', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/corsi/2017/0115G/P0001|1')
						.then(x => x.json()))
					.resolves.toEqual(data.o1);
			});

			test('existent course', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/corsi/2017/0115G/P0001|1?' +
							'timestampInizio=2017-10-20T02:00:00.000Z&' +
							'timestampFine=2017-10-27T02:00:00.000Z'
							)
						.then(x => x.json()))
					.resolves.toEqual(data.o2);
			});

			test('existent course denorm', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/corsi/2017/0115G/P0001|1?deNorm')
						.then(x => x.json()))
					.resolves.toEqual(data.o3);
			});

			test('existent course denorm', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/corsi/2017/0115G/P0001|1?' +
							'timestampInizio=2017-10-20T02:00:00.000Z&' +
							'timestampFine=2017-10-27T02:00:00.000Z&deNorm'
							)
						.then(x => x.json()))
					.resolves.toEqual(data.o4);
			});
		});
	});
}

{
	const data = {
		o5: require('./data/routes/o5.json'),
		o6: require('./data/routes/o6.json'),
		o9: require('./data/routes/o9.json'),
		o10: require('./data/routes/o10.json')
	};

	describe('route /api/orari/:anno/:codice_attivita', () => {
		describe('Get', () => {
			test('Invalid anno', () => {
				return expect(
					fetch('http://localhost:3000/api/orari/nonunAnno/CODICE')
					.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere di tipo Number');
			});

			test('Existent orario', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/2017/' +
							'EC0115G_120000_120000^2_Nessun partizionamento_FERRA')
						.then(x => x.json()))
					.resolves.toEqual(data.o6);
			});

			test('Existent orario', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/2017/' +
							'EC0115G_120000_120000^2_Nessun partizionamento_FERRA?deNorm')
						.then(x => x.json()))
					.resolves.toEqual(data.o5);
			});

			test('Invalid timestampInizio -> Unfiltered json', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/2017/' +
							'EC0115G_120000_120000^2_Nessun partizionamento_FERRA?' +
							'timestampInizio=2017-adsa&' +
							'timestampFine=2017-10-09T08:08:08.000Z')
						.then(x => x.text()))
					.resolves.toEqual('Invalid timestampInizio/timestampFine');
			});

			test('Invalid timestmapFine -> Unfiltered json', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/2017/' +
							'EC0115G_120000_120000^2_Nessun partizionamento_FERRA?' +
							'timestampInizio=2017-10-09T01:02:03.000Z&' +
							'timestampFine=2017-10-dsaT08:08:08.000Z&' +
							'deNorm')
						.then(x => x.text()))
					.resolves.toEqual('Invalid timestampInizio/timestampFine');
			});

			test('Valid filter', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/2017/' +
							'EC0115G_120000_120000^2_Nessun partizionamento_FERRA?' +
							'timestampInizio=2017-10-09T01:02:03.000Z&' +
							'timestampFine=2017-10-29T08:08:08.000Z')
						.then(x => x.json()))
					.resolves.toEqual(data.o9);
			});

			test('Valid filter denorm', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/2017/' +
							'EC0115G_120000_120000^2_Nessun partizionamento_FERRA?' +
							'timestampInizio=2017-10-09T01:02:03.000Z&' +
							'timestampFine=2017-10-29T08:08:08.000Z&' +
							'deNorm')
						.then(x => x.json()))
					.resolves.toEqual(data.o10);
			});
		});
	});
}


{
	const data = {
		o7: require('./data/routes/o7.json'),
		o8: require('./data/routes/o8.json'),
	};

	describe('route /api/orari/:anno/:codice_attivita/:timestamp_inizio/:timestamp_fine', () => {
		describe('Get', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/nonunAnno/CODICE/' +
							'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z')
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere di tipo Number');
			});

			test('Invalid timestampInizio', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/CODICE/' +
							'2017-as-09T02:00:00.000Z/2017-10-19T02:00:00.000Z')
						.then(x => x.text()))
					.resolves.toEqual('I campi timestamp_inizio e timestamp_fine ' +
						'devono essere una data ISO');
			});

			test('Invalid timestampInizio', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/CODICE/' +
							'2017-10-09T02:00:00.000Z/2017-1*-19T02:00:00.000Z')
						.then(x => x.text()))
					.resolves.toEqual('I campi timestamp_inizio e timestamp_fine ' +
						'devono essere una data ISO');
			});

			test('non-existent orario', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/codicefalso/' +
							'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z')
						.then(x => x.text()))
					.resolves.toEqual('L\'elemento richiesto non è stato trovato');
			});

			test('Existent orario', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/2017/' +
							'EC0115G_120000_120000^2_Nessun partizionamento_FERRA/' +
							'2017-09-19T08:30:00.000Z/' +
							'2017-09-19T10:30:00.000Z'
						)
						.then(x => x.json()))
					.resolves.toEqual(data.o7);
			});

			test('Existent orario', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/2017/' +
							'EC0115G_120000_120000^2_Nessun partizionamento_FERRA/' +
							'2017-09-19T08:30:00.000Z/' +
							'2017-09-19T10:30:00.000Z' +
							'?deNorm')
						.then(x => x.json()))
					.resolves.toEqual(data.o8);
			});
		});

		describe('Post', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/nonunAnno/CODICE/' +
							'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
							{
								method: 'POST'
							})
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere di tipo Number');
			});

			test('Invalid timestampInizio', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/CODICE/' +
							'2017-as-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
							{
								method: 'POST'
							})
						.then(x => x.text()))
					.resolves.toEqual('I campi timestamp_inizio e timestamp_fine ' +
						'devono essere una data ISO');
			});

			test('Invalid timestampInizio', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/CODICE/' +
							'2017-10-09T02:00:00.000Z/2017-1*-19T02:00:00.000Z',
							{
								method: 'POST'
							})
						.then(x => x.text()))
					.resolves.toEqual('I campi timestamp_inizio e timestamp_fine ' +
						'devono essere una data ISO');
			});

			describe('Controlli tipo', () => {
				test('tipo undefined', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE1/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: "caio"
									})
								})
							.then(x => x.text()))
						.resolves.toEqual('Il campo tipo è mancante');
				});

				test('tipo not string', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE1/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: "caio",
										tipo: 94
									})
								})
							.then(x => x.text()))
						.resolves.toEqual('Il campo tipo deve essere di tipo string');
				});
			});


			describe('Controlli docente', () => {
				test('docente undefined', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE3/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										tipo: 'Lezioni'
									})
								})
							.then(x => x.text()))
						.resolves.toEqual('Il campo docente è mancante');
				});

				test('docente not string', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE3/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: [23, 12],
										tipo: 'Lezioni'
									})
								})
							.then(x => x.text()))
						.resolves.toEqual('Il campo docente deve essere di tipo string');
				});
			});

			describe('Controlli luogo', () => {
				test('luogo undefined', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE5/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
									})
								})
							.then(x => x.text()))
						.resolves.toEqual('Il campo luogo deve essere presente');
				});

				test('luogo not array', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE5/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: 12
									})
								})
							.then(x => x.text()))
						.resolves.toEqual('Il campo luogo deve essere un array');
				});

				test('luogo with nothing(correct)', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE6/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [{}]
									})
								})
							.then(x => x.json()))
						.resolves.toEqual({status: 'ok'});
				});

				test('luogo with only codice_aula(correct)', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE7/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [
											{codice_aula: 'A07'},
											{codice_aula: 'A91'}
										]
									})
								})
							.then(x => x.json()))
						.resolves.toEqual({status: 'ok'});
				});

				test('luogo with only codice_sede(correct)', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE8/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [
											{codice_sede: 'E101', codice_aula: 'A07'},
											{codice_sede: 'CLA', codice_aula: 'A91'}
										]
									})
								})
							.then(x => x.json()))
						.resolves.toEqual({status: 'ok'});
				});

				test('luogo con codici misti(correct)', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE9/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [
											{codice_sede: 'E101', codice_aula: 'A07'},
											{codice_sede: 'CLA'},
											{codice_sede: 'E101'},
											{codice_aula: 'A91'}
										]
									})
								})
							.then(x => x.json()))
						.resolves.toEqual({status: 'ok'});
				});

				test('luogo con codice_aula di tipo non string', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE10/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [
											{codice_aula: 12}
										]
									})
								})
							.then(x => x.text()))
						.resolves.toEqual(
							'Il campo luogo deve avere struttura \n' +
							'[{codice_aula: string, codice_sede: string}...]');
				});

				test('luogo con codice_sede di tipo non string', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE11/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'POST',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [
											{codice_sede: ['dsa',231]}
										]
									})
								})
							.then(x => x.text()))
						.resolves.toEqual(
							'Il campo luogo deve avere struttura \n' +
							'[{codice_aula: string, codice_sede: string}...]');
				});
			});
		});

		describe('Put', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/nonunAnno/CODICE/' +
							'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
							{
								method: 'PUT'
							})
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere di tipo Number');
			});

			test('Invalid timestampInizio', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/CODICE/' +
							'2017-as-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
							{
								method: 'PUT'
							})
						.then(x => x.text()))
					.resolves.toEqual('I campi timestamp_inizio e timestamp_fine ' +
						'devono essere una data ISO');
			});

			test('Invalid timestampInizio', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/CODICE/' +
							'2017-10-09T02:00:00.000Z/2017-1*-19T02:00:00.000Z',
							{
								method: 'PUT'
							})
						.then(x => x.text()))
					.resolves.toEqual('I campi timestamp_inizio e timestamp_fine ' +
						'devono essere una data ISO');
			});

			test('Nessun elemento con il codice indicato', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/2095/CODICE1/' +
							'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
							{
								method: 'PUT',
								headers: {'Content-Type': 'application/json'},
								body: JSON.stringify({
									docente: "caio",
									tipo: "lezione"
								})
							})
						.then(x => x.text()))
					.resolves.toEqual('Impossibile trovare l\'elemento richiesto');
			});

			describe('Controlli lezione', () => {
				test('tipo not string', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE1/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'PUT',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: "caio",
										tipo: 94
									})
								})
							.then(x => x.text()))
						.resolves.toEqual('Il campo tipo deve essere di tipo string');
				});
			});


			describe('Controlli docente', () => {
				test('docente not string', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE3/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'PUT',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: [23, 12],
										tipo: 'Lezioni'
									})
								})
							.then(x => x.text()))
						.resolves.toEqual('Il campo docente deve essere di tipo string');
				});
			});

			describe('Controlli luogo', () => {
				test('luogo not array', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE5/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'PUT',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: 12
									})
								})
							.then(x => x.text()))
						.resolves.toEqual('Il campo luogo deve essere un array');
				});

				test('luogo with nothing(correct)', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE6/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'PUT',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [{}]
									})
								})
							.then(x => x.json()))
						.resolves.toEqual({status: 'ok'});
				});

				test('luogo with only codice_aula(correct)', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE7/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'PUT',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [
											{codice_aula: 'A07'},
											{codice_aula: 'A91'}
										]
									})
								})
							.then(x => x.json()))
						.resolves.toEqual({status: 'ok'});
				});

				test('luogo with only codice_sede(correct)', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE8/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'PUT',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [
											{codice_sede: 'E101', codice_aula: 'A07'},
											{codice_sede: 'CLA', codice_aula: 'A91'}
										]
									})
								})
							.then(x => x.json()))
						.resolves.toEqual({status: 'ok'});
				});

				test('luogo con codici misti(correct)', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE9/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'PUT',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [
											{codice_sede: 'E101', codice_aula: 'A07'},
											{codice_sede: 'CLA'},
											{codice_sede: 'E101'},
											{codice_aula: 'A91'}
										]
									})
								})
							.then(x => x.json()))
						.resolves.toEqual({status: 'ok'});
				});

				test('luogo con codice_aula di tipo non string', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE10/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'PUT',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [
											{codice_aula: 12}
										]
									})
								})
							.then(x => x.text()))
						.resolves.toEqual(
							'Il campo luogo deve avere struttura \n' +
							'[{codice_aula: string, codice_sede: string}...]');
				});

				test('luogo con codice_sede di tipo non string', () => {
					return expect(
							fetch('http://localhost:3000/api/orari/3024/CODICE11/' +
								'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
								{
									method: 'PUT',
									headers: {'Content-Type': 'application/json'},
									body: JSON.stringify({
										docente: 'prova',
										tipo: 'Lezioni',
										luogo: [
											{codice_sede: ['dsa',231]}
										]
									})
								})
							.then(x => x.text()))
						.resolves.toEqual(
							'Il campo luogo deve avere struttura \n' +
							'[{codice_aula: string, codice_sede: string}...]');
				});
			});

			test('Valid delete', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/CODICE6/' +
							'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
							{
								method: 'PUT',
								headers: {'Content-Type': 'application/json'},
								body: JSON.stringify({
									docente: 'nuovoDoc',
									tipo: 'Lezioni'
								})
							})
						.then(x => x.json()))
					.resolves.toEqual({status: 'ok'});
			});
		});

		describe('Delete', () => {
			test('Invalid anno', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/nonunAnno/CODICE/' +
							'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
							{
								method: 'DELETE'
							})
						.then(x => x.text()))
					.resolves.toEqual('Il campo anno deve essere di tipo Number');
			});

			test('Invalid timestampInizio', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/CODICE/' +
							'2017-as-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
							{
								method: 'DELETE'
							})
						.then(x => x.text()))
					.resolves.toEqual('I campi timestamp_inizio e timestamp_fine ' +
						'devono essere una data ISO');
			});

			test('Invalid timestampInizio', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/CODICE/' +
							'2017-10-09T02:00:00.000Z/2017-1*-19T02:00:00.000Z',
							{
								method: 'DELETE'
							})
						.then(x => x.text()))
					.resolves.toEqual('I campi timestamp_inizio e timestamp_fine ' +
						'devono essere una data ISO');
			});


			test('Delete on nonExistent orario', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/2999/CODICE6/' +
							'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
							{
								method: 'DELETE'
							})
						.then(x => x.text()))
					.resolves.toEqual('Impossibile eliminare l\'oggetto richiesto');
			});

			test('Valid delete', () => {
				return expect(
						fetch('http://localhost:3000/api/orari/3024/CODICE6/' +
							'2017-10-09T02:00:00.000Z/2017-10-19T02:00:00.000Z',
							{
								method: 'DELETE'
							})
						.then(x => x.json()))
					.resolves.toEqual({status: 'ok'});
			});
		});
	});
}
