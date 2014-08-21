(function() {


    var VideoURL = 'video/big_buck_bunny.mpg';


    var play = document.querySelector( '#play' );
    var stop = document.querySelector( '#stop' );


    var jsmpeg = new JSMPEG( '#video' , {
        video: (VideoURL + '?r=' + Date.now()),
        autoplay: true
    })
    .onload(function( e ) {

        jsmpeg.container.classList.add( 'ready' );

        play.addEventListener( 'click' , function( e ) {
            jsmpeg.play();
        });

        stop.addEventListener( 'click' , function( e ) {
            jsmpeg.stop();
        });

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
    .tic(function( e ) {
        console.log(e.type,arguments);
    })
    .onstop(function( e ) {
        console.log(e.type,arguments);
    })
    .end(function( e ) {
        console.log(e.type,arguments);
    });

    

}());




















