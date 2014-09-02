// Controls

(function( JSMPEG ) {


    JSMPEG[PROTOTYPE].play = function() {

        var that = this;

        if (that.playing === 1) {
            return;
        }

        that.targetTime = performance.now();
        that.playing = 1;

        var audio = that.audio;

        if (audio && audio.playable) {

            var audioStartEvent = (that.waitForLock && !audio.playstate) ? 'start' : 'connect';

            audio.once( audioStartEvent , function( e , offset ) {
                that.scheduleNextFrame();
            });
        }
        else {
            that.scheduleNextFrame();
        }

        that.happen( PLAY );
        
        return that;
    };


    JSMPEG[PROTOTYPE].pause = function() {
        var that = this;
        if (that.playing < 2) {
            that.once( PLAY , performance.now() , incrementTBuff );
            that.playing = 2;
            that.happen( PAUSE );
        }
        return that;
    };


    JSMPEG[PROTOTYPE].stop = function() {
        var that = this;
        if (that.playing > 0) {
            if (that.buffer) {
                that.buffer.index = that.firstSequenceHeader;
            }
            if (that.client) {
                that.client.close();
                that.client = NULL;
            }
            that.playing = 0;
            that.dispel( NULL , incrementTBuff );
            that.happen( STOP );
        }
        return that;
    };


    JSMPEG[PROTOTYPE].setFPS = function( fps ) {
        var that = this;
        if (fps !== that.fps) {
            that.scheduleFPSChange( fps );
        }
        return that;
    };


    function incrementTBuff( e , pauseStart ) {
        var that = e.target;
        that._incrementTBuff( pauseStart - performance.now() );
    }


}( JSMPEG ));
















