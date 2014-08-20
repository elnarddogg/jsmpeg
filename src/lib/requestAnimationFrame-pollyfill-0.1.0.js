/*! window.requestAnimationFrame Polyfill - 0.1.0 - Bernard McManus - 2014-08-04 */

window.requestAnimationFrame = (function( window , Date , setTimeout , clearTimeout ) {


    var name = 'equestAnimationFrame';
    var initTime = Date.now();


    function timestamp() {
        return Date.now() - initTime;
    }
    
    
    return (
        window['r' + name] ||
        window['webkitR' + name] ||
        window['mozR' + name] ||
        window['oR' + name] ||
        window['msR' + name] ||
        function( callback ) {
            var timeout = setTimeout(function() {
                callback( timestamp() );
                clearTimeout( timeout );
            }, ( 1000 / 60 ));
        }
    ).bind( null );

    
}( window , Date , setTimeout , clearTimeout ));




























