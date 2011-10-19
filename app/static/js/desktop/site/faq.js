jQuery(function($){
    var blocks = [],
        $sections = $('.content .section'),
        $links = $('.leftCol li a');
    
    $('.content h3').each(function(i, h3){
        var $els = $(),
            $h3 = $(h3),
            $block = $('<div class="block" />').insertBefore($h3),
            $answer = $('<div class="answer" />'),
            $question = $('<div class="question" />'),
            $full = $('<div class="full" />'),
            $short = $('<div class="short" />'),
            $cur = $h3;
        
        while( ($cur = $cur.next()).length ){
            if( $cur[0].tagName.match(/^h/i) ) break;
            $els = $els.add( $cur );
        }
        
        $full.append($els);
        var text = $els.text().substring(0, 100).split(" ").slice(0, -1).join(" ") + "..."
        $short.html('<p>'+text+'</p>');
        
        $question.click(function(){
            $block.toggleClass('full');
        });
        
        $question.append($('<span class="arrow" />')).append($h3);
        $answer.append($short).append($full);
        
        $block.append($question).append($answer);
        
        blocks[blocks.length] = {
            $question: $question,
            $answer: $answer,
            $block: $block
        };
    });
    
    // setup the sections
    $links.click(function(e){
        
        var id = $(this).attr('href'),
            $section = $(id);
        
        e.preventDefault();
        $sections.hide();
        
        $section.show();
        $links.removeClass('active');
        $(this).addClass('active');
        $section.attr('id', '');
        window.location.hash = id.replace(/^#/,'');
        $section.attr('id', id.replace(/^#/,''));
    });
    
    var $link = $links.filter('a[href='+window.location.hash+']');
    if( $link.length ) $link.click();
    else $links.eq(0).click();
    
});