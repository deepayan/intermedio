
# Javascript: A quick reference #

## Comparison with R ##

FIXME: Need to look into TypedArrays.

Javascript has several similarities with R, and the goal of this
document is to introduce someone familiar with R to the capabilities
of Javascript.  Before going into the details, let us quickly outline
the _dissimilarities_, i.e., the things that _cannot_ be done in
Javascript but are taken for granted in R.

1. There is no concept of an unevaluated ('quoted') expression.  Of
   course, strings can be used for that purpose, and such strings can
   be evaluted as well, even within a 'scope':

		a = { foo : 1, bar : 2 };
		b = { p : 3 }
		with(a) { 
		    with (b) {
		        eval('(foo + bar) << p');
		    }
		}

   However, these strings cannot be explicitly parsed and the syntax
   tree computed on.  We can of course write our own parser to deal
   with this.

2. Operators cannot be defined or overloaded.  For example, we cannot
   define matrix objects whose elements can be accessed using a
   `x[i,j]` syntax, or added elementwise by `x + y` or matrix product
   computed by `x %*% y`. 

3. No default arguments of functions.  However, if all arguments are
   combined into an object and that treated as a single arguments,
   individual elements could be missing (`undefined`).
   
4. No lazy evaluation.



## Basic features ##

As in most scripting languages, types are associated with values, not
with variables (dynamic typing).  Javascript is garbage-collected, so
one usually does not delete anything (although that can be done using
`delete x`).

JavaScript allows *Run-time evaluation*.  The `eval` function can
execute statements provided as strings at run-time.

Javascript's syntax is similar to that of C.

	for(i = 0; i < a.length; i++) {
        if (a[i] == x) return i;
	}

JavaScript is almost entirely object-based. JavaScript objects are
associative arrays (values with named *properties*, similar to
attributes in R), augmented with prototypes (see below). Object
property names are string keys.  `obj.x = 10` and `obj['x'] = 10` are
equivalent, the dot notation being syntactic sugar.  Properties and
their values can be added, changed, or deleted at run-time.

Functions are first-class objects which can be stored as properties,
passed as arguments, and returned as results.  Properties that are
functions are also called *methods*.  Functions themselves may and do
have properties and methods, such as `.call()` and
`.bind()`. Functions may be defined within another function. Such a
function is created each time the outer function is invoked, and forms
a lexical closure which may be retained even after the outer function
finishes running, e.g., if the inner function is returned or assigned
to an outer variable.

Javascript comes with shorthands (literals) for common datatypes.

	var digits = [3, 1, , 1, , , 5, 9]; // Array()
	var img = { width: 320, height:160, src: "images/foo.png" }; // Object()
	var email = /([^@]*)@([^@]*)/; // RegExp()

Variable assignments copy reference, not value.  For example, 

	var img2 = img;
	img2.width; // 320
	img.width = 300;
	img2.width; // also 300


### JavaScript Object Notation (JSON) ###

