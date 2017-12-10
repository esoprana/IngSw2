jest.mock('node-fetch');
const fetchMock = require('node-fetch');
fetchMock.mockImplementation(global.fetch);
require('./error_matching.js');

const Calendar = require('./../src/sources/calendar.js').Calendar;
const data = {
	i1: require('./data/i1.json'),
	o1: require('./data/o1.json'),
	i2: require('./data/i2.json'),
	o2: require('./data/o2.json'),
	i3: require('./data/i3.json'),
	i4: require('./data/i4.json'),
	o10: require('./data/o10.json'),
	o20: require('./data/o20.json')
};
/*
expect.extend({
	toMatchError(received,argument){
		if (received instanceof Error) {
			if(received.message == argument) {
				return {
					message: () => ``,
					pass: true,
				};
			} else {
				return {
					message: () =>
						this.utils.matcherHint('.toMatchError') +
						'\n\n' +
						`Expected message of error to be :\n` +
						`  ${this.utils.printExpected(argument)}\n` +
						`Received:\n` +
						`  ${this.utils.printReceived(received.message)}`,
					pass: false,
				};
			}
		} else {
			return {
				message: () =>
						this.utils.matcherHint('.toMatchError') +
						'\n\n' +
						`Expected type ${this.utils.printExpected('Error')} `+
						`but type of object is ${this.utils.printReceived(typeof received)}`,
				pass: false,
			};
		}
	},
	toMatchLengthErrorLines(received,argument){
		if(received instanceof Error){
			const s = received.message.split('\n');
			if((s.length) == argument) {
				return {
					message: () => ``,
					pass: true,
				};
			} else {
				return {
					message: () =>
						this.utils.matcherHint('.toMatchLengthErrorLines') +
						'\n\n' +
						`Expected number of lines of the error message to be :\n` +
						`  ${this.utils.printExpected(argument)}\n` +
						`Received:\n` +
						`  ${this.utils.printReceived(s.length)}\n` +
						`with\n` +
						`${this.utils.printReceived(received.message)}`,
					pass: false,
				};
			}
		} else {
			return {
				message: () =>
						this.utils.matcherHint('.toMatchLengthErrorLines') +
						'\n\n' +
						`Expected type ${this.utils.printExpected('Error')} `+
						`but type of object is ${this.utils.printReceived(typeof received)}`,
				pass: false,
			};
		}
	}
});
*/
describe("Calendar constructor",() => {
	test("Throw on Calendar(undefined)",() => {
		return expect(() => (new Calendar(undefined))).toThrow();
	});

	test("Throw on Calendar(<not string>)", () => {
		return expect(() => (new Calendar(15))).toThrow();
	});

	test("Not throw on Calendar(<string>)",() => {
		return expect(() => (new Calendar('http://url.test'))).not.toThrow();
	});

	test("Not throw on Calendar(<String>)",() => {
		return expect(() => (new Calendar(new String('http://url.test')))).not.toThrow();
	});
});

