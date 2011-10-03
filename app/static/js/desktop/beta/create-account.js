jQuery(function($){
    $('.create-account label').hover(
        function(){
            $(this).addClass('hover');
        },
        function(){
            $(this).removeClass('hover');
        }
    )
    
    $('.create-account input[type=radio]')
        .change(function(){
            
            $('.create-account input:[type=radio][checked=true]').parents('label').addClass('selected');
            $('.create-account input:[type=radio][checked=false]').parents('label').removeClass('selected');
            
            // is something selected?
            if( $('.create-account input:[type=radio][checked=true]').length ){
                // enable the button
                $('.create-account input:[type=submit]').attr('disabled',false).removeClass('site-button-disabled');
            }
            else{
                $('.create-account input:[type=submit]').attr('disabled',true).addClass('site-button-disabled');
            }
        });
});