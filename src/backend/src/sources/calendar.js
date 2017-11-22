const fetch = require('node-fetch');
const FormData = require('form-data');

exports.getCal = (lang,anno,anno2,codes,corso,date) => {
	if(!Array.isArray(codes))
		codes=[codes];

	const url = 'https://easyroom.unitn.it/Orario/list_call.php'
	const form = new FormData();
	form.append('_lang','it');
	form.append('anno',anno);
	form.append('anno2',anno2);
	form.append('ar_codes_',codes.join('|'));
	form.append('ar_select_',(new Array(codes.length)).fill(true).join('|'));
	form.append('corso',corso);
	form.append('corso',corso);
	form.append('date',date);
	form.append('form-type','corso');

	return fetch(url,{
			method: 'POST',
			body: form
		})
		.then(data => data.text())
		.then(text => {
			const json = JSON.parse(text);
			const elenco_lez = [];

			for(let i=0;i<json.contains_data;i++) {
				const dataSplit = json[i].data.split('-');
				const orarioInizioSplit = json[i].ora_inizio.split(':');
				const orarioFineSplit = json[i].ora_fine.split(':');
				const begTimestamp = new Date(
					dataSplit[2],dataSplit[1],dataSplit[0],
					orarioInizioSplit[0],orarioInizioSplit[1]
				);
				const endTimestamp = new Date(
					dataSplit[2],dataSplit[1],dataSplit[0],
					orarioFineSplit[0],orarioFineSplit[1]
				);
				const codiceAulaSplit = json[i].codice_aula.split('/');

				elenco_lez.push({
					insegnamento: {
						codice_insegnamento: json[i].codice_insegnamento,
//						nome_insegnamento: json[i].nome_insegnamento,
						docente: json[i].docente
					},
					luogo:{
						codice_dipartimento: codiceAulaSplit[0],
						codice_aula: codiceAulaSplit[1],
					},
					timestamp: {
						inizio: begTimestamp,
						fine: endTimestamp,
					},
					tipo: json[i].tipo
				});
			}

			return JSON.stringify({
				elenco_lezioni: elenco_lez
			});
		});
}