describe("Calendar.getCal",() => {
	describe("Invalid 'lang' parameter", () => {
		test("Reject on 'lang' parameter undefined", () => {
			return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal(undefined,"2017","P0003|2","0332H","2017-11-27")
				).rejects.toMatchError('Il parametro lang è undefined');
		});

		test("Reject on 'lang' parameter number(not string or String)",() => {
			return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal(21,"2017","P0003|2","0332H","2017-11-27")
				).rejects.toMatchError("Il parametro deve essere di tipo 'string' o instanceof String");
		});
	});


	describe("Invalid 'anno' parameter",() => {
		test("Reject on 'anno' undefined",() => {
			return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it",undefined,"P0003|2","0332H","2017-11-27")
				).rejects.toMatchError("Il parametro anno è undefined");
		});

		test("Reject on not finite(with string)",() => {
			return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it","2017a","P0003|2","0332H","2017-11-27")
				).rejects.toMatchError("Il paramentro anno deve essere un numero");
		});

		test("Reject on not finite(with object)",() => {
			return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it",{a:1,b:2},"P0003|2","0332H","2017-11-27")
				).rejects.toMatchError("Il paramentro anno deve essere un numero");
		});
	});

	describe("Invalid 'percorso' undefined", () => {
		test("Reject on 'percorso' undefined",() => {
			return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it","2017",undefined,"0332H","2017-11-27")
				).rejects.toMatchError("Il parametro codice_percorso è undefined");
		});
	});

	describe("Invalid 'corso' undefined", () => {
		test("Reject on 'corso' undefined",() => {
			return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it","2017","P0003|2",undefined,"2017-11-27")
				).rejects.toMatchError("Il parametro codice_corso è undefined");
		});
	});

	describe("Invalid date",() => {
		test("Reject on 'date' undefined",() => {
			return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it","2017","P0003|2","0332H",undefined)
				).rejects.toMatchError("Il parametro date è undefined");
		});

		test("Reject on 'date' invalid",() => {
			return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it","2017","P0003|2","0332H","questaNonÉunaData")
				).rejects.toMatchError(
					"Il parametro date deve essere una data in formato ISO" +
					"(YYYY-MM-DD) o numero di millisecondi dopo il 1970-01-01");
		});

		test("Check date padding", () => {
			fetch.mockResponse(JSON.stringify(data.i3),{
				status: 200,
				header: {'Content-Type':'application/json'}
			});

			return expect((
				(new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it","2017","P0003|2","0332H","2017-01-07")
			)).resolves.toHaveProperty('date',"2017-01-07");
		});
	});

	describe("Multiple invalid parameters",() => {
		test("lang, percorso,data invalid",() => {
		return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
				.getCal(undefined,"2017",undefined,"0332H","questaNonÉunaData"))
				.rejects.toMatchLengthErrorLines(3); // Controllo se ci sono almeno tre righe
		});

		test("lang, percorso,data invalid",() => {
		return expect((new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
				.getCal("it","dsa2017","P0003|2",undefined,1511740800000))
				.rejects.toMatchLengthErrorLines(2); // Controllo se ci sono almeno tre righe
		});
	});


	describe("Valid parameters", () => {
		test("Not reject on valid parameters 1", () => {
			fetch.mockResponse(JSON.stringify(data.i1),{
				status: 200,
				header: {'Content-Type':'application/json'}
			});

			return expect((
				(new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it","2017","P0003|2","0332H","2017-11-27")
			)).resolves.toEqual(data.o1);
		});

		test("Not reject on valid parameters 2", () => {
			fetch.mockResponse(JSON.stringify(data.i2),{
				status: 200,
				header: {'Content-Type':'application/json'}
			});

			// Parse e stringify ripetuti sono per trasformare tutto come se fosse stato appena parsato da JSON
			// Es: numero ---JSON--> stringa --Parse--> stringa
			return expect((
				new Calendar('https://easyroom.unitn.it/Orario/grid_call.php')
					.getCal("it","2017","P0003|1","0332H","2017-11-27")
			)).resolves.toEqual(data.o2);
		});

		test("Not reject on valid parameters 1(with timestamp)", () => {
			fetch.mockResponse(JSON.stringify(data.i1),{
				status: 200,
				header: {'Content-Type':'application/json'}
			});

			return expect((
				(new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it","2017","P0003|2","0332H",1511740800000)
					.then(x => JSON.parse(JSON.stringify(x)))
			)).resolves.toEqual(data.o1);
		});

		test("Not reject on valid parameters 2(with timestamp)", () => {
			fetch.mockResponse(JSON.stringify(data.i2),{
				status: 200,
				header: {'Content-Type':'application/json'}
			});

			// Parse e stringify ripetuti sono per trasformare tutto come se fosse stato appena parsato da JSON
			// Es: numero ---JSON--> stringa --Parse--> stringa
			return expect((
				new Calendar('https://easyroom.unitn.it/Orario/grid_call.php')
					.getCal("it","2017","P0003|1","0332H",1511740800000)
			)).resolves.toEqual(data.o2);
		});

		test("Not reject on valid parameters 1(with String as lang)", () => {
			fetch.mockResponse(JSON.stringify(data.i1),{
				status: 200,
				header: {'Content-Type':'application/json'}
			});

			return expect((
				(new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal(new String("it"),"2017","P0003|2","0332H",1511740800000)
			)).resolves.toEqual(data.o1);
		});

		test("Not reject on valid parameters 2(with String as lang)", () => {
			fetch.mockResponse(JSON.stringify(data.i2),{
				status: 200,
				header: {'Content-Type':'application/json'}
			});

			// Parse e stringify ripetuti sono per trasformare tutto come se fosse stato appena parsato da JSON
			// Es: numero ---JSON--> stringa --Parse--> stringa
			return expect((
				new Calendar('https://easyroom.unitn.it/Orario/grid_call.php')
					.getCal(new String("it"),"2017","P0003|1","0332H",1511740800000)
			)).resolves.toEqual(data.o2);
		});
	});

	describe("Error on invalid data",() => {
		test("Reject on invalid data(with invalid date)", () => {
			fetch.mockResponse(JSON.stringify(data.i4),{
				status: 200,
				header: {'Content-Type':'application/json'}
			});

			return expect(
				(new Calendar('https://easyroom.unitn.it/Orario/grid_call.php'))
					.getCal("it","2017","P0003|2","0332H","2017-01-07")
			).rejects.toBeInstanceOf(RangeError);
		});

		test("Reject on 500 failed fetch",()=>{
			fetch.mockResponse('',{status: 500});
			return expect(
				(new Calendar('http://prova.test')) // Test non routable address
					.getCal("it","2017","P0003|2","0332H","2017-11-27")
			).rejects.toBeInstanceOf(Error);
		});

		test("Reject on non json body",()=>{
			fetch.mockResponse('questoNonèUnJSON',{
				status: 200,
				header: {'Content-Type':'application/json'}
			});
			return expect(
				(new Calendar('http://prova.test')) // Test non routable address
					.getCal("it","2017","P0003|2","0332H","2017-11-27")
			).rejects.toBeInstanceOf(Error);
		});
	});
});

describe("Calendar.getAssoc()",() => {
	describe("Reject on invalid data",() => {
		test("Reject on non json body",()=>{
			fetch.mockResponse('questoNonèUnJSON',{
				status: 200,
				header: {'Content-Type':'application/json'}
			});

			return expect(
				(new Calendar('http://prova.test')) // Test non routable address
					.getAssoc("it","2017","P0003|2","0332H","2017-11-27")
			).rejects.toBeInstanceOf(Error);
		});
	});

	describe("Valid parameters",() => {
		test("Not reject on valid parameters 1(with correct result)", () => {
				fetch.mockResponse(
						JSON.stringify(data.i1),
						{
							status: 200,
							header: {'Content-Type':'application/json'}
						}
				);

				return expect((
					new Calendar('https://easyroom.unitn.it/Orario/grid_call.php')
						.getAssoc(new String("it"),"2017","P0003|2","0332H",1511740800000)
				)).resolves.toEqual(data.o10);
			});

		test("Not reject on valid parameters 2(with correct result)", () => {
			fetch.mockResponse(
					JSON.stringify(data.i2),
					{
						status: 200,
						header: {'Content-Type':'application/json'}
					}
			);

			return expect((
				new Calendar('https://easyroom.unitn.it/Orario/grid_call.php')
					.getAssoc("it","2017","P0003|1","0332H","2017-11-27")
			)).resolves.toEqual(data.o20);
		});
	})
});
