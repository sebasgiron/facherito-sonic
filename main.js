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
		let menuOptions = []; 
		console.log('_____________________________\nMenú principal'); 
		console.log('[1] Cargar archivo'); 
		menuOptions.push('1'); 
		if (saveState != null && saveState.canShowData())  {
			console.log('[2] Mostrar la data'); 
			menuOptions.push('2'); 
		}		
		console.log('[X] Salir \n'); 
		menuOptions.push('X'); 
		switch (await getMenuOption(menuOptions)) {
			case '1': await loadSavegame(); break; 
			case '2': mostrarData(); break; 
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
	console.log(saveState.data); 
}

mainMenu();