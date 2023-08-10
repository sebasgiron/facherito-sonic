const fs = require('fs'); 

module.exports = {
	
	SavedGame: class {
		constructor(fileName) {
			this.fileName = fileName; 
		}
		
		readGame() {
			this.buffer = fs.readFileSync(this.fileName)
			console.log('Longitud de datos: ' + this.buffer.length); 
		}			
	}

}

