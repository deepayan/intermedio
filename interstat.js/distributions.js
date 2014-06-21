

// standard distributions

var Distribution = {

    Normal : function(mean, sd)
    {
	if (!mean) mean = 0;
	if (!sd) sd = 1;
	var k;
	with(Math) { k = sqrt(2 * PI) * sd; }
	var norm = {
	    
	    d : function(x) {
		with (Math) {
		    var u = (x - mean) / sd;
		    var ans = exp(-0.5 * (u*u)) / k;
		}
		return ans;
	    },

	    r : function(n) {
		// Box-Muller. Eventually change to ziggurat
		// [http://www.jstatsoft.org/v05/i08/paper]
		var i, t1, t2;
		var x = new Numeric(n);
		with (Math) {
		    for (i = 0; i < n; i += 2) {
			t1 = sqrt(-2 * log(random()));
			t2 = 2 * PI * random();
			x.set(i, mean + sd * t1 * cos(t2));
			x.set(i + 1, mean + sd * t1 * sin(t2));
		    }
		}
		if (x.length() > n) { x.setlength(n); }
		return x;
	    }

	}
	return norm;
    },

    Exponential : function(rate)
    {
	if (!rate) rate = 1;
	var expon = {
	    
	    d : function(x) {
		with (Math) {
		    var ans = rate * exp(-rate * x);
		}
		return ans;
	    },

	    p : function(x) {
		with (Math) {
		    var ans = 1 - exp(-rate * x);
		}
		return ans;
	    },

	    r : function(n) {
		var i, t1, t2;
		var x = new Numeric(n);
		with (Math) {
		    for (i = 0; i < n; i++) {
			x.set(i, -log(random()) / rate);
		    }
		}
		return x;
	    }

	}
	return expon;
    }, 

    Uniform : function(smin, smax)
    {
	if (!smin) smin = 0;
	if (!smax) smax = 1;
	var k = 1 / (smax - smin);
	var unif = {
	    
	    d : function(x) {
		var ans;
		if (x >= smin && x <= smax) ans = k;
		else ans = 0;
		return ans;
	    },

	    p : function(x) {
		var ans;
		if (x >= smin && x <= smax) ans = (x - smin) * k;
		else if (x < smin) ans = 0;
		else ans = 1;
		return ans;
	    },

	    r : function(n) {
		var i, s = 1/k;
		var x = new Numeric(n);
		with (Math) {
		    for (i = 0; i < n; i++) {
			x.set(i, smin + s * random());
		    }
		}
		return x;
	    }

	}
	return unif;
    },

    Binomial : function(size, prob)
    {
	var binom = {
	    
	    d : function(x) {
		var ans;
		if (x < 0 || x > size) ans = 0; 
		else {
		    with (Math) {
			ans = Rstatic.choose(size, x) * pow(prob, x) * pow(1-prob, size - x);
		    }
		}
		return ans;
	    },

	    p : function(x) {
		var i, k = floor(x), ans = 0;
		if (k < 0) ans = 0; 
		else if (k >= size) ans = 1;
		else {
		    with (Math) {
			for (i = 0; i <= x; i++) {
			    ans += Rstatic.choose(size, i) * pow(prob, i) * pow(1-prob, size - i);
			}
		    }
		}
		return ans;
	    },

	    r : function(n) {
		var i, j, count;
		var x = new Numeric(n);
		with (Math) {
		    for (i = 0; i < n; i++) {
			count = 0;
			for (j = 0; j < size; j++) { 
			    if (random() < prob) count++;
			}
			x.set(i, count);
		    }
		}
		return x;
	    }

	}
	return binom;
    }, 

}

// Usage:

// n = Distribution.Normal(0, 1)
// n.r(10);


