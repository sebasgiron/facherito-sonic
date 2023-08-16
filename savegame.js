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
				levelLayout: this.buffer.subarray(42104, 46200), 
				score: this.buffer.readUInt32BE(74398) * 10,
				emeraldCount: this.buffer[74793],
				emeraldArray: this.buffer.subarray(74794, 74801),
				rings: this.buffer.readUInt16BE(74392),
				palette: this.buffer.subarray(73592, 73720), 
				underwaterPalette: this.buffer.subarray(70904, 71032)
			};
			
			this.data.paletteForTest = Array.from(this.data.palette).toString();
			this.data.paletteArray = this.getPaletteArray(this.data.palette); 
			this.data.UndPaletteForTest = Array.from(this.data.underwaterPalette).toString();
		}
		
		getPaletteArray(aBuffer) {
			let index = 0;
			let result = []; 
			const colormap = new Map(); 
			colormap.set(0,0); 
			colormap.set(2,52); 
			colormap.set(4,87); 
			colormap.set(6,116); 
			colormap.set(8,144); 
			colormap.set(10,172); 
			colormap.set(12,206); 
			colormap.set(14,255); 
			
			while (index < aBuffer.length) {
				let b1 = aBuffer[index]; 
				let b2 = aBuffer[index+1]; 
				
				result.push({
					blue: colormap.get((b1 % 16)), 
					green: colormap.get((b2 % 16)), 
					red: colormap.get(b2 >> 4)
				}); 
				
				index = index + 2; 		
			}
			return result; 
		}
			
		setRings (value) {
			if (value > 65535) { throw new Error('Too big!'); }
			
			this.buffer.writeUInt16BE(value, 74392);
			this.analyzeGame();
		}
		
		setLives (value) {
			if (value > 255) { throw new Error('Too big!'); }
			
			this.buffer.writeUInt8(value, 74378);
			this.analyzeGame();
		}
		
		setZone (value) {
			if (value > 255) { throw new Error('Too big!'); }
			
			this.buffer.writeUInt8(value, 74376);
			this.analyzeGame();
		}
		
		setAct (value) {
			if (value > 255) { throw new Error('Too big!'); }
			
			this.buffer.writeUInt8(value, 74377);
			this.analyzeGame();
		}
		
		setScore (value) {
			if (value > 4294967295) { throw new Error('Too big!') }
			this.buffer.writeUInt32BE(value / 10, 74398);
			this.analyzeGame();
		}
		
		writeGame (target) {
			fs.writeFileSync(target || this.fileName, this.buffer);
			console.log('Data written successfully');
		}
		
	}

}
