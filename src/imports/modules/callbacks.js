// Callbacks

(function( JSMPEG ) {


	JSMPEG[PROTOTYPE].onload = function( callback ) {
		var that = this;
		return that.when( ONLOAD , callback );
	};


	JSMPEG[PROTOTYPE].timing = function( callback ) {
		var that = this;
		return that.when( TIMING , callback );
	};


	JSMPEG[PROTOTYPE].tic = function( callback ) {
		var that = this;
		return that.when( TIC , callback );
	};


	JSMPEG[PROTOTYPE].ondecode = function( callback ) {
		var that = this;
		return that.when( DECODE_FRAME , callback );
	};


	JSMPEG[PROTOTYPE].onplay = function( callback ) {
		var that = this;
		return that.when( PLAY , callback );
	};


	JSMPEG[PROTOTYPE].onpause = function( callback ) {
		var that = this;
		return that.when( PAUSE , callback );
	};


	JSMPEG[PROTOTYPE].onstop = function( callback ) {
		var that = this;
		return that.when( STOP , callback );
	};


	JSMPEG[PROTOTYPE].end = function( callback ) {
		var that = this;
		return that.when( END , callback );
	};


}( JSMPEG ));
















