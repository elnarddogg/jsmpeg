// Sequence Layer

(function( window , BitReader , JSMPEG , requestAnimFrame , Uint8Array , Int32Array , Uint32Array ) {


	JSMPEG[PROTOTYPE].pictureRate = 30;
	JSMPEG[PROTOTYPE].lateTime = 0;
	JSMPEG[PROTOTYPE].firstSequenceHeader = 0;
	JSMPEG[PROTOTYPE].targetTime = 0;

	JSMPEG[PROTOTYPE].nextFrame = function() {
		if( !this.buffer ) { return; }
		while(true) {
			var code = this.buffer.findNextMPEGStartCode();
			
			if( code == START_SEQUENCE ) {
				this.decodeSequenceHeader();
			}
			else if( code == START_PICTURE ) {
				if( this.playing ) {
					this.scheduleNextFrame();
				}
				this.decodePicture();
				return this.canvas;
			}
			else if( code == BitReader.NOT_FOUND ) {
				this.stop(); // Jump back to the beginning

				if( this.externalFinishedCallback ) {
					this.externalFinishedCallback(this);
				}

				// Only loop if we found a sequence header
				if( this.loop && this.sequenceStarted ) {
					this.play();
				}
				return null;
			}
			else {
				// ignore (GROUP, USER_DATA, EXTENSION, SLICES...)
			}
		}
	};

	JSMPEG[PROTOTYPE].scheduleNextFrame = function() {
		this.lateTime = Date.now() - this.targetTime;
		var wait = Math.max(0, (1000/this.pictureRate) - this.lateTime);
		this.targetTime = Date.now() + wait;

		if( this.benchmark ) {
			var now = Date.now();
			if(!this.benchframe) {
				this.benchstart = now;
				this.benchframe = 0;
			}
			this.benchframe++;
			var timepassed = now - this.benchstart;
			if( this.benchframe >= 100 ) {
				this.benchfps = (this.benchframe / timepassed) * 1000;
				if( console ) {
					console.log("frames per second: " + this.benchfps);
				}
				this.benchframe = null;
			}
			setTimeout( this.nextFrame.bind(this), 0);
		}
		else if( wait < 18) {
			this.scheduleAnimation();
		}
		else {
			setTimeout( this.scheduleAnimation.bind(this), wait );
		}
	};

	JSMPEG[PROTOTYPE].scheduleAnimation = function() {
		requestAnimFrame( this.nextFrame.bind(this), this.canvas );
	};
		
	JSMPEG[PROTOTYPE].decodeSequenceHeader = function() {
		this.width = this.buffer.getBits(12);
		this.height = this.buffer.getBits(12);
		this.buffer.advance(4); // skip pixel aspect ratio
		this.pictureRate = PICTURE_RATE[this.buffer.getBits(4)];
		this.buffer.advance(18 + 1 + 10 + 1); // skip bitRate, marker, bufferSize and constrained bit

		this.initBuffers();

		if( this.buffer.getBits(1) ) { // load custom intra quant matrix?
			for( var i = 0; i < 64; i++ ) {
				this.customIntraQuantMatrix[ZIG_ZAG[i]] = this.buffer.getBits(8);
			}
			this.intraQuantMatrix = this.customIntraQuantMatrix;
		}
		
		if( this.buffer.getBits(1) ) { // load custom non intra quant matrix?
			for( var i = 0; i < 64; i++ ) {
				this.customNonIntraQuantMatrix[ZIG_ZAG[i]] = this.buffer.getBits(8);
			}
			this.nonIntraQuantMatrix = this.customNonIntraQuantMatrix;
		}
	};

	JSMPEG[PROTOTYPE].initBuffers = function() {	
		this.intraQuantMatrix = DEFAULT_INTRA_QUANT_MATRIX;
		this.nonIntraQuantMatrix = DEFAULT_NON_INTRA_QUANT_MATRIX;
		
		this.mbWidth = (this.width + 15) >> 4;
		this.mbHeight = (this.height + 15) >> 4;
		this.mbSize = this.mbWidth * this.mbHeight;
		
		this.codedWidth = this.mbWidth << 4;
		this.codedHeight = this.mbHeight << 4;
		this.codedSize = this.codedWidth * this.codedHeight;
		
		this.halfWidth = this.mbWidth << 3;
		this.halfHeight = this.mbHeight << 3;
		this.quarterSize = this.codedSize >> 2;
		
		// Sequence already started? Don't allocate buffers again
		if( this.sequenceStarted ) { return; }
		this.sequenceStarted = true;
		
		
		// Manually clamp values when writing macroblocks for shitty browsers
		// that don't support Uint8ClampedArray
		var MaybeClampedUint8Array = window.Uint8ClampedArray || window.Uint8Array;
		if( !window.Uint8ClampedArray ) {
			this.copyBlockToDestination = this.copyBlockToDestinationClamp;
			this.addBlockToDestination = this.addBlockToDestinationClamp;
		}
		
		// Allocated buffers and resize the canvas
		this.currentY = new MaybeClampedUint8Array(this.codedSize);
		this.currentY32 = new Uint32Array(this.currentY.buffer);

		this.currentCr = new MaybeClampedUint8Array(this.codedSize >> 2);
		this.currentCr32 = new Uint32Array(this.currentCr.buffer);

		this.currentCb = new MaybeClampedUint8Array(this.codedSize >> 2);
		this.currentCb32 = new Uint32Array(this.currentCb.buffer);
		

		this.forwardY = new MaybeClampedUint8Array(this.codedSize);
		this.forwardY32 = new Uint32Array(this.forwardY.buffer);

		this.forwardCr = new MaybeClampedUint8Array(this.codedSize >> 2);
		this.forwardCr32 = new Uint32Array(this.forwardCr.buffer);

		this.forwardCb = new MaybeClampedUint8Array(this.codedSize >> 2);
		this.forwardCb32 = new Uint32Array(this.forwardCb.buffer);
		
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		
		this.currentRGBA = this.canvasContext.getImageData(0, 0, this.width, this.height);

		if( this.bwFilter ) {
			// This fails in IE10; don't use the bwFilter if you need to support it.
			this.currentRGBA32 = new Uint32Array( this.currentRGBA.data.buffer );
		}
		this.fillArray(this.currentRGBA.data, 255);
	};


}( window , BitReader , JSMPEG , requestAnimationFrame , Uint8Array , Int32Array , Uint32Array ));

















