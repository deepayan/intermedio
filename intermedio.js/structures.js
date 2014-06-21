
// Port of tessella/R/structures.R


// Structures for abstracting viewports and layouts.

// A "tlayout" has columns and rows, with fixed (pixel) or null
// (expandable) dimensions.  Positive means pixel units, negative
// means null (proportional to absolute value)

tlayout = function(x)
{
    args = modifyObject({ widths : -1, 
			  heights : -1, 
			  parent : NULL, 
			  respect_aspect : FALSE },
			x)

    // parent = NULL means parent viewport is not yet specified.  If
    // non-NULL, we can convert the null units into pixel values.  We
    // will still keep the originals so that we can recompute if
    // (properties of) parent viewport change(s).

    // If respect.aspect=TRUE, then relative (pixel) dimensions of
    // negative x and y units should be respected.

    // FIXME: should we be more parsimonious with refreshLayout()
    // calls? Currently there may be many redundant calls, but not
    // sure if there are benefits.  We may keep a flag, and not re-do
    // if set.
    
    with (args) {
	ans = { 
	    owidths : widths, oheights : heights,
            widths : NULL, heights : NULL,
            respect_aspect : respect_aspect,
            parent : parent,
	    rclass : "tlayout"
	};
    }
    // if (!is.null(parent)) ans = refreshLayout(ans)
    return ans;
}


// refreshLayout() computes actual width/height based on available
// space for "null" units, i.e., negative values indicating
// space-filling lengths. NA's (which indicate that the owner doesn't
// care) are taken as 0.

refreshLayout = function(x)
{
    var respect, wtotal, htotal, available_wnull, available_hnull, wnull, hnull;
    var desired_aspect, negWidth, totalNegWidth, negHeight, totalNegHeight;
    with (Rstatic) {
	if (x.parent === NULL) {
            x.widths = x.heights = NULL;
	}
	else {
            respect = x.respect_aspect
            x.widths = x.owidths
            x.heights = x.oheights
	    replace(x.widths, testEqual(NA), 0); // x.widths[is_na(x.widths)] = 0
            replace(x.heights, testEqual(NA), 0); // x.heights[is_na(x.heights)] = 0
            wtotal = x.parent.w
            htotal = x.parent.h
            // print(list(wtotal, htotal))
            available_wnull = wtotal - sum(x.owidths.filter(testGreaterThan(0))); //  [x.owidths > 0]) // FIXME
            available_hnull = htotal - sum(x.oheights.filter(testGreaterThan(0))); // [x.oheights > 0]) // FIXME
            if (available_wnull < 0 || available_hnull < 0) 
            {
		if (respect) stop("Not enough space available (", 
				  available_wnull, ", ", available_hnull, ")",
				  " and respect = TRUE")
		else
                    warning("Not enough space available (", available_wnull, ", ", available_hnull, ")")
            }
            wnull = x.owidths.filter(testLessThan(0)).map(multiplyBy(-1)); // -x.owidths[x.owidths < 0] // FIXME
            hnull = x.oheights.filter(testLessThan(0)).map(multiplyBy(-1)); // -x.oheights[x.oheights < 0] // FIXME
            if (respect)
            {
		// available - available_wnull, available_hnull. Which has extra?
		desired_aspect = sum(hnull) / sum(wnull)
		// available_hnull / available_wnull == desired_aspect # ideal
		if (available_hnull / available_wnull < desired_aspect) {
                    // more width available than necessary
                    available_wnull = available_hnull / desired_aspect
		}
		else {
                    // more height available than necessary 
                    available_hnull = available_wnull * desired_aspect
		}
            }
            // x.widths[x.owidths < 0] =
	    // 	available_wnull * prop_table(-x.owidths[x.owidths < 0])
            // x.heights[x.oheights < 0] =
	    // 	available_hnull * prop_table(-x.oheights[x.oheights < 0])
	    stopifnot(x.widths.length === x.owidths.length, 
		      x.heights.length === x.oheights.length);
	    negWidth = x.owidths.map(testLessThan(0));
	    // want to distribute available_wnull among these
	    totalNegWidth = sum(x.owidths.filter(testLessThan(0)));
	    for (i in negWidth) {
		if (negWidth[i]) {
		    x.widths[i] = available_wnull * x.owidths[i] / totalNegWidth;
		}
	    }
	    negHeight = x.oheights.map(testLessThan(0));
	    // want to distribute available_wnull among these
	    totalNegHeight = sum(x.oheights.filter(testLessThan(0)));
	    for (i in negHeight) {
		if (negHeight[i]) {
		    x.heights[i] = available_wnull * x.oheights[i] / totalNegHeight;
		}
	    }
	}
    }
    return x;
}


// All plotting is done in a context, represented as an abstract
// surface defined by bottom-left (or top-left if invert_y = TRUE ==> WHICH IS THE CASE FOR canvas)
// corner (x, y) and size (w, h) expected to represent raster (pixel)
// coordinates.  Primitives work in this coordinate system.  Layout
// heights/widths are also in terms of this coordinate system.

// The actual context (and primitives) will ultimately have to be
// provided by the rendering backend, but the functions here try to do
// as much of the common work as possible using this abstraction.

tcontext = function(x, y, w, h)
{
    var invert_y = TRUE;
    return { 
	x : x, y : y, w : w, h : h, 
	invert_y : invert_y, 
	rclass : "tcontext" 
    };
}

// A viewport can be either a subviewport of a parent viewport, or of
// a parent layout (which itself must have a parent viewport)

