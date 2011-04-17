jQuery(function($){
    
    // simple regular expression for email
    var re_email = /.+@.+\..+/;
    
    var email = $('.email'), submit=$('.submit');
    var placeholder = 'your email address...';
    email.focus(function(){
        if( email.val() == placeholder ) email.val('');
        email.addClass('email-active');
    });
    email.blur(function(){
        if( email.val() == '' ){
            email.val(placeholder);
            email.removeClass('email-active');
        }
    });
    email.val(placeholder);
    submit.focus(function(){
        submit.addClass('submit-focus');
    });
    submit.blur(function(){
        submit.removeClass('submit-focus');
    });
    submit.hover(function(){
        submit.addClass('submit-focus');
    },function(){
        submit.removeClass('submit-focus');
    });
    var form = $('#mc');
    var cities_picked = false;
    form.submit(function(e){
        var v = email.val();
        if( v == '' || v == placeholder || !re_email.test(v)){
            $('<p>Please enter a valid email address</p>').dialog({
                autoOpen: true,
                buttons: {
                    'Okay': function(){ $(this).dialog("close"); }
                },
                title: 'Uh-oh!',
                modal: true,
                resizable: false,
                draggable: false
            });
            e.preventDefault();
            return;
        }
        if( !cities_picked ){
            $('.city').dialog({
                title:"Choose your city",
                modal: true,
                resizable: false,
                draggable: false,
                width: 400,
                buttons: {
                    "Sign me up!" : function(){
                        cities_picked = true;
                        $(this).dialog('close');
                        $('.city').appendTo('.hidden');
                        form.submit();
                    }
                }
            });
            e.preventDefault();
        }
    });
});