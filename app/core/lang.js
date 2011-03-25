var sprintf = require('sprintf').sprintf,
    vsprintf = require('sprintf').vsprintf,
    bozuko = require('bozuko')
    ;
    

exports.translate = function(){
    var args = Array.prototype.slice.call(arguments);
    if( args.length < 2 ){
        throw bozuko.error('bozuko/lang_not_enough_args');
    }
    var lang = args.shift();
    var full_path = args.shift();
    var parts = full_path.split('/');
    var key = parts.pop();
    var path = parts.length > 0 ? parts.join('/') : 'bozuko';
    var mod=null;
    try{
        try{
            mod = bozuko.require('lang/'+lang+'/'+path);
        }
        catch(e){
            mod = bozuko.require('lang/en/'+path);
        }
    }
    catch(e){
        throw bozuko.error('bozuko/lang_bad_path', full_path);
    }
    try{
        if( !mod[key] ) throw "Untranslated";
        return vsprintf( mod[key], args);
    }catch(e){
        console.log('Untranslated string ['+full_path+']');
        return key;
    }
};
