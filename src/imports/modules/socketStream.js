// Streaming over WebSockets

(function( JSMPEG ) {


	JSMPEG[PROTOTYPE].initSocketClient = function( client ) {

		var that = this;

		that.buffer = new BitReader(new ArrayBuffer(that.socketBufferSize));

		that.nextPictureBuffer = new BitReader(new ArrayBuffer(that.socketBufferSize));
		that.nextPictureBuffer.writePos = 0;
		that.nextPictureBuffer.chunkBegin = 0;
		that.nextPictureBuffer.lastWriteBeforeWrap = 0;

		that.client.binaryType = 'arraybuffer';
		that.client.onmessage = that.receiveSocketMessage.bind(that);
	};

	JSMPEG[PROTOTYPE].decodeSocketHeader = function( data ) {
		// Custom header sent to all newly connected clients when streaming
		// over websockets:
		// struct { char magic[4] = "jsmp"; unsigned short width, height; };

		var that = this;

		if( 
			data[0] == SOCKET_MAGIC_BYTES.charCodeAt(0) && 
			data[1] == SOCKET_MAGIC_BYTES.charCodeAt(1) && 
			data[2] == SOCKET_MAGIC_BYTES.charCodeAt(2) && 
			data[3] == SOCKET_MAGIC_BYTES.charCodeAt(3)
		) {
			that.width = (data[4] * 256 + data[5]);
			that.height = (data[6] * 256 + data[7]);
			that.initBuffers();
		}
	};

	JSMPEG[PROTOTYPE].receiveSocketMessage = function( event ) {

		var that = this;

		var messageData = new Uint8Array(event.data);

		if( !that.sequenceStarted ) {
			that.decodeSocketHeader(messageData);
		}

		var current = that.buffer;
		var next = that.nextPictureBuffer;

		if( next.writePos + messageData.length > next.length ) {
			next.lastWriteBeforeWrap = next.writePos;
			next.writePos = 0;
			next.index = 0;
		}
		
		next.bytes.set( messageData, next.writePos );
		next.writePos += messageData.length;

		var startCode = 0;
		while( true ) {
			startCode = next.findNextMPEGStartCode();
			if( 
				startCode == BitReader.NOT_FOUND ||
				((next.index >> 3) > next.writePos)
			) {
				// We reached the end with no picture found yet; move back a few bytes
				// in case we are at the beginning of a start code and exit.
				next.index = Math.max((next.writePos-3), 0) << 3;
				return;
			}
			else if( startCode == START_PICTURE ) {
				break;
			}
		}

		// If we are still here, we found the next picture start code!

		
		// Skip picture decoding until we find the first intra frame?
		if( that.waitForIntraFrame ) {
			next.advance(10); // skip temporalReference
			if( next.getBits(3) == PICTURE_TYPE_I ) {
				that.waitForIntraFrame = false;
				next.chunkBegin = (next.index-13) >> 3;
			}
			return;
		}

		// Last picture hasn't been decoded yet? Decode now but skip output
		// before scheduling the next one
		if( !that.currentPictureDecoded ) {
			that.decodePicture(DECODE_SKIP_OUTPUT);
		}

		
		// Copy the picture chunk over to 'this.buffer' and schedule decoding.
		var chunkEnd = ((next.index) >> 3);

		if( chunkEnd > next.chunkBegin ) {
			// Just copy the current picture chunk
			current.bytes.set( next.bytes.subarray(next.chunkBegin, chunkEnd) );
			current.writePos = chunkEnd - next.chunkBegin;
		}
		else {
			// We wrapped the nextPictureBuffer around, so we have to copy the last part
			// till the end, as well as from 0 to the current writePos
			current.bytes.set( next.bytes.subarray(next.chunkBegin, next.lastWriteBeforeWrap) );
			var written = next.lastWriteBeforeWrap - next.chunkBegin;
			current.bytes.set( next.bytes.subarray(0, chunkEnd), written );
			current.writePos = chunkEnd + written;
		}

		current.index = 0;
		next.chunkBegin = chunkEnd;

		// Decode!
		that.currentPictureDecoded = false;
		requestAnimationFrame( that.scheduleDecoding.bind(that), that.canvas );
	};

	JSMPEG[PROTOTYPE].scheduleDecoding = function() {
		var that = this;
		that.decodePicture();
		that.currentPictureDecoded = true;
	};


}( JSMPEG ));

















