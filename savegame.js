const fs = require('fs'); 

module.exports = {
	
	SavedGame: class {
		constructor(fileName) {
			this.fileName = fileName; 
		}
		
		readGame() {
			this.buffer = fs.readFileSync(this.fileName)
			console.log('Longitud de datos: ' + this.buffer.length); 
			this.checkFileFormat(); 
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
			
			if (!((s_gst == 'GST') & (i3 == 0x40e0 | i6 == 0xe040))) {
				throw new Error('Los datos leídos no concuerdan con el formato Genecyst esperado'); 
			}
			
			this.info = {
				version: this.buffer.readUInt8(0x50),
				emulatorID: this.buffer.readUInt8(0x51), 
				systemID: this.buffer.readUInt8(0x52), 
			}; 
			
			return (true); 
		}
		
		analyzeGame () {
			this.data = {
				playerLives: this.buffer[74378],
				zone: this.buffer[74376], 
				act: this.buffer[74377], //Empezando en 0 (ej. EHZ => Zone 00 Act 00)
				levelLayout: this.buffer.subarray(42104, 46199), 
				score: this.buffer.readUInt32BE(74398) * 10,
				emeraldCount: this.buffer[74793],
				emeraldArray: this.buffer.subarray(74794, 74800),
				rings: this.buffer.readUInt16BE(74392),
				palette: this.buffer.subarray(73592, 73719), 
				underwaterPalette: this.buffer.subarray(70904, 71031)
			};
		}
		
	}

}
