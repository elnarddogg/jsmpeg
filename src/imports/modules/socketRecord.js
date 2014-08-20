// Recording from WebSockets


	JSMPEG[PROTOTYPE].isRecording = false;
	JSMPEG[PROTOTYPE].recorderWaitForIntraFrame = false;
	JSMPEG[PROTOTYPE].recordedFrames = 0;
	JSMPEG[PROTOTYPE].recordedSize = 0;
	JSMPEG[PROTOTYPE].didStartRecordingCallback = NULL;

	JSMPEG[PROTOTYPE].recordBuffers = [];

	JSMPEG[PROTOTYPE].canRecord = function(){
		var that = this;
		return (that.client && that.client.readyState == that.client.OPEN);
	};

	JSMPEG[PROTOTYPE].startRecording = function(callback) {

		var that = this;

		if( !that.canRecord() ) {
			return;
		}
		
		// Discard old buffers and set for recording
		that.discardRecordBuffers();
		that.isRecording = true;
		that.recorderWaitForIntraFrame = true;
		that.didStartRecordingCallback = callback || NULL;

		that.recordedFrames = 0;
		that.recordedSize = 0;
		
		// Fudge a simple Sequence Header for the MPEG file
		
		// 3 bytes width & height, 12 bits each
		var wh1 = (that.width >> 4),
			wh2 = ((that.width & 0xf) << 4) | (that.height >> 8),
			wh3 = (that.height & 0xff);
		
		that.recordBuffers.push(new Uint8Array([
			0x00, 0x00, 0x01, 0xb3, // Sequence Start Code
			wh1, wh2, wh3, // Width & height
			0x13, // aspect ratio & framerate
			0xff, 0xff, 0xe1, 0x58, // Meh. Bitrate and other boring stuff
			0x00, 0x00, 0x01, 0xb8, 0x00, 0x08, 0x00, // GOP
			0x00, 0x00, 0x00, 0x01, 0x00 // First Picture Start Code
		]));
	};

	JSMPEG[PROTOTYPE].recordFrameFromCurrentBuffer = function() {

		var that = this;

		if( !that.isRecording ) { return; }
		
		if( that.recorderWaitForIntraFrame ) {
			// Not an intra frame? Exit.
			if( that.pictureCodingType != PICTURE_TYPE_I ) { return; }
		
			// Start recording!
			that.recorderWaitForIntraFrame = false;
			if( that.didStartRecordingCallback ) {
				that.didStartRecordingCallback( that );
			}
		}
		
		that.recordedFrames++;
		that.recordedSize += that.buffer.writePos;
		
		// Copy the actual subrange for the current picture into a new Buffer
		that.recordBuffers.push(new Uint8Array(that.buffer.bytes.subarray(0, that.buffer.writePos)));
	};

	JSMPEG[PROTOTYPE].discardRecordBuffers = function() {
		var that = this;
		that.recordBuffers = [];
		that.recordedFrames = 0;
	};

	JSMPEG[PROTOTYPE].stopRecording = function() {
		var that = this;
		var blob = new Blob(that.recordBuffers, {type: 'video/mpeg'});
		that.discardRecordBuffers();
		that.isRecording = false;
		return blob;
	};

















