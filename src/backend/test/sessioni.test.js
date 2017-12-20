const sessioni = require('./../src/sources/sessioni.js');

test('output non Undefined', () => {
    expect.assertions(1);
    return sessioni.getSessions('et_cdl', '2016', '0428H', 'Unico|1', '61', 'it').then(data => {
        expect(data).not.toBeUndefined();
    });
});

test('output contiene i campi infoSessione e listaAppelli', () => {
    expect.assertions(2);
    return sessioni.getSessions('et_cdl', '2016', '0428H', 'Unico|1', '61', 'it').then(data => {
        //var object = JSON.parse(data);     cambiati object in data
        expect(data).toHaveProperty('infoSessione');
        expect(data).toHaveProperty('listaAppelli');
    });
});

test('infoSessione.AnnoAccademico uguale a quello passato come parametro', () => {
    expect.assertions(1);
    return sessioni.getSessions('et_cdl', '2016', '0428H', 'Unico|1', '61', 'it').then(data => {
        //var object = JSON.parse(data);       cambiati object in data
        expect(data).toHaveProperty('infoSessione.AnnoAccademico', '2016');
    });
});

test('array listaAppelli non vuoto', () => {
    expect.assertions(1);
    return sessioni.getSessions('et_cdl', '2016', '0428H', 'Unico|1', '61', 'it').then(data => {
        //var object = JSON.parse(data);     cambiati object in data
        expect(data.listaAppelli).not.toHaveLength(0);
    });
});

test('array listaAppelli.appelli non vuoto', () => {
    return sessioni.getSessions('et_cdl', '2016', '0428H', 'Unico|1', '61', 'it').then(data => {
        //var object = JSON.parse(data);       cambiati object in data
        data.listaAppelli.forEach((corsoAppello) => {
            expect(corsoAppello.appelli).not.toHaveLength(0);
        });
    });
});

test('array listaAppelli.appelli di dimensione listaAppelli.numeroAppelli', () => {
    return sessioni.getSessions('et_cdl', '2016', '0428H', 'Unico|1', '61', 'it').then(data => {
        //var object = JSON.parse(data);     cambiati object in data
        data.listaAppelli.forEach((corsoAppello) => {
            expect(corsoAppello.appelli).toHaveLength(corsoAppello.numeroAppelli);
        });
    });
});

test('verifica struttura e campi dell output', () => {
    return sessioni.getSessions('et_cdl', '2016', '0428H', 'Unico|1', '61', 'it').then(data => {
        //var object = JSON.parse(data);              cambiati object in data
        expect(data).toHaveProperty('infoSessione.AnnoAccademico');
        expect(data).toHaveProperty('infoSessione.IdSessione');
        expect(data).toHaveProperty('infoSessione.NomeFacolta');
        expect(data).toHaveProperty('infoSessione.Sessione');
        expect(data).toHaveProperty('infoSessione.DataInizioSessione');
        expect(data).toHaveProperty('infoSessione.DataFineSessione');
        data.listaAppelli.forEach((corsoAppello) => {
            expect(corsoAppello).toHaveProperty('nomeCorso');
            expect(corsoAppello).toHaveProperty('codiceGenerale');
            expect(corsoAppello).toHaveProperty('crediti');
            expect(corsoAppello).toHaveProperty('tipoEsame');
            expect(corsoAppello).toHaveProperty('nomeDocente');
            expect(corsoAppello).toHaveProperty('matricolaDocente');
            expect(corsoAppello).toHaveProperty('numeroAppelli');
            expect(corsoAppello).toHaveProperty('appelli');
        });
        data.listaAppelli.forEach((corsoAppello) => {
            corsoAppello.appelli.forEach((appello) => {
                //expect(appello).toHaveProperty('data');
                //expect(appello).toHaveProperty('oraInizio');
                //expect(appello).toHaveProperty('oraFine');
                expect(appello).toHaveProperty('dataInizio');       //********AGGIUNTO********
                expect(appello).toHaveProperty('dataFine');         //********AGGIUNTO********
                expect(appello).toHaveProperty('aula');
                expect(appello).toHaveProperty('sede');
            });
        });
    });
});

test('valori dei parametri inconsistenti, 2017 al posto di 2016', () => {
    return sessioni.getSessions('et_cdl', '2017', '0428H', 'Unico|1', '61', 'it').then(data => {
        expect(data).toBe('Problemi di acquisizione dati o nel trattamento dati. Controllare la connessione o i valori dei parametri della richiesta.');
    });
});