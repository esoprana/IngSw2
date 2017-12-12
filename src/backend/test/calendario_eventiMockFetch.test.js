const calendario_eventi = require('./../src/sources/calendario_eventi.js');
jest.mock('node-fetch');
const fetchMock = require('node-fetch');
fetchMock.mockImplementation(global.fetch);

test('mock fetch with 500 respose status', () => {
    fetch.mockResponse('ciao', {
        status: 500,
        header: {'Content-Type':'text/plain'}
    });
    return expect(calendario_eventi.getEvents('2017-10-24')).resolves.toBe('Problemi di acquisizione dati o nel trattamento dati. Controllare la connessione o i valori dei parametri della richiesta.');
});

test('mock fetch reject', () => {
    fetch.mockResponse(JSON.stringify('ciao'), {
        status: 500,
        header: {'Content-Type':'application/json'}
    });
    return expect(calendario_eventi.getEvents('2017-10-24')).reject;
});