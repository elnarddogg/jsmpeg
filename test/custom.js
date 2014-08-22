(function() {


    Require.setManifestPath( 'http://bmcmanus.cs.sandbox.millennialmedia.com/jquery.hx/cdn/manifest.json' );
    Require.load( 'Solace' , function() {


        Solace.lineLimit = 10;


        var AudioURL = 'video/test3.mp3';
        var VideoURL = 'video/test3.mpg';


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


        var jsmpeg = new JSMPEG( '#video' , {
            audio: (AudioURL + '?r=' + Date.now()),
            video: (VideoURL + '?r=' + Date.now()),
            autoplay: true
        })
        .ready(function( e ) {

            console.log(e.type,arguments);

            jsmpeg.container.classList.add( 'ready' );

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
        .error(function( e ) {
            console.log(e.type,arguments);
        })
        .onplay(function( e ) {
            console.log(e.type,arguments);
        })
        .onpause(function( e ) {
            console.log(e.type,arguments);
        })
        .ondecode(function( e ) {
            //console.log(e.type,arguments);
        })
        .timing(function( e ) {
            //console.log(e.type,arguments);
        })
        .tic(function( e , elapsedMacro , elapsed ) {
            console.log(e.type,elapsedMacro,elapsed/*,Math.round((elapsed/jsmpeg.duration) * 100)*/);
            //console.log(e.type,arguments);
        })
        .onstop(function( e ) {
            console.log(e.type,arguments);
        })
        .end(function( e ) {
            console.log(e.type,arguments);
        });

        console.log(jsmpeg);
    });

}());




















