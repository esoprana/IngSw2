const sessioni = require('./../src/sources/sessioni.js');
jest.mock('node-fetch');
const fetchMock = require('node-fetch');
fetchMock.mockImplementation(global.fetch);

test('mock fetch reject', () => {
    fetch.mockResponse(JSON.stringify('ciao'), {
        status: 200,
        header: {'Content-Type':'application/json'}
    });
    return expect(sessioni.getSessions('et_cdl', '2016', '0428H', 'Unico|1', '61', 'it')).reject;
});

test('mock fetch with data input error', () => {
    fetch.mockResponse(JSON.stringify('ciao'), {
        status: 200,
        header: {'Content-Type':'application/json'}
    });
    return expect(sessioni.getSessions('et_cdl', '2016', '0428H', 'Unico|1', '61', 'it')).resolves.toBe('Problemi di acquisizione dati o nel trattamento dati. Controllare la connessione o i valori dei parametri della richiesta.');
});

test('mock fetch with 500 respose status', () => {
    fetch.mockResponse('ciao', {
        status: 500,
        header: {'Content-Type':'text/plain'}
    });
    return expect(sessioni.getSessions('et_cdl', '2016', '0428H', 'Unico|1', '61', 'it')).resolves.toBe('Problemi di acquisizione dati o nel trattamento dati. Controllare la connessione o i valori dei parametri della richiesta.');
});