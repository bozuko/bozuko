var markdown    = require('markdown-js'),
    path        = require('path'),
    fs          = require('fs')
    ;
    
var contentDir = Bozuko.dir+'/content';

module.exports = {
    get : function(file, _default){
        file = contentDir+'/'+file;
        if( !path.existsSync(file) ) return _default;
        
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