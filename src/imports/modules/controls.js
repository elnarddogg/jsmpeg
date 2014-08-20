// Controls


	JSMPEG[PROTOTYPE].play = function() {
		var that = this;
		if( that.playing ) { return; }
		that.targetTime = Date.now();
		that.playing = true;
		that.scheduleNextFrame();
	};

	JSMPEG[PROTOTYPE].pause = function() {
		var that = this;
		that.playing = false;
	};

	JSMPEG[PROTOTYPE].stop = function() {
		var that = this;
		if( that.buffer ) {
			that.buffer.index = that.firstSequenceHeader;
		}
		that.playing = false;
		if( that.client ) {
			that.client.close();
			that.client = NULL;
		}
	};
















