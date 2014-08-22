// Picture Layer

(function( JSMPEG ) {


    JSMPEG[PROTOTYPE].decodePicture = function(skipOutput) {

        var that = this;

        that.buffer.advance(10); // skip temporalReference
        that.pictureCodingType = that.buffer.getBits(3);
        that.buffer.advance(16); // skip vbv_delay
        
        // Skip B and D frames or unknown coding type
        if( that.pictureCodingType <= 0 || that.pictureCodingType >= PICTURE_TYPE_B ) {
            return;
        }
        
        // full_pel_forward, forward_f_code
        if( that.pictureCodingType == PICTURE_TYPE_P ) {
            that.fullPelForward = that.buffer.getBits(1);
            that.forwardFCode = that.buffer.getBits(3);
            if( that.forwardFCode == 0 ) {
                // Ignore picture with zero forward_f_code
                return;
            }
            that.forwardRSize = that.forwardFCode - 1;
            that.forwardF = 1 << that.forwardRSize;
        }
        
        var code = 0;
        do {
            code = that.buffer.findNextMPEGStartCode();
        } while( code == START_EXTENSION || code == START_USER_DATA );
        
        
        while( code >= START_SLICE_FIRST && code <= START_SLICE_LAST ) {
            that.decodeSlice( (code & 0x000000FF) );
            code = that.buffer.findNextMPEGStartCode();
        }
        
        // We found the next start code; rewind 32bits and let the main loop handle it.
        that.buffer.rewind(32);

        // Record this frame, if the recorder wants it
        that.recordFrameFromCurrentBuffer();
        
        
        if( skipOutput != DECODE_SKIP_OUTPUT ) {
            if( that.bwFilter ) {
                that.YToRGBA();
            }
            else {
                that.YCbCrToRGBA();    
            }
            that.canvasContext.putImageData(that.currentRGBA, 0, 0);

            that.happen( DECODE_FRAME , that.canvas );
        }
        
        // If this is a reference picutre then rotate the prediction pointers
        if( that.pictureCodingType == PICTURE_TYPE_I || that.pictureCodingType == PICTURE_TYPE_P ) {
            var 
                tmpY = that.forwardY,
                tmpY32 = that.forwardY32,
                tmpCr = that.forwardCr,
                tmpCr32 = that.forwardCr32,
                tmpCb = that.forwardCb,
                tmpCb32 = that.forwardCb32;

            that.forwardY = that.currentY;
            that.forwardY32 = that.currentY32;
            that.forwardCr = that.currentCr;
            that.forwardCr32 = that.currentCr32;
            that.forwardCb = that.currentCb;
            that.forwardCb32 = that.currentCb32;

            that.currentY = tmpY;
            that.currentY32 = tmpY32;
            that.currentCr = tmpCr;
            that.currentCr32 = tmpCr32;
            that.currentCb = tmpCb;
            that.currentCb32 = tmpCb32;
        }
    };

    JSMPEG[PROTOTYPE].YCbCrToRGBA = function() {    

        var that = this;

        var pY = that.currentY;
        var pCb = that.currentCb;
        var pCr = that.currentCr;
        var pRGBA = that.currentRGBA.data;

        // Chroma values are the same for each block of 4 pixels, so we proccess
        // 2 lines at a time, 2 neighboring pixels each.
        // I wish we could use 32bit writes to the RGBA buffer instead of writing
        // each byte separately, but we need the automatic clamping of the RGBA
        // buffer.

        var yIndex1 = 0;
        var yIndex2 = that.codedWidth;
        var yNext2Lines = that.codedWidth + (that.codedWidth - that.width);

        var cIndex = 0;
        var cNextLine = that.halfWidth - (that.width >> 1);

        var rgbaIndex1 = 0;
        var rgbaIndex2 = that.width * 4;
        var rgbaNext2Lines = that.width * 4;
        
        var cols = that.width >> 1;
        var rows = that.height >> 1;

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

        var that = this;
        
        // Luma only
        var pY = that.currentY;
        var pRGBA = that.currentRGBA32;

        var yIndex = 0;
        var yNext2Lines = (that.codedWidth - that.width);

        var rgbaIndex = 0;    
        var cols = that.width;
        var rows = that.height;

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
















