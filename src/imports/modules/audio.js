// Audio


(function( JSMPEG ) {


    var AudioContext = window.webkitAudioContext || window.AudioContext;


    JSMPEG[PROTOTYPE].loadAudio = function( url , resolve , reject ) {
        
        var that = this;
        var request = new XMLHttpRequest();

        request.onload = function( e ) {
            that._unlockAudio();
            that._createAudio( request.response , resolve );
        };

        request.onerror = function( e ) {
            reject( e );
        };

        request.open( 'GET' , url , true );
        request.responseType = 'arraybuffer';
        request.send();

        that
        .dispel( NULL , that._audioEvent )
        .when([ PLAY , STOP , PAUSE , TIMING , TIC , AUDIO_READY ] , that._audioEvent );
    };


    JSMPEG[PROTOTYPE]._unlockAudio = function() {

        var that = this;

        if (that.isIos) {
            window.addEventListener( 'touchstart' , function ts( e ) {
                if (that.canPlayAudio) {
                    var audio = that.audio;
                    that.happen( AUDIO_READY , audio );
                    //audio.noteOn( 0 );
                    window.removeEventListener( 'touchstart' , ts );
                }
            });
        }
        else {
            that.audioLocked = false;
        }
    };


    JSMPEG[PROTOTYPE]._createAudio = function( data , callback ) {

        callback = callback || function() {};
        
        var that = this;
        var audioContext = new AudioContext();
        var audio = audioContext.createBufferSource();

        that.audioData = data || that.audioData;

        audioContext.decodeAudioData( that.audioData , function( buffer ) {
            audio.buffer = buffer;
            //audio.start( 0 );
            //callback();
            if (!that.audioLocked) {
                that.happen( AUDIO_READY , audio );
            }
            callback();
            console.log(audio);
        });

        that.audio = audio;
        that.audioContext = audioContext;
    };


    JSMPEG[PROTOTYPE]._destroyAudio = function() {
        
        var that = this;
        var audio = that.audio;

        audio.disconnect();
        audio.stop( 0 );

        that.audio = null;
        that.audioContext = null;
    };


    JSMPEG[PROTOTYPE]._audioEvent = function( e ) {
        
        var that = this;
        var args = arguments;
        var audio;
        
        switch (e.type) {

            case AUDIO_READY:
                audio = args[1];
                audio.start( 0 );
                that._incrementTBuff(
                     Math.round( that.audioContext.currentTime * 1000 )
                );
            break;

            case TIC:
                var video = that.elapsed;
                var audio = that.elapsedAudio;
                Solace.log( 'video' , video , { color: 'gray' });
                Solace.log( 'audio' , audio , { color: 'gray' });
                Solace.log( 'diff' , ( audio - video ) , { color: 'cyan' });
                //console.log('tic');
            break;

            case TIMING:
                //console.log('timing');
            break;

            case PLAY:
                that._playAudio();
            break;

            case STOP:
                that._stopAudio();
            break;

            case PAUSE:
                that._pauseAudio();
            break;
        }
    };


    JSMPEG[PROTOTYPE]._playAudio = function() {
        
        var that = this;

        console.log('start audio');

        if (that.canPlayAudio) {
            connect();
        }
        else {
            that._createAudio( null , connect );
        }

        function connect() {
            var audio = that.audio;
            var audioContext = that.audioContext;
            audio.connect( audioContext.destination );
        }
    };


    JSMPEG[PROTOTYPE]._stopAudio = function() {
        
        var that = this;
        var audio = that.audio;

        console.log('stop audio');

        if (that.canPlayAudio) {
            that._destroyAudio();
        }
    };


    JSMPEG[PROTOTYPE]._pauseAudio = function() {
        
        var that = this;
        var audio = that.audio;

        console.log('pause audio');

        if (that.canPlayAudio) {
            audio.disconnect();
        }
    };


}( JSMPEG ));
















