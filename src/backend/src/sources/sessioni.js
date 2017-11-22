const fetch = require('node-fetch');
const FormData = require('form-data');

exports.getSessions = (formtype, anno, cdl, annocdl, sessione, _lang) => {
    const url = 'https://easyroom.unitn.it/Orario/test_call.php'
	const form = new FormData();
	form.append('form-type',formtype);
	form.append('anno',anno);
	form.append('cdl',cdl);
	form.append('annocdl',annocdl);
	form.append('sessione',sessione);
	form.append('_lang',_lang);
    
    return fetch(url,{
			method: 'POST',
			body: form
		})
        .then(data => data.text())
        .then(text => {
            return JSON.stringify(text);
        
        })
    
}