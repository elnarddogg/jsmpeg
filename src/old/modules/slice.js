// Slice Layer

(function( JSMPEG ) {


	JSMPEG[PROTOTYPE].quantizerScale = 0;
	JSMPEG[PROTOTYPE].sliceBegin = false;

	JSMPEG[PROTOTYPE].decodeSlice = function(slice) {	
		this.sliceBegin = true;
		this.macroblockAddress = (slice - 1) * this.mbWidth - 1;
		
		// Reset motion vectors and DC predictors
		this.motionFwH = this.motionFwHPrev = 0;
		this.motionFwV = this.motionFwVPrev = 0;
		this.dcPredictorY  = 128;
		this.dcPredictorCr = 128;
		this.dcPredictorCb = 128;
		
		this.quantizerScale = this.buffer.getBits(5);
		
		// skip extra bits
		while( this.buffer.getBits(1) ) {
			this.buffer.advance(8);
		}

		do {
			this.decodeMacroblock();
			// We may have to ignore Video Stream Start Codes here (0xE0)!?
		} while( !this.buffer.nextBytesAreStartCode() );
	};


}( JSMPEG ));

















