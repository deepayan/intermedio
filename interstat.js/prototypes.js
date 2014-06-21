

// Standard prototypes.  Note that these are not constructors, but
// functions that will be called exactly once, to create what will
// eventually be the .prototype property of constructors

// Note that it is basically impossible to properly subclass arrays
// (the special features that make them different from Object-s are
// not inherited properly). So we use a 'data' slot to store vector
// data even when we ideally should have inherited from Array.


// Lessons: only methods should be inherited through prototypes, never
// data.  This is because inheritance is literal, not slot type
// descriptions.  So for example, DataFrame inheriting from List helps
// only in the sense that common methods can be inherited.



var StdPrototypes = {

    Numeric : function() 
    {

	// We want the vector methods (R^n -> R^n) in particular to
	// work with matrices and retain their Matrix-ness.  So the
	// standard idiom is clone() and modify.

	var x = {
	    // data : [], // put by constructor
	    clone : function() { return new Numeric(this.data); },
	    length : function() { return this.data.length; },
	    setlength : function(n) { this.data.length = n; },
	    get : function(i) { return this.data[i]; }, // FIXME: vectorize?
	    set : function(i, val) { this.data[i] = val; },
	    range : function(f) {
		if (f == null) f = 0;
		var i, lo = Infinity, hi = -Infinity;
		for (i = 0; i < this.length(); i++) {
		    if (this.get(i) < lo) lo = this.get(i);
		    else if (this.get(i) > hi) hi = this.get(i);
		}
		return new Numeric([lo - f * (hi-lo), hi + f * (hi-lo)]);
	    },
	    map : function(f) { // to be used like sapply() 
		var i, ans = this.clone();
		for (i = 0; i < this.length(); i++) { 
		    ans.set(i, f(this.get(i)));
		}
		return ans;
	    },
	    min : function() {
		var i, lo = Infinity;
		for (i = 0; i < this.data.length; i++) {
		    if (this.data[i] < lo) lo = this.data[i];
		}
		return lo;
	    },
	    which_min : function() {
		var i, opt = Infinity, ans = -1;
		for (i = 0; i < this.length(); i++) {
		    if (this.get(i) < opt) { 
			opt = this.get(i);
			ans = i;
		    }
		}
		return ans;
	    },
	    max : function() {
		var i, hi = -Infinity;
		for (i = 0; i < this.data.length; i++) {
		    if (this.data[i] > hi) hi = this.data[i];
		}
		return hi;
	    },
	    which_max : function() {
		var i, opt = -Infinity, ans = -1;
		for (i = 0; i < this.length(); i++) {
		    if (this.get(i) > opt) { 
			opt = this.get(i);
			ans = i;
		    }
		}
		return ans;
	    },
	    sum : function(narm) {
		var tmp, sum = 0;
		for (i = 0; i < this.length(); i++) {
		    tmp = this.get(i);
		    if (tmp) sum += tmp;
		    else if (!narm) return undefined; // tmp=undefined and narm=false
		}
		return sum;
	    },
	    mean : function(narm) { // add trim/weight arguments?
		if (narm) {
		    var tmp, len = 0, sum = 0;
		    for (i = 0; i < this.length(); i++) {
			tmp = this.get(i);
			if (tmp) {
			    len++;
			    sum += tmp;
			}
		    }
		    return sum / len; 
		}
		else return this.sum() / this.length();
	    },
	    head : function(n) {
		if (!n) n = 6;
		if (n > this.data.length) n = this.data.length;
		var i, ans = new Numeric(n);
		for (i = 0; i < n; i++) {
		    ans.set(i, this.get(i));
		}
		return ans;
	    },
	    tail : function(n) {
		if (!n) n = 6;
		if (n > this.data.length) n = this.data.length;
		var i, m = this.length(), ans = new Numeric(n);
		for (i = 0; i < n; i++) {
		    ans.set(i, this.get(m - n + i));
		}
		return ans;
	    },
	    round : function(digits) {
		var i, p, ans;
		if (!digits) digits = 0;
		if (digits > 0) p = Math.pow(10, digits); 
		else p = 1;
		ans = this.clone();
		for (i = 0; i < this.length(); i++) { 
		    ans.set(i, Math.round(this.get(i) * p) / p);
		}
		return ans;
	    },
	    pow : function(p) {
		if (!p) throw "Exponent missing in call to pow()";
		ans = this.clone();
		for (i = 0; i < this.length(); i++) { 
		    ans.set(i, Math.pow(this.get(i), p));
		}
		return ans;
	    },
	    toFixed : function(digits) {
		if (!digits) digits = 0;
		var i, ans = new Array(this.length()); // will return strings
		for (i = 0; i < this.length(); i++) { 
		    ans[i] = this.get(i).toFixed(digits);
		}
		return ans;
	    },
	    pretty : function(n) {
		if (!n) n = 5;
		var lo = this.min();
		var hi = this.max();
		var c = (hi - lo) / n
		var b = Math.pow(10.0, Math.floor( Math.log(c) / Math.log(10) )); 
		var u = new Numeric([ 1, 2, 5, 10 ]).map(function(x) { return x * b; });
		var v = u.map(function(x) { return Math.abs(c/x - 1) ; })
		var d = u.data[ v.which_min() ];
		var ans = new Numeric(Rstatic.seq_by(d * Math.ceil(lo/d), 
						     d * Math.floor(hi/d), 
						     d));
		ans.digits = -Math.round(Math.log(b) / Math.log(10));
		if (ans.digits < 0) ans.digits = 0;
		return ans;
	    },
	    toString : function() {
		if (this.data.length < 7) {
		    return "Numeric ["+this.data.length+"]: " + 
			this.round(3).data.join();
		}
		else {
		    return "Numeric ["+this.data.length+"]: " + 
			this.head().round(3).data.join() + "...";
		}
	    },
	    sort : function(method) {
		if (!method) method = "merge";
		y = Array(this.data.length); // FIXME - proper Numeric instance?
		for (i = 0; i < this.length(); i++) { y[i] = this.data[i] };
		Sort[method](y);
		return y;
	    }
	};

	// Make vectorized versions of Math.*().  Not all, but only

	var mathMethods = ["abs", "acos", "asin", "atan", "ceil", "cos",
			   "exp", "floor", "log", "sin", "sqrt", "tan"];

	makeMathFun = function(mname) {
	    var FUN = Math[mname];
	    return function() {
		var i, ans = this.clone();
		console.log(FUN);
		for (i = 0; i < this.length(); i++) { 
		    ans.set(i, FUN(this.get(i)));
		}
		return ans;
	    }
	}

	for (i in mathMethods) { // i runs over integer indices
	    var mname = mathMethods[i];
	    x[mname] = makeMathFun(mname);
	}

	// Note: two-arg: "pow" (see above), "atan2" (will not implement)

	return x;
    },

    Matrix : function() 
    {
	// inherits from numeric (but then vector methods will produce
	// Numeric without dim!).  Maybe better to make Matrix a
	// special case of Numeric (with dim)
	var x = new Numeric();
	x.ij2k = function(i, j) { return i + (j * this.dim[0]); };
	x.mget = function(i, j) { return this.get(this.ij2k(i, j)); };
	x.mset = function(i, j, val) { this.set(this.ij2k(i, j), val); };
	x.asNumeric = function() { return new Numeric(this.data); };
	// var x = {
	//     data : [],
	//     dim : [0,0],
	//     ij2k : function(i, j) { return i + (j * this.dim[0]); },
	//     mget : function(i, j) { return this.data[this.ij2k(i, j)]; },
	//     mset : function(i, j, val) { this.data[this.ij2k(i, j)] = val; },
	//     asNumeric : function() { return new Numeric(this.data); },
	// }
	return x;
    },

    List : function()
    {
	var x = { 
	    data : {},
	    names : [],
	    get : function(i) { return this.data[this.names[i]]; }
	};
	return x;
    }

}

Numeric = function(x) 
{
    var i;
    if (x instanceof Array) {
	this.data = [];
	for (i = 0; i < x.length; i++) this.data.push(x[i]);
    }
    else this.data = new Array(x); // x=length
}

Numeric.prototype = StdPrototypes.Numeric();

Matrix = function(x, ncol, nrow) 
{
    var i;
    this.data = [];
    for (i = 0; i < x.length; i++) { this.data.push(x[i]); }
    if (!ncol && !nrow) { this.dim = [x.length, 0]; }
    else if (ncol * nrow == x.length) { this.dim = [ncol, nrow]; }
    else { throw ("Dimension mismatch: " + ncol + " * " + nrow + " != " + x.length); }
    // else { throw "Dimension mismatch"; }
}

Matrix.prototype = StdPrototypes.Matrix();

List = function(x) 
{
    var nm;
    this.data = { };
    for (nm in x) {
	this.data[nm] = x[nm];
	this.names.push(nm);
    }
}

List.prototype = StdPrototypes.List();




