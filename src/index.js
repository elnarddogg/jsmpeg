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
    Object,
    Date,
    XMLHttpRequest,
    Error,
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


    function JSMPEG( selector , opts ) {

        opts = opts || {};

        var that = this;

        MOJO.Construct( that );

        that.autoplay = !!opts.autoplay;
        that.loop = !!opts.loop;
        that.bwFilter = opts.bwFilter || false;

        try {
            that.canvas = createCanvas( selector );
            that.canvasContext = that.canvas.getContext( '2d' );
            that.container = that.canvas.parentNode;
        }
        catch( err ) {
            throw err;
        }

        that.setFPS( opts.fps );
        that._init();

        Object.defineProperties( that , {
            elapsedMacro: {
                get: function() {
                    return Math.floor( that.elapsed / 1000 );
                }
            },
            elapsedMicro: {
                get: function() {
                    return ( that.elapsed % 1000 );
                }
            }
        });

        that.loadVideo( opts.video );

        console.log(that);
    }


    JSMPEG.prototype = MOJO.Create({

        _init: function() {

            var that = this;

            that.customIntraQuantMatrix = new Uint8Array( 64 );
            that.customNonIntraQuantMatrix = new Uint8Array( 64 );
            that.blockData = new Int32Array( 64 );
            that.waitForIntraFrame = true;
            that.socketBufferSize = 512 * 1024; // 512kb each
            that.onlostconnection = NULL;
            that.isRecording = false;
            that.recorderWaitForIntraFrame = false;
            that.recordedFrames = 0;
            that.recordedSize = 0;
            that.didStartRecordingCallback = NULL;
            that.recordBuffers = [];
            that.dcPredictorY;
            that.dcPredictorCr;
            that.dcPredictorCb;
            that.currentY = NULL;
            that.currentCr = NULL;
            that.currentCb = NULL;
            that.currentRGBA = NULL;
            that.pictureCodingType = 0;
            that.forwardY = NULL;
            that.forwardCr = NULL;
            that.forwardCb = NULL;
            that.fullPelForward = false;
            that.forwardFCode = 0;
            that.forwardRSize = 0;
            that.forwardF = 0;
            that.quantizerScale = 0;
            that.sliceBegin = false;
            that.macroblockAddress = 0;
            that.mbRow = 0;
            that.mbCol = 0;
            that.macroblockType = 0;
            that.macroblockIntra = false;
            that.macroblockMotFw = false;
            that.motionFwH = 0;
            that.motionFwV = 0;
            that.motionFwHPrev = 0;
            that.motionFwVPrev = 0;
            that.benchframe = NULL;
            that.pictureRate = 30;
            that.lateTime = 0;
            that.firstSequenceHeader = 0;
            that.targetTime = 0;
            that.lastTime = 0;
            that.now = 0;
            that.elapsed = 0;
            that.lastTic = 0;

            that.when( STOP , function( e ) {
                that.elapsed = 0;
                that.now = 0;
                that.lastTime = 0;
                that.lastTic = 0;
            });
        }
    });


    function createCanvas( selector ) {

        var container = document.querySelector( selector );
        var bcr = container.getBoundingClientRect();
        var canvas = document.createElement( 'canvas' );

        canvas.setAttribute( 'width' , bcr.width );
        canvas.setAttribute( 'height' , bcr.height );
        canvas.style.width = bcr.width + 'px';
        canvas.style.height = bcr.height + 'px';

        container.appendChild( canvas );

        return canvas;
    }


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
    Object,
    Date,
    XMLHttpRequest,
    Error,
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
















