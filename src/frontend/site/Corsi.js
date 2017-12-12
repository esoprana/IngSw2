(function(){
	var anniacc = [
		{
			nome: "2017/2018",
			codice_anno: "2017"
		},
		{
			nome: "2016/2017",
			codice_anno: "2016"
		}
	];

	const anniAccSelect = document.getElementById('anniaccSelect');
	const corsiSelect = document.getElementById('corsiSelect');
	const anniStuSelect = document.getElementById('annistuSelect');
	var listorari = document.getElementById('listorari');
	var listesami = document.getElementById('listesami');

	function cleanSelect(select){
		while(select.firstChild){
			select.removeChild(select.firstChild);
		}
		
		const disabledOption = document.createElement('option');
		disabledOption.disabled="";
		disabledOption.selected="";
		disabledOption.value="";
		disabledOption.innerHTML="Seleziona";
		disabledOption.style.display = 'none';
		select.append(disabledOption);
	}

	function updateOrari(){
		const codice_anno = anniAccSelect.options[anniAccSelect.selectedIndex].value;
		const codice_corso = corsiSelect.options[corsiSelect.selectedIndex].value;
		const codice_annoStu = annistuSelect.options[anniStuSelect.selectedIndex].value;
		const url_orari = 'localhost:3000/api/orari/'+codice_anno+'/'+codice_corso+'/'+codice_annoStu;

		fetch(url_orari)
			.then(data => data.json())
			.then(orari => {
				orari.elenco_lezioni.forEach((orario) => {
					var corso = document.createElement('p');
						corso.className = "mb-0, nomeCorso";
						corso.innerHTML = orario.insegnamento.codice_insegnamento;

						var divPrincipale1 = document.createElement('div');
						divPrincipale1.className="d-flex w-100 justify-content-between";
						divPrincipale1.append(corso);

						var docente = document.createElement('p');
						docente.className = "mb-0";
						docente.innerHTML = orario.insegnamento.docente;
						
						var aula = document.createElement('p');
						aula.className = "mb-0";
						aula.innerHTML = orario.luogo.codice_aula;
						
						var orain = document.createElement('p');
						orain.className = "mb-0";
						var OI = new Date (orario.timestamp.inizio);
						orain.innerHTML =  OI.getHours() + "-" + OI.getMinutes();
						
						var orafi = document.createElement('p');
						orafi.className = "mb-0";
						var OF = new Date (orario.timestamp.fine);
						orafi.innerHTML = OF.getHours() + "-" + OF.getMinutes();
						
						var giorno = document.createElement('p');
						giorno.className = "mb-0";
						giorno.innerHTML = OI.getDay();
						
						var li = document.createElement('li');
						li.className="list-group-item  list-group-item-dark flex-column align-items-start";
						li.style.position="absolute";
						li.style.width = "16.66667%";
						li.style.height = ((OF.getHours() - OI.getHours() + (OF.getMinutes()- OI.getMinutes())/60.0)*(100.0/14.0))+"%";
						li.style.left = ((OI.getDay())*(100.0/6.0))+"%";
						li.style.top = ((1 + OI.getHours() - 7 + OI.getMinutes()/60.0)*(100.0/14.0))+"%";
						li.append(divPrincipale1,docente,aula);
						
						listorari.append(li);
					});
					
			});
	}

	function updateEsami(){
		const codice_anno = anniAccSelect.options[anniAccSelect.selectedIndex].value;
		const codice_corso = corsiSelect.options[corsiSelect.selectedIndex].value;
		const codice_annoStu = annistuSelect.options[anniStuSelect.selectedIndex].value;
		const url_esami = 'localhost:3000/api/esami/'+codice_anno+'/'+codice_corso+'/'+codice_annoStu;

		fetch(url_esami)
			.then(data => data.json())
			.then(esami => {	
				for (const codiceGenerale in esami){
					esami[codiceGenerale].appelli.forEach(appello => {
						var titolo = document.createElement('h5');
						titolo.className = "mb-1";
						titolo.value = appello;
						titolo.innerHTML = esami[codiceGenerale].nomeCorso;
						
						var divPrincipale = document.createElement('div');
						divPrincipale.className="d-flex w-100 justify-content-between"; 
						divPrincipale.append(titolo);
						
						var docente = document.createElement('p');
						docente.className = "mb-1";
						docente.innerHTML = esami[codiceGenerale].nomeDocente;
						
						var tipo = document.createElement('p');
						tipo.className = "mb-1";
						tipo.innerHTML = esami[codiceGenerale].tipo;					
				
						var data = document.createElement('p');
						data.className = "mb-1";
						data.innerHTML =
							esami[codiceGenerale].appelli[appello].timestamp.inizio.toLocaleString()
							+ " - "
							+ esami[codiceGenerale].appelli[appello].timestamp.fine.toLocaleString();
							
						var sede = document.createElement('p');
						sede.className = "mb-1";
						sede.innerHTML = esami[codiceGenerale].appelli[appello].sede
					
						var aula = document.createElement('p');
						aula.className = "mb-1";
						aula.innerHTML = esami[codiceGenerale].appelli[appello].aula
								
						var li = document.createElement('li');
						li.className="list-group-item  list-group-item-dark flex-column align-items-start";
						li.append(divPrincipale,docente,tipo,data,sede,aula);
						
						listesami.append(li);
					})
				}
			});
	}


	cleanSelect(anniAccSelect);
	cleanSelect(corsiSelect);
	cleanSelect(anniStuSelect);

	let dati=undefined;
		
	anniacc.forEach((annoacc) => {
		var option = document.createElement('option');
		option.value = annoacc.codice_anno;
		option.innerHTML = annoacc.nome;
		anniaccSelect.append(option);
	});

	anniAccSelect.addEventListener('change',function(){
		const codice_anno = anniAccSelect.options[anniAccSelect.selectedIndex].value;
		cleanSelect(corsiSelect);
		cleanSelect(annistuSelect);
		
		dati = undefined;
		
		if (codice_anno != ''){
			const url_corsi = 'localhost:3000/api/corsi/'+codice_anno;
			fetch(url_corsi)
				.then(data => data.json())
				.then(orari => {
					dati = orari;

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
		const codice_corso = corsiSelect.options[corsiSelect.selectedIndex].value;
		if((dati !== undefined)||(codice_corso!='')) {
			
			cleanSelect(anniStuSelect);
			
			for (const codice_anno in dati[codice_corso].elenco_anni){
				var option = document.createElement('option');
				option.value = codice_anno;
				option.innerHTML = dati[codice_corso].elenco_anni[codice_anno].label;
				annistuSelect.append(option);
			}	
		}						
	});

	anniStuSelect.addEventListener('change',function(){
		if((dati !== undefined)||(codice_annoStu!='')) {
			updateOrari();
			updateEsami();
		}
	});	
})();