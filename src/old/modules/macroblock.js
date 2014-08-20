// Macroblock Layer

(function( JSMPEG ) {


	JSMPEG[PROTOTYPE].macroblockAddress = 0;
	JSMPEG[PROTOTYPE].mbRow = 0;
	JSMPEG[PROTOTYPE].mbCol = 0;
	
	JSMPEG[PROTOTYPE].macroblockType = 0;
	JSMPEG[PROTOTYPE].macroblockIntra = false;
	JSMPEG[PROTOTYPE].macroblockMotFw = false;
	
	JSMPEG[PROTOTYPE].motionFwH = 0;
	JSMPEG[PROTOTYPE].motionFwV = 0;
	JSMPEG[PROTOTYPE].motionFwHPrev = 0;
	JSMPEG[PROTOTYPE].motionFwVPrev = 0;

	JSMPEG[PROTOTYPE].decodeMacroblock = function() {
		// Decode macroblock_address_increment
		var 
			increment = 0,
			t = this.readCode(MACROBLOCK_ADDRESS_INCREMENT);
		
		while( t == 34 ) {
			// macroblock_stuffing
			t = this.readCode(MACROBLOCK_ADDRESS_INCREMENT);
		}
		while( t == 35 ) {
			// macroblock_escape
			increment += 33;
			t = this.readCode(MACROBLOCK_ADDRESS_INCREMENT);
		}
		increment += t;

		// Process any skipped macroblocks
		if( this.sliceBegin ) {
			// The first macroblock_address_increment of each slice is relative
			// to beginning of the preverious row, not the preverious macroblock
			this.sliceBegin = false;
			this.macroblockAddress += increment;
		}
		else {
			if( this.macroblockAddress + increment >= this.mbSize ) {
				// Illegal (too large) macroblock_address_increment
				return;
			}
			if( increment > 1 ) {
				// Skipped macroblocks reset DC predictors
				this.dcPredictorY  = 128;
				this.dcPredictorCr = 128;
				this.dcPredictorCb = 128;
				
				// Skipped macroblocks in P-pictures reset motion vectors
				if( this.pictureCodingType == PICTURE_TYPE_P ) {
					this.motionFwH = this.motionFwHPrev = 0;
					this.motionFwV = this.motionFwVPrev = 0;
				}
			}
			
			// Predict skipped macroblocks
			while( increment > 1) {
				this.macroblockAddress++;
				this.mbRow = (this.macroblockAddress / this.mbWidth)|0;
				this.mbCol = this.macroblockAddress % this.mbWidth;
				this.copyMacroblock(this.motionFwH, this.motionFwV, this.forwardY, this.forwardCr, this.forwardCb);
				increment--;
			}
			this.macroblockAddress++;
		}
		this.mbRow = (this.macroblockAddress / this.mbWidth)|0;
		this.mbCol = this.macroblockAddress % this.mbWidth;

		// Process the current macroblock
		this.macroblockType = this.readCode(MACROBLOCK_TYPE_TABLES[this.pictureCodingType]);
		this.macroblockIntra = (this.macroblockType & 0x01);
		this.macroblockMotFw = (this.macroblockType & 0x08);

		// Quantizer scale
		if( (this.macroblockType & 0x10) != 0 ) {
			this.quantizerScale = this.buffer.getBits(5);
		}

		if( this.macroblockIntra ) {
			// Intra-coded macroblocks reset motion vectors
			this.motionFwH = this.motionFwHPrev = 0;
			this.motionFwV = this.motionFwVPrev = 0;
		}
		else {
			// Non-intra macroblocks reset DC predictors
			this.dcPredictorY = 128;
			this.dcPredictorCr = 128;
			this.dcPredictorCb = 128;
			
			this.decodeMotionVectors();
			this.copyMacroblock(this.motionFwH, this.motionFwV, this.forwardY, this.forwardCr, this.forwardCb);
		}

		// Decode blocks
		var cbp = ((this.macroblockType & 0x02) != 0) 
			? this.readCode(CODE_BLOCK_PATTERN) 
			: (this.macroblockIntra ? 0x3f : 0);

		for( var block = 0, mask = 0x20; block < 6; block++ ) {
			if( (cbp & mask) != 0 ) {
				this.decodeBlock(block);
			}
			mask >>= 1;
		}
	};


	JSMPEG[PROTOTYPE].decodeMotionVectors = function() {
		var code, d, r = 0;
		
		// Forward
		if( this.macroblockMotFw ) {
			// Horizontal forward
			code = this.readCode(MOTION);
			if( (code != 0) && (this.forwardF != 1) ) {
				r = this.buffer.getBits(this.forwardRSize);
				d = ((Math.abs(code) - 1) << this.forwardRSize) + r + 1;
				if( code < 0 ) {
					d = -d;
				}
			}
			else {
				d = code;
			}
			
			this.motionFwHPrev += d;
			if( this.motionFwHPrev > (this.forwardF << 4) - 1 ) {
				this.motionFwHPrev -= this.forwardF << 5;
			}
			else if( this.motionFwHPrev < ((-this.forwardF) << 4) ) {
				this.motionFwHPrev += this.forwardF << 5;
			}
			
			this.motionFwH = this.motionFwHPrev;
			if( this.fullPelForward ) {
				this.motionFwH <<= 1;
			}
			
			// Vertical forward
			code = this.readCode(MOTION);
			if( (code != 0) && (this.forwardF != 1) ) {
				r = this.buffer.getBits(this.forwardRSize);
				d = ((Math.abs(code) - 1) << this.forwardRSize) + r + 1;
				if( code < 0 ) {
					d = -d;
				}
			}
			else {
				d = code;
			}
			
			this.motionFwVPrev += d;
			if( this.motionFwVPrev > (this.forwardF << 4) - 1 ) {
				this.motionFwVPrev -= this.forwardF << 5;
			}
			else if( this.motionFwVPrev < ((-this.forwardF) << 4) ) {
				this.motionFwVPrev += this.forwardF << 5;
			}
			
			this.motionFwV = this.motionFwVPrev;
			if( this.fullPelForward ) {
				this.motionFwV <<= 1;
			}
		}
		else if( this.pictureCodingType == PICTURE_TYPE_P ) {
			// No motion information in P-picture, reset vectors
			this.motionFwH = this.motionFwHPrev = 0;
			this.motionFwV = this.motionFwVPrev = 0;
		}
	};

	JSMPEG[PROTOTYPE].copyMacroblock = function(motionH, motionV, sY, sCr, sCb ) {
		var 
			width, scan, 
			H, V, oddH, oddV,
			src, dest, last;

		// We use 32bit writes here
		var dY = this.currentY32;
		var dCb = this.currentCb32;
		var dCr = this.currentCr32;

		// Luminance
		width = this.codedWidth;
		scan = width - 16;
		
		H = motionH >> 1;
		V = motionV >> 1;
		oddH = (motionH & 1) == 1;
		oddV = (motionV & 1) == 1;
		
		src = ((this.mbRow << 4) + V) * width + (this.mbCol << 4) + H;
		dest = (this.mbRow * width + this.mbCol) << 2;
		last = dest + (width << 2);

		var y1, y2, y;
		if( oddH ) {
			if( oddV ) {
				while( dest < last ) {
					y1 = sY[src] + sY[src+width]; src++;
					for( var x = 0; x < 4; x++ ) {
						y2 = sY[src] + sY[src+width]; src++;
						y = (((y1 + y2 + 2) >> 2) & 0xff);

						y1 = sY[src] + sY[src+width]; src++;
						y |= (((y1 + y2 + 2) << 6) & 0xff00);
						
						y2 = sY[src] + sY[src+width]; src++;
						y |= (((y1 + y2 + 2) << 14) & 0xff0000);

						y1 = sY[src] + sY[src+width]; src++;
						y |= (((y1 + y2 + 2) << 22) & 0xff000000);

						dY[dest++] = y;
					}
					dest += scan >> 2; src += scan-1;
				}
			}
			else {
				while( dest < last ) {
					y1 = sY[src++];
					for( var x = 0; x < 4; x++ ) {
						y2 = sY[src++];
						y = (((y1 + y2 + 1) >> 1) & 0xff);
						
						y1 = sY[src++];
						y |= (((y1 + y2 + 1) << 7) & 0xff00);
						
						y2 = sY[src++];
						y |= (((y1 + y2 + 1) << 15) & 0xff0000);
						
						y1 = sY[src++];
						y |= (((y1 + y2 + 1) << 23) & 0xff000000);

						dY[dest++] = y;
					}
					dest += scan >> 2; src += scan-1;
				}
			}
		}
		else {
			if( oddV ) {
				while( dest < last ) {
					for( var x = 0; x < 4; x++ ) {
						y = (((sY[src] + sY[src+width] + 1) >> 1) & 0xff); src++;
						y |= (((sY[src] + sY[src+width] + 1) << 7) & 0xff00); src++;
						y |= (((sY[src] + sY[src+width] + 1) << 15) & 0xff0000); src++;
						y |= (((sY[src] + sY[src+width] + 1) << 23) & 0xff000000); src++;
						
						dY[dest++] = y;
					}
					dest += scan >> 2; src += scan;
				}
			}
			else {
				while( dest < last ) {
					for( var x = 0; x < 4; x++ ) {
						y = sY[src]; src++;
						y |= sY[src] << 8; src++;
						y |= sY[src] << 16; src++;
						y |= sY[src] << 24; src++;

						dY[dest++] = y;
					}
					dest += scan >> 2; src += scan;
				}
			}
		}
		
		if( this.bwFilter ) {
			// No need to copy chrominance when black&white filter is active
			return;
		}
		

		// Chrominance
		
		width = this.halfWidth;
		scan = width - 8;
		
		H = (motionH/2) >> 1;
		V = (motionV/2) >> 1;
		oddH = ((motionH/2) & 1) == 1;
		oddV = ((motionV/2) & 1) == 1;
		
		src = ((this.mbRow << 3) + V) * width + (this.mbCol << 3) + H;
		dest = (this.mbRow * width + this.mbCol) << 1;
		last = dest + (width << 1);
		
		var cr1, cr2, cr;
		var cb1, cb2, cb;
		if( oddH ) {
			if( oddV ) {
				while( dest < last ) {
					cr1 = sCr[src] + sCr[src+width];
					cb1 = sCb[src] + sCb[src+width];
					src++;
					for( var x = 0; x < 2; x++ ) {
						cr2 = sCr[src] + sCr[src+width];
						cb2 = sCb[src] + sCb[src+width]; src++;
						cr = (((cr1 + cr2 + 2) >> 2) & 0xff);
						cb = (((cb1 + cb2 + 2) >> 2) & 0xff);

						cr1 = sCr[src] + sCr[src+width];
						cb1 = sCb[src] + sCb[src+width]; src++;
						cr |= (((cr1 + cr2 + 2) << 6) & 0xff00);
						cb |= (((cb1 + cb2 + 2) << 6) & 0xff00);

						cr2 = sCr[src] + sCr[src+width];
						cb2 = sCb[src] + sCb[src+width]; src++;
						cr |= (((cr1 + cr2 + 2) << 14) & 0xff0000);
						cb |= (((cb1 + cb2 + 2) << 14) & 0xff0000);

						cr1 = sCr[src] + sCr[src+width];
						cb1 = sCb[src] + sCb[src+width]; src++;
						cr |= (((cr1 + cr2 + 2) << 22) & 0xff000000);
						cb |= (((cb1 + cb2 + 2) << 22) & 0xff000000);

						dCr[dest] = cr;
						dCb[dest] = cb;
						dest++;
					}
					dest += scan >> 2; src += scan-1;
				}
			}
			else {
				while( dest < last ) {
					cr1 = sCr[src];
					cb1 = sCb[src];
					src++;
					for( var x = 0; x < 2; x++ ) {
						cr2 = sCr[src];
						cb2 = sCb[src++];
						cr = (((cr1 + cr2 + 1) >> 1) & 0xff);
						cb = (((cb1 + cb2 + 1) >> 1) & 0xff);

						cr1 = sCr[src];
						cb1 = sCb[src++];
						cr |= (((cr1 + cr2 + 1) << 7) & 0xff00);
						cb |= (((cb1 + cb2 + 1) << 7) & 0xff00);

						cr2 = sCr[src];
						cb2 = sCb[src++];
						cr |= (((cr1 + cr2 + 1) << 15) & 0xff0000);
						cb |= (((cb1 + cb2 + 1) << 15) & 0xff0000);

						cr1 = sCr[src];
						cb1 = sCb[src++];
						cr |= (((cr1 + cr2 + 1) << 23) & 0xff000000);
						cb |= (((cb1 + cb2 + 1) << 23) & 0xff000000);

						dCr[dest] = cr;
						dCb[dest] = cb;
						dest++;
					}
					dest += scan >> 2; src += scan-1;
				}
			}
		}
		else {
			if( oddV ) {
				while( dest < last ) {
					for( var x = 0; x < 2; x++ ) {
						cr = (((sCr[src] + sCr[src+width] + 1) >> 1) & 0xff);
						cb = (((sCb[src] + sCb[src+width] + 1) >> 1) & 0xff); src++;

						cr |= (((sCr[src] + sCr[src+width] + 1) << 7) & 0xff00);
						cb |= (((sCb[src] + sCb[src+width] + 1) << 7) & 0xff00); src++;

						cr |= (((sCr[src] + sCr[src+width] + 1) << 15) & 0xff0000);
						cb |= (((sCb[src] + sCb[src+width] + 1) << 15) & 0xff0000); src++;

						cr |= (((sCr[src] + sCr[src+width] + 1) << 23) & 0xff000000);
						cb |= (((sCb[src] + sCb[src+width] + 1) << 23) & 0xff000000); src++;
						
						dCr[dest] = cr;
						dCb[dest] = cb;
						dest++;
					}
					dest += scan >> 2; src += scan;
				}
			}
			else {
				while( dest < last ) {
					for( var x = 0; x < 2; x++ ) {
						cr = sCr[src];
						cb = sCb[src]; src++;

						cr |= sCr[src] << 8;
						cb |= sCb[src] << 8; src++;

						cr |= sCr[src] << 16;
						cb |= sCb[src] << 16; src++;

						cr |= sCr[src] << 24;
						cb |= sCb[src] << 24; src++;

						dCr[dest] = cr;
						dCb[dest] = cb;
						dest++;
					}
					dest += scan >> 2; src += scan;
				}
			}
		}
	};


}( JSMPEG ));

















