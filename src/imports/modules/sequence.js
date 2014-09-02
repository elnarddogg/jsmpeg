// Sequence Layer

(function( JSMPEG ) {


    JSMPEG[PROTOTYPE].nextFrame = function() {

        var that = this;

        if( !that.buffer ) { return; }

        while(true) {

            var code = that.buffer.findNextMPEGStartCode();
            
            if( code == START_SEQUENCE ) {
                that.decodeSequenceHeader();
            }
            else if( code == START_PICTURE ) {
                
                if( that.playing === 1 ) {

                    var s = that.elapsedMacro;
                    var ms = that.elapsedMicro;
                    var total = that.elapsed;

                    if (that.lastTic !== s) {
                        that.lastTic = s;
                        that.happen( TIC , [ s , total ]);
                    }

                    that.scheduleNextFrame();
                    that.happen( TIMING , [ ms , total ]);
                }

                that.decodePicture();
                return that.canvas;
            }
            else if( code == BitReader.NOT_FOUND ) {

                that.happen( END );

                that.stop(); // Jump back to the beginning

                // Only loop if we found a sequence header
                if( that.loop && that.sequenceStarted ) {
                    that.play();
                }
                return NULL;
            }
            else {
                // ignore (GROUP, USER_DATA, EXTENSION, SLICES...)
            }
        }
    };


    JSMPEG[PROTOTYPE].scheduleNextFrame = function() {

        var that = this;
        var now = performance.now();

        that.lastTime = that.now || now;
        that.now = now;
        that._incrementTime( now - that.lastTime );
        that.lateTime = now - that.targetTime;

        var wait = Math.max(0, (1000/that.pictureRate) - that.lateTime);

        that.targetTime = now + wait;

        if( that.fps ) {
            
            if(!that.benchframe) {
                that.benchstart = now;
                that.benchframe = 0;
            }
            
            that.benchframe++;
            
            var timepassed = now - that.benchstart;

            if( that.benchframe >= that.fps ) {
                that.benchfps = (that.benchframe / timepassed) * 1000;
                //console.log('frames per second: ' + that.benchfps);
                //console.log('frame deficit: ' + that.frameDeficit);
                that.benchframe = NULL;
                that.happen( _BENCHFRAME );
            }
            
            setTimeout( that.nextFrame.bind( that ) , ( 1000 / that.fps ));
        }
        else if( wait < 18) {
            that.scheduleAnimation();
        }
        else {
            setTimeout( that.scheduleAnimation.bind( that ) , wait );
        }
    };


    JSMPEG[PROTOTYPE].scheduleFPSChange = function( fps ) {

        var that = this;
        var changeOnEvent = [ PAUSE , STOP ];

        if (fps === NULL && that.playing === 1 && that.benchframe) {
            //console.log('schedule fps change');
            changeOnEvent.unshift( _BENCHFRAME );
        }
        else {
            changeOnEvent.unshift( DECODE_FRAME );
        }

        that.once( changeOnEvent , [ fps , changeOnEvent ] , changeFPS );
    };


    JSMPEG[PROTOTYPE].scheduleAnimation = function() {
        var that = this;
        requestAnimationFrame(
            that.nextFrame.bind( that )
        );
    };

        
    JSMPEG[PROTOTYPE].decodeSequenceHeader = function() {

        var that = this;

        that.width = that.buffer.getBits(12);
        that.height = that.buffer.getBits(12);
        that.buffer.advance(4); // skip pixel aspect ratio
        that.pictureRate = PICTURE_RATE[that.buffer.getBits(4)];
        that.buffer.advance(18 + 1 + 10 + 1); // skip bitRate, marker, bufferSize and constrained bit

        that.initBuffers();

        if( that.buffer.getBits(1) ) { // load custom intra quant matrix?
            for( var i = 0; i < 64; i++ ) {
                that.customIntraQuantMatrix[ZIG_ZAG[i]] = that.buffer.getBits(8);
            }
            that.intraQuantMatrix = that.customIntraQuantMatrix;
        }
        
        if( that.buffer.getBits(1) ) { // load custom non intra quant matrix?
            for( var i = 0; i < 64; i++ ) {
                that.customNonIntraQuantMatrix[ZIG_ZAG[i]] = that.buffer.getBits(8);
            }
            that.nonIntraQuantMatrix = that.customNonIntraQuantMatrix;
        }
    };


    JSMPEG[PROTOTYPE].initBuffers = function() {

        var that = this;
        
        that.intraQuantMatrix = DEFAULT_INTRA_QUANT_MATRIX;
        that.nonIntraQuantMatrix = DEFAULT_NON_INTRA_QUANT_MATRIX;
        
        that.mbWidth = (that.width + 15) >> 4;
        that.mbHeight = (that.height + 15) >> 4;
        that.mbSize = that.mbWidth * that.mbHeight;
        
        that.codedWidth = that.mbWidth << 4;
        that.codedHeight = that.mbHeight << 4;
        that.codedSize = that.codedWidth * that.codedHeight;
        
        that.halfWidth = that.mbWidth << 3;
        that.halfHeight = that.mbHeight << 3;
        that.quarterSize = that.codedSize >> 2;
        
        // Sequence already started? Don't allocate buffers again
        if( that.sequenceStarted ) { return; }
        that.sequenceStarted = true;
        
        
        // Manually clamp values when writing macroblocks for shitty browsers
        // that don't support Uint8ClampedArray
        var MaybeClampedUint8Array = window.Uint8ClampedArray || Uint8Array;
        if( !window.Uint8ClampedArray ) {
            that.copyBlockToDestination = that.copyBlockToDestinationClamp;
            that.addBlockToDestination = that.addBlockToDestinationClamp;
        }
        
        // Allocate buffers and resize the canvas
        that.currentY = new MaybeClampedUint8Array(that.codedSize);
        that.currentY32 = new Uint32Array(that.currentY.buffer);

        that.currentCr = new MaybeClampedUint8Array(that.codedSize >> 2);
        that.currentCr32 = new Uint32Array(that.currentCr.buffer);

        that.currentCb = new MaybeClampedUint8Array(that.codedSize >> 2);
        that.currentCb32 = new Uint32Array(that.currentCb.buffer);
        

        that.forwardY = new MaybeClampedUint8Array(that.codedSize);
        that.forwardY32 = new Uint32Array(that.forwardY.buffer);

        that.forwardCr = new MaybeClampedUint8Array(that.codedSize >> 2);
        that.forwardCr32 = new Uint32Array(that.forwardCr.buffer);

        that.forwardCb = new MaybeClampedUint8Array(that.codedSize >> 2);
        that.forwardCb32 = new Uint32Array(that.forwardCb.buffer);
        
        that.canvas.width = that.width;
        that.canvas.height = that.height;
        
        that.currentRGBA = that.canvasContext.getImageData(0, 0, that.width, that.height);

        if( that.bwFilter ) {
            // This fails in IE10; don't use the bwFilter if you need to support it.
            that.currentRGBA32 = new Uint32Array( that.currentRGBA.data.buffer );
        }
        that.fillArray(that.currentRGBA.data, 255);
    };


    function changeFPS( e , fps , changeOnEvent ) {
        var context = e.target;
        //console.log('change fps');
        context.fps = ((fps && fps < 2) ? 2 : fps) || NULL;
        context.targetTime = performance.now();
        context.dispel( changeOnEvent , changeFPS );
    }


}( JSMPEG ));














