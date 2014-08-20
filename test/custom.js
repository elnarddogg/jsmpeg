(function() {


    //var VideoURL = 'video/big_buck_bunny.mpg?r=' + Date.now();
    var VideoURL = '/big-buck-bunny.mpg?r=' + Date.now();


    var container = document.querySelector( '#canvas' );
    var canvas = document.querySelector( '#video' );
    var play = document.querySelector( '#play' );
    var stop = document.querySelector( '#stop' );

    var bcr = canvas.getBoundingClientRect();
    canvas.setAttribute( 'width' , bcr.width );
    canvas.setAttribute( 'height' , bcr.height );

    var jsmpeg = new JSMPEG( VideoURL , {
        canvas: canvas,
        autoplay: true
    })
    .onload(function () {

        container.classList.add( 'ready' );

        play.addEventListener( 'click' , function( e ) {
            jsmpeg.play();
        });

        stop.addEventListener( 'click' , function( e ) {
            jsmpeg.stop();
        });
    });

    

}());




















