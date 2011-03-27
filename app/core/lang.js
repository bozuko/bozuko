var sprintf = require('sprintf').sprintf,
    vsprintf = require('sprintf').vsprintf
    ;
    

exports.translate = function(){
    var args = Array.prototype.slice.call(arguments);
    if( args.length < 2 ){
        throw Bozuko.error('Bozuko.lang_not_enough_args');
    }
    var lang = args.shift() || 'en';
    var full_path = args.shift();
    var parts = full_path.split('/');
    var key = parts.pop();
    var path = parts.length > 0 ? parts.join('/') : 'bozuko';
    var mod=null;
    try{
        try{
            mod = Bozuko.require('lang/'+lang+'/'+path);
        }
        catch(e){
            mod = Bozuko.require('lang/en/'+path);
        }
    }
    catch(e){
        throw Bozuko.error('Bozuko.lang_bad_path', full_path);
    }
    try{
        if( !mod[key] ) throw "Untranslated";
        return vsprintf( mod[key], args);
    }catch(e){
        console.log('Untranslated string ['+full_path+']');
        return key;
    }
};
