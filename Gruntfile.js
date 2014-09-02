module.exports = function( grunt ) {


    var HTTPD_NODE_PORT = 8888;


    var httpd = require( 'httpd-node' );
    var fs = require( 'fs-extra' );


    httpd.environ( 'root' , __dirname );


    var Main = [ 'src/index.js' ];


    var Includes = [
        'src/external/audiostream-0.1.0.min.js',
        'src/external/wee-promise-0.1.3.min.js'
    ];


    var Build = Includes.concat( Main );


    var Imports = {
        Constants: 'src/imports/constants.js',
        BitReader: 'src/imports/bitreader.js',
        Controls: 'src/imports/modules/controls.js',
        SocketStream: 'src/imports/modules/socketStream.js',
        SocketRecord: 'src/imports/modules/socketRecord.js',
        AjaxLoad: 'src/imports/modules/ajaxLoad.js',
        Util: 'src/imports/modules/util.js',
        Sequence: 'src/imports/modules/sequence.js',
        Picture: 'src/imports/modules/picture.js',
        Slice: 'src/imports/modules/slice.js',
        Macroblock: 'src/imports/modules/macroblock.js',
        Block: 'src/imports/modules/block.js'
    };


    grunt.initConfig({

        pkg: grunt.file.readJSON( 'package.json' ),

        'git-describe': {
            'options': {
                prop: 'git-version'
            },
            dist : {}
        },

        jshint : {
            all: [ 'Gruntfile.js' , 'src/**/*.js' , '!src/external/*' ]
        },

        clean: {
            build: [ '<%= pkg.name %>-*.js' , 'live' ],
            temp: [ 'temp' ]
        },

        replace: {
            debug: {
                options: {
                    patterns: [
                        {
                            match: /<\!(\-){2}\s\[BUILD\]\s(\-){2}>/,
                            replacement: '<script src=\"../<%= BUILD %>\"></script>'
                        },
                        {
                            match: /(\/\*){0,1}\[SERVER_ADDR\](\*\/){0,1}/g,
                            replacement: function() {
                                return 'http://'
                                    + (grunt.config.get( 'HOST' ) || 'localhost')
                                    + ':' + grunt.config.get( 'PORT' ) + '/';
                            }
                        }
                    ]
                },
                files: [{
                    src: 'live/index.html',
                    dest: 'live/index.html'
                }]
            },
            prod: {
                options: {
                    patterns: [
                        {
                            match: /(\"version\")(.*?)(\")(.{1,}?)(\")/i,
                            replacement: '\"version\": \"<%= pkg.version %>\"'
                        },
                        {
                            match: /(\"main\")(.*?)(\")(.{1,}?)(\")/i,
                            replacement: '\"main\": \"<%= BUILD %>\"'
                        }
                    ]
                },
                files: [
                    {
                        src: 'package.json',
                        dest: 'package.json'
                    },
                    {
                        src: 'bower.json',
                        dest: 'bower.json'
                    }
                ]
            }
        },

        watch: {
            debug: {
                files: [ 'Gruntfile.js' , 'src/**/*.js' , 'test/*' ],
                tasks: [ '_debug' ]
            },
            debugProd: {
                files: [ 'Gruntfile.js' , 'src/**/*.js' , 'test/*' ],
                tasks: [ '_debugProd' ]
            }
        },

        concat: {
            imports: {
                src: Build,
                dest: 'temp/<%= pkg.name %>.js'
            },
            dev: {
                options: {
                    banner : '/*! <%= pkg.name %> - <%= pkg.version %> - <%= pkg.author.name %> - <%= grunt.config.get( \'git-hash\' ) %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n\n\n'
                },
                src: 'temp/<%= pkg.name %>.js',
                dest: '<%= BUILD %>'
            }
        },

        uglify: {
            options: {
                banner : '/*! <%= pkg.name %> - <%= pkg.version %> - <%= pkg.author.name %> - <%= grunt.config.get( \'git-hash\' ) %> - <%= grunt.template.today("yyyy-mm-dd") %> */\n'
            },
            release: {
                files: {
                    '<%= BUILD %>' : 'temp/<%= pkg.name %>.js'
                }
            }
        }
    });


    [
        'grunt-contrib-jshint',
        'grunt-contrib-clean',
        'grunt-git-describe',
        'grunt-replace',
        'grunt-contrib-concat',
        'grunt-contrib-uglify',
        'grunt-contrib-watch'
    ]
    .forEach( grunt.loadNpmTasks );


    grunt.registerTask( 'defineBuildSrc' , function() {

        var name = grunt.config.get( 'pkg.name' );
        var version = grunt.config.get( 'pkg.version' );
        var type = process.argv[2] || '';
        var src = name + '-' + version;
        var ext = '.js';

        if (!type || (/debugProd/).test( type )) {
            ext = '.min.js'
        }

        grunt.config.set( 'BUILD' , ( src + ext ));
    });


    grunt.registerTask( 'imports' , function() {

        var tempPath = 'temp/' + grunt.config.get( 'pkg.name' ) + '.js';
        var temp = fs.readFileSync( tempPath , 'utf-8' );

        var re_line = /(\/{2})([^a-z,A-Z,0-9,\~]*)\@IMPORT+.*/;
        var re_key = /.*\:+(\W*)/;
        var match, safe = 0;

        while (match !== null && safe < 100) {
            match = re_line.exec( temp );
            if (match) {
                temp = replaceImport( temp , match[0] );
            }
            safe++;
        }

        fs.writeFileSync( tempPath , temp );

        function replaceImport( temp , line ) {
            var key = (line || '').replace( re_key , '' );
            var src = Imports[key];
            var text = '';
            if (src && fs.existsSync( src )) {
                text = fs.readFileSync( src , 'utf-8' );
            }
            return temp.replace( re_line , text );
        }
    });


    grunt.registerTask( 'createTemp' , function() {
        fs.ensureDirSync( 'temp/' );
    });


    grunt.registerTask( 'getIP' , function() {

        var os = require( 'os' );
        var ifaces = os.networkInterfaces();
        var local = '127.0.0.1';
        var ip = local;

        for (var dev in ifaces) {
            ifaces[dev].forEach(function( details ) {
                if ((/ipv4/i).test( details.family ) && details.address !== local) {
                    ip = details.address;
                }
            });
        }

        grunt.config.set( 'HOST' , ip );
    });


    grunt.registerTask( 'initServer' , function() {

        var server = new httpd({ port : HTTPD_NODE_PORT });

        server.setHttpDir( 'default' , '/' );
        server.start();

        grunt.config.set( 'PORT' , server.port );
    });


    grunt.registerTask( 'createLive' , function() {
        var src = __dirname + '/test';
        var dest = __dirname + '/live';
        fs.copySync( src , dest );
    });


    grunt.registerTask( 'createHash' , function() {

        grunt.task.requires( 'git-describe' );

        var rev = grunt.config.get( 'git-version' );
        var matches = rev.match( /(\-{0,1})+([A-Za-z0-9]{7})+(\-{0,1})/ );

        var hash = matches
            .filter(function( match ) {
                return match.length === 7;
            })
            .pop();

        if (matches && matches.length > 1) {
            grunt.config.set( 'git-hash' , hash );
        }
        else{
            grunt.config.set( 'git-hash' , rev );
        }
    });


    grunt.registerTask( 'always' , [
        //'jshint',
        'defineBuildSrc',
        'clean:build',
        'git-describe',
        'createHash',
        'createTemp',
        'concat:imports',
        'imports'
    ]);

    grunt.registerTask( 'default' , [
        'always',
        'replace:prod',
        'uglify',
        'clean:temp'
    ]);

    grunt.registerTask( 'dev' , [
        'always',
        'concat:dev',
        'clean:temp'
    ]);

    grunt.registerTask( '_debug' , [
        'always',
        'concat:dev',
        'createLive',
        'replace:debug',
        'clean:temp'
    ]);

    grunt.registerTask( 'debug' , [
        'getIP',
        'initServer',
        '_debug',
        'watch:debug'
    ]);

    grunt.registerTask( '_debugProd' , [
        'always',
        'uglify',
        'createLive',
        'replace:debug',
        'clean:temp'
    ]);

    grunt.registerTask( 'debugProd' , [
        'getIP',
        'initServer',
        '_debugProd',
        'watch:debugProd'
    ]);
};












