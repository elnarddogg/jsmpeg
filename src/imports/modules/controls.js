// Controls

(function( JSMPEG ) {


    JSMPEG[PROTOTYPE].play = function() {
        var that = this;
        if( that.playing ) { return; }
        that.targetTime = Date.now();
        that.playing = true;
        that.scheduleNextFrame();
        that.happen( PLAY );
        return that;
    };


    JSMPEG[PROTOTYPE].pause = function() {
        var that = this;
        that.once( PLAY , Date.now() , incrementTBuff );
        that.playing = false;
        that.happen( PAUSE );
        return that;
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
        that.dispel( NULL , incrementTBuff );
        that.happen( STOP );
        return that;
    };


    JSMPEG[PROTOTYPE].setFPS = function( fps ) {
        var that = this;
        that.scheduleFPSChange( fps );
        return that;
    };


    function incrementTBuff( e , pauseStart ) {
        var that = e.target;
        that._incrementTBuff( pauseStart - Date.now() );
    }


}( JSMPEG ));
















