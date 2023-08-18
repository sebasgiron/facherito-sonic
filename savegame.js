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
					result.push(this.readObjectStatusSonic(this.buffer.subarray(offset, offset + 0x40), offset)); 
				} else {
					result.push(this.readObjectStatus(this.buffer.subarray(offset, offset + 0x40), offset)); 
				}
				offset = offset + 0x40; 
			}
			return(result); 
		}
		
		setObjectProperty(objectStatus, property, value) { // { id: 1, ..., parentIndex: buffer }, 'id', 2
			switch (this.objectStatusMap.get(property).t) {
				case 's':
					if (value > 255 && value < 0) { throw new Error ('El valor no está en el rango requerido (0 a 255)'); }
					this.buffer.writeUInt8(value, objectStatus.sourceBufferOffset + this.objectStatusMap.get(property).i);
					break;
				case 'l':
					if (value > 127 && value < -127) { throw new Error ('El valor no está en el rango requerido (-127 al 127)'); }
					this.buffer.writeInt16BE(value, objectStatus.sourceBufferOffset + this.objectStatusMap.get(property).i);
					break;
				case 'lu':
					if (value > 65535 && value < 0) { throw new Error ('El valor no está en el rango requerido (0 al 65535)'); }
					this.buffer.writeUInt16BE(value, objectStatus.sourceBufferOffset + this.objectStatusMap.get(property).i);
					break;
				case 'b':
					if (this.data.objectArray[0][property].length !== value.length) { throw new Error('Longitud incorrecta') }
					for (let i = 0; i < value.length; i++) {
						this.buffer[objectStatus.sourceBufferOffset + this.objectStatusMap.get(property).i + i] = value[i];
					}
					break;
			}
			this.analyzeGame()
		}
			
		readObjectStatus(source, sourceBufferOffset) {
			let result = {
				id: source[0], 
				render_flags: source[1],
				art_tile: source.subarray(0x02, 0x04), 
				mappings: source.subarray(0x04, 0x08), 
				x_pos: source.readUInt16BE(0x08), 
				x_sub: source.readUInt16BE(0x0A), 
				y_pos: source.readUInt16BE(0x0C), //00 --> Arriba izquierda
				y_pixel: source.subarray(0x0E, 0x10), 
				x_vel: source.readInt16BE(0x10), 
				y_vel: source.readInt16BE(0x12), //TODO: Leer como positivos / negativos: x_vel, y_vel, inertia
				inertia: source.readInt16BE(0x14),
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
				parent_index: source.subarray(0x3E, 0x40),
				sourceBuffer: source,
				sourceBufferOffset: sourceBufferOffset
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
			result.move_lock = source.readUInt16BE(0x2E); 
			result.invulnerable_time = source.readUInt16BE(0x30); 
			result.invincibility_time = source.readUInt16BE(0x32);
			result.speedshoes_time = source.readUInt16BE(0x34);
			result.next_tilt = source[0x36]; 
			result.tilt = source[0x37];
			result.stick_to_convex = source[0x38];
			result.spindash_flag = source[0x39];
			result.spindash_counter = source.readUInt16BE(0x3A); 
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
			
		printObjectsCSV () {
			let text = Object.keys(this.data.objectArray[0]).toString(); //La de P1
			for (let object of this.data.objectArray) {
				text += '\n';
				for (let property of Object.keys(object)) {
					if (object[property] instanceof Array || object[property] instanceof Buffer) {
						text += `"${Array.from(object[property]).toString()}",`;
					} else {
						text += object[property] + ',';
					}
				}
				text = text.split('');
				text.pop();
				text = text.join(''); //Quita la coma del final
			}
			fs.writeFileSync('out/objectCSV.csv', text);
			console.log('Impreso correctamente en out/objectCSV.csv');
		}
		
		get objectStatusMap () { //Get permite acceder al resultado como si fuera una variable (sin los paréntesis)
			let result = new Map();
			
			result.set('id', { i: 0, t: 's' /*single value*/ });
			result.set('render_flags', { i: 1, t: 's' });
			result.set('art_tile', { i: 2, t: 'b' /*buffer*/ });
			result.set('mappings', { i: 0x4, t: 'b' });
			result.set('x_pos', { i: 0x8, t: 'lu' /*large unsigned (16 bits)*/ });
			result.set('x_sub', { i: 0x0A, t: 'lu' });
			result.set('y_pos', { i: 0x0C, t: 'lu' });
			result.set('y_pixel', { i: 0x0E, t: 'b' });
			result.set('x_vel', { i: 0x10, t: 'l' /*large signed (16 bits)*/ });
			result.set('y_vel', { i: 0x12, t: 'l' });
			result.set('inertia', { i: 0x14, t: 'l' });
			result.set('y_radius', { i: 0x16, t: 's' });
			result.set('x_radius', { i: 0x17, t: 's' });
			result.set('priority', { i: 0x18, t: 's' });
			result.set('width_pixels', { i: 0x19, t: 's' });
			result.set('mapping_frame', { i: 0x1A, t: 's' });
			result.set('anim_frame', { i: 0x1B, t: 's' });
			result.set('anim', { i: 0x1C, t: 's' });
			result.set('next_anim', { i: 0x1D, t: 's' });
			result.set('anim_frame_duration', { i: 0x1E, t: 's' });
			result.set('collision_flags', { i: 0x20, t: 's' });
			result.set('collision_property', { i: 0x21, t: 's' });
			result.set('status_flags', { i: 0x22, t: 's' });
			result.set('respawn_index', { i: 0x23, t: 's' });
			result.set('routine', { i: 0x24, t: 's' });
			result.set('routine_secondary', { i: 0x25, t: 's' });
			result.set('angle', { i: 0x26, t: 's' });
			result.set('flip_angle', { i: 0x27, t: 's' });
			result.set('subtype', { i: 0x28, t: 's' });
			result.set('parent_index', { i: 0x3E, t: 'b' });
			result.set('air_left', { i: 0x28, t: 's' });
			result.set('flip_turned', { i: 0x29, t: 's' });
			result.set('obj_control', { i: 0x2A, t: 's' });
			result.set('status_secondary', { i: 0x2B, t: 's' });
			result.set('flips_remaining', { i: 0x2C, t: 's' });
			result.set('flip_speed', { i: 0x2D, t: 's' });
			result.set('move_lock', { i: 0x2E, t: 'lu' });
			result.set('invulnerable_time', { i: 0x30, t: 'lu' });
			result.set('invincibility_time', { i: 0x32, t: 'lu' });
			result.set('speedshoes_time', { i: 0x34, t: 'lu' });
			result.set('next_tilt', { i: 0x36, t: 's' });
			result.set('tilt', { i: 0x37, t: 's' });
			result.set('stick_to_convex', { i: 0x38, t: 's' });
			result.set('spindash_flag', { i: 0x39, t: 's' });
			result.set('spindash_counter', { i: 0x3A, t: 'lu' });
			result.set('jumping', { i: 0x3C, t: 's' });
			result.set('interact', { i: 0x3D, t: 's' });
			result.set('top_solid_bit', { i: 0x3E, t: 's' });
			result.set('lrb_solid_bit', { i: 0x3F, t: 's' });
			
			
			return result;
		}
		
	}

}
