(function() {


    Require.setManifestPath( 'http://bmcmanus.cs.sandbox.millennialmedia.com/jquery.hx/cdn/manifest.json' );
    Require.load( 'Solace' , function() {


        //Solace.lineLimit = 10;

        var AudioURL = 'video/test3_lg.' + (AudioStream.isIos() ? 'm4a' : 'mp3');
        var VideoURL = 'video/test3_lg.mpg';

        var jsmpeg = new JSMPEG( '#video' , {
            audio: (AudioURL + '?r=' + Date.now()),
            video: (VideoURL + '?r=' + Date.now()),
            //autoplay: true
        })
        .when( 'loading' , function( e , percent ) {
            //Solace.log( e.type , percent , { color: 'red' });
        })
        .when( 'ready' , function( e ) {

            console.log(e.type,arguments);

            jsmpeg.container.classList.add( 'ready' );

            /*setTimeout(function() {
                jsmpeg.nextFrame();
            }, 1);*/

            /*setTimeout(function() {
                jsmpeg.pause();
            }, 2000);

            setTimeout(function() {
                jsmpeg.play();
            }, 4000);*/

            /*setTimeout(function() {
                jsmpeg.setFPS( 100 );
            }, 2400);

            setTimeout(function() {
                jsmpeg.setFPS( 150 );
            }, 2500);

            setTimeout(function() {
                jsmpeg.setFPS( null );
            }, 10000);*/
        })
        .when( 'error' , function( e ) {
            console.log(e.type,arguments);
        })
        .when( 'play' , function( e ) {
            console.log(e.type,arguments);
        })
        .when( 'pause' , function( e ) {
            console.log(e.type,arguments);
        })
        .when( 'decode' , function( e ) {
            //console.log(e.type,arguments);
        })
        .when( 'timing' , function( e ) {
            //console.log(e.type,arguments);
        })
        .when( 'tic' , function( e , elapsedMacro , elapsed ) {
            console.log(e.type,elapsedMacro,elapsed/*,Math.round((elapsed/jsmpeg.duration) * 100)*/);
            //console.log(e.type,arguments);
        })
        .when( 'stop' , function( e ) {
            console.log(e.type,arguments);
        })
        .when( 'end' , function( e ) {
            console.log(e.type,arguments);
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
    });

}());




