tviewport = function(parent, margs)
{
    var rmethod = tviewport[parent.rclass];
    if (rmethod) { return rmethod(parent, margs); }
    else if (tviewport.rdefault) { return tviewport.rdefault(parent, margs); }
    else throw "tviewport method not found";
}

// The parent argument can be a "tcontext".  The resulting viewport
// fills the whole context by default.

tviewport.tcontext = function(parent, margs)
{
    with (Rstatic) {
	args = modifyObject({ x : parent.x, y : parent.y,
			      w : parent.w, h : parent.h,
			      xlim : c(0, 1), ylim : c(0, 1) },
			    margs); 
	with (args) {
	    ans = {
		parent : NULL,
		context : parent,
		x : x, y : y, w : w, h : h,
		xlim : xlim, ylim : ylim,
		rclass : "tviewport"
	    };
	}
    }
    return ans
}

// The parent argument is usually another "tviewport".  The original
// context has to be recorded.

// [xywh] is supplied in parent's native coordinates, but stored in
// canvas coordinates. (FIXME: is that a good idea? For many layers of
// nesting, rounding errors might combine to produce visible effects.)
// So supplied (x,y) is always bottom-left in parent viewportt
// coordinates, but stored (x,y) is (top-left), (x+w,y+h) is
// (bottom-right) in canvas coordinates (unless invert.y = FALSE,
// when top => bottom).

// xlim|ylim are 2-vectors giving (bottom-left) and (top-right)
// corners (Cartesian coordinates)

// default (should) produce subviewport with full extents (useful to
// have a version with different limits)

tviewport.tviewport =
    function(parent, margs)
{
    with (Rstatic) {
	var args = modifyObject({ x : parent.xlim[0], y : parent.ylim[0],
				  w : diff2(parent.xlim), h : diff2(parent.ylim),
				  xlim : c(0.0, 1.0), ylim : c(0.0, 1.0) },
				margs);

	with (args) {
	    ans = {
		parent : parent,
		context : parent.context,
		xlim : xlim, ylim : ylim,
		rclass : "tviewport" 
	    };
	    // ans.x = parent.x + parent.w * (x - parent.xlim[1]) / diff(parent.xlim);
	    // ans.y = parent.y + parent.h * (parent.ylim[2] - (y + h)) / diff(parent.ylim);
	    ans.x = x2pixel(x, parent);
	    if (parent.context.invert_y) ans.y = y2pixel(y + h, parent);
	    else ans.y = y2pixel(y, parent);
	    if (diff2(parent.xlim)) ans.w = parent.w * w / diff2(parent.xlim); 
	    else ans.w = 0;
	    if (diff2(parent.ylim)) ans.h = parent.h * h / diff2(parent.ylim);
	    else ans.h = 0;
	}
    }
    return ans;
}


// layouts are always assumed to number rows increasing top-to-bottom

tviewport.tlayout =
    function(parent, columns, rows, margs)
{
    with (Rstatic) {
	var args = modifyObject({ xlim : c(0, 1), ylim : c(0, 1) },
				margs);

	with (args) {

	    // For now, let us put the restriction that the parent layout must
	    // have a non-null parent viewport
	    if (parent.parent == NULL) stop("parent layout has no parent")
	    parent = refreshLayout(parent)
	    // parent.widths and parent.heights are now in pixels,
	    // parent.parent.x/y are also in pixels, in context coordinates
	    // (which may have y-axis inverted)
	    ans = {
		parent : parent.parent,
		context : parent.parent.context,
		playout : parent,
		columns : columns, rows : rows,
		xlim : xlim, ylim : ylim,
		rclass : "tviewport"
	    };
	
	    // FIXME !!! What are we trying to do here?
	    // xx = cumsum(c(0, parent.widths))[range(columns) + c(0, 1)]
	    // yy = cumsum(c(0, parent.heights))[range(rows) + c(0, 1)]

	    cumx = cumsum(c(0, parent.widths));
	    cumy = cumsum(c(0, parent.heights));
	    xx = [cumx[columns[0]], cumx[columns[columns.length-1] + 1]];
	    yy = [cumy[rows[0]], cumy[rows[rows.length-1] + 1]];

	    ans.x = parent.parent.x + xx[0]
            if (parent.parent.context.invert_y)
		ans.y = parent.parent.y + yy[0]
            else
		ans.y = parent.parent.y + parent.parent.h - yy[1]
	    ans.w = diff2(xx)
	    ans.h = diff2(yy)
	    ans
	}
    }
    return ans;
}


x2pixel = function(x, vp)
{
    return vp.x + vp.w * (x - vp.xlim[0]) / Rstatic.diff2(vp.xlim);
}

y2pixel = function(y, vp)
{
    pixoffset = vp.h * (y - vp.ylim[0]) / Rstatic.diff2(vp.ylim);
    if (vp.context.invert_y) {
        return vp.y + vp.h - pixoffset;
    }
    else {
        return vp.y + pixoffset;
    }
}

pixel2x = function(x, vp)
{
    return vp.xlim[0] + Rstatic.diff2(vp.xlim) * (x - vp.x) / vp.w 
}

pixel2y = function(y, vp)
{
    if (vp.context.invert_y) {
        return vp.ylim[0] + Rstatic.diff2(vp.ylim) * (vp.y + vp.h - y) / vp.h;
    }
    else {
        return vp.ylim[0] + Rstatic.diff(vp.ylim) * (y - vp.y) / vp.h;
    }
}

 