JSON is a popular, lightweight data interchange format.  See the R
package [rjson](http://cran.r-project.org/web/packages/rjson/).



### Prototypes for object-oriented programming ###

Javascript doesn't have classes.  Instead, it uses prototypes.  See
[Wikipedia article](http://en.wikipedia.org/wiki/Prototype-based_programming).

Basically this means that objects *inherit* properties from a
prototype, which is another actual object (not a *class description*).

	var foo = {name: "foo", one: 1, two: 2};
	var bar = {two: "two", three: 3};
	bar.one; // undefined
	bar.__proto__; // undefined
	bar.__proto__ = foo;
	bar.one; // 1
	bar.two; // "two", not 2

This is done using *delegation*, which means that a requested property
is found simply by following a series of delegation pointers (from
object to its prototype) until a match is found. All that is required
to establish this behavior-sharing between objects is the pointer
(`bar.__proto__` above).  To distinguish between an object's own
properties and those inherited through delegation, objects have a
`hasOwnProperty()` method.


	bar.hasOwnProperty('two'); // true
	bar.hasOwnProperty('name'); // false

Many Javascript engines allow changing the prototype (as done above),
but this is not guaranteed by the ECMAscript specification, and is not
a good idea anyway.

Because prototypes are stored as pointers, it is possible to change
properties of an ancestor after an object has been created.

	bar.four; // undefined
	foo.four = 4;
	bar.four; // 4

One can loop through enumerable properties using a `for` loop (more on
this later).

	for (i in bar) alert(i);


### Functions as object constructors ###

In addition to their usual role, functions also act as object
constructors.  This is the canonical way to create custom objects.

Prefixing a function call with `new` will execute the function as
usual, but instead of the usual return value (if any), it will return
the value of the `this` variable.  `this` is initialized to
`Object()`, and then may or may not be modified inside the function.
By convention, names of constructors are capitalized, and they are
used only as constructors.

Here is an example

	Add = function(x, y) { this.prod = x * y; return x + y };
	Add(10, 20); // 30
	z = new Add(20, 30); // Add {prod: 600}

Using `new` does a few extra things: objects get a property called
`constructor`, which points at the constructor function.  This
essentially means that we can test for *class* (or whatever):

	z instanceof Add; // true

If the function has a `.prototype` property, then it will be used as
the internal prototype for `this` (otherwise the prototype will be
`Object()`.

	Add.prototype = { message: "Hello!" };
	z = new Add(20, 30); // Add {prod: 600, message: "Hello!"
	z.hasOwnProperty('prod'); // true
	z.hasOwnProperty('message'); // false

New *inherited methods* can be added after instantiation by modifying
the prototype used as a constructor (but it is generally considered
bad practice to modify the `Object` prototype).


### Functions as methods ###

When a function is called as a method of an object, the function's
local `this` keyword is bound to that object for that invocation (when
called globally in a browser run-time environment, `this` will usually
be the global variable `window`).

Two special properties a function has are `call` and `apply`.  `apply`
is like `do.call()` in R, and has two arguments.  The first is the
variable to be used as `this` (may be `null`), and the second is an
`Array` of arguments.

	sum = function(x, y, z) { 
		var ans = x + y + z; 
		this.total = ans; // warning: this.sum may override global sum
		return ans; 
	}
	sum(1, 2, 3); // 6
	sum.apply(null, [1, 3, 5]); // 9
	a = {};
	sum.apply(a, [1, 2, 3]); // 6
	a; // Object {total: 6}

`call` is not really different from a direct function call, except
that it has an extra (first) argument specifying `this`.
	
	sum.call(null, 1, 3, 5);



### Variadic functions ###

An indefinite number of parameters can be passed to a function. The
function can access them through formal parameters and also through
the local `arguments` object (which is an array, not an object; see
below).

	function list(a, b) { alert(a); return(arguments); }
	list(1, 2, "three", {c: 3, d: 4});

Variadic functions can also be created by using the `apply` method.

## Syntax ##

See [Wikipedia](http://en.wikipedia.org/wiki/JavaScript_syntax).

### Primitive data types ###

`undefined`, `null`, `Number()` (equivalent to `double`), `Infinity`,
`NaN`, `String()`, `true`, `false`.

Use `toFixed()` for formatting numbers.  E.g.,

	a = 0.94 - 0.01
	a
	a.toFixed(3)

Strings are coerced to Numbers. 

	-a.toFixed();
	Number(a.toFixed());

String literals are quoted using `"` or `'`.  Strings are immutable.

	var greeting = "Hello, world!";
	greeting.charAt(0);
	greeting[0];
	
	greeting[0] = "M";
	greeting; // no change
	
This is possibly because string literals don't make new copies.

	message = "Hello, world!";
	message == greeting; // true

Can also use the `String()` constructor.

	greeting = new String("Hello, world!");
	message = new String("Hello, world!");

This makes an `Object`, not `Array` (but still immutable).

	greeting == message; // false
	greeting.valueOf() == message.valueOf(); // false


### Native objects ###

JavaScript provides a handful of native objects.  The most important
of these is `Array`.  `Object`-s are more or less like `list` in R,
that is, they have named keys that can contain any other `Object`.
Contrary to what one might expect, `Array`-s are not like vectors in C
or R.  Rather, they are also like lists that can contain arbitrary
elements, except that they are indexed by integers.  They can also
have (other) properties (indexed only by name), so they are also
`Object`s in that sense.

Apart from these, the runtime environment will usually define some
*host* objects (for example, DOM elements like `window`, `form`,
etc. in a browser).


#### Array ####

`Array`s are Data values indexed by integer keys (starting from 0),
prototyped with methods and properties to aid in routine tasks (for
example, `join`, `slice`, `push`, and `pop`).  Indexing is of the form
`x[i]`.  They can be created using

	myArray = [0, 1, , , 4, 5]; // missing elements are undefined
	myArray = new Array(0, 1, 3, undefined, 4, 5);
	myArray = new Array(365); // empty array with length 365

	[1,2,3].join("-") // "1-2-3"
	[1,2,3].forEach(alert);

#### Date ####

A `Date` object stores a signed millisecond count with zero
representing 1970-01-01 00:00:00 UTC.

	new Date() // Current time/date.
	new Date(2010, 2, 1) // 2010-Mar-01 00:00:00. Note months are zero-based
	new Date(2010, 2, 1, 14, 25, 30) // 2010-Mar-01 14:25:30
	new Date("2010-3-1 14:25:30")

There are several methods to extract fields.  All properties specific
to `Date` can be listed by

	Object.getOwnPropertyNames(Date.prototype).join(", ")

which gives

	"constructor, toString, toDateString, toTimeString,
	toLocaleString, toLocaleDateString, toLocaleTimeString, valueOf,
	getTime, getFullYear, getUTCFullYear, getMonth, getUTCMonth,
	getDate, getUTCDate, getDay, getUTCDay, getHours, getUTCHours,
	getMinutes, getUTCMinutes, getSeconds, getUTCSeconds,
	getMilliseconds, getUTCMilliseconds, getTimezoneOffset, setTime,
	setMilliseconds, setUTCMilliseconds, setSeconds, setUTCSeconds,
	setMinutes, setUTCMinutes, setHours, setUTCHours, setDate,
	setUTCDate, setMonth, setUTCMonth, setFullYear, setUTCFullYear,
	toGMTString, toUTCString, getYear, setYear, toISOString, toJSON"


#### Error ####

`Error` objects allow creation of new errors.

	throw new Error("Something unexpected happened.");

Errors can be caught using try-catch constructs.

	try {
		// Statements in which exceptions might be thrown
	} catch(errorValue) {
		// Statements that execute in the event of an exception
	} finally {
		// Statements that execute afterward either way
	}

#### Math ####

The Math object contains various math-related constants and functions.

	E, LN10, LN2, LOG2E, LOG10E, PI, SQRT1_2, SQRT2, random, abs,
	acos, asin, atan, ceil, cos, exp, floor, log, round, sin, sqrt,
	tan, atan2, pow, max, min, imul

#### Regular expressions ####

See [MDN article](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions)

#### Functions ####

This is an anonymous function:

	(function(x, y) { return x + y; })(10, 11);

The following are equivalent (?) ways to bind it to a variable.

	add = function(x, y) { return x + y; } // like R
	function add(x, y) { return x + y; } // like C
	add = new Function('x', 'y', 'return x+y');
	add(10, 11);
	add.length; // expected number of arguments


#### Operators ####

`+` is overloaded, and applies to numbers and strings (but it doesn't
seem that further overloading for custom objects is possible).  Binary
arithmetic operators are (all floating point)

	+ - * / %

Unary operators are 

	+ - ++ --

Assignment operators are (`+=` works for strings as well)

	= += -= *= /= %=

Assignment of primitives or literals create new objects.  Assignment
of existing objects assign references to the object without making a
copy.

Comparison operators are

	==    Equal
	!=    Not equal
	>     Greater than
	>=    Greater than or equal to
	<     Less than
	<=    Less than or equal to
	===   Identical (equal and of the same type)
	!==   Not identical


Two objects are equal only if their references are equal (not value).

Logical operators are 

	! || &&

Short-circuit evaluation is supported, that is, `A && B` will not
evaluate `B` if `A` is `false`.

Bitwise operators are

	& | ^ (XOR) << >> (sign propagating) >>>  ~ (unary NOT)


#### Control structures ####

The following constructs are allowed:

	if (cond1) { ... } else if (cond2) { ... } else { ... }

	?? if (expr; cond1) { ... } else if (cond2) { ... } else { ... }

	result = condition ? expression : alternative;
	
	while (cond) { ... }
	
	do { ... } while (cond);

	with (object) { ... } // object becomes default object

	switch (expr) {
		case SOMEVALUE: expr1; break;
		case ANOTHERVALUE: expr1; break;
		default: expr3; break; // last break unnecessary
	}

Here case values can be string literals.

For loops have two variants.  The second loops over *enumerable*
properties.

	for (initial; condition; loop statement) { ... }
	
	for (initial; condition; loop statement(iteration)) // one statement
	
	for (var key in myobject) { ... }

For example, the `for ... in` form can be used to get enumerable
properties of an object:

	anames = function(x) {
		var nm;
		var ans = [];
		for (nm in x) {
			ans.push(nm);
		}
		return ans;
	}

	onames = function(x) { // skip inherited properties
		var nm;
		var ans = [];
		for (nm in x) {
			if (x.hasOwnProperty(nm)) ans.push(nm);
		}
		return ans;
	}

This will not work for non-enumerable properties, e.g., `anames(Math)`
will not give anything because its properties are not enumerable.  For
those, use `Object.getOwnPropertyNames(Math)` instead.

## Cloning objects ##

Making a deep copy of a javascript object seems non-trivial (there is
no official language construct to do it).  One legitimate question is
whether to clone inherited properies, but 'yes' cannot be a reasonable
answer to that.


[Apparently](http://stackoverflow.com/questions/122102/most-efficient-way-to-clone-an-object)
a commonly option is to use jQuery (which we will not use).  Another
option, which should be OK when it works, is to use

	var newObject = JSON.parse(JSON.stringify(oldObject));

A simple function, which will hopefully be faster, to do this might be

	function clone(obj) {
	    var target = {};
   	    for (var i in obj) {
    	        if (obj.hasOwnProperty(i)) {
     	            target[i] = obj[i];
    	        }
   	    }
      	    return target;
  	}

But it doesn't really work:

	x = { a : 1, b : [1,2,3] };
	y = clone(x);
	z = JSON.parse(JSON.stringify(x));

	x.b[1] = 10;
	y.b; // [1, 10, 3]
	z.b; // [1, 2, 3]


A bit more sophisticated version might be

	function clone(obj) {
	    var i, target;
	    if (!(obj instanceof Object)) {
	        return obj; // no copy (number, string, etc.)
	    }
	    if (obj instanceof Function) {
	        return obj; // no copy
	    }
	    if (obj instanceof Array) {
	        target = new Array(obj.length);
		for (i = 0; i < obj.length; i++) {
		    target[i] = clone(obj[i]);
		}
	    }
	    else target = new Object();
   	    for (i in obj) {
    	        if (obj.hasOwnProperty(i)) {
     	            target[i] = clone(obj[i]);
    	        }
   	    }
      	    return target;
  	}
       
This of course does not copy the prototype, nor whatever makes
`instanceof` give the right answer.


## Extra goodies ##

	foo = {a:1, b:2, c:3, d:"four" };
	"c" in a; // true
	"f" in a; // false



## Informative articles ##

1. (Events)[http://www.quirksmode.org/js/introevents.html]

2. (Problems with subclassing arrays)[http://perfectionkills.com/how-ecmascript-5-still-does-not-allow-to-subclass-an-array/]



