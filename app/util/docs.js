
/**
 * Docify a transfer object by key
 */
var ignoreTypes = ['Array','String','Object','Boolean','Number','Integer','Mixed','Date'];

function buffer(string, spaces){
    var ar = string.split('\n');
    var buffer = '';
    if( typeof spaces != 'string' ) for(var i=0; i<spaces; i++) buffer+=' ';
    else buffer = spaces;
    ar.forEach(function(line, i){
        ar[i] = buffer+line;
    });
    return ar.join('\n');
}

function create_link(type, spaces){
    spaces+= '<span style="color:#999;">|</span>';
    var link = '<span class="expander"><a class="trigger" href="#/objects/'+type+'">"'+type+'"</a>';
    link+= '<span class="content">\n'+buffer(docify(type), spaces)+'</span></span>';
    return link;
}

function docify(key){
    
    var transfer = Bozuko.transfer(key);
    if( !transfer ) return '';
    var json = JSON.stringify( transfer.def, null, '  ' );
    
    
    json = json.replace(/(\n(\s*)\"(\w+)\"\s*:\s*)("\w+")/gi, function(match, begin, spaces, name, type){
        type = type.replace(/"/g,'');
        if( ~ignoreTypes.indexOf(type) ) return match;
        return begin+create_link(type, spaces);
    });
    
    json = json.replace(/(\[\s*?\n(\s*))("\w+")(\s*\])/gi, function(match, begin, spaces, type, end){
        type = type.replace(/"/g,'');
        if( ~ignoreTypes.indexOf(type) ) return match;
        return begin+create_link(type, spaces)+end;
    });
    
    return json;
}

module.exports.docify = docify;