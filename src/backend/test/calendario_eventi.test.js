const calendario_eventi = require('./../src/sources/calendario_eventi.js');

test('output non Undefined', () => {
    expect.assertions(1);
    return calendario_eventi.getEvents('2017-10-24').then(data => {
        expect(data).not.toBeUndefined();
    });
});

test('data_stringa non definita viene mappata nel parametro della richiesta come dd-mm-yyyy', () => {
    expect.assertions(1);
    return calendario_eventi.getEvents('2017-12-06').then(data => {
        var object = JSON.parse(data);
        expect(object[0].data_stringa).toBe('06-12-2017');
    });
});


test('verifica struttura e campi dell output', () => {
    return calendario_eventi.getEvents('2017-10-24').then(data => {
        var object = JSON.parse(data);
        object.forEach((evento) => {
            expect(evento).toHaveProperty('titolo_evento');
            expect(evento).toHaveProperty('href');
            expect(evento).toHaveProperty('image_src');
            expect(evento).toHaveProperty('dipartimento');
            expect(evento).toHaveProperty('data_stringa');
        });
    });
});

test('parametro day undefined viene mappato nel giorno attuale', () => {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
    if(dd < 10) {
        dd = '0'+dd;
    }
    if(mm < 10) {
        mm = '0'+mm;
    }
    var todayString = [yyyy, mm, dd].join('-');
    var promises = [];
    promises.push(calendario_eventi.getEvents('undefined'));
    promises.push(calendario_eventi.getEvents(todayString));
    
    return Promise.all(promises).then(values => {
        expect(values[0]).toBe(values[1]);
    })
    
});

test('parametro day non corrispondente ad un giorno possibile viene mappato nel giorno attuale', () => {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();
    if(dd < 10) {
        dd = '0'+dd;
    }
    if(mm < 10) {
        mm = '0'+mm;
    }
    var todayString = [yyyy, mm, dd].join('-');
    var promises = [];
    promises.push(calendario_eventi.getEvents('2017-34-72'));
    promises.push(calendario_eventi.getEvents(todayString));
    
    return Promise.all(promises).then(values => {
        expect(values[0]).toBe(values[1]);
    })
});












