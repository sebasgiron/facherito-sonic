const fs = require('fs'); 

module.exports = {
	
	SavedGame: class {
		constructor(fileName) {
			this.fileName = fileName; 
		}
		
		readGame() {
			this.buffer = fs.readFileSync(this.fileName)
			console.log('Longitud de datos: ' + this.buffer.length); 
			this.analyzeGame();
			console.log('Data analizada');
		}

		checkFileFormat() {
			if(this.buffer == null) {
				console.log('Buffer no asignado, llamando a readGame()'); 
				this.readGame(); 
			}			
			var s_gst = this.buffer.toString('latin1', 0, 3);
			console.log('s_gst = ' + s_gst); 
			var i3 = this.buffer.readUInt16BE(3); 
			var i6 = this.buffer.readUInt16BE(6); 
			console.log('i3 = ' + i3.toString(16));
			console.log('i6 = ' + i6.toString(16));			
			return (true);
		}
		
		analyzeGame () {
			this.data = {
				playerLives: this.buffer[74378],
				zone: this.buffer[74376], 
				act: this.buffer[74377], //Empezando en 0 (ej. EHZ => Zone 00 Act 00)
				levelLayout: sectionOfBuffer(this.buffer, 42104, 46199),
				score: Number(Array.from(sectionOfBuffer(this.buffer, 74398, 74401)).join('')) * 10, //Score NO es hexadecimal
				emeraldCount: this.buffer[74793],
				emeraldArray: sectionOfBuffer(this.buffer, 74794, 74800),
				rings: Number(Array.from(sectionOfBuffer(this.buffer, 74392, 74393)).join('')),
				palette: sectionOfBuffer(this.buffer, 73592, 73719),
				underwaterPalette: sectionOfBuffer(this.buffer, 70904, 71031)
			};
		}
		
	}

}

function sectionOfBuffer (buffer, start, end) {
	let array = Array.from(buffer);
	
	let newArray = array.filter(function (el, index) {
		return (index >= start && index <= end);
	})
	
	return Buffer.from(newArray);
}