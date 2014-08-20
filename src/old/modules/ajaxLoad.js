// Loading via Ajax

(function( BitReader , JSMPEG ) {


	JSMPEG[PROTOTYPE].load = function( url ) {
		this.url = url;

		var request = new XMLHttpRequest();
		var that = this;
		request.onreadystatechange = function() {		
			if( request.readyState == request.DONE && request.status == 200 ) {
				that.loadCallback(request.response);
			}
		};
		request.onprogress = this.updateLoader.bind(this);

		request.open('GET', url);
		request.responseType = "arraybuffer";
		request.send();
	};

	JSMPEG[PROTOTYPE].updateLoader = function( ev ) {
		var 
			p = ev.loaded / ev.total,
			w = this.canvas.width,
			h = this.canvas.height,
			ctx = this.canvasContext;

		ctx.fillStyle = '#222';
		ctx.fillRect(0, 0, w, h);
		ctx.fillStyle = '#fff';
		ctx.fillRect(0, h - h*p, w, h*p);
	};
		
	JSMPEG[PROTOTYPE].loadCallback = function(file) {
		var time = Date.now();
		this.buffer = new BitReader(file);
		
		this.findStartCode(START_SEQUENCE);
		this.firstSequenceHeader = this.buffer.index;
		this.decodeSequenceHeader();

		// Load the first frame
		this.nextFrame();
		
		if( this.autoplay ) {
			this.play();
		}

		if( this.externalLoadCallback ) {
			this.externalLoadCallback(this);
		}
	};


}( BitReader , JSMPEG ));

















