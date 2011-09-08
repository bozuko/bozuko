Ext.define('Bozuko.model.Prize', {
    extend: 'Bozuko.lib.data.Model',

    idProperty: '_id',

    fields: [
        {name:'_id',            type:'String'},
        {name:'value',          type:'Number'},
        {name:'duration',       type:'Number',      defaultValue: 1000 * 60 * 60 * 24 * 7 },
        {name:'image',          type:'String'},
        {name:'name',           type:'String'},
        {name:'description',    type:'String'},
        {name:'details',        type:'String'},
        {name:'redemption_type',type:'String'},
        {name:'instructions',   type:'String'},
        {name:'image',          type:'String'},
        {name:'total',          type:'Number'},
        {name:'won',            type:'Number'},
        {name:'redeemed',       type:'Number'},
        {name:'is_email',       type:'Boolean'},
        {name:'is_barcode',     type:'Boolean'},
        {name:'barcodes',       type:'Array'},
        {name:'barcode_type',   type:'String',      defaultValue: '39'},
        {name:'email_format',   type:'String',      defaultValue: 'text/plain'},
        {name:'email_subject',  type:'String'},
        {name:'email_body',     type:'String'},
        {name:'email_codes',    type:'Array'}
    ],
    
    associations: { type: 'belongsTo', model: 'Bozuko.lib.data.Contest' },
    
    getDefaultInstructions : function(_type){
        var me = this,
            instructions = '',
            type = me.get('redemption_type') || _type;
            
        // this should be part of a store..
        if( me.store ) me.store.each(function(prize){
            // console.log(prize, prize === this);
            if( prize !== me && prize.get('redemption_type') == type && prize.get('instructions') != ''){
                instructions = prize.get('instructions');
                return false;
            }
            return true;
        });
        
        if( instructions !== '' ) return instructions;
        
        switch( type ){
            case 'email':
                instructions = 'Press "Redeem" and your prize will be emailed to you.';
                break;
            
            case 'barcode':
            case 'image':
                instructions = 'Please show this screen to an employee and then press "Redeem".';
                break;
        }
        return instructions;
    },
    
    getDefaultEmailSubject : function(){
        return this.get('email_subject') || 'Congratulations! you won a {prize}';
    },
    
    getDefaultEmailBody : function(){
        return this.get('email_body') || [
            '<p>Hi {name}</p>',
            '<p>Congratulations! You have won a {prize}. Here is your gift code:</p>',
            '<p>{code}</p>'
        ].join('');
    }
});