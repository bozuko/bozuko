if( !window.Bozuko ) window.Bozuko = {};

Compose.call( Bozuko, {
    /**
     * Create a namespace
     * @param {String} namespace The namespace to create
     * @return {Object}
     */
    ns : function(str){
        var cur = window,
            parts = str.split('.');
            
        for( var i=0; i<parts.length; i++ ){
            var part = parts[i];
            if( !cur[part] ) cur[part] = {};
            cur = cur[part];
        }
        return cur;
    },
    
    each : function(o, fn, scope){
        if( Bozuko.isObject(o) ){
            for(var i in o ){
                if( o.hasOwnProperty(i) ){
                    if( fn.call(scope, o[i], i, o) === false ) return;
                }
            }
        }
        else if( Bozuko.isArray(o) ){
            for(var i=0; i<o.length; i++){
                if( fn.call(scope, o[i], i, o) === false ) return;
            }
        }
    },
    
    /**
     * <p>Returns true if the passed value is empty.</p>
     * <p>The value is deemed to be empty if it is<div class="mdetail-params"><ul>
     * <li>null</li>
     * <li>undefined</li>
     * <li>an empty array</li>
     * <li>a zero length string (Unless the <tt>allowBlank</tt> parameter is <tt>true</tt>)</li>
     * </ul></div>
     * @param {Mixed} value The value to test
     * @param {Boolean} allowBlank (optional) true to allow empty strings (defaults to false)
     * @return {Boolean}
     */
    isEmpty : function(value, allowBlank) {
        var isNull       = value == null,
            emptyArray   = (Bozuko.isArray(value) && !value.length),
            blankAllowed = !allowBlank ? value === '' : false;

        return isNull || emptyArray || blankAllowed;
    },

    /**
     * Returns true if the passed value is a JavaScript array, otherwise false.
     * @param {Mixed} value The value to test
     * @return {Boolean}
     */
    isArray : function(v) {
        return Object.prototype.toString.apply(v) === '[object Array]';
    },

    /**
     * Returns true if the passed object is a JavaScript date object, otherwise false.
     * @param {Object} object The object to test
     * @return {Boolean}
     */
    isDate : function(v) {
        return Object.prototype.toString.apply(v) === '[object Date]';
    },

    /**
     * Returns true if the passed value is a JavaScript Object, otherwise false.
     * @param {Mixed} value The value to test
     * @return {Boolean}
     */
    isObject : function(v) {
        return !!v && !v.tagName && Object.prototype.toString.call(v) === '[object Object]';
    },

    /**
     * Returns true if the passed value is a JavaScript 'primitive', a string, number or boolean.
     * @param {Mixed} value The value to test
     * @return {Boolean}
     */
    isPrimitive : function(v) {
        return Bozuko.isString(v) || Bozuko.isNumber(v) || Bozuko.isBoolean(v);
    },

    /**
     * Returns true if the passed value is a JavaScript Function, otherwise false.
     * @param {Mixed} value The value to test
     * @return {Boolean}
     */
    isFunction : function(v) {
        return Object.prototype.toString.apply(v) === '[object Function]';
    },

    /**
     * Returns true if the passed value is a number. Returns false for non-finite numbers.
     * @param {Mixed} value The value to test
     * @return {Boolean}
     */
    isNumber : function(v) {
        return Object.prototype.toString.apply(v) === '[object Number]' && isFinite(v);
    },

    /**
     * Returns true if the passed value is a string.
     * @param {Mixed} value The value to test
     * @return {Boolean}
     */
    isString : function(v) {
        return typeof v === 'string';
    },

    /**util
     * Returns true if the passed value is a boolean.
     * @param {Mixed} value The value to test
     * @return {Boolean}
     */
    isBoolean : function(v) {
        return Object.prototype.toString.apply(v) === '[object Boolean]';
    },

    /**
     * Returns true if the passed value is an HTMLElement
     * @param {Mixed} value The value to test
     * @return {Boolean}
     */
    isElement : function(v) {
        return v ? !!v.tagName : false;
    },

    /**
     * Returns true if the passed value is not undefined.
     * @param {Mixed} value The value to test
     * @return {Boolean}
     */
    isDefined : function(v){
        return typeof v !== 'undefined';
    },
    
    touchAsMouse : function(){
        
        function touchHandler(event){
            var touches = event.changedTouches,
                first = touches[0],
                type = "";
            
            switch(event.type){
                case "touchstart": type="mousedown";    break;
                case "touchmove":  type="mousemove";    break;        
                case "touchend":   type="mouseup";      break;
                default: return;
            }
        
            var simulatedEvent = document.createEvent("MouseEvent");
            simulatedEvent.initMouseEvent(type, true, true, window, 1, 
                                      first.screenX, first.screenY, 
                                      first.clientX, first.clientY, false, 
                                      false, false, false, 0/*left*/, null);
        
            first.target.dispatchEvent(simulatedEvent);
            event.preventDefault();
        }
        
        function init(){
            document.addEventListener("touchstart", touchHandler, true);
            document.addEventListener("touchmove", touchHandler, true);
            document.addEventListener("touchend", touchHandler, true);
            document.addEventListener("touchcancel", touchHandler, true);    
        }
    }
});