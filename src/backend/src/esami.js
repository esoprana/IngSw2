var mongoose = require('mongoose');
var Schema = mongoose.Schema;

const esamiSchema = new mongoose.Schema({
	anno: {
		type: Number,
		required: true
	},
    anno_cdl: {
		type: String,
		required: true
	},
    cdl: {
		type: String,
		required: true
	},
    id_sessione: {
		type: Number,
		required: true
	},
    //lista_appelli: [{
	codice_generale: {
		type: String,
		required: true
	},
	crediti: {
		type: Number,
		required: true
	},
	tipo_esame: {
		type: String,
		required: true
	},
	matricola_docente: {
		type: String,
		required: true
	},
	numero_appelli: {
		type: String,
		required: true
	},
	appelli: [{
		timestamp: {
			type: {
				inizio: {
					type: Date,
					required: true
				},
				fine: {
					type: Date,
					required: true
				}
			},
			required: true
		},
		aula: {
			type: String,
			required: true
		},
		sede: {
			type: String,
			required: true
		}
	}]
    //}]
}, {collection: 'esami'});
esamiSchema.index({"anno": 1, "anno_cdl": 1, "cdl": 1, "id_sessione": 1, "codice_generale": 1 }, {unique: true});

module.exports = mongoose.model('esami', esamiSchema);