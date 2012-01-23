/*
 * stickyfloat - jQuery plugin for verticaly floating anything in a constrained area
 * 
 * Example: jQuery('#menu').stickyfloat({duration: 400});
 * parameters:
 * 		duration 	(200)	 - the duration of the animation
 *		startOffset (number) - the amount of scroll offset after the animations kicks in
 *		offsetY		(number) - the offset from the top when the object is animated
 *		lockBottom	(true)	 - set to false if you don't want your floating box to stop at parent's bottom
 *		delay		(0)		 - delay in milliseconds  until the animnations starts
		easing		(linear) - easing function (jQuery has by default only 'swing' & 'linear')
 * $Version: 08.10.2011 r2
 * $Version: 05.16.2009 r1
 * Copyright (c) 2009 Yair Even-Or
 * vsync.design@gmail.com
 */

(function($){
	$.fn.stickyfloat = function(options, lockBottom){
		var $obj 				= this,
			doc					= $((jQuery.browser.msie && jQuery.browser.version == 8 ) ? document.documentElement : document),
			opts, bottomPos, pastStartOffset, objFartherThanTopPos, objBiggerThanWindow, newpos, checkTimer, lastDocPos = doc.scrollTop(),
			parentPaddingTop 	= parseInt($obj.parent().css('padding-top')),
			startOffset 		= options.startOffset || $obj.parent().parent().offset().top;
			
		
            
        $.extend( $.fn.stickyfloat.opts, options, { startOffset:startOffset} );
        
        opts = $.fn.stickyfloat.opts;
        
		$obj.css({ position: 'absolute' });
		
		if(opts.lockBottom){
			bottomPos = $obj.parent().parent().height() - $obj.outerHeight() + parentPaddingTop - opts.offsetY; //get the maximum scrollTop value
			if( bottomPos < 0 )
				bottomPos = 0;
		}
		
		function checkScroll(){
			if( opts.duration > 40 ){
				clearTimeout(checkTimer);
				checkTimer = setTimeout(function(){
					if( Math.abs(doc.scrollTop() - lastDocPos) > 0 ){
						lastDocPos = doc.scrollTop();
						initFloat();
					}
				},40);
			}
			else initFloat();
		}
		
		function initFloat(){
			$obj.stop(); // stop all calculations on scroll event
			
			
			pastStartOffset			= doc.scrollTop() > opts.startOffset;	// check if the window was scrolled down more than the start offset declared.
			objFartherThanTopPos	= $obj.offset().top > startOffset;	// check if the object is at it's top position (starting point)
			objBiggerThanWindow 	= $obj.outerHeight() < $(window).height();	// if the window size is smaller than the Obj size, then do not animate.
			
			// if window scrolled down more than startOffset OR obj position is greater than
			// the top position possible (+ offsetY) AND window size must be bigger than Obj size
			if( (pastStartOffset || objFartherThanTopPos) && objBiggerThanWindow ){
				
				newpos = (doc.scrollTop() -startOffset + opts.offsetY );

				if ( newpos > bottomPos ){
					newpos = bottomPos;
				}
				if ( doc.scrollTop() < opts.startOffset ){ // if window scrolled < starting offset, then reset Obj position (opts.offsetY);
					newpos = opts.startOffset;
				}
				$obj.delay(opts.delay).animate({ top: newpos }, opts.duration , opts.easing );
			}
		}
		$(window).scroll(checkScroll);
	};
	
	$.fn.stickyfloat.opts = { duration:200, lockBottom:true , delay:0, easing:'linear' };
})(jQuery);

jQuery(function($){
	
    $('.fixed').stickyfloat({lockBottom: true, duration: 400, offsetY: 70, startOffset: 125});
	
	$('#welcome-form-container').appendTo($('body'));
	
	// setup the welcome form
	$('.question-trigger').overlay({
		// some mask tweaks suitable for modal dialogs
		mask: {
			color: '#000',
			loadSpeed: 200,
			opacity: 0.6
		},

		target : $('#welcome-form')
	});
	
	var form = $('#welcome-form form'),
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
		$.post('/beta/form', form.serialize(), function(response){
			var tmp = $('<h3 style="font-weight:bold; color: green; ">Your message has been sent!</h3>').insertBefore(submit);
			submit.hide();
			setTimeout(function(){
				tmp.remove();
				submit.show();
				submit.val('Send');
				$('.question-trigger').data('overlay').close();
			}, 1500);
		});
	});
	
});