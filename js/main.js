function getRandom(x, y) {
    return Math.floor(Math.random() * (y - x + 1)) + x;
}
function foreach(arr,cb){
	for(var i = 0,l = arr.length;i<l;i++){
		var r = cb(arr[i],i);
		if(r===false){
			return;
		}
	}
}
function start() {
	//init
	var settings = {
		brick:{
			width:80,
			height:40,
			lifes:1
		},
		ball:{
			radius:10,
			v:10,
			angle:70
		},
		me:{
			width:200
		}
	}
	var me = {line:settings.default_line};
	var _frame = 0;
	var _keydown = {};
	var _h = $(window).height();
	var _w = $(window).width();
	var canvas = new fabric.StaticCanvas('test',{
		renderOnAddRemove:false,
		selection:false
	});
	var keymap = {
			"37":"l",
			"39":"r",
			"38":"u",
			"40":"d"
		}
	var brick_map = [
		"oooooooooooooooo",
		"oooooooooooooooo",
		"oooooooooooooooo",
		"oooooooooooooooo",
		"oooooooooooooooo",
		"oooooooooooooooo",
		"oooooooooooooooo",
		"ooooooxooxoooooo",
		"oooooooooooooooo",
		"oooooooxxooooooo",
		"oooooooooooooooo",
		"oooooooooooooooo",
		"oooooooooooooooo",
	];
	function onResize(){
		_h = $(window).height();
		_w = $(window).width();
		canvas.setHeight(_h-10);
		canvas.setWidth(_w);
		updateEdge();
	}
	$(window).on('resize',onResize).on('keydown',function(e){
		var dir = keymap[e.keyCode];
		dir && (_keydown[dir] = true);
	}).on('keyup',function(e){
		var dir = keymap[e.keyCode];
		dir && (_keydown[dir] = false);
	});


	var bricks = [];
	var edge = {};
	var me = {
		left:0,
		top:0,
		width:settings.me.width,
		height:20,
		v:settings.ball.v,
		isMe:true,
		goNextFrame(){
			for ( var dir in _keydown ){
				if(_keydown.l){
					this.left-=this.v;
				}
				if(_keydown.r){
					this.left+=this.v;
				}
				if(_keydown.d){
					bricks = initBricksArray();
				}
				if(_keydown.u){
					ball.angle = 45;
				}
				this.left = Math.max(me.left,0);
				this.left = Math.min(me.left,edge.right-me.width);
			}
		}
	};
	var ball = {
		radius:settings.ball.radius,
		left:0,
		top:0,
		angle:settings.ball.angle,
		angle_random:settings.ball.angle_random,
		v:settings.ball.v,
		checkCollisionAndGetNextFrameAngle:function(){
			var touched = {
				top:false,
				left:false,
				bottom:false,
				right:false
			}
			var _this = this;
			var w = this.radius*2;
			var force_angle = null;
			var return_angle = this.angle;

			// if(edge.bottom == this.top + w ){
			// 	touched.bottom = true;
			// }
			if(edge.right == this.left + w){
				touched.right = true;
			}
			if(edge.left == this.left){
				touched.left = true;
			}
			if(edge.top == this.top){
				touched.top = true;
			}
			
			foreach(bricks.concat(me),function(item,i){
				if(item.lifes<=0)return;
				var p = item;
				var b = {
					top:_this.top,
					left:_this.left,
					right:_this.left+w,
					bottom:_this.top+w
				};

				if(!item.isMe && b.top > bricks[bricks.length-1].bottom){
					return;
				}
				var hit = false;

				isTouched(b,p,{
					top:function(){
						touched.top = true;
						hit = true;
					},
					left:function(){
						touched.left = true;
						hit = true;
					},
					right:function(){
						touched.right = true;
						hit = true;
					},
					bottom:function(){
						touched.bottom = true;
						hit = true;
					},
				});
				if(item.isMe && hit){
					var diff = (ball.left - me.left + settings.ball.radius) / me.width;
					force_angle = 160 * (1-diff) + 10;
				}
				if(hit){
					item.lifes--;
					return false;
				}
			});

			if(force_angle){

				return force_angle;
			}

			if( touched.top || touched.bottom){
				return_angle = - this.angle;
			}
			if( touched.right || touched.left ){
				return_angle = 180 - this.angle;
			}

			return return_angle;
		},
		getNextFramePosition:function(){
			var STATIC_MATH_PARAM = 0.017453293;
			var angle = this.checkCollisionAndGetNextFrameAngle();
			this.angle = angle;
			var vx = this.v * Math.cos(-angle * STATIC_MATH_PARAM);
			var vy = this.v * Math.sin(-angle * STATIC_MATH_PARAM);
			var top = this.top + vy;
			var left = this.left + vx;

			// top = Math.min(edge.bottom - this.radius*2,top);
			left = Math.min(edge.right - this.radius*2,left);
			top = Math.max(edge.top,top);
			left = Math.max(edge.left,left);

			foreach(bricks.concat(me),function(item,i){
				if(item.lifes<=0)return;
				var p = item;
				var b = {
					top:top,
					left:left,
					right:this.left+settings.ball.radius*2,
					bottom:this.top+settings.ball.radius*2
				}
				isTouched(b,p,{
					top:function(){
						top = p.bottom;
					},
					bottom:function(){
						top = p.top - settings.ball.radius*2;
					},
					left:function(){
						left = p.right;
					},
					right:function(){
						left = p.left - settings.ball.radius*2
					}
				});

			});

			return {
				top:top,
				left:left
			}
		},
		goNextFrame:function(){
			var next = this.getNextFramePosition();
			this.left = next.left;
			this.top = next.top;
		}
	}

	function isTouched(a,b,cbObj){
		if(b.width){
			b.right = b.left + b.width;
		}
		if(b.height){
			b.bottom = b.top + b.height;
		}
		var aw = a.right - a.left;
		var ah = a.bottom -a.top;
		var bw = b.right -b.left;
		var bh = b.bottom -b.top;
		var result = "";
		var result_vertical = "";
		var result_horizon = "";
		if( (a.bottom >= b.top && a.top < b.top && a.bottom < b.bottom) &&  (a.left<=b.right && a.left >= b.right-aw-bw )){ // a's bottom
			result_vertical = "bottom";
		}else if( (b.bottom >= a.top && b.top < a.top && b.bottom < a.bottom) && (b.left<=a.right && b.left >= a.right-aw-bw) ){ // a's top
			result_vertical = "top";
		}

		if( (a.left <= b.right && a.right >b.right && a.left>b.left) && (a.top<=b.bottom && a.top >= b.bottom-ah-bh)){ // a's left
			result_horizon = "left";
		}else if( (b.left <= a.right && b.right >a.right && b.left > a.left) && (b.top <= a.bottom && b.top >= a.bottom-ah-bh ) ){  // a's right
			result_horizon = "right";
		}

		if(result_vertical && result_horizon){
			var diff_y = Math.min(a.bottom-b.top,b.bottom-a.top);
			var diff_x = Math.min(a.right-b.left,b.right-a.left);
			if(diff_y>diff_x){
				result = result_horizon;
			}else{
				result = result_vertical;
			}
		}else{
			result = result_vertical||result_horizon;
		}
		cbObj[result]&&cbObj[result]();
	}


	function updateEdge(){
		edge = {
			top:0,
			bottom:_h,
			left:0,
			right:_w
		}
		me.top = edge.bottom - 20;
	}
	function getBrickElement(brick,color){
	    return new fabric.Rect({
	        left:brick.left+1,
	        top:brick.top+1,
	        fill:color,
	        width:settings.brick.width -2,
	        height:settings.brick.height -2
	    });
	}
	function initBricksArray(){
		var bricks = [];
		var max_length = 0;
		foreach(brick_map,function(line){
			line.length>max_length && (max_length=line.length);
		})
		settings.brick.width = edge.right/max_length;

		foreach(brick_map,function(line,a){
			foreach(line,function(str,b){
				(str=="o")&&bricks.push({
					top:settings.brick.height * (a),
					left:settings.brick.width * (b),
					right:settings.brick.width * (b+1),
					bottom:settings.brick.height * (a+1),
					width:settings.brick.width,
					height:settings.brick.height,
					lifes:settings.brick.lifes
				})
			})
		});
		return bricks;
	}

	

	function oneFrame(){
		_frame ++;
		canvas.clear();
		


		function isCrashed(){
			var r = ball.top>edge.bottom;
			r&&console.log('isCrashed');
			return r;
		}

		me.goNextFrame();
		ball.goNextFrame();
		

		//render 
		//bricks
		foreach(bricks,function(item){
			var c = 10-(item.lifes||0);
			item.lifes && canvas.add(getBrickElement(item,"#"+c+c+c));
		});
		//edge
		canvas.add(new fabric.Rect({
			left:0,
			top:0,
			stroke:"red",
			strokeWidth:2,
			fill:"rgba(0,0,0,0.0)",
			width:edge.right-1,
			height:edge.bottom-1
		}));
		//ball
		canvas.add(new fabric.Circle({
			left:ball.left,
			top:ball.top,
			radius:ball.radius,
			fill:"red"
		}));
		canvas.add(new fabric.Rect({
			left:me.left,
			top:me.top,
			fill:"blue",
			width:me.width,
			height:me.height
		}))

		canvas.renderAll();
		!isCrashed() && fabric.util.requestAnimFrame(oneFrame,canvas.getElement());
	}



	onResize();
	updateEdge();
	me.left = (edge.right- me.width)/2;
	ball.left = (edge.right - settings.ball.radius)/2;
	ball.top = edge.bottom - 100;
	bricks = initBricksArray();
	oneFrame();
};
$(function(){
	setTimeout(start,400);
})