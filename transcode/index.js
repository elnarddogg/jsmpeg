(function() {


    var exec = require( 'child_process' ).exec;
    var Promise = require( 'wee-promise' );
    var fs = require( 'fs-extra' );
    var util = require( 'util' );
    var mime = require( 'mime' );
    var colors = require( 'colors' );


    var VIDEO = {
        src: '/Users/bmcmanus/Downloads/test3_lg.mp4',
        dest: '/Users/bmcmanus/jsmpeg/test/video/',
    };


    (function Create( video ) {

        var source = video.src;
        var dir = video.dest;

        var srcName = source.split( '/' ).pop();
        var genericName = srcName.replace( /(\.[0-9a-z]+$)/ , '' );
        var mp3Name = genericName + '.mp3';
        var m4aName = genericName + '.m4a';
        var videoName = genericName + '.mpg';

        var manifest = new Manifest( dir )
            .set( 'video' , videoName )
            .set( 'audio.m4a.main' , m4aName )
            .set( 'audio.m4a.base64' , ( m4aName + '.txt' ))
            .set( 'audio.mp3.main' , mp3Name )
            .set( 'audio.mp3.base64' , ( mp3Name + '.txt' ));

        fs.removeSync( dir );
        fs.ensureDirSync( dir );

        var promises = [

            new Promise(function( resolve , reject ) {
                var dest = dir + mp3Name;
                util.puts(
                    ('transcoding ' + srcName + ' -> ' + (mp3Name).bold + '...').white
                );
                extractAudio( source , dest , function( err , stdout , stderr ) {
                    if (err) {
                        reject([ 'mp3 extraction failed!' , err ]);
                    }
                    else {
                        util.puts(
                            ('  -> mp3 extraction complete.').grey
                        );
                        util.puts(
                            ('  -> base64 encoding mp3...').grey
                        );
                        base64encode( dest , function( err ) {
                            if (err) {
                                reject([ 'mp3 encoding failed!' , err ]);
                            }
                            else {
                                resolve();
                            }
                        });
                    }
                });
            })
            .then(function() {
                util.puts(
                    ('\u2713 mp3 complete.').cyan
                );
            }),

            new Promise(function( resolve , reject ) {
                var dest = dir + m4aName;
                util.puts(
                    ('transcoding ' + srcName + ' -> ' + (m4aName).bold + '...').white
                );
                extractAudio( source , dest , function( err , stdout , stderr ) {
                    if (err) {
                        reject([ 'm4a extraction failed!' , err ]);
                    }
                    else {
                        util.puts(
                            ('  -> m4a extraction complete.').grey
                        );
                        util.puts(
                            ('  -> base64 encoding m4a...').grey
                        );
                        base64encode( dest , function( err ) {
                            if (err) {
                                reject([ 'm4a encoding failed!' , err ]);
                            }
                            else {
                                resolve();
                            }
                        });
                    }
                });
            })
            .then(function() {
                util.puts(
                    ('\u2713 m4a complete.').cyan
                );
            }),

            new Promise(function( resolve , reject ) {
                var dest = dir + videoName;
                util.puts(
                    ('transcoding ' + srcName + ' -> ' + (videoName).bold + '...').white
                );
                transcode( source , dest , function( err , stdout , stderr ) {
                    if (err) {
                        reject([ 'video transcoding failed!' , err ]);
                    }
                    else {
                        resolve();
                    }
                });
            })
            .then(function() {
                util.puts(
                    ('\u2713 mpg complete.').cyan
                );
            })
        ];

        Promise.all( promises ).then(function() {
            fs.writeJson( manifest.path , manifest , function() {
                util.puts(
                    ('\u2713 done\n').bold.green
                );
            });
        });

        Promise.all( promises ).catch(function( args ) {
            var msg = args[0];
            var err = args[1];
            util.puts(
                ( msg ).bold.red
            );
            util.puts(
                ('ERROR: ' + err.message).yellow
            );
        });

    }( VIDEO ));


    function extractAudio( video , audio , callback ) {

        callback = callback || function() {};

        var template = 'ffmpeg -i [video] -vn [audio]';

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


    function base64encode( src , callback ) {

        var dest = src + '.txt';
        var mimestr = mime.lookup( src );

        var promises = [

            new Promise(function( resolve , reject ) {
                var data = 'data:' + mimestr + ';base64,';
                fs.writeFile( dest , data , function( err ) {
                    if (err) {
                        reject( err );
                    }
                    else {
                        resolve();
                    }
                });
            }),

            new Promise(function( resolve , reject ) {
                fs.readFile( src , function( err , data ) {
                    if (err) {
                        reject( err );
                    }
                    else {
                        var base64data = new Buffer( data ).toString( 'base64' );
                        resolve( base64data );
                    }
                });
            })
        ];

        Promise.all( promises ).then(function( args ) {
            var base64data = args[1];
            fs.appendFile( dest , base64data , function( err ) {
                callback( err );
            });
        });

        Promise.all( promises ).catch(function( err ) {
            callback( err );
        });
    }


    function Manifest( dir ) {

        var that = this;

        that.video = null;

        that.audio = {
            m4a: { main : null , base64 : null },
            mp3: { main : null , base64 : null }
        };

        Object.defineProperties( that , {
            dir: {
                value: dir
            },
            path: {
                value: (dir + 'manifest.json')
            }
        });

        that.set = function( key , val ) {

            var that = this;
            var target = that;
            var targetPath = key.split( '.' );

            key = targetPath.pop();

            targetPath.forEach(function( childKey ) {
                target = target[childKey];
            });

            target[key] = that.dir + val;

            return that;
        };
    }


}());





















