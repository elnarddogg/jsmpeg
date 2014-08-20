// Picture Layer

(function( JSMPEG ) {


	JSMPEG[PROTOTYPE].currentY = null;
	JSMPEG[PROTOTYPE].currentCr = null;
	JSMPEG[PROTOTYPE].currentCb = null;

	JSMPEG[PROTOTYPE].currentRGBA = null;

	JSMPEG[PROTOTYPE].pictureCodingType = 0;

	// Buffers for motion compensation
	JSMPEG[PROTOTYPE].forwardY = null;
	JSMPEG[PROTOTYPE].forwardCr = null;
	JSMPEG[PROTOTYPE].forwardCb = null;

	JSMPEG[PROTOTYPE].fullPelForward = false;
	JSMPEG[PROTOTYPE].forwardFCode = 0;
	JSMPEG[PROTOTYPE].forwardRSize = 0;
	JSMPEG[PROTOTYPE].forwardF = 0;


	JSMPEG[PROTOTYPE].decodePicture = function(skipOutput) {
		this.buffer.advance(10); // skip temporalReference
		this.pictureCodingType = this.buffer.getBits(3);
		this.buffer.advance(16); // skip vbv_delay
		
		// Skip B and D frames or unknown coding type
		if( this.pictureCodingType <= 0 || this.pictureCodingType >= PICTURE_TYPE_B ) {
			return;
		}
		
		// full_pel_forward, forward_f_code
		if( this.pictureCodingType == PICTURE_TYPE_P ) {
			this.fullPelForward = this.buffer.getBits(1);
			this.forwardFCode = this.buffer.getBits(3);
			if( this.forwardFCode == 0 ) {
				// Ignore picture with zero forward_f_code
				return;
			}
			this.forwardRSize = this.forwardFCode - 1;
			this.forwardF = 1 << this.forwardRSize;
		}
		
		var code = 0;
		do {
			code = this.buffer.findNextMPEGStartCode();
		} while( code == START_EXTENSION || code == START_USER_DATA );
		
		
		while( code >= START_SLICE_FIRST && code <= START_SLICE_LAST ) {
			this.decodeSlice( (code & 0x000000FF) );
			code = this.buffer.findNextMPEGStartCode();
		}
		
		// We found the next start code; rewind 32bits and let the main loop handle it.
		this.buffer.rewind(32);

		// Record this frame, if the recorder wants it
		this.recordFrameFromCurrentBuffer();
		
		
		if( skipOutput != DECODE_SKIP_OUTPUT ) {
			if( this.bwFilter ) {
				this.YToRGBA();
			}
			else {
				this.YCbCrToRGBA();	
			}
			this.canvasContext.putImageData(this.currentRGBA, 0, 0);

			if(this.externalDecodeCallback) {
				this.externalDecodeCallback(this, this.canvas);
			}
		}
		
		// If this is a reference picutre then rotate the prediction pointers
		if( this.pictureCodingType == PICTURE_TYPE_I || this.pictureCodingType == PICTURE_TYPE_P ) {
			var 
				tmpY = this.forwardY,
				tmpY32 = this.forwardY32,
				tmpCr = this.forwardCr,
				tmpCr32 = this.forwardCr32,
				tmpCb = this.forwardCb,
				tmpCb32 = this.forwardCb32;

			this.forwardY = this.currentY;
			this.forwardY32 = this.currentY32;
			this.forwardCr = this.currentCr;
			this.forwardCr32 = this.currentCr32;
			this.forwardCb = this.currentCb;
			this.forwardCb32 = this.currentCb32;

			this.currentY = tmpY;
			this.currentY32 = tmpY32;
			this.currentCr = tmpCr;
			this.currentCr32 = tmpCr32;
			this.currentCb = tmpCb;
			this.currentCb32 = tmpCb32;
		}
	};

	JSMPEG[PROTOTYPE].YCbCrToRGBA = function() {	
		var pY = this.currentY;
		var pCb = this.currentCb;
		var pCr = this.currentCr;
		var pRGBA = this.currentRGBA.data;

		// Chroma values are the same for each block of 4 pixels, so we proccess
		// 2 lines at a time, 2 neighboring pixels each.
		// I wish we could use 32bit writes to the RGBA buffer instead of writing
		// each byte separately, but we need the automatic clamping of the RGBA
		// buffer.

		var yIndex1 = 0;
		var yIndex2 = this.codedWidth;
		var yNext2Lines = this.codedWidth + (this.codedWidth - this.width);

		var cIndex = 0;
		var cNextLine = this.halfWidth - (this.width >> 1);

		var rgbaIndex1 = 0;
		var rgbaIndex2 = this.width * 4;
		var rgbaNext2Lines = this.width * 4;
		
		var cols = this.width >> 1;
		var rows = this.height >> 1;

		var y, cb, cr, r, g, b;

		for( var row = 0; row < rows; row++ ) {
			for( var col = 0; col < cols; col++ ) {
				cb = pCb[cIndex];
				cr = pCr[cIndex];
				cIndex++;
				
				r = (cr + ((cr * 103) >> 8)) - 179;
				g = ((cb * 88) >> 8) - 44 + ((cr * 183) >> 8) - 91;
				b = (cb + ((cb * 198) >> 8)) - 227;
				
				// Line 1
				y = pY[yIndex1++];
				pRGBA[rgbaIndex1] = y + r;
				pRGBA[rgbaIndex1+1] = y - g;
				pRGBA[rgbaIndex1+2] = y + b;
				rgbaIndex1 += 4;
				
				y = pY[yIndex1++];
				pRGBA[rgbaIndex1] = y + r;
				pRGBA[rgbaIndex1+1] = y - g;
				pRGBA[rgbaIndex1+2] = y + b;
				rgbaIndex1 += 4;
				
				// Line 2
				y = pY[yIndex2++];
				pRGBA[rgbaIndex2] = y + r;
				pRGBA[rgbaIndex2+1] = y - g;
				pRGBA[rgbaIndex2+2] = y + b;
				rgbaIndex2 += 4;
				
				y = pY[yIndex2++];
				pRGBA[rgbaIndex2] = y + r;
				pRGBA[rgbaIndex2+1] = y - g;
				pRGBA[rgbaIndex2+2] = y + b;
				rgbaIndex2 += 4;
			}
			
			yIndex1 += yNext2Lines;
			yIndex2 += yNext2Lines;
			rgbaIndex1 += rgbaNext2Lines;
			rgbaIndex2 += rgbaNext2Lines;
			cIndex += cNextLine;
		}
	};

	JSMPEG[PROTOTYPE].YToRGBA = function() {	
		// Luma only
		var pY = this.currentY;
		var pRGBA = this.currentRGBA32;

		var yIndex = 0;
		var yNext2Lines = (this.codedWidth - this.width);

		var rgbaIndex = 0;	
		var cols = this.width;
		var rows = this.height;

		var y;

		for( var row = 0; row < rows; row++ ) {
			for( var col = 0; col < cols; col++ ) {
				y = pY[yIndex++];
				pRGBA[rgbaIndex++] = 0xff000000 | y << 16 | y << 8 | y;
			}
			
			yIndex += yNext2Lines;
		}
	};


}( JSMPEG ));

















