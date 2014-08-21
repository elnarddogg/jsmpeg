// Loading via Ajax

(function( JSMPEG ) {


	JSMPEG[PROTOTYPE].loadVideo = function( url ) {

		if (!url) {
			throw new Error( 'video url is required' );
		}

		var that = this;

		that.url = url;

		var request = new XMLHttpRequest();

		request.onreadystatechange = function() {
			if( request.readyState == request.DONE && request.status == 200 ) {
				that.loadCallback(request.response);
			}
		};

		request.onprogress = that.updateLoader.bind( that );

		request.open( 'GET' , url , true );
		request.responseType = "arraybuffer";
		request.send();
	};

	JSMPEG[PROTOTYPE].updateLoader = function( ev ) {

		var that = this;

		var 
			p = ev.loaded / ev.total,
			w = that.canvas.width,
			h = that.canvas.height,
			ctx = that.canvasContext;

		ctx.fillStyle = '#222';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, h - h*p, w, h*p);
	};
		
	JSMPEG[PROTOTYPE].loadCallback = function(file) {

		var that = this;
		
		that.buffer = new BitReader(file);
		that.findStartCode(START_SEQUENCE);
		that.firstSequenceHeader = that.buffer.index;
		that.decodeSequenceHeader();

		// Load the first frame
		that.nextFrame();
		
		if( that.autoplay ) {
			that.play();
		}

		that.happen( ONLOAD );
	};


}( JSMPEG ));

















