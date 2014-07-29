/**
	@Author : w.f.
**/
var Stt;
(function(){
	Function.prototype.getName = function(){
		return this.name || this.toString().match(/function\s*([^(]*)\(/)[1]
	}
})();
(function(){
	var M = Stt.Math = function(){}
	
	M.prototype = {
		average : function(){
			for(var i=arguments.length - 1; i>=0; i++){
				var arg = arguments[i]
				if(typeof arg == 'number'){
					
				}
			}
		}
	};
})();

(function(){
	var S = Stt.Sample = function(){
		this.name = 'Sample'
	};
	S.prototype = {
		
	};
})();