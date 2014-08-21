// Block layer

(function( JSMPEG ) {


	JSMPEG[PROTOTYPE].decodeBlock = function(block) {

		var that = this;
		
		var
			n = 0,
			quantMatrix;
		
		// Clear preverious data
		that.fillArray(that.blockData, 0);
		
		// Decode DC coefficient of intra-coded blocks
		if( that.macroblockIntra ) {
			var 
				predictor,
				dctSize;
			
			// DC prediction
			
			if( block < 4 ) {
				predictor = that.dcPredictorY;
				dctSize = that.readCode(DCT_DC_SIZE_LUMINANCE);
			}
			else {
				predictor = (block == 4 ? that.dcPredictorCr : that.dcPredictorCb);
				dctSize = that.readCode(DCT_DC_SIZE_CHROMINANCE);
			}
			
			// Read DC coeff
			if( dctSize > 0 ) {
				var differential = that.buffer.getBits(dctSize);
				if( (differential & (1 << (dctSize - 1))) != 0 ) {
					that.blockData[0] = predictor + differential;
				}
				else {
					that.blockData[0] = predictor + ((-1 << dctSize)|(differential+1));
				}
			}
			else {
				that.blockData[0] = predictor;
			}
			
			// Save predictor value
			if( block < 4 ) {
				that.dcPredictorY = that.blockData[0];
			}
			else if( block == 4 ) {
				that.dcPredictorCr = that.blockData[0];
			}
			else {
				that.dcPredictorCb = that.blockData[0];
			}
			
			// Dequantize + premultiply
			that.blockData[0] <<= (3 + 5);
			
			quantMatrix = that.intraQuantMatrix;
			n = 1;
		}
		else {
			quantMatrix = that.nonIntraQuantMatrix;
		}
		
		// Decode AC coefficients (+DC for non-intra)
		var level = 0;
		while( true ) {
			var 
				run = 0,
				coeff = that.readCode(DCT_COEFF);
			
			if( (coeff == 0x0001) && (n > 0) && (that.buffer.getBits(1) == 0) ) {
				// end_of_block
				break;
			}
			if( coeff == 0xffff ) {
				// escape
				run = that.buffer.getBits(6);
				level = that.buffer.getBits(8);
				if( level == 0 ) {
					level = that.buffer.getBits(8);
				}
				else if( level == 128 ) {
					level = that.buffer.getBits(8) - 256;
				}
				else if( level > 128 ) {
					level = level - 256;
				}
			}
			else {
				run = coeff >> 8;
				level = coeff & 0xff;
				if( that.buffer.getBits(1) ) {
					level = -level;
				}
			}
			
			n += run;
			var dezigZagged = ZIG_ZAG[n];
			n++;
			
			// Dequantize, oddify, clip
			level <<= 1;
			if( !that.macroblockIntra ) {
				level += (level < 0 ? -1 : 1);
			}
			level = (level * that.quantizerScale * quantMatrix[dezigZagged]) >> 4;
			if( (level & 1) == 0 ) {
				level -= level > 0 ? 1 : -1;
			}
			if( level > 2047 ) {
				level = 2047;
			}
			else if( level < -2048 ) {
				level = -2048;
			}

			// Save premultiplied coefficient
			that.blockData[dezigZagged] = level * PREMULTIPLIER_MATRIX[dezigZagged];
		};
		
		// Transform block data to the spatial domain
		if( n == 1 ) {
			// Only DC coeff., no IDCT needed
			that.fillArray(that.blockData, (that.blockData[0] + 128) >> 8);
		}
		else {
			that.IDCT();
		}
		
		// Move block to its place
		var
			destArray,
			destIndex,
			scan;
		
		if( block < 4 ) {
			destArray = that.currentY;
			scan = that.codedWidth - 8;
			destIndex = (that.mbRow * that.codedWidth + that.mbCol) << 4;
			if( (block & 1) != 0 ) {
				destIndex += 8;
			}
			if( (block & 2) != 0 ) {
				destIndex += that.codedWidth << 3;
			}
		}
		else {
			destArray = (block == 4) ? that.currentCb : that.currentCr;
			scan = (that.codedWidth >> 1) - 8;
			destIndex = ((that.mbRow * that.codedWidth) << 2) + (that.mbCol << 3);
		}
		
		n = 0;
		
		var blockData = that.blockData;
		if( that.macroblockIntra ) {
			// Overwrite (no prediction)
			that.copyBlockToDestination(that.blockData, destArray, destIndex, scan);
		}
		else {
			// Add data to the predicted macroblock
			that.addBlockToDestination(that.blockData, destArray, destIndex, scan);
		}
	};


	JSMPEG[PROTOTYPE].copyBlockToDestination = function(blockData, destArray, destIndex, scan) {
		var n = 0;
		for( var i = 0; i < 8; i++ ) {
			for( var j = 0; j < 8; j++ ) {
				destArray[destIndex++] = blockData[n++];
			}
			destIndex += scan;
		}
	};

	JSMPEG[PROTOTYPE].addBlockToDestination = function(blockData, destArray, destIndex, scan) {
		var n = 0;
		for( var i = 0; i < 8; i++ ) {
			for( var j = 0; j < 8; j++ ) {
				destArray[destIndex++] += blockData[n++];
			}
			destIndex += scan;
		}
	};

	// Clamping version for shitty browsers (IE) that don't support Uint8ClampedArray
	JSMPEG[PROTOTYPE].copyBlockToDestinationClamp = function(blockData, destArray, destIndex, scan) {
		var n = 0;
		for( var i = 0; i < 8; i++ ) {
			for( var j = 0; j < 8; j++ ) {
				var p = blockData[n++];
				destArray[destIndex++] = p > 255 ? 255 : (p < 0 ? 0 : p);
			}
			destIndex += scan;
		}
	};

	JSMPEG[PROTOTYPE].addBlockToDestinationClamp = function(blockData, destArray, destIndex, scan) {
		var n = 0;
		for( var i = 0; i < 8; i++ ) {
			for( var j = 0; j < 8; j++ ) {
				var p = blockData[n++] + destArray[destIndex];
				destArray[destIndex++] = p > 255 ? 255 : (p < 0 ? 0 : p);
			}
			destIndex += scan;
		}
	};

	JSMPEG[PROTOTYPE].IDCT = function() {
		// See http://vsr.informatik.tu-chemnitz.de/~jan/MPEG/HTML/IDCT.html
		// for more info.

		var that = this;
		
		var 
			b1, b3, b4, b6, b7, tmp1, tmp2, m0,
			x0, x1, x2, x3, x4, y3, y4, y5, y6, y7,
			i,
			blockData = that.blockData;
		
		// Transform columns
		for( i = 0; i < 8; ++i ) {
			b1 =  blockData[4*8+i];
			b3 =  blockData[2*8+i] + blockData[6*8+i];
			b4 =  blockData[5*8+i] - blockData[3*8+i];
			tmp1 = blockData[1*8+i] + blockData[7*8+i];
			tmp2 = blockData[3*8+i] + blockData[5*8+i];
			b6 = blockData[1*8+i] - blockData[7*8+i];
			b7 = tmp1 + tmp2;
			m0 =  blockData[0*8+i];
			x4 =  ((b6*473 - b4*196 + 128) >> 8) - b7;
			x0 =  x4 - (((tmp1 - tmp2)*362 + 128) >> 8);
			x1 =  m0 - b1;
			x2 =  (((blockData[2*8+i] - blockData[6*8+i])*362 + 128) >> 8) - b3;
			x3 =  m0 + b1;
			y3 =  x1 + x2;
			y4 =  x3 + b3;
			y5 =  x1 - x2;
			y6 =  x3 - b3;
			y7 = -x0 - ((b4*473 + b6*196 + 128) >> 8);
			blockData[0*8+i] =  b7 + y4;
			blockData[1*8+i] =  x4 + y3;
			blockData[2*8+i] =  y5 - x0;
			blockData[3*8+i] =  y6 - y7;
			blockData[4*8+i] =  y6 + y7;
			blockData[5*8+i] =  x0 + y5;
			blockData[6*8+i] =  y3 - x4;
			blockData[7*8+i] =  y4 - b7;
		}
		
		// Transform rows
		for( i = 0; i < 64; i += 8 ) {
			b1 =  blockData[4+i];
			b3 =  blockData[2+i] + blockData[6+i];
			b4 =  blockData[5+i] - blockData[3+i];
			tmp1 = blockData[1+i] + blockData[7+i];
			tmp2 = blockData[3+i] + blockData[5+i];
			b6 = blockData[1+i] - blockData[7+i];
			b7 = tmp1 + tmp2;
			m0 =  blockData[0+i];
			x4 =  ((b6*473 - b4*196 + 128) >> 8) - b7;
			x0 =  x4 - (((tmp1 - tmp2)*362 + 128) >> 8);
			x1 =  m0 - b1;
			x2 =  (((blockData[2+i] - blockData[6+i])*362 + 128) >> 8) - b3;
			x3 =  m0 + b1;
			y3 =  x1 + x2;
			y4 =  x3 + b3;
			y5 =  x1 - x2;
			y6 =  x3 - b3;
			y7 = -x0 - ((b4*473 + b6*196 + 128) >> 8);
			blockData[0+i] =  (b7 + y4 + 128) >> 8;
			blockData[1+i] =  (x4 + y3 + 128) >> 8;
			blockData[2+i] =  (y5 - x0 + 128) >> 8;
			blockData[3+i] =  (y6 - y7 + 128) >> 8;
			blockData[4+i] =  (y6 + y7 + 128) >> 8;
			blockData[5+i] =  (x0 + y5 + 128) >> 8;
			blockData[6+i] =  (y3 - x4 + 128) >> 8;
			blockData[7+i] =  (y4 - b7 + 128) >> 8;
		}
	};


}( JSMPEG ));
















