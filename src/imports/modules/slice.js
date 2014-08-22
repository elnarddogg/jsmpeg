// Slice Layer

(function( JSMPEG ) {


    JSMPEG[PROTOTYPE].decodeSlice = function(slice) {

        var that = this;
        
        that.sliceBegin = true;
        that.macroblockAddress = (slice - 1) * that.mbWidth - 1;
        
        // Reset motion vectors and DC predictors
        that.motionFwH = that.motionFwHPrev = 0;
        that.motionFwV = that.motionFwVPrev = 0;
        that.dcPredictorY  = 128;
        that.dcPredictorCr = 128;
        that.dcPredictorCb = 128;
        
        that.quantizerScale = that.buffer.getBits(5);
        
        // skip extra bits
        while( that.buffer.getBits(1) ) {
            that.buffer.advance(8);
        }

        do {
            that.decodeMacroblock();
            // We may have to ignore Video Stream Start Codes here (0xE0)!?
        } while( !that.buffer.nextBytesAreStartCode() );
    };


}( JSMPEG ));
















