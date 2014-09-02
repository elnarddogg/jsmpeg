// Loading via Ajax

(function( JSMPEG ) {


    JSMPEG[PROTOTYPE].loadVideo = function( url , resolve , reject ) {

        var that = this;
        var request = new XMLHttpRequest();

        request.onload = function( e ) {
            that.loadCallback( request.response );
            resolve();
        };

        request.onerror = function( e ) {
            reject( e );
        };

        request.onprogress = function( e ) {
            that.happen( LOADING , ( e.loaded / e.total ));
        };

        request.open( 'GET' , url , true );
        request.responseType = 'arraybuffer';
        request.send();
    };

        
    JSMPEG[PROTOTYPE].loadCallback = function(file) {

        var that = this;
        
        that.buffer = new BitReader(file);
        that.findStartCode(START_SEQUENCE);
        that.firstSequenceHeader = that.buffer.index;
        that.decodeSequenceHeader();
    };


}( JSMPEG ));

















