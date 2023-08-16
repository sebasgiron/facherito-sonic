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

//La función askQuestion devuelve una promesa que se resolverá (dará un resultado) al responder a la pregunta

async function main () {
	let fileName = await askQuestion('¿Cuál es la ruta del archivo quieres leer?');
	if (fileName === 'exit') { rl.close(); return; }
	
	try {
		let saveState = new SavedGame(fileName);
		saveState.readGame();
		
		console.log(saveState.data);
	} catch (e) {
		console.clear();
		console.log(`No se puedo leer la información de ${fileName || '???'}. Razón: ${e.message || 'desconocida'}`);
		return main() //Repite la pregunta y termina con este programa (el rl.close se hará en el el sub-main())
	}
	
	rl.close();
}

main();