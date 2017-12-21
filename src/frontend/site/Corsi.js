(function(){
	var anniacc = [
		{
			nome: "2017/2018",
			anno: "2017"
		},
		{
			nome: "2016/2017",
			anno: "2016"
		}
	];

	const anniAccSelect = document.getElementById('anniaccSelect');
	const corsiSelect = document.getElementById('corsiSelect');
	const anniStuSelect = document.getElementById('annistuSelect');
	const sessioniSelect = document.getElementById('sessioniSelect');
	var listorari = document.getElementById('listorari');
	var listesami = document.getElementById('listesami');

	function cleanCh(obj) {
		while(obj.firstChild){
			obj.removeChild(obj.firstChild);
		}
	}
	
	function cleanSelect(select){
		cleanCh(select);
		
		const disabledOption = document.createElement('option');
		disabledOption.disabled="";
		disabledOption.selected="";
		disabledOption.value="";
		disabledOption.innerHTML="Seleziona";
		disabledOption.style.display = 'none';
		select.append(disabledOption);
	}

	function updateOrari(){
		const anno = anniAccSelect.options[anniAccSelect.selectedIndex].value;
		const codice_corso = corsiSelect.options[corsiSelect.selectedIndex].value;
		const codice_percorso = annistuSelect.options[anniStuSelect.selectedIndex].value;
		const url_orari = 'https://shielded-brook-92534.herokuapp.com/api/orari/corsi/'+anno+'/'+codice_corso+'/'+codice_percorso+'?deNorm';

		fetch(url_orari)
			.then(data => data.json())
			.then(orari => {
				orari.elenco_lezioni.forEach((orario) => {					
					var D = new Date();
					
					var corso = document.createElement('p');
						corso.className = "mb-0, nomeCorso";
						corso.innerHTML = orario.insegnamento.nome_insegnamento;

					var divPrincipale1 = document.createElement('div');
						divPrincipale1.className="d-flex w-100 justify-content-between";
						divPrincipale1.append(corso);

					var docente = document.createElement('p');
						docente.className = "mb-0, docente";
						docente.innerHTML = orario.insegnamento.docente;
					
					var OI = new Date (orario.timestamp_inizio);	
					var OF = new Date (orario.timestamp_fine);
					
					var settcorr = false;
					{
						var IS =  new Date(D.getFullYear(),D.getMonth(),D.getDate()-D.getDay()+1);
						var FS =  new Date(D.getFullYear(),D.getMonth(),D.getDate()-D.getDay()+7);
						if ((OI >= IS) && (OI<= FS)){
							settcorr = true;
						}
					} 
					
					if (settcorr == true){
						var li = document.createElement('li');
							li.className="list-group-item  list-group-item-info flex-column align-items-start";
							li.style.position="absolute";
							li.style.width = 100.0/6.0+"%";
							li.style.height = ((OF.getHours() - OI.getHours() + (OF.getMinutes()- OI.getMinutes())/60.0)*50)+"px";
							li.style.left = ((OI.getDay())*(100.0/6.0))+"%";
							li.style.top = ((1+ OI.getHours() - 7 + (OI.getMinutes()/60.0)))*50+"px";//(100.0/14.0)+"%";
							
							li.append(divPrincipale1,docente);
							
							if (orario.luogo.codice_aula !== undefined) {
								var aula = document.createElement('p');
									aula.className = "mb-0, aula";
									aula.innerHTML = orario.luogo.codice_aula;
									li.append(aula);
							}
							
							listorari.append(li);
					}
				});
					
			});
	}

	function updateSessioni(){
		const codice_corso = corsiSelect.options[corsiSelect.selectedIndex].value;
		const codice_percorso = annistuSelect.options[anniStuSelect.selectedIndex].value;
		
		for(const codiceSessione in dati[codice_corso].elenco_anni[codice_percorso].elenco_sessioni) {
			var option = document.createElement('option');
			option.value = codiceSessione;
			option.innerHTML = dati[codice_corso].elenco_anni[codice_percorso].elenco_sessioni[codiceSessione].label;
			sessioniSelect.append(option);
		}	
	}
	
	function updateEsami(){
		const anno = anniAccSelect.options[anniAccSelect.selectedIndex].value;
		const codice_corso = corsiSelect.options[corsiSelect.selectedIndex].value;
		const codice_percorso = annistuSelect.options[anniStuSelect.selectedIndex].value;
		const codice_sessione = sessioniSelect.options[sessioniSelect.selectedIndex].value;
		const url_esami = 'https://shielded-brook-92534.herokuapp.com/api/esami/corsi/'+anno+'/'+codice_corso+'/'+codice_percorso+'/'+codice_sessione+'?deNorm';
		
		fetch(url_esami)
			.then(data => data.json())
			.then(esami => {
				esami.forEach(esame => {
					esame.appelli.forEach(appello => {
						var titolo = document.createElement('h5');
						titolo.className = "mb-1";
						titolo.value = appello;
						titolo.innerHTML = esame.codice_generale;
						
						var divPrincipale = document.createElement('div');
						divPrincipale.className="d-flex w-100 justify-content-between"; 
						divPrincipale.append(titolo);
						
						//var docente = document.createElement('p');
						//docente.className = "mb-1";
						//docente.innerHTML = esame.nome_docente;
						
						//var tipo = document.createElement('p');
						//tipo.className = "text-muted";
						//tipo.innerHTML = esame.tipo_esame;					
				
						var data = document.createElement('small');
						//data.className = "text-muted";
						data.innerHTML =
							new Date(appello.timestamp.inizio).toLocaleString()
							+ " - "
							+ new Date(appello.timestamp.fine).toLocaleString();
							
						var sede = document.createElement('small');
						sede.className = "text-muted";
						sede.innerHTML = appello.sede
					
						var aula = document.createElement('small');
						aula.className = "mb-1";
						aula.innerHTML = appello.aula
								
						var li = document.createElement('li');
						li.className="list-group-item  list-group-item-info flex-column align-items-start";
						li.append(divPrincipale,/*docente,tipo,*/
									document.createElement('br'),
									data,
									document.createElement('br'),
									sede,
									document.createElement('br'),
									aula);
						
						listesami.append(li);
					});
				});			
			});
			
			
	}


	cleanSelect(anniAccSelect);
	cleanSelect(corsiSelect);
	cleanSelect(anniStuSelect);
	cleanSelect(sessioniSelect);


	let dati=undefined;
		
	anniacc.forEach((annoacc) => {
		var option = document.createElement('option');
		option.value = annoacc.anno;
		option.innerHTML = annoacc.nome;
		anniAccSelect.append(option);
	});

	anniAccSelect.addEventListener('change',function(){
		const anno = anniAccSelect.options[anniAccSelect.selectedIndex].value;
		cleanSelect(corsiSelect);
		cleanSelect(annistuSelect);
		cleanSelect(sessioniSelect);
		cleanCh(listesami);
		cleanCh(listorari);
		
		
		dati = undefined;
		
		if (anno != ''){
			const url_corsi = 'https://shielded-brook-92534.herokuapp.com/api/corsi/'+anno;
			fetch(url_corsi)
				.then(data => data.json())
				.then(data => {
					dati = data.corsi;
					
					for (const codice in dati){
						var option = document.createElement('option');
						option.value = codice;
						option.innerHTML = dati[codice].label;
						corsiSelect.append(option);
					}	
				});	
		}					
	});
		
	corsiSelect.addEventListener('change',function(){
		cleanCh(listesami);
		cleanCh(listorari);
		cleanSelect(anniStuSelect);
		cleanSelect(sessioniSelect);
			
		const codice_corso = corsiSelect.options[corsiSelect.selectedIndex].value;
		if((dati !== undefined)||(codice_corso!='')) {
			
			for (const anno in dati[codice_corso].elenco_anni){
				var option = document.createElement('option');
				option.value = anno;
				option.innerHTML = dati[codice_corso].elenco_anni[anno].label; 
				annistuSelect.append(option);
			}	
		}						
	});

	anniStuSelect.addEventListener('change',function(){	
		cleanCh(listesami);
		cleanCh(listorari);
		cleanSelect(sessioniSelect);
			
		if((dati !== undefined)||(codice_percorso!='')) {
			updateOrari();
			updateSessioni();
		}
	});	
	
	sessioniSelect.addEventListener('change',function(){
		cleanCh(listesami);
		
		if((dati !== undefined)||(codice_percorso!='')) {
			updateEsami();
		}
	});
	
})();


