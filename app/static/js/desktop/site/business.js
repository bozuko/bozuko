jQuery(function($){
	
    $('#contact-form-container').appendTo($('body'));
	
	// setup the welcome form
	$('.learn-more a').overlay({
		// some mask tweaks suitable for modal dialogs
		mask: {
			color: '#000',
			loadSpeed: 200,
			opacity: 0.6
		},

		target : $('#contact-form')
	});
	
	var form = $('#contact-form form'),
		errors = {},
		name = form.find('input[name=name]'),
		email = form.find('input[name=email]'),
		submit = form.find('input[type=submit]'),
		msg = form.find('textarea');
		
	form.submit(function(e){
		e.preventDefault();
		// check to see if we validate, screw the jquerytools validator
		var error = false;
		if( !name.val() ){
			error = true;
			errors.name = $('<div class="error">Name is required</div>').insertAfter(name);
		}
		else{
			if( errors.name ){
				errors.name.remove();
				delete errors.name;
			}
		}
		if( !email.val() ){
			error = true;
			errors.email = $('<div class="error">Email is required</div>').insertAfter(email);
		}
		else if( !/^([a-z0-9_\.\-\+]+)@([\da-z\.\-]+)\.([a-z\.]{2,6})$/i.exec( email.val() ) ){
			error = true;
			errors.email = $('<div class="error">Please enter a valid email address.</div>').insertAfter(email);
		}
		else{
			if( errors.email ){
				errors.email.remove();
				delete errors.email;
			}
		}
		if( !msg.val() ){
			error = true;
			errors.msg= $('<div class="error">Message is required</div>').insertAfter(msg);
		}
		else{
			if( errors.msg){
				errors.msg.remove();
				delete errors.msg;
			}
		}
		
		if( error ) return;
		
		submit.val('Sending...');
		submit.attr('disabled', true);
		$.post(form.attr('action'), form.serialize(), function(response){
			var tmp = $('<h3 style="font-weight:bold; color: green; ">Your message has been sent!</h3>').insertBefore(submit);
			submit.hide();
			setTimeout(function(){
				tmp.remove();
				submit.show();
				submit.val('Send');
				$('.learn-more a').data('overlay').close();
			}, 1500);
		});
	});
	
});