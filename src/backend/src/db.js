const mongoose = require('mongoose');

const dbUser = 'diru2weitu9deeHa';
const dbPassword = 'ze9eiGhuu3ohb0mahMu0Pi9ahPh9que1';
const url = '@ds129906.mlab.com:29906/prova';
//const url = '@127.0.0.1:27017/prova';

mongoose.connect(
	`mongodb://${dbUser}:${dbPassword}${url}`,
	//`mongodb://${url}`,
	{useMongoClient: true}
);
mongoose.Promise = global.Promise;

const corsoSchema = new mongoose.Schema({
	anno: {
		type: Number,
		require: true
	},
	id: {
		type: String,
		require: true
	},
	label: {
		type: String,
		required: true
	},
	codice_cdl: {
		type: String,
		required: false
	},
	elenco_anni: [{
		id: {
			type: String,
			require: true // Aggiungere controllo unicità
		},
		label: [{
			type: String,
			require: true // To lowercase?
		}],
		elenco_attivita: {
			type: [String],
			default: []
		},
		codice_percorso_cdl: {
			type: String,
			require: false
		},
		elenco_sessioni: {
			type: [{
				id: {
					type: Number,
					required: true
				},
				label: {
					type: String,
					required: true
				}
			}],
			default: []
		}
	}]
}, {collection: 'corsi'});
corsoSchema.index({
	anno: 1,
	id: 1
}, {
	unique: true
});

const attivitaSchema = new mongoose.Schema({
	anno: {
		type: Number,
		require: true
	},
	id: {
		type: String,
		require: true
	},
	label: {
		type: String,
		require: true
	}
}, {collection: 'attivita'});
attivitaSchema.index({
	anno: 1,
	id: 1
}, {
	unique: true
});

const docenteSchema = new mongoose.Schema({
	anno: {
		type: Number,
		require: true
	},
	id: {
		type: String,
		required: true
	},
	label: {
		type: String,
		tolowercase: true,
		required: true
	},
	sessioni: {
		type: [{
			id: {
				type: Number,
				required: true
			},
			label: {
				type: String,
				required: true
			}
		}],
		default: []
	}
}, {collection: 'docenti'});
docenteSchema.index({anno: 1, id: 1}, {unique: true});

const insegnamentoSchema = new mongoose.Schema({
	anno: {
		type: Number,
		require: true
	},
	id: {
		type: String,
		require: true
	},
	label: {
		type: String,
		require: true
	},
	elenco: {
		type: [{
			valore: {
				type: Number
			},
			label: String
		}],
		default: []
	}
}, {collection: 'insegnamenti'});
insegnamentoSchema.index({
	anno: 1,
	id: 1
}, {
	unique: true
});

const orarioSchema = new mongoose.Schema({
	anno: {
		type: Number,
		require: true
	},
	attivita: {
		type: String,
		required: true
	},
	docente: {
		type: String,
		required: true
	},
	luogo: {
		type: [{
			codice_aula: {
				type: String,
				required: false
			},
			codice_sede: {
				type: String,
				required: false
			}
		}],
		default: []
	},
	timestamp_inizio: {
		type: Date,
		required: true
	},
	timestamp_fine: {
		type: Date,
		required: true
	},
	tipo: {
		type: String,
		required: true
	}
}, {collection: 'orario'});
orarioSchema.index({
	anno: 1,
	attivita: 1
});

// Favorisce periodo rispetto all'attività
// Ricerco varie attività in un periodo(es: voglio le lezioni da settembre a
// novembre di tutte le attività)
orarioSchema.index({
	anno: 1,
	timestamp_inizio: 1,
	timestamp_fine: 1,
	attivita: 1
}, {
	unique: true
});

// Favorisce attività rispetto al periodo
// Cerco una singola attività in un periodo(es voglio tutte le lezioni
// dell'attività x da settembre a novembre)
orarioSchema.index({
	anno: 1,
	attivita: 1,
	timestamp_inizio: 1,
	timestamp_fine: 1
});

const esameSchema = new mongoose.Schema({
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
}, {collection: 'esami'});
esameSchema.index({"anno": 1, "anno_cdl": 1, "cdl": 1, "id_sessione": 1, "codice_generale": 1 }, {unique: true});

const sedeSchema = new mongoose.Schema({
	id: {
		type: String,
		required: true,
		index: true,
		unique: true
	},
	label: {
		type: String,
		required: true
	}
}, {collection: 'sede'});

const Docente = mongoose.model('docenti', docenteSchema);
const Corso = mongoose.model('corsi', corsoSchema);
const Attivita = mongoose.model('attivita', attivitaSchema);
const Insegnamento = mongoose.model('insegnamenti', insegnamentoSchema);
const Orario = mongoose.model('orario', orarioSchema);
const Esame = mongoose.model('esami', esameSchema);
const Sede = mongoose.model('sedi', sedeSchema);

module.exports = {
	Docente,
	Corso,
	Attivita,
	Insegnamento,
	Orario,
	Esame,
	Sede
};
