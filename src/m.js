/**
	@Author : w.f.
**/
var Stt = {};
(function($$){
	var _object = function(st) {
		this._ = st;
		var e = this._e = {};
	};
	_object.prototype._get = function(k) {
		return this._[k];
	};
	_object.prototype._set = function(k, v) {
		var me = this;
		if(typeof k == 'string'){
			me._[k] = v;
			me.asTrigger("set " + k, [v], me);
		}else{
			for(var a in k){
				me._[a] = k[a];
				me.asTrigger("set " + a, [k[a]], me);
			}
		}
		
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
	$$.define = function(name, prop){
		$$[name] = new Function('this._constructor_();this.init.apply(this, arguments);');
		$$.util.extend($$[name], _object);
		
		for(var k in prop){
			var p = prop[k];
			if(typeof p === 'function'){
				$$[name].prototype[k] = p;
			}else{
				$$[name][k] = p;
			}
		}
		$$[name].prototype['_constructor_'] = (function(){_object.apply(this, [{}])});
		if(!$$[name].prototype['init']){
			$$[name].prototype['init'] = (function(){});
		}
		return $$[name];
	};
	$$.create = function(name, prop){
		for(var k in prop){
			$$[name][k] = p;
		}
		return $$[name];
	};
	$$.is = {
		array : function(o){
			return Object.prototype.toString.call(o) === '[object Array]';
		}
	};
	$$.util = {
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
		},
		delayCall : function(t, fn, args, ms){
			setTimeout(function(){
				fn.apply(t, args||[]);
			}, ms||0);
		}
	};
})(Stt);

(function($$){
	var M = $$.Math = {};
	var B = $$.Beta = {};
})(Stt);

(function($$){
	$$.define('Iterator', {
		init : function(arr){
			this._set({
				arr : arr,
				index : 0,
				max : arr.size()
			});
		},
		hasNext : function(){
			return this._get('index')<this._get('max');
		},
		next : function(){
			var me = this, i = me._get('index');
			me._set('index', i + 1);
			return me._get("arr").get(i);
		}
	});
})(Stt);

(function($$){
	$$.define('Number', {
		init : function(){},
		is : {
			Infinity : function(v){
				return v == Infinity || v == -Infinity;
			},
			Nan : function(v){
				return isNaN(v);
			}
		}
	});
})(Stt);

(function($$){
	Defaults = {
		bsize : 100,
		bp : [0,0],
		inner : {}
	};
	var Util = {
		index : function(i){
			var mod = i%Defaults.bsize, div = Math.floor(i/Defaults.bsize);
			return [div, mod];
		}
	},I = $$.Iterator;
	$$.define('Array', {
		_getBp : function(){
			return this._get('bp');
		},
		_getBLength : function(){
			return this._getBp()[0];
		},
		_getLengthInB : function(){
			return this._getBp()[1];
		},
		_getBlock : function(){
			var me = this, bl = me._getBLength(), inner = me._get('inner');
			var block = inner[bl];
			if(!block){
				inner[bl] = block = new Float32Array(me._get('bsize'));
			}
			return block;
		},
		_getBlockBy : function(bi){
			var me = this, inner = me._get('inner');
			return inner[bi];
		},
		size : function(){
			var me = this, bp = me._getBp();
			return bp[0]*Defaults.bsize + bp[1];
		},
		init : function(){
			var me = this;
			me._set({
				bsize : 100,
				bp : [0,0],
				inner : {}
			});
			me.on("push", function(val, callback){
				var bp = me._getBp(),block = me._getBlock();
				block[bp[1]] = val;
				me.trigger('resize', [1]);
				if(typeof callback == 'function'){
					callback.call(me, val, l);
				}
			});
			
			me.on("resize", function(pl){
				var bp = me._getBp(), delt = Math.floor(bp[1] - Defaults.bsize);
				if(delt < 0){
					bp[1] += 1;
				}else{
					bp[0] += 1;
					bp[1] = delt;
				}
				me._set('bp', bp);
			});
		},
		push : function(){
			this.trigger('push', arguments);
			return this;
		},
		pop : function(){
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
		},
		peek : function(){
			var me = this;
			return me._getBlockBy(me._getBLength() - 1)[me._getLengthInB()]
		},
		get : function(i){
			var me = this, indx = Util.index(i), b = me._getBlockBy(indx[0]);
			if(b){
				return b[indx[1]]
			}
		},
		set : function(i, val){
			var me = this, indx = Util.index(i), b = me._getBlockBy(me._getBLength() - 1);
			if(b){
				b[me._getLengthInB()] = val;
			}else{
				me.push(val);
			}
		},
		concat : function(arr){
			var me = this;
			for(var i=0, l = arr.length; i<l; i++){
				me.push(arr[i]);
			}
		},
		iterator : function(){
			return new $$.Iterator(this);
		},
		each : function(func){
			var me = this, it = me.iterator();
			while(it.hasNext()){
				func.call(null, it.next())
			}
			delete it;
		}
	});
})(Stt);
(function($$){
	var M = $$.Math,B = $$.Beta,N = $$.Number;
	M.average = function(){
		var length = 0, all = 0;
		var result = M.sum.apply(M, arguments);
		return result.value * 1.00 / result.length
	};
	M.sum = function(){
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
	M.variance = function(s, average){
		var avr = average || M.average(s), p1 = 0, p0 = s.size()-1;
		s.each(function(val){
			p1 += val*val;
		});
		p1 -= (p0+1) * avr * avr;
		return p1/p0;
	};
	M.gammar = function(n){
		return Math.exp((Math.log(2*Math.PI)- Math.log(n))/2 + n* (Math.log(n + 1.0/(12.0*n - 0.1/n)) - 1));
	};
	M.gammarln = function(n){
		var cst = [76.18009172947146,-86.50532032941677,24.01409824083091,-1.231739572450155,0.1208650973866179e-2,-0.5395239384953e-5];
		var x, y, tmp, ser = 1.000000000190015;
		y = x = n;
		tmp = x + 5.5;
		tmp -= (x+0.5)*Math.log(tmp);
		for(var j=0; j<6; j++){
			ser += cst[j]/++y;
		}
		return -tmp + Math.log(2.5066282746310005*ser/x);
		
	};
	M.lnBeta = function(a, b){
		return Math.log(Math.exp(M.gammarln(a)) * Math.exp(M.gammarln(b))/ Math.exp(M.gammarln(a + b)));
		//return Math.log(M.gammar(a) * M.gammar(b)/ M.gammar(a + b));
	};
	M.degreesFreedom = function(sp0, sp1){
		var n0 = sp0.size(), n1 = sp1.size(), v0 = sp0.getVariance(), v1 = sp1.getVariance(),
		s0 = v0/n0, s1 = v1/n1;
		return Math.pow(s0 + s1, 2)/(s0*s0/(n0-1) + s1*s1/(n1-1))
	};
	M.tscore = function(sp0, sp1){
		var avr0 = sp0.getAverage(), avr1 = sp1.getAverage(), 
			v0 = sp0.getVariance(),v1 = sp1.getVariance();
		var p0 = avr0 - avr1, p1 = Math.sqrt(v0/sp0.size() + v1/sp1.size());
		return p0/p1;
	};
	M.ttest = function(sp0, sp1){
		var t = M.tscore(sp0, sp1), df = M.degreesFreedom(sp0, sp1);
		//return Math.pow(1 + t*t/df, -(df + 1)/2) * M.gammar((df + 1)/2)/(M.gammar(df/2)*Math.sqrt(df * Math.PI));
		var r = 2.0 * M.cdf(-t, df);
		return r;
	};
	M.cdf = function(x, df){
		var ret = NaN;
		if(x == 0){
			ret = 0.5
		}else{
			var t = B.iBeta(df/(df + x*x), 0.5 * df, 0.5);
			if(x < 0){
				ret = 0.5 * t;
			}else{
				ret = 1.0 - 0.5 * t;
			}
		}
		
		return ret;
	};
	M.equals = function(x, y, maxUlps){
		return Math.abs(x.toExponential(4) - y.toExponential(4)) <= maxUlps.toExponential(4)
			|| Math.abs(x - y) <= maxUlps;
	};
})(Stt);

(function($$){
	var M = $$.Math,N = $$.Number;
	$$.define('ContinuedFraction', {
		init : function(op){
			this._set(op);
		},
		getA : function(){
			return this._get('getA')||function(){};
		},
		getB : function(){
			return this._get('getB')||function(){};
		},
		evaluate : function(x, epsilon, maxIterations){
			var me = this, small = 1e-50;
			var hPrev = me.getA().call(me, 0, x);
			
			if(M.equals(hPrev, 0.0, small)){
				hPrev = small;
			}
			
			var n =1, dPrev = 0.0, cPrev = hPrev, hN = hPrev;
			while(n < maxIterations){
				var a = me.getA().call(me, n, x);
				var b = me.getB().call(me, n, x);
				
				var dN = a + b * dPrev;
				if(M.equals(dN, 0.0, small)){
					dN = small;
				}
				var cN = a + b/cPrev;
				if(M.equals(cN, 0.0, small)){
					cN = small;
				}
				
				dN = 1/dN;
				var deltaN = cN*dN;
				hN = hPrev * deltaN;
				
				if(N.is.Infinity(hN)==true){
					throw "Continued fraction convergents diverged to +/- infinity for value " + hN;
				}
				if(N.is.Nan(hN) == true){
					throw "Continued fraction diverged to NaN for value " + hN;
				}
				
				if(Math.abs(deltaN - 1.0) < epsilon){
					break;
				}
				
				dPrev = dN;
				cPrev = cN;
				hPrev = hN;
				n ++;
			}
			if(n >= maxIterations){
				throw "Continued fraction convergents failed to converge (in less than "+maxIterations+" iterations) for value " + x;
			}
			return hN;
		}
	});
	
})(Stt);

(function($$){
	var M = $$.Math,B = $$.Beta,CF = $$.ContinuedFraction;
	B.iBeta = function(x, a, b, ep, max){
		var r, epsilon = ep||1.0E-14, maxIterations = max||2147483647;
		if(x<0 || x>1 || a<=0 || b<=0){
			return NaN;
		}else if(x>(a + 1)/(2+b+a) && (1-x)<=(b+1)/(2 + b+ a)){
			r = 1 - B.iBeta(1-x, b, a, epsilon, maxIterations);
		}else{
			var cf = new CF({
				getB : function(n, xx){
					var rr, m;
					if(n % 2 == 0){
						m = n/2.0;
						rr = (m *(b - m) * xx )/((a + 2 * m - 1)*(a + 2 * m));
					}else{
						m = (n - 1.0)/ 2.0;
						rr = -((a + m) * (a + b + m) * xx)/((a + 2 * m) * (a + 2*m + 1))
					}
					return rr;
				},
				getA : function(n, xx){
					return 1.0;
				}
			});
			r = Math.exp(a * Math.log(x) + b * Math.log(1-x) - Math.log(a) - M.lnBeta(a, b)) * 1.0/cf.evaluate(x, epsilon, maxIterations);
		}
		
		return r;
	};
})(Stt);

(function($$){
	var A = $$.Array,M = $$.Math
	$$.define('Sample', {
		init : function(){
			var me = this;
			me._set('_s',{});
			me.on('set data', me.refresh);
			
			var inner = new A();
			for(var i=arguments.length - 1; i>=0; i--){
				var arg = arguments[i];
				if(typeof arg == 'number'){
					inner.push(parseFloat(arg));
				}else if(Stt.is.array(arg)){
					inner.concat(arg);
				}
			}
			me._setData(inner);
		},
		refresh : function(){
			var me = this, inner = me.getData();
			var avr = M.average(inner),size = inner.size(), sumVal = avr*size, stData = me._getStatData();
			stData.sum = sumVal;
			stData.average = avr;
			stData.variance = M.variance(inner, avr);
		},
		_setData : function(d){
			this._set('data', d);
		},
		_getStatData : function(){
			return this._get('_s');
		},
		getData : function(){
			return this._get("data");
		},
		getAverage : function(){
			return this._getStatData().average;
		},
		size : function(){
			return this.getData().size();
		},
		getVariance : function(){
			var me = this;
			return  vr = me._getStatData().variance;
		},
		add : function(val){
			var me = this, d = me.getData();
			d.push(parseFloat(val));
			me._setData(d);
		}
	});
})(Stt);