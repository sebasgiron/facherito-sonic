const readline = require('readline');
const {SavedGame} = require('./savegame.js');

const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
}); //Interfaz de las preguntas

function askQuestion (question) {
	return new Promise (resolve => {
		rl.question(question, answer => {
			resolve(answer);
		});
	});
}

// Aquí guardaremos el juego procesado
var saveState; 

async function mainMenu() {
	let doContinue = true;
	
	while (doContinue) {		
		var menuOptions = []; 
		console.log('------------------------------\nMenú principal'); 
		console.log('[1] Cargar archivo'); 
		menuOptions.push('1'); 
		if (saveState != null && saveState.canShowData())  {
			console.log('[2] Mostrar la data'); 
			menuOptions.push('2'); 
			console.log('[3] Imprimir paleta'); 
			menuOptions.push('3');
			console.log('[4] Cambiar valores del juego'); 
			menuOptions.push('4');
			console.log('[5] Crear archivo CSV de la memoria de objetos'); 
			menuOptions.push('5');
			console.log('[G] Guardar'); 
			menuOptions.push('G');
		}
		console.log('[X] Salir \n'); 
		menuOptions.push('X'); 
		switch (await getMenuOption(menuOptions)) {
			case '1': await loadSavegame(); break; 
			case '2': mostrarData(); break; 
			case '3': await printPalette(); break;
			case '4': await changesMenu(); break;
			case '5': await saveState.printObjectsCSV(); break;
			case 'G': await writeGame(); break;
			case 'X': doContinue = false; break; 
		}
	}

	rl.close(); 
}

async function getMenuOption(menuOptions) {
	let answer = null; 
	while (answer == null) {
		answer = await askQuestion('Introduce la opción deseada: '); 
		if (!(menuOptions.includes(answer))) {			
			console.log('La opción que has elegido no es válida'); 
			answer = null; 
		}
	}
	return answer; 
}

async function loadSavegame() {
	console.log('Indica la ruta del archivo que quieres leer:'); 
	let fileName = await askQuestion('');
		
	try {
		console.log('Procesando archivo\n');
		saveState = new SavedGame(fileName);
		saveState.readGame();
		console.log(''); 
	} catch (e) {		
		console.log(`No se pudo leer la información de ${fileName || '???'}. Mensaje:\n${e.message}`);
	}
}

function mostrarData() {
	console.log(`Zona: ${saveState.data.zone}`);
	console.log(`Acto: ${saveState.data.act}`);
	console.log(`Vida(s): ${saveState.data.playerLives}`);
	console.log(`Anillo(s): ${saveState.data.rings}`);
	console.log(`Puntos: ${saveState.data.score}`);
	console.log(`Modo debug: ${Boolean(saveState.data.debugMode) ? 'activado' : 'desactivado'}`);
	
	console.log(`Objetos usados en memoria: ${saveState.objectArrayInfo.usedLength}`);
	console.log(`Longitud de la lista de anillos en memoria: ${saveState.data.ringArray.length}`);
}

async function printPalette () {
	let doContinuePalette = true;
	
	while (doContinuePalette) {
		var menuOptions = [];
		console.log('Qué paleta quieres cargar?');
		console.log('[A] Cargar paleta normal'); 
		menuOptions.push('A');
		menuOptions.push('a');
		console.log('[B] Cargar paleta aquática'); 
		menuOptions.push('B');
		menuOptions.push('b');
		console.log('[X] Volver al menú principal'); 
		menuOptions.push('X');
		
		switch (await getMenuOption(menuOptions)) {
			case 'A':
			case 'a': //Si se ponen de esta forma (sin break), se vuelven una misma opción
				saveState.printPalette(false);
				doContinuePalette = false;
				break;
			case 'B':
			case 'b':
				saveState.printPalette(true);
				doContinuePalette = false;
				break;
			case 'X':
				doContinuePalette = false;
				break;
		}
		
	}
}

async function writeGame () {
	let doContinueWriting = true;
	
	while (doContinueWriting) {
		var menuOptions = [];
		console.log('Quieres reescribir el archivo o guardarlo con otro nombre?');
		console.log('[A] Reescribirlo');
		menuOptions.push('A');
		menuOptions.push('a');
		console.log('[B] Guardarlo con otro nombre');
		menuOptions.push('B');
		menuOptions.push('b');
		console.log('[X] Volver al menú principal');
		menuOptions.push('X');
		
		switch (await getMenuOption(menuOptions)) {
			case 'A':
			case 'a':
				saveState.writeGame();
				doContinueWriting = false;
				break;
			case 'B':
			case 'b':
				saveState.writeGame(await askQuestion('Escribe la nueva ruta y nombre del archivo: '));
				doContinueWriting = false;
				break;
			case 'X':
				doContinueWriting = false;
				break;
		}
	}
}

async function ringChange () {
	let doContinueRings = true;
	
	while (doContinueRings) {
		var menuOptions = [];
		console.log(`Tienes ${saveState.data.rings} anillo(s)`);
		console.log('Elige cuántos anillos quieres tener (0 - 65535)');
		for (let i = 0; i <= 65535; i++) {
			menuOptions.push(String(i));
		}
		var nRings = await getMenuOption(menuOptions);
		if (nRings != null) {
			saveState.setRings(nRings);
			doContinueRings = false;
		}
		
	} 
}

async function livesChange () {
	let doContinueLives = true;
	
	while (doContinueLives) {
		var menuOptions = [];
		console.log(`Tienes ${saveState.data.lives} vida(s)`);
		console.log('Elige cuántas vidas quieres tener (0 - 255)');
		for (let i = 0; i <= 255; i++) {
			menuOptions.push(String(i));
		}
		var nLives = await getMenuOption(menuOptions);
		if (nLives != null) {
			saveState.setLives(nLives);
			doContinueLives = false;
		}
		
	} 
}

async function debugChange () {
	let doContinueDebug = true;
	while (doContinueDebug) {
		var menuOptions = [];
		console.log(`El modo debug está ${Boolean(saveState.data.debugMode) ? 'activado' : 'deasctivado'}`);
		console.log('Quieres activar el modo debug?');
		console.log('[S] Sí');
		menuOptions.push('S');
		console.log('[N] No');
		menuOptions.push('N');
		console.log('[X] Volver al menú principal');
		menuOptions.push('X');
		
		switch (await getMenuOption(menuOptions)) {
			case 'S':
				saveState.setDebugMode(true);
				doContinueDebug = false;
				console.log('Modo debug activado');
				break;
			case 'N':
				saveState.setDebugMode(false);
				doContinueDebug = false;
				console.log('Modo debug desactivado');
				break;
			case 'X':
				doContinueDebug = false;
				break;
		}
	}
}

async function scoreChange () {
	let doContinueScore = true;
	
	while (doContinueScore) {
		console.log(`Tienes ${saveState.data.score} puntos`);
		var nScore = await askQuestion('Elige cuántos anillos quieres tener (0 - 4294967290) (debe ser divisible entre 10)\n');
		if (nScore != null && Number(nScore) % 10 === 0 && Number(nScore) <= 4294967295) {
			saveState.setScore(nScore);
			doContinueScore = false;
		} else {
			console.log('Número no válido');
		}
		
	} 
}

async function zoneChange () {
	let doContinueZone = true;
	
	while (doContinueZone) {
		var menuOptions = [];
		console.log(`Estás en la zona ${saveState.data.zone}.`);
		console.log('En qué zona quieres estar? (0 - 255) (Solo existen 17)'); //TODO: Añadir una interfaz con cada una de las zonas
		for (let i = 0; i <= 255; i++) {
			menuOptions.push(String(i));
		}
		var nZone = await getMenuOption(menuOptions);
		if (nZone != null) {
			saveState.setZone(nZone);
			doContinueZone = false;
		}
		
	} 
}

async function actChange () {
	let doContinueAct = true;
	
	while (doContinueAct) {
		var menuOptions = [];
		console.log(`Estás en el acto ${saveState.data.act}.`);
		console.log('En qué acto quieres estar? (0 - 255) (a partir del 128 [inclusivo] son inestables)'); //TODO: Añadir una interfaz con cada una de las zonas
		for (let i = 0; i <= 255; i++) {
			menuOptions.push(String(i));
		}
		var nAct = await getMenuOption(menuOptions);
		if (nAct != null) {
			saveState.setAct(nAct);
			doContinueAct = false;
		}
		
	} 
}

