Ext.define('Browser.controller.Browser' ,{
    extend: 'Ext.app.Controller',
    
    requires:[
        'Bozuko.lib.Api'
    ],
    
    views: [
        'Browser'
    ],
    
    defaultParams: {
        mobile_version   :'1.0'
    },
    
    refs : [
        {ref: 'browser', selector: 'apibrowser'},
        {ref: 'loginButton', selector: 'apibrowser button[action=login]'},
        {ref: 'requestButton', selector: 'apibrowser button[action=request]'},
        {ref: 'requestForm', selector: 'apibrowser form'},
        {ref: 'historyView', selector: 'apibrowser panel[region=east] dataview'},
        {ref: 'body', selector: 'apibrowser panel[region=center]'},
    ],
    
    init : function(){
        var me = this;
        window.Browser = this;
        this.api = Ext.create('Bozuko.lib.Api');
        this.links = Bozuko.links;
        this.users = Bozuko.users;
        this.users.unshift({token:'', name:'No User'});
        
        this.historyStore = Ext.create('Ext.data.Store',{
            fields: ['timestamp','status','path','options','data']
        });
        this.links.api.path = '/api';
        this.saved = {
            ll: '42.646261785714,-71.303897114286'
        };
        Ext.Object.each( this.defaultParams, function(key, value){
            me.saved[key] = value;
        });
        this.control({
            'apibrowser form':{
                render: this.initFormPanel
            },
            'apibrowser button[action=request]':{
                click: this.makeRequest
            },
            'apibrowser button[action=entry]':{
                click: this.updateWithEntry
            },
            'apibrowser panel[region=east] dataview':{
                itemclick: this.onHistoryClick
            },
            'apibrowser button[action=updatefrombody]':{
                click: this.updateFromBody
            },
            'apibrowser button[action=reloadbody]':{
                click: this.reloadBody
            }
        });
        this.api.on('beforecall', function(){
            if( me.getBody() ) me.getBody().setLoading(true);
        });
        this.api.on('aftercall', function(){
            if( me.getBody() )me.getBody().setLoading(false);
        });
        this.api.call('/user', 'get', {}, function(result){
            me.user = result.data;
        });
        
        // listen for changes in the hash
        window.addEventListener('hashchange', function(){
            me.onHashChange();
        }, false);
    },
    
    onLaunch : function(){
        this.getHistoryView().bindStore( this.historyStore );
    },
    
    initFormPanel : function(){
        var links = [],
            formPanel = this.getRequestForm();
            
        Ext.Object.each(this.links, function(name){
            links.push({value:name});
        });
        
        this.pathField = formPanel.add({
            xtype:'hidden',
            name: 'path',
            value: '/api'
        });
        
        this.linkField = formPanel.add({
            xtype:'hidden',
            name: 'link',
            value: 'api'
        });
        
        this.usersField = formPanel.add({
            xtype:'combobox',
            editable: false,
            forceSelection: true,
            allowBlank: false,
            autoSelect: true,
            name: 'token',
            fieldLabel: 'User',
            store:Ext.create('Ext.data.Store',{
                fields:['token','name','phones','challenge'],
                data: this.users
            }),
            displayField: 'name',
            valueField: 'token',
            listeners : {   
                scope: this,
                change: function(){
                    var record = this.usersField.store.findRecord( 'token', this.usersField.getValue());
                    if( !record ){
                        this.phoneIdField.setValue('');
                        this.phoneTypeField.setValue('');
                        this.challengeField.setValue('');
                        return;
                    }
                    var phones = record.get('phones');
                    if( phones && phones.length ){
                        var phone = phones[0];
                        this.phoneIdField.setValue(phone.unique_id);
                        this.phoneTypeField.setValue(phone.type);
                    }
                    this.challengeField.setValue( record.get('challenge') + 5127 );
                }
            }
        });
        
        this.phoneTypeField = formPanel.add({
            xtype:'textfield',
            name: 'phone_type',
            fieldLabel: 'phone_type'
        });
        
        this.phoneIdField = formPanel.add({
            xtype:'textfield',
            name: 'phone_id',
            fieldLabel: 'phone_id'
        });
        
        this.challengeField = formPanel.add({
            xtype:'textfield',
            name: 'challenge_response',
            fieldLabel: 'challenge_response'
        });
        
        this.description = formPanel.add({
            xtype: 'panel',
            border: false,
            bodyPadding: 6,
            bodyStyle:'background-color: #f3f3f3',
            autoScroll: true,
            height: 100,
            tpl:[
                '<h1>{path}</h1>',
                '<p style="margin-top: 1em; color: #666">{doc}</p>'
            ],
            data: {
                path: this.links.api.path,
                doc: this.links.api.methods.get.doc
            }
        });
        
        this.methodCombo= formPanel.add({
            xtype:'combobox',
            editable: false,
            forceSelection: true,
            allowBlank: false,
            autoSelect: true,
            name: 'method',
            fieldLabel: 'Method',
            store:Ext.create('Ext.data.Store',{
                fields:['value','text'],
                data: [{value:'get', text:'get'}]
            }),
            listeners:{
                scope: this,
                select: this.onMethodChange
            },
            displayField: 'text',
            valueField: 'value'
        });
        
        this.updateWithEntry();
        
    },
    
    clearForm : function(){
        var formPanel = this.getRequestForm(),
            methodCombo = this.methodCombo;
            
        
        var pos = Ext.Array.indexOf(formPanel.items, methodCombo );
        
        while(formPanel.items.length > pos+1){
            var item = formPanel.items.items[pos+1];
            if( item.name ){
                this.saved[item.name] = item.getValue();
            }
            formPanel.remove(item);
        }
    },
    
    updateForm : function(link, path, method){
        var me = this,
            methodCombo = this.methodCombo,
            methodStore = this.methodCombo.store,
            formPanel = this.getRequestForm();
            
        this.pathField.setValue(path);
        this.linkField.setValue(link.name);
        
        methodStore.removeAll();
        
        if( link.methods ) Ext.Object.each( link.methods, function(name){
            if( !method ) method = name;
            methodStore.add({value: name, text: name});
        });
        methodCombo.select( method );
        this.onMethodChange();
    },
    
    updateFromBody : function(){
        var response = this.getBody().response;
        if( !response ) return;
        this.updateForm(this.links[response.link], response.path, response.method);
        this.getRequestForm().getForm().setValues(response.params||{});
    },
    
    reloadBody : function(){
        this.updateFromBody();
        this.makeRequest();
    },
    
    onMethodChange : function(){
        
        var me = this,
            formPanel = this.getRequestForm(),
            link = this.links[this.linkField.getValue()],
            method = link.methods[this.methodCombo.getValue()];
        
        if( !method ) return;
        var params = {};
        Ext.Object.each( this.defaultParams, function(key, value){
            params[key] = value;
        });
        if( method.params ) Ext.Object.each( method.params, function(key, value){
            params[key] = value;
        });
        
        this.clearForm();
        this.description.update({path:this.pathField.getValue(), doc: method.doc});
            
        if( params ) {
            Ext.Object.each(params,function(param, config){
                var field = formPanel.add({
                    xtype: 'textfield',
                    name: param,
                    fieldLabel: param
                });
                if(me.saved[param]){
                    field.setValue(me.saved[param]);
                }
            });
        }
    },
    
    makeRequest : function(){
        var me = this,
            formPanel = me.getRequestForm(),            
            params = formPanel.getForm().getValues(),
            path = params.path,
            link = params.link,
            method = params.method;
        
        
        delete params.link;
        delete params.path;
        delete params.method;
        
        me.api.call(path, method, params, me.afterCall, me, link);
    },
    
    afterCall : function(response){
        this.historyStore.insert(0,response);
        this.updateBody(response);
    },
    
    onHistoryClick : function(node, record){
        this.updateBody(record.data);
    },
    
    updateWithEntry : function(){
        this.updateForm(this.links.api, '/api');
    },
    
    updateBody : function(response){
        var me = this,
            data = response.data;
        this.getBody().response = response;
        this.getBody().update('<pre>'+me.getJson(data)+'</pre>');
    },
    
    onHashChange : function(){
        
        var parts = window.location.hash.replace(/^#/,'').split(':');
        if( parts.length != 2 ) return;
        
        var path = parts[0],
            link = parts[1];
        
        this.updateForm(this.links[link], path);
        window.location.hash='';
        
    },
    
    getJson : function(obj, level, link){
        level = level || 0;
        var me = this,
            indent = me.indent;
        
        if (obj && obj.toJSON) obj = obj.toJSON();
        
        var special = {'\b': '\\b', '\t': '\\t', '\n': '\\n', '\f': '\\f', '\r': '\\r', '"' : '\\"', '\\': '\\\\'};

        var escape = function(chr){
            return special[chr] || '\\u' + ('0000' + chr.charCodeAt(0).toString(16)).slice(-4);
        };
    
        switch (Ext.typeOf(obj)){
            case 'string':
                if( link ){
                    return '<a href="#'+obj+':'+link+'">'+obj+'</a>';
                }
                return '"' + obj.replace(/[\x00-\x1f\\"]/g, escape) + '"';
            case 'array':
                var json = '[';
                var items = [];
                Ext.Array.each(obj, function(item){
                    items.push(indent(level+1)+me.getJson(item, level+1));
                });
                json += items+indent(level)+']';
                return json;
            case 'object': case 'hash':
                var string = [];
                Ext.Object.each(obj, function(key, value){
                    var json = '';
                    if( key == 'links'){
                        json = me.getJson(value, level+1, true)
                    }
                    else{
                        json = me.getJson(value, level+1, link ? key : false);
                    }
                    if (json){
                        string.push(indent(level+1)+ me.getJson(key) + ':' + json);
                    }
                });
                return '{' + string + indent(level)+'}';
            case 'number': case 'boolean': return '' + obj;
            case 'null': return 'null';
        }
    
        return null;
    },
    
    indent : function(level){
        var indent='\n', indent_str='  ';
        for(var i=0; i<level; i++) {
            // if(i==0) indent+='\n';
            indent += indent_str;
        }
        return indent;
    }
});