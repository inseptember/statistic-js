/**
	@Author : w.f.
**/
var Stt = {};
(function(){
	Stt.is = {
		array : function(o){
			return Object.prototype.toString.call(o) === '[object Array]';
		}
	};
	
	Stt.util = {
		extend : function(sub, sup) {
			var F = function() {
			};
			F.prototype = sup.prototype;
			sub.prototype = new F();
			sub.prototype.constructor = sub;
			sub.superclass = sup.prototype;
			if (sup.prototype.constructor == Object.prototype.constructor) {
				sup.prototype.constructor = sup;
			}
		},
		extendObject : function(o1, o2){
			for(var k in o1){
				if(o2[k] == undefined){
					o2[k] = o1[k]
				}
			}
		}
	};
	
	var _object = Stt.base = function(st) {
		this._ = st;
		var e = this._e = {};
	};
	_object.prototype._get = function(k) {
		return this._[k];
	};
	_object.prototype._set = function(k, v) {
		var me = this;
		me._[k] = v;
		me.asTrigger("set " + k, [v], me);
		return me;
	};
	_object.prototype.on = function(k, callback){
		var me = this;
		if(typeof(callback) == 'function'){
			if(!me._e[k]){
				me._e[k] = [];
			}
			me._e[k].unshift(callback);
		}
		return me;
	};
	_object.prototype.off = function(k){
		var me = this, e = me._e[k];
		if(e){
			if(e.length > 1){
				e.pop();
			}else{
				delete me._e[k];
			}
		}
		return me;
	};
	_object.prototype.trigger = function(k, args){
		var me = this, e = me._e[k];
		if(e){
			for(var i=e.length-1; i>=0; i--){
				e[i].apply(me, args);
			}
		}
		return me;
	};
	_object.prototype.asTrigger = function(k, args, ms, _me){
		var _this = _me || this, e = this._e[k];
		if(e){
			setTimeout(function(){
				for(var i=e.length-1; i>=0; i--){
					e[i].apply(_this, args);
				}
			}, ms||0);
		}
		return _this;
	};
})();

(function(){
	var A = Stt.Array = function(){
		Stt.base.apply(this, [{
			bsize : 100,
			bp : [0,0],
			inner : {}
		}]);
		this.init();
		return this;
	};
	A.defaults = {
		bsize : 100,
		bp : [0,0],
		inner : {}
	};
	Stt.util.extend(A, Stt.base);
	
	var M = Stt.Math = function(){
		this.name = 'Math';
	}
	
	var I = Stt.Iterator = function(arr){
		var me = this;
		Stt.base.apply(me, [{
			arr : arr,
			index : 0,
			max : arr.size()
		}]);
	};
	Stt.util.extend(I, Stt.base);
	
	var S = Stt.Sample = function(){
		var me = this;
		Stt.base.apply(me, [{}]);
		
		me.name = 'Sample';
		me.init.apply(me, arguments);
	};
	Stt.util.extend(S, Stt.base);
})();

(function(){
	var I = Stt.Iterator;
	I.prototype.init = function(){
		var me = this;
	};
	I.prototype.hasNext = function(){
		return this._get('index')<this._get('max');
	};
	I.prototype.next = function(){
		var me = this, i = me._get('index');
		me._set('index', i + 1);
		return me._get("arr").get(i);
	};
})();

(function(){
	var A = Stt.Array, I = Stt.Iterator;
	
	var Util = {
		index : function(i){
			var mod = i%A.defaults.bsize, div = Math.floor(i/A.defaults.bsize);
			return [div, mod];
		}
	};
	A.prototype._getBp = function(){
		return this._get('bp');
	};
	A.prototype._getBLength = function(){
		return this._getBp()[0];
	};
	A.prototype._getLengthInB = function(){
		return this._getBp()[1];
	};
	A.prototype._getBlock = function(){
		var me = this, bl = me._getBLength(), inner = me._get('inner');
		var block = inner[bl];
		if(!block){
			inner[bl] = block = new Float32Array(me._get('bsize'));
		}
		return block;
	};
	A.prototype._getBlockBy = function(bi){
		var me = this, inner = me._get('inner');
		return inner[bi];
	};
	A.prototype.size = function(){
		var me = this, bp = me._getBp();
		return bp[0]*A.defaults.bsize + bp[1];
	};
	A.prototype.init = function(){
		var me = this;
		me.on("push", function(val, callback){
			var bp = me._getBp(),block = me._getBlock();
			block[bp[1]] = val;
			me.trigger('resize', [1]);
			if(typeof callback == 'function'){
				callback.call(me, val, l);
			}
		});
		
		me.on("resize", function(pl){
			var bp = me._getBp(), delt = Math.floor(bp[1] - A.defaults.bsize);
			if(delt < 0){
				bp[1] += 1;
			}else{
				bp[0] += 1;
				bp[1] = delt;
			}
			me._set('bp', bp);
		});
	};
	A.prototype.push = function(){
		this.trigger('push', arguments);
		return this;
	};
	A.prototype.pop = function(){
		var me = this;
		var result;
		try{
			var b = me._getBlock(),  bp = me._getBp();
			result = b[bp[1] - 1];
			b[bp[1] - 1] = 0;
			me.trigger('resize', [-1]);
		}catch(e){
			console.log(e);
		}
		return result;
	};
	A.prototype.peek = function(){
		var me = this;
		return me._getBlockBy(me._getBLength() - 1)[me._getLengthInB()]
	};
	A.prototype.get = function(i){
		var me = this, indx = Util.index(i), b = me._getBlockBy(indx[0]);
		if(b){
			return b[indx[1]]
		}
	};
	A.prototype.set = function(i, val){
		var me = this, indx = Util.index(i), b = me._getBlockBy(me._getBLength() - 1);
		if(b){
			b[me._getLengthInB()] = val;
		}else{
			me.push(val);
		}
	};
	A.prototype.concat = function(arr){
		var me = this;
		for(var i=0, l = arr.length; i<l; i++){
			me.push(arr[i]);
		}
	};
	A.prototype.iterator = function(){
		return new I(this);
	};
	A.prototype.each = function(func){
		var me = this, it = me.iterator();
		while(it.hasNext()){
			func.call(null, it.next())
		}
	};
})();

(function(){
	var M = Stt.Math;
	
	M.prototype.average = function(){
		var length = 0, all = 0;
		var result = this.sum.apply(this, arguments);
		return result.value * 1.00 / result.length
	};
	M.prototype.sum = function(){
		var length = 0, all = 0;
		for(var i=arguments.length - 1; i>=0; i--){
			var arg = arguments[i]
			arg.each(function(val){
				all += val;
				length += 1;
			})
		}
		return {
			value : all,
			length : length
		};
	};
	M.prototype.variance = function(s, average){
		var avr = average || this.average(s), p1 = 0, p0 = s.size();
		s.each(function(val){
			p1 += Math.pow(val - avr, 2);
		});
		return p1/p0;
	};
	M.prototype.ttest = function(sp0, sp1){
		var avr0 = sp0.avr || this.average(sp0.data), avr1 = sp1.avr || this.average(sp1.data), 
			v0 = sp0.variance || this.variance(sp0.data, avr0),v1 = sp1.variance || this.variance(sp1.data, avr1);
		var p0 = avr0 - avr1, p1 = Math.sqrt(v0/sp0.size + v1/sp1.size);
		return p0/p1;
	};
})();

(function(){
	var A = Stt.Array;
	var S = Stt.Sample;
	var m = new Stt.Math()
	S.prototype.init = function(){
		var me = this;
		var inner = new A();
		
		for(var i=arguments.length - 1; i>=0; i--){
			var arg = arguments[i];
			if(typeof arg == 'number'){
				inner.push(parseFloat(arg));
			}else if(Stt.is.array(arg)){
				inner.concat(arg);
			}
		}
		me._set("data", inner);
		
		var sumVal = m.sum(inner),size = inner.size(), avr = sumVal.value/size;
		me._set("_s", {
			sum : sumVal.value,
			average : avr
		});
		
	};
	S.prototype._getStatData = function(){
		return this._get('_s');
	};
	S.prototype.getData = function(){
		return this._get("data");
	},
	S.prototype.getAverage = function(){
		return this._getStatData().average;
	},
	S.prototype.getVariance = function(){
		var me = this;
		var inner = me.getData(), vr = me._getStatData().variance;
		if(vr == undefined){
			vr = m.variance(inner, me.getAverage());
			me._getStatData().variance = vr
		}
		return vr;
	};
})();

