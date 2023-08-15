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
			
			return (true); 
		}
		

		
	}

}

