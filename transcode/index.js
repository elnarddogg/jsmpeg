(function() {


    var exec = require( 'child_process' ).exec;
    var Promise = require( 'es6-promise' ).Promise;
    var fs = require( 'fs-extra' );
    var util = require( 'util' );


    var VIDEO = {
        src: '/Users/bmcmanus/Downloads/big_buck_bunny.mp4',
        dest: '/Users/bmcmanus/jsmpeg/test/video/',
    };


    (function Create( video ) {

        var source = video.src;
        var dir = video.dest;

        var srcName = source.split( '/' ).pop();
        var genericName = srcName.replace( /(\.[0-9a-z]+$)/ , '' );
        var audioName = genericName + '.mp3';
        var videoName = genericName + '.mpg';


        fs.removeSync( dir );
        fs.ensureDirSync( dir );

        util.puts( 'transcoding ' + srcName + '...' );

        var promises = [

            new Promise(function( resolve , reject ) {
                var dest = dir + audioName;
                util.puts( 'extracting audio to ' + audioName + '...' );
                extractAudio( source , dest , function( err , stdout , stderr ) {
                    if (err) {
                        console.log( err );
                        reject();
                    }
                    else {
                        util.puts( 'audio complete.' );
                        resolve();
                    }
                });
            }),

            new Promise(function( resolve , reject ) {
                var dest = dir + videoName;
                util.puts( 'transcoding video to ' + videoName + '...' );
                transcode( source , dest , function( err , stdout , stderr ) {
                    if (err) {
                        console.log( err );
                        reject();
                    }
                    else {
                        util.puts( 'video complete.' );
                        resolve();
                    }
                });
            })
        ];

        Promise.all( promises ).then(function() {
            util.puts( 'done\n' );
        });

    }( VIDEO ));


    function extractAudio( video , audio , callback ) {

        callback = callback || function() {};

        var template = 'ffmpeg -i [video] [audio]';

        var cmd = template
            .replace( /\[video\]/ , video )
            .replace( /\[audio\]/ , audio );

        exec( cmd , callback );
    }


    function transcode( video , dest , callback ) {

        callback = callback || function() {};

        var template = 'ffmpeg -i [input] -f mpeg1video [output]';

        var cmd = template
            .replace( /\[input\]/ , video )
            .replace( /\[output\]/ , dest );

        exec( cmd , callback );
    }


}());





















