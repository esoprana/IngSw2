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
			require: true
		},
		elenco_sessioni: {
			type: [{id: Number, label: String}],
			default: []
		}
	}]
}, {collection: 'corsi'});
corsoSchema.index({anno: 1, id: 1}, {unique: true});

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
attivitaSchema.index({anno: 1, id: 1}, {unique:true});

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
				type: Number
			},
			label: String
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
insegnamentoSchema.index({anno: 1, id: 1}, {unique: true});

const orarioSchema = new mongoose.Schema({
	anno: {
		type: Number,
		require: true
	},
	attivita: {
		type: String,
		required: true,
		index: true
	},
	docente: {
		type: String,
		required: false
	},
	luogo: {
		codice_aula: {
			type: String,
			required: false
		},
		codice_sede: {
			type: String,
			required: false
		}
	},
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
	tipo: {
		type: String,
		required: true
	}
}, {collection: 'orario'});
//orarioSchema.index({anno: 1, attivita: 1, timestamp: 1}, {unique: true});

const esameSchema = new mongoose.Schema({
	anno: {
		type: Number,
		required: true
	},
	codice_generale: {
		type: String,
		required: true
	},
	crediti: {
		type: Number,
		required: false
	},
	tipo_esame: {
		type: String,
		required: false
	},
	matricola_docente: {
		type: String,
		required: true
	},
	nome_docente: {
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
			required: false
		},
		sede: {
			type: String,
			required: false
		}
	}]
}, {collection: 'esami'});
//esameSchema.index({anno: 1, codice_generale: 1}, {unique: true});

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
