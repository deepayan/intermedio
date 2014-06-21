
# interstat.js

Javascript library that provides basis structures for data
manipulation and statistical functions.

Although we are coming from an R background and want everything to be
as R-like as possible, that may not be very Javascript like.  We have
several decisions to make:

1. value vs reference: should functions _never_ modify its arguments?

2. should we have 'generic' static functions like in R, or should we
have methods as object properties, which is more Javascript-like?

I think in both cases we will not take a hard stand.  For the first
case, the preference should be for not modifying arguments.  For
example, order(x) or x.order() should not modify x.

Also, since Javascript doesn't have a reliable way to clone, maybe all
our classes should have a clone() method.

For the second case, the preference should be for object property
methods (like Numeric().summary(), DataFrame().summary(), etc., not
summary(Numeric()) and summary(DataFrame())).



## First question: how to define basic classes and operations.

numeric vector : Numeric()

factor : Factor()

?dates : DateTime() // Date() is alreay taken

One option is to make these 

V.Numeric(), V.Factor(), etc.

matrix/array: special matrices, or general arrays?  Let's start with a
special matrix class as it's conceptually simpler.  Will think about
arrays later.

data frame : DataFrame()


## Common methods: 

 - summary, order, subset (like "[" in R)
 - isValid()
 - clone()
 - all Math methods (vectorized) for numeric -> copy


## Vectorization

Vectorization has no special performance benefits.  So let's implement
it only where it helps stylistically.  For example, we would want
vectorized operations and matrix operations, but not much point in
vectorizing indexing (either extract or replace) of vectors or
matrices.  On the other hand, vectorized extraction is sometimes
helpful (e.g., bootstrapping), so they could be implemented separately
(and usually make copies).

# Files (should be combined in this order?)

- `prototypes.js` contains prototypes of standard constructors.



