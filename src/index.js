// jsmpeg by Dominic Szablewski - phoboslab.org, github.com/phoboslab
//
// Consider this to be under MIT license. It's largely based an an Open Source
// Decoder for Java under GPL, while I looked at another Decoder from Nokia 
// (under no particular license?) for certain aspects.
// I'm not sure if this work is "derivative" enough to have a different license
// but then again, who still cares about MPEG1?
//
// Based on "Java MPEG-1 Video Decoder and Player" by Korandi Zoltan:
// http://sourceforge.net/projects/javampeg1video/
//
// Inspired by "MPEG Decoder in Java ME" by Nokia:
// http://www.developer.nokia.com/Community/Wiki/MPEG_decoder_in_Java_ME


window.JSMPEG = (function(
	window,
	document,
	Date,
	XMLHttpRequest,
	requestAnimationFrame,
	setTimeout,
	ArrayBuffer,
	Int8Array,
	Int16Array,
	Int32Array,
	Uint8Array,
	Uint32Array,
	Blob,
	MOJO
) {


	function JSMPEG( url , opts ) {

		opts = opts || {};

		var that = this;

		MOJO.Construct( that );

		that.benchmark = !!opts.benchmark;
		that.canvas = opts.canvas || document.createElement('canvas');
		that.autoplay = !!opts.autoplay;
		that.loop = !!opts.loop;

		that.externalDecodeCallback = opts.ondecodeframe || NULL;
		that.externalFinishedCallback = opts.onfinished || NULL;
		that.bwFilter = opts.bwFilter || false;

		that.customIntraQuantMatrix = new Uint8Array(64);
		that.customNonIntraQuantMatrix = new Uint8Array(64);
		that.blockData = new Int32Array(64);

		that.canvasContext = that.canvas.getContext('2d');

		that.load(url);

		console.log(that);
	}


	JSMPEG.prototype = MOJO.Create( {} );


	// @IMPORT : Constants
	// @IMPORT : Controls
	//~ @IMPORT : SocketStream
	// @IMPORT : SocketRecord
	// @IMPORT : AjaxLoad
	// @IMPORT : Util
	// @IMPORT : Sequence
	// @IMPORT : Picture
	// @IMPORT : Slice
	// @IMPORT : Macroblock
	// @IMPORT : Block
	// @IMPORT : Callbacks
	// @IMPORT : BitReader
	
	
	return JSMPEG;

	
})(
	window,
	document,
	Date,
	XMLHttpRequest,
	requestAnimationFrame,
	setTimeout,
	ArrayBuffer,
	Int8Array,
	Int16Array,
	Int32Array,
	Uint8Array,
	Uint32Array,
	Blob,
	MOJO
);
















