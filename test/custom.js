(function() {


    var AudioURL = 'video/test3_lg.' + (AudioStream.isIos() ? 'm4a' : 'mp3') + '?r=' + Date.now();
    var VideoURL = 'video/test3_lg.mpg?r=' + Date.now();

    var jsmpeg = new JSMPEG( '#video' , {
        audio: AudioURL,
        video: VideoURL,
        autoplay: true,
        waitForLock: true
    })
    .when( 'loading' , function( e , percent ) {
        console.log( e.type , percent );
    })
    .when( 'ready' , function( e ) {
        jsmpeg.container.classList.add( 'ready' );
        console.log(e.type);
    })
    .when( 'error' , function( e , err ) {
        console.log(e.type,err);
    })
    .when( 'play' , function( e ) {
        console.log(e.type);
    })
    .when( 'pause' , function( e ) {
        console.log(e.type);
    })
    .when( 'stop' , function( e ) {
        console.log(e.type);
    })
    .when( 'decodeFrame' , function( e , canvas ) {
        //console.log(e.type,canvas);
    })
    .when( 'timing' , function( e , elapsedMicro , elapsed ) {
        //console.log(e.type,elapsedMicro,elapsed);
    })
    .when( 'tic' , function( e , elapsedMacro , elapsed ) {
        console.log(e.type,elapsedMacro,elapsed);
    })
    .when( 'end' , function( e ) {
        console.log(e.type);
    });

    console.log(jsmpeg);

    var play = document.querySelector( '#play' );
    var stop = document.querySelector( '#stop' );
    var pause = document.querySelector( '#pause' );

    play.addEventListener( 'click' , function( e ) {
        jsmpeg.play();
    });

    stop.addEventListener( 'click' , function( e ) {
        jsmpeg.stop();
    });

    pause.addEventListener( 'click' , function( e ) {
        jsmpeg.pause();
    });


}());




















