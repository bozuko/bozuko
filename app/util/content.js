var markdown    = require('markdown-js'),
    path        = require('path'),
    fs          = require('fs')
    ;
    
var contentDir = Bozuko.dir+'/content';

module.exports = {
    get : function(file, _default){
        // see if there is a custom content dir
        var custom_dir
          , custom_file
        
        if( (custom_dir = Bozuko.cfg('custom_content_dir')) ){
            custom_file = custom_dir +'/'+file;
        }
        if( path.existsSync(custom_file) ){
            file = custom_file;
        }
        else{
            file = contentDir+'/'+file;
            if( !path.existsSync(file) ) return _default;
        }
        
        var ext = path.extname(file),
            content = '';
        switch(ext){
            
            case '.md':
                content = markdown.parse( fs.readFileSync(file, 'utf-8') );
                break;
            
            default:
                content = fs.readFileSync(file, 'utf-8');
                break;
        }
        return content;
    }
};