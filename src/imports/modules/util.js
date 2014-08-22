// Utilities

(function( JSMPEG ) {


    JSMPEG[PROTOTYPE].readCode = function(codeTable) {
        var that = this;
        var state = 0;
        do {
            state = codeTable[state + that.buffer.getBits(1)];
        } while( state >= 0 && codeTable[state] != 0 );
        return codeTable[state+2];
    };

    JSMPEG[PROTOTYPE].findStartCode = function( code ) {
        var that = this;
        var current = 0;
        while( true ) {
            current = that.buffer.findNextMPEGStartCode();
            if( current == code || current == BitReader.NOT_FOUND ) {
                return current;
            }
        }
        return BitReader.NOT_FOUND;
    };

    JSMPEG[PROTOTYPE].fillArray = function(a, value) {
        for( var i = 0, length = a.length; i < length; i++ ) {
            a[i] = value;
        }
    };


}( JSMPEG ));

















