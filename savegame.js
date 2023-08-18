const fs = require('fs'); 

module.exports = {
	
	SavedGame: class {
		
		constructor(fileName) {
			this.fileName = fileName; 
			this.data = null; 
		}
		
		canShowData() {
			return this.data != null; 
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
				underwaterPalette: this.buffer.subarray(70904, 71032),
				debugMode: this.buffer[74866],
				objectArray: this.readObjects()
			};
			
			this.data.paletteArray = this.getPaletteArray(this.data.palette); 
			this.data.undPaletteArray = this.getPaletteArray(this.data.underwaterPalette); 
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
		
		setDebugMode (bool) {
			this.buffer[74866] = Number(bool);
			this.analyzeGame();
		}
		
		setScore (value) {
			if (value > 4294967295) { throw new Error('Too big!') }
			if (value % 10 !== 0) { throw new Error('Score must be divisible by 10!') }
			this.buffer.writeUInt32BE(value / 10, 74398);
			this.analyzeGame();
		}
		
		setEmeralds (targetArray) { // ['0', '0', '1', '0', '0', '1', '1']
			if (targetArray.length !== 7) { throw new Error ('Wrong number of elements (must be 7)!') }
			this.buffer[74793] = targetArray.filter(el => Boolean(Number(el))).length;
			
			for (let i = 0; i < 7; i++) {
				this.buffer[74794 + i] = targetArray[i];
			}
			
			this.analyzeGame();
		}
		
		writeGame (target) {
			fs.writeFileSync(target || this.fileName, this.buffer);
			console.log('Data written successfully');
		}
		
		printPalette (isUnderwater) {
			let targetPalette;
			if (isUnderwater) {
				targetPalette = this.data.undPaletteArray;
			} else {
				targetPalette = this.data.paletteArray;
			}
			
			let html = '<style>body { background-color: #eee } </style>';
			for (let color of targetPalette) {
				html += `<button style=" width: 12.5%; margin: 0; border: 0; height: 12.5%; background-color: rgb(${color.red}, ${color.green}, ${color.blue}); " disabled></button>`
			}
			
			fs.writeFileSync('out/palette.html', html);
			console.log('Paleta descargada en out/palette.html');
		}
		
		readObjects() {
			//0x2478
			//0xB000 inicio
			//0xD5FF final
			//0x40 longitud de cada bloque
			//152 objetos
			let offset = 0x2478 + 0xB000;
			let result = []; 
			while (offset <= (0x2478 + 0xD5FF)) {
				if (result.length < 2) {
					result.push(this.readObjectStatusSonic(this.buffer.subarray(offset, offset + 0x40))); 
				} else {
					result.push(this.readObjectStatus(this.buffer.subarray(offset, offset + 0x40))); 
				}
				offset = offset + 0x40; 
			}
			return(result); 
		}
		
		readObjectStatus(source) {
			let result = {
				id: source[0], 
				render_flags: source[1],
				art_tile: source.subarray(0x02, 0x04), 
				mappings: source.subarray(0x04, 0x08), 
				x_pos: source.subarray(0x08, 0x0A), 
				x_sub: source.subarray(0x0A, 0x0C), 
				y_pos: source.subarray(0x0C, 0x0E), 
				y_pixel: source.subarray(0x0E, 0x10), 
				x_vel: source.subarray(0x10, 0x12), 
				y_vel: source.subarray(0x12, 0x14),
				inertia: source.subarray(0x14, 0x16),
				y_radius: source[0x16], 
				x_radius: source[0x17],
				priority: source[0x18], 
				width_pixels: source[0x19],
				mapping_frame: source[0x1A],
				anim_frame: source[0x1B], 
				anim: source[0x1C],
				next_anim: source[0x1D],
				anim_frame_duration: source[0x1E], 
				collision_flags: source[0x20],
				collision_property: source[0x21],
				status_flags: source[0x22],
				respawn_index: source[0x23],
				routine: source[0x24],
				routine_secondary: source[0x25],
				angle: source[0x26],
				flip_angle: source[0x27],
				subtype: source[0x28],
				parent_index: source.subarray(0x3E, 0x40) 
			}; 
			return(result); 
		}
		
		readObjectStatusSonic(source) {
			let result = this.readObjectStatus(source); 
			result.air_left = source[0x28];
			result.flip_turned = source[0x29];
			result.obj_control = source[0x2A];
			result.status_secondary = source[0x2B];
			result.flips_remaining = source[0x2C];
			result.flip_speed = source[0x2D];
			result.move_lock = source.subarray(0x2E, 0x30); 
			result.invulnerable_time = source.subarray(0x30, 0x32); 
			result.invincibility_time = source.subarray(0x32, 0x34);
			result.speedshoes_time = source.subarray(0x34, 0x36);
			result.next_tilt = source[0x36]; 
			result.tilt = source[0x37];
			result.stick_to_convex = source[0x38];
			result.spindash_flag = source[0x39];
			result.spindash_counter = source.subarray(0x3A, 0x3C); 
			result.jumping = source[0x3C];
			result.interact = source[0x3D];
			result.top_solid_bit = source[0x3E]; 
			result.lrb_solid_bit = source[0x3F]; 
			return(result); 
		}
		
		getUsedObjectArray() {
			return this.data.objectArray.filter(el => el.id != 0); 
		}
	
		getObjectArrayInfo() {
			let result = {
				totalLength : this.data.objectArray.length, 
				usedLength : this.getUsedObjectArray().length
			}; 
			return(result); 
		}
		
	}

}