async function emeraldChange () {
	let obtainedEmeralds = [];
	
	for (let i = 1; i <= 7; i++) {
		var doContinueEmeralds = true;
		
		while (doContinueEmeralds) {
			var menuOptions = [];
			console.log(`Quieres obtener la esmeralda número ${i}?`);
			console.log('[S] Sí');
			menuOptions.push('S');
			menuOptions.push('s');
			console.log('[N] No');
			menuOptions.push('N');
			menuOptions.push('n');
			
			var answer = await getMenuOption(menuOptions);
			if (answer != null) { obtainedEmeralds.push(answer); doContinueEmeralds = false; }
		}
	}
	
	saveState.setEmeralds(obtainedEmeralds.map(el => {
		if (el === 'S' || el === 's') {
			return '1';
		}
		return '0';
	}))
}

// Menú de cambios
async function changesMenu() {
	let doContinue = true;
	
	while (doContinue) {		
		var menuOptions = []; 
		console.log('------------------------------\nMenú de cambios de valores'); 
		console.log('[1] Cambiar número de anillos'); 
		menuOptions.push('1');
		console.log('[2] Cambiar número de vidas'); 
		menuOptions.push('2');
		console.log('[3] Cambiar puntuación'); 
		menuOptions.push('3');
		console.log('[4] Cambiar zona'); 
		menuOptions.push('4');
		console.log('[5] Cambiar acto'); 
		menuOptions.push('5');
		console.log('[6] Cambiar esmeraldas'); 
		menuOptions.push('6');
		console.log('[7] Cambiar objeto'); 
		menuOptions.push('7');
		console.log('[8] Cambiar modo debug'); 
		menuOptions.push('8');
		console.log('[X] Salir \n'); 
		menuOptions.push('X'); 
		switch (await getMenuOption(menuOptions)) {
			case '1': await ringChange(); break;
			case '2': await livesChange(); break;
			case '3': await scoreChange(); break;
			case '4': await zoneChange(); break;
			case '5': await actChange(); break;
			case '6': await emeraldChange(); break;
			case '7': await objectChange(); break;
			case '8': await debugChange(); break;
			case 'X': doContinue = false; break; 
		}
	}
}

async function objectChange () {
	let doContinueObject = true, objectIndex, property, value;
	while (doContinueObject) {
		var menuOptions = [];
		console.log(`Qué objeto quieres cambiar (del 1 al ${saveState.data.objectArray.length})?`);
		for (let i = 1; i <= saveState.data.objectArray.length; i++) {
			menuOptions.push(String(i));
		}
		
		objectIndex = Number(await getMenuOption(menuOptions)) - 1;
		
		if (objectIndex != null) {
			doContinueObject = false;
		}
	}
	
	console.log(`Vas a cambiar el objeto ${objectIndex + 1}, con id ${saveState.data.objectArray[objectIndex].id}.\nQué propiedad quieres cambiar?`);
	doContinueObject = true;
	while (doContinueObject) {
		var menuOptions = [], options = [];
		
		var i = 1;
		for (let mappedProperty of saveState.objectStatusMap.keys()) {
			menuOptions.push(String(i));
			options.push(mappedProperty);
			console.log(`[${i}] ${mappedProperty}`);
			i++;
		}
		
		property = options[Number(await getMenuOption(menuOptions)) - 1];
		
		if (property != null) {
			doContinueObject = false;
		}
	}
	
	console.log(`Vas a cambiar la propiedad ${property}, que tiene el valor ${saveState.data.objectArray[objectIndex][property]}`);
	doContinueObject = true;
	while (doContinueObject) {
		try {
			value = Number(await askQuestion('Qué valor quieres que tenga?'));
			if (Number.isNaN(value)) { throw new Error('Valor no válido. Debe ser un valor numérico') }
			
			doContinueObject = false;
		} catch (e) {
			console.log(e);
		}
	}
	
	saveState.setObjectProperty(saveState.data.objectArray[objectIndex], property, value);
	console.log(`La propiedad ${property} del objeto número ${objectIndex + 1} ahora es ${value}`);
}

mainMenu();