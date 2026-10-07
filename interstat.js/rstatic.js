
// utilities - static functions analogous to those in R

// The advantage for making it a function call rather than a static
// Object is the availability of a closure so that member functions
// can call each other.

// var Rstatic = {

//     stopifnot : function()
//     {
// 	for (i in arguments) {
// 	    if (!arguments[i]) throw "Assertion failed: " + i;
// 	}
//     },

//     stop : function()
//     {
// 	var msg = "";
// 	for (i in arguments) {
// 	    msg += arguments[i];
// 	}
// 	throw msg;
//     },

//     warning : function()
//     {
// 	var msg = "";
// 	for (i in arguments) {
// 	    msg += arguments[i];
// 	}
// 	console.log(msg);
//     },

//     is : function(x, t)
//     {
// 	return x instanceof t;
//     },

//     modifyObject : function(x, val) 
//     {
// 	stopifnot(is(x, Object), is(val, Object))
// 	for (v in val) {
// 	    if (is(x[v], Object) && is(val[v], Object)) {
// 		x[v] = modifyObject(x[v], val[v]);
// 	    }
// 	    else {
// 		x[v] = val[v];
// 	    }
// 	}
//     },

//     c : function() {
// 	var i, j, ans = [];
// 	for (i in arguments) {
// 	    if (arguments[i] instanceof Array) {
// 		for (j in arguments[i]) {
// 		    ans.push(arguments[i][j]);
// 		}
// 	    } 
// 	    else ans.push(arguments[i]); // typically number, but not sure how to check
// 	}
// 	return ans;
//     },

//     cumsum : function(x) {
// 	var i, psum = 0, ans = [];
// 	for (i in x) {
// 	    psum += x[i];
// 	    ans.push(psum);
// 	}
// 	return ans;
//     },

//     diff2 : function(x) {
// 	if (x.length !== 2) throw "diff2 is only for length-2 arrays";
// 	return x[1] - x[0];
//     },

//     sum2 : function(x, y) { 
// 	return x + y;
//     },

//     // x.reduce(function(previousValue, currentValue, index, array), [initialValue])

//     sum : function(x) {
// 	return x.reduce(sum2, 0);
//     },

//     // something to do like x[x < 0] <- 0.  Warning: changes x

//     replace: function(x, testfun, val) {
// 	for (i in x) {
// 	    if (testfun(x[i])) x[i] = val;
// 	}
//     },
    
//     // something to do like x[x < 0]





//     testEqual : function(val) {
// 	return function(u) {
// 	    return (u === val);
// 	}
//     },
//     testGreaterThan : function(val) {
// 	return function(u) {
// 	    return (u > val);
// 	}
//     },
//     testLessThan : function(val) {
// 	return function(u) {
// 	    return (u < val);
// 	}
//     },
//     addTo : function(val) {
// 	return function(u) {
// 	    return (u + val);
// 	}
//     },
//     multiplyBy : function(val) {
// 	return function(u) {
// 	    return (u * val);
// 	}
//     }
// }


var Rstatic = function() {

    var stopifnot = function()
    {
	for (i in arguments) {
	    if (!arguments[i]) throw "Assertion failed: " + i;
	}
    }

    var stop = function()
    {
	var msg = "";
	for (i in arguments) {
	    msg += arguments[i];
	}
	throw msg;
    }

    var warning = function()
    {
	var msg = "";
	for (i in arguments) {
	    msg += arguments[i];
	}
	console.log(msg);
    }

    var is = function(x, t)
    {
	return x instanceof t;
    }

    var modifyObject = function(x, val) 
    {
	if (!val) return x;
	stopifnot(is(x, Object), is(val, Object))
	for (v in val) {
	    if (is(x[v], Object) && is(val[v], Object)) {
		x[v] = modifyObject(x[v], val[v]);
	    }
	    else {
		x[v] = val[v];
	    }
	}
	return x;
    }

    var c = function() {
	var i, j, ans = [];
	for (i in arguments) {
	    if (arguments[i] instanceof Array) {
		for (j in arguments[i]) {
		    ans.push(arguments[i][j]);
		}
	    } 
	    else ans.push(arguments[i]); // typically number, but not sure how to check
	}
	return ans;
    }

    var seq_len = function(n) {
	var i, ans = new Array(n);
	for (var i = 0; i < n; i++) {
	    ans[i] = i + 1;
	}
	return ans;
    }

    var seq_by = function(from, to, by) {
	var i, n = Math.ceil(0.5 + (to-from) / by);
	var ans = new Array(n);
	ans[0] = from;
	for (i = 1; i < n; i++) {
            ans[i] = ans[i-1] + by;
	}
	return ans;
    }

    var rep = function(x, times) {
	var i, j, n = x.length * times;
	var ans = new Array(n);
	for (i = 0; i < x.length; i++) {
            for (j = 0; j < times; j++) {
		ans[j * x.length + i] = x[i];
            }
	}
	return ans;
    }

    var cumsum = function(x) {
	var i, psum = 0, ans = [];
	for (i in x) {
	    psum += x[i];
	    ans.push(psum);
	}
	return ans;
    }

    var diff2 = function(x) {
	if (x.length !== 2) throw "diff2 is only for length-2 arrays";
	return x[1] - x[0];
    }

    var sum2 = function(x, y) { 
	return x + y;
    }

    // x.reduce(function(previousValue, currentValue, index, array), [initialValue])

    var sum = function(x) {
	return x.reduce(sum2, 0);
    }

    // something to do like x[x < 0] <- 0.  Warning: changes x

    var replace = function(x, testfun, val) {
	for (i in x) {
	    if (testfun(x[i])) x[i] = val;
	}
    }
    


    var testEqual = function(val) {
	return function(u) {
	    return (u === val);
	}
    }

    var testGreaterThan = function(val) {
	return function(u) {
	    return (u > val);
	}
    }

    var testLessThan = function(val) {
	return function(u) {
	    return (u < val);
	}
    }

    var addTo = function(val) {
	return function(u) {
	    return (u + val);
	}
    }

    var multiplyBy = function(val) {
	return function(u) {
	    return (u * val);
	}
    }

    var factorial = function(n) {
	var i, p = 1;
	for (i = 1; i <= n; i++) p *= i;
	return p;
    }

    var choose = function(n, k) {
	var i, p = 1;
	if (k > n-k) k = n-k;
	for (i = 1; i <= k; i++) p *= ((n-i+1)/i);
	return p;
    }

    // Vectorization helpers
    var vectorize1 = function(fn) {
        return function(x) {
            if (x instanceof Array || ArrayBuffer.isView(x)) return x.map(fn);
            return fn(x);
        }
    }

    var vectorize2 = function(fn) {
        return function(x, y) {
            var isArrX = x instanceof Array || ArrayBuffer.isView(x);
            var isArrY = y instanceof Array || ArrayBuffer.isView(y);
            if (!isArrX && !isArrY) return fn(x, y);
            if (isArrX && !isArrY) return x.map(function(v) { return fn(v, y); });
            if (!isArrX && isArrY) return y.map(function(v) { return fn(x, v); });
            var n = Math.min(x.length, y.length);
            var result = new Array(n);
            for (var i = 0; i < n; i++) result[i] = fn(x[i], y[i]);
            return result;
        }
    }

    // Vectorized Math Operations
    var add = vectorize2(function(a, b) { return a + b; });
    var sub = vectorize2(function(a, b) { return a - b; });
    var mult = vectorize2(function(a, b) { return a * b; });
    var div = vectorize2(function(a, b) { return a / b; });
    var abs = vectorize1(Math.abs);
    var sqrt = vectorize1(Math.sqrt);
    var exp = vectorize1(Math.exp);
    var log = vectorize1(Math.log);

    // Vectorized Relational and Logical Operations
    var eq = vectorize2(function(a, b) { return a === b; });
    var neq = vectorize2(function(a, b) { return a !== b; });
    var lt = vectorize2(function(a, b) { return a < b; });
    var gt = vectorize2(function(a, b) { return a > b; });
    var le = vectorize2(function(a, b) { return a <= b; });
    var ge = vectorize2(function(a, b) { return a >= b; });
    var and = vectorize2(function(a, b) { return a && b; });
    var or = vectorize2(function(a, b) { return a || b; });
    var not = vectorize1(function(a) { return !a; });

    // Vectorized ifelse
    var ifelse = function(cond, yes, no) {
        var isArrCond = cond instanceof Array || ArrayBuffer.isView(cond);
        if (!isArrCond) return cond ? yes : no;
        var isArrYes = yes instanceof Array || ArrayBuffer.isView(yes);
        var isArrNo = no instanceof Array || ArrayBuffer.isView(no);
        var result = new Array(cond.length);
        for (var i = 0; i < cond.length; i++) {
            var yVal = isArrYes ? yes[i % yes.length] : yes;
            var nVal = isArrNo ? no[i % no.length] : no;
            result[i] = cond[i] ? yVal : nVal;
        }
        return result;
    }
    
    // Aggregations
    var max = function(x) { return Math.max.apply(null, x); }
    var min = function(x) { return Math.min.apply(null, x); }
    var range = function(x) { return [min(x), max(x)]; }
    var mean = function(x) { return sum(x) / x.length; }
    var length = function(x) { return (x instanceof Array || ArrayBuffer.isView(x)) ? x.length : 1; }

    var ans = {

	stopifnot : stopifnot,
	stop : stop,
	warning : warning,
	is : is,
	modifyObject : modifyObject,
	c : c,
	seq_len : seq_len,
	seq_by : seq_by,
	rep : rep,
	cumsum : cumsum,
	diff2 : diff2,
	sum2 : sum2,
	sum : sum,
	replace: replace,
	testEqual : testEqual,
	testGreaterThan : testGreaterThan,
	testLessThan : testLessThan,
	addTo : addTo,
	multiplyBy : multiplyBy,
	factorial : factorial,
	choose : choose,

    // New additions
    add: add, sub: sub, mult: mult, div: div,
    abs: abs, sqrt: sqrt, exp: exp, log: log,
    eq: eq, neq: neq, lt: lt, gt: gt, le: le, ge: ge,
    and: and, or: or, not: not, ifelse: ifelse,
    max: max, min: min, range: range, mean: mean, length: length

    }
    return ans;
}()

