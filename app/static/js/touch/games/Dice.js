Ext.ns('Bozuko.game');

Bozuko.game.Dice = Ext.extend( Ext.Panel, {
	
	fps				:10,
	rollTime		:2.0,
	numDice			:5,
	frameCt			:0,
	cls				:'felt',
	
	diceSprite: {
		xFrames: 6,
		yFrames: 2,
		width: 99,
		height: 99
	},
	
	initComponent : function(){
		
		this.isRolling = false;
		this.timer = null;
		this.faces = [];
		this.dice = [];
		this.result = [];
		this.frameTotal = this.rollTime * this.fps;
		this.on('render', this.initDice);
		
		this.dockedItems = [{
			xtype			:'toolbar',
			layout			:{
				pack			:'center'
			},
			dock			:'bottom',
			items			:[{
				text			:'Roll the Dice!',
				handler			:this.roll,
				scope			:this,
				ui				:'confirm'
			}]
		}];
		
		Bozuko.game.Dice.superclass.initComponent.call(this);
	},
	
	initDice : function(){
		for(var i=0; i<this.numDice; i++){
			var f = this.faces[i] = {x: Math.floor(Math.random()*6), y:0};
			this.dice[i] = this.body.createChild({
				tag:'div',
				cls:'die-ct',
				id:'dice'+(i+1),
				children:[{
					tag:'div',
					cls:'die',
					style:{
						"background-position":(-this.diceSprite.width*f.x)+'px '+f.y+'px'
					}
				},{
					tag:'div',
					cls:'shadow'
				}]
			});
			this.dice[i].die = this.dice[i].down('.die');
		}
	},
	
	play : function(){
		this.roll.apply(this,arguments);
	},
	
	roll : function(result){
		// need to test if its an array because
		// we are using this as a handler from a button event
		// which passes arguments as well
		if( result && result.forEach ) this.result = result;
		if( !this.isRolling ){
			this.isRolling = true;
			this.frame = 0;
			this._loop();
		}
	},
	
	reset : function(){
		this.result=false;
	},
	
	stop : function(){
		clearTimeout( this.timeout );
		this.isRolling = false;
		this.updateDice();
		this.finish();
	},
	
	_loop : function(){
		this.frame++;
		this.updateDice();
		var _this = this;
		if( this.frame < this.frameTotal ){
			this.timeout = Ext.defer(this._loop, 1000/this.fps, this);
		}
		else{
			this.isRolling = false;
			this.finish();
		}
	},
	
	finish : function(){
		// check the die
		var results = [0,0,0,0,0,0];
		for( var i=0; i<this.faces.length; i++){
			var face = this.faces[i];
			results[this.faces[i].x]++;
		}
		console.log(results, this.faces);
		// just check for > 3 of a kind right now
		if( ~results.indexOf(5) ){
			this.fireEvent('win', '5-of-a-kind', this);
		}
		else if( ~results.indexOf(4) ){
			this.fireEvent('win', '4-of-a-kind', this);
		}
		else if( ~results.indexOf(3) ){
			this.fireEvent('win', '3-of-a-kind', this);
		}
		else{
			this.fireEvent('lose', this);
		}
		this.reset();
		
	},
	
	updateDice : function(){
		var i;
		var die;
		var dice = this.diceSprite;
		var xpos, ypos;
        var stopped = this.isRolling === false || this.frame === this.frameTotal;
        
		for (i = 0; i < this.numDice; i++) {
            var top = stopped || this.frame % dice.yFrames == 0;
            this.dice[i][!top?'addCls':'removeCls']('die-state-2');
            
            var face = this.faces[i];
            face.y = top ? 0 : (this.frame % this.diceSprite.yFrames);
            ypos = -dice.height * face.y;
            // check if we have results
            if( stopped && this.result && this.result[i] ){
                face.x = Math.max(Math.min(this.result[i]-1,6),0);
            }
            else{
                var x = face.x;
                var pool = [0,1,2,3,4,5];
				pool.splice(x,1);
				var r = Math.floor(Math.random()*5);
				face.x = pool[r];
				if( stopped ){
					this.result[i] = face.x+1
				}
				delete pool;
            }
            xpos = -dice.width*face.x;
            this.dice[i].die.setStyle({backgroundPosition:xpos+"px "+ypos+"px"});
        }
	}
});