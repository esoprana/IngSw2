const express = require('express');
const app = express();
var bodyParser = require('body-parser');
const calendario_eventi = require('./sources/calendario_eventi.js');
const sessioni = require('./sources/sessioni.js');
var mongoose = require('mongoose');
var Esami = require('./esami');

var urlencodedParser = bodyParser.urlencoded({ extended: false });
var router = express.Router();

mongoose.Promise = global.Promise;
var options = {
    useMongoClient: true,
    user: 'marco',
    pass: 'password'
  };
mongoose.connect('mongodb://marco:password@ds139436.mlab.com:39436/ingsw2db', options).then(
    () => { console.log('DB connected successfully!'); },
    err => { console.error('Error while connecting to DB: '.concat(err.message)); }
);

router.route('/calendario_eventi.json')
    .get((req,res) => {
    if(Object.keys(req.query).length != 1) {
        console.log('numero parametri sbagliato');
        res.end('ParameterNumberException: numero parametri sbagliato');
    }
    else{
        calendario_eventi.getEvents(req.query.day)
            .then(generatedJSON => {
                res.status(200).json(generatedJSON);
            });
    }
});

router.route('/sessioni/:anno/:annocdl/:cdl/:idSessione/:codiceGenerale')
    .get((req,res) => {
        Esami.findOne({anno: req.params.anno,
                       anno_cdl: req.params.annocdl,
                       cdl: req.params.cdl,
                       id_sessione: req.params.idSessione,
                       codice_generale: req.params.codiceGenerale }, function (err, esame) {
                    if (err) { res.json(err); }
                    else if(esame == null) { res.json('nessun elemento'); }
                    else{
                        res.json(esame); 
                    }
                });
})
    .put(urlencodedParser, function (req, res) {
        Esami.findOne({anno: req.params.anno,
                       anno_cdl: req.params.annocdl,
                       cdl: req.params.cdl,
                       id_sessione: req.params.idSessione,
                       codice_generale: req.params.codiceGenerale }, function (err, esame) {
                    if (err) { res.json(err); }
                        console.log(req.body.annoAccademico);
                        esame.anno = parseInt(req.body.annoAccademico);
                        esame.anno_cdl = req.body.annoCdl;
                        esame.cdl = req.body.cdl;
                        esame.id_sessione = parseInt(req.body.idSessione);
                        esame.codice_generale = req.body.codiceGenerale,
                        esame.crediti = req.body.crediti,
                        esame.tipo_esame = req.body.tipoEsame,
                        esame.matricola_docente = req.body.matricolaDocente,
                        esame.numero_appelli = req.body.numeroAppelli,
                        
                        esame.save(function (err) {
                            if (err) {res.json(err); }
                            res.json(esame);
                        });    
                });
})

    .delete(urlencodedParser, (req,res) => {
        Esami.remove({anno: req.body.anno,
                       anno_cdl: req.body.annocdl,
                       cdl: req.body.cdl,
                       id_sessione: req.body.idSessione,
                       codice_generale: req.body.codiceGenerale }, function (err, esame) {
                    if (err) { res.json(err); }
                    else{
                        res.json('elemento eliminato con successo'); 
                    }
                });
});

router.route('/sessioni')
    .get((req, res) => {
        Esami.find(function (err, esami) {
            if (err) { res.send(err); }
            res.json(esami);
        });
})

    .post(urlencodedParser, (req, res) => {
        
        sessioni.getSessions(
                req.body.formtype,
                req.body.anno,
                req.body.cdl,
                req.body.annocdl,
                req.body.sessione
            ).then(generatedJSON => {
                var esame;
                generatedJSON.listaAppelli.forEach((appelloLista) => {
                        esame = new Esami();
                        esame.anno = parseInt(generatedJSON.infoSessione.AnnoAccademico);
                        esame.anno_cdl = generatedJSON.infoSessione.AnnoCdl;
                        esame.cdl = generatedJSON.infoSessione.Cdl;
                        esame.id_sessione = parseInt(generatedJSON.infoSessione.IdSessione);
                        esame.codice_generale = appelloLista.codiceGenerale,
                        esame.crediti = appelloLista.crediti,
                        esame.tipo_esame = appelloLista.tipoEsame,
                        esame.matricola_docente = appelloLista.matricolaDocente,
                        esame.numero_appelli = appelloLista.numeroAppelli,
                        esame.appelli = []
                        appelloLista.appelli.forEach((appello) => {
                             esame.appelli.push({
                                 timestamp: {
                                     inizio: appello.dataInizio,
                                     fine: appello.dataFine
                                 },
                                 aula: appello.aula,
                                 sede: appello.sede
                             });
                        });
                    esame.save(function (err) {
                        //if (err) { res.json(err); }
                    });
                    
                });
            res.setHeader('Content-Type', 'application/json');
            res.json('save riuscita');
        });
    
});



app.use(router);
app.listen(3000);