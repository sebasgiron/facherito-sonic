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
			var s_gst = this.buffer.toString('latin1', 0, 3);
			console.log('s_gst = ' + s_gst); 
			var i3 = this.buffer.readInt16BE(3); 
			var i6 = this.buffer.readInt16BE(6); 
			console.log('i3 = ' + i3.toString(16));
			console.log('i6 = ' + i3.toString(16));			
			return (s_gst == 'GST'); 
		}
		

		
	}

}

