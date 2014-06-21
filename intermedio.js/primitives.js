

// R-like graphics primitives using canvas API

var rcanvas = function() {

    var modifyPar = Rstatic.modifyObject; // for updating gpar with defaults

    var ans = {

	points : function(x, y, context, gpar)
	{
	    var i;
	    var gp = modifyPar({ pch : 1, fill : FALSE, stroke : "black", cex : 1 },
			       gpar);
	    if (gp.pch !== 1) throw "Only pch : 1 is currently supported";
	    context.strokeStyle = gp.stroke;
	    if (gp.fill === TRUE) context.fillStyle = gp.stroke;
	    else if (gp.fill !== FALSE) context.fillStyle = gp.fill;
	    var symbolFun = function(x, y) {
		context.beginPath();
		context.arc(x, y, 5 * gp.cex, 0, Math.PI * 2, true);
		context.closePath();
		if (gp.fill !== FALSE) context.fill(); // for many, may be better to have separate symbolFun?
		context.stroke();
	    }
	    for (i = 0; i < x.length; i++)
	    {
		symbolFun(x[i], y[i]);
	    }
	},

	lines : function(x, y, context, gpar)
	{
	    var i;
	    var gp = modifyPar({ stroke : "black", lwd : 1 },
			       gpar);
	    if (x.length < 2) return;
	    // draw lines [FIXME: NA/NaN ?]
	    context.strokeStyle = gp.stroke;
	    context.lineWidth = gp.lwd;
	    context.beginPath();
	    context.moveTo(x[0], y[0]);
	    for (i = 1; i < x.length; i++)
	    {
		context.lineTo(x[i], y[i]);
	    }
	    context.stroke();
	},

	segments : function(x0, y0, x1, y1, context, gpar)
	{
	    var i;
	    var gp = modifyPar({ stroke : "black", lwd : 1 },
			       gpar);
	    if (x0.length < 1) return;
	    // draw lines [FIXME: NA/NaN ?]
	    context.strokeStyle = gp.stroke;
	    context.lineWidth = gp.lwd;
	    context.beginPath();
	    for (i = 0; i < x0.length; i++)
	    {
		context.moveTo(x0[i], y0[i]);
		context.lineTo(x1[i], y1[i]);
	    }
	    context.stroke();
	},

	// col = NA, border = NULL, lty = par("lty"), lwd = par("lwd"), 
	rect : function(xleft, ybottom, xright, ytop, context, gpar)
	{
	    var i;
	    var gp = modifyPar({ stroke : "black", fill : FALSE, lwd : 1 },
			       gpar);
	    if (xleft instanceof Numeric) xleft = xleft.data;
	    if (ybottom instanceof Numeric) ybottom = ybottom.data;
	    if (xright instanceof Numeric) xright = xright.data;
	    if (ytop instanceof Numeric) ytop = ytop.data;
	    // draw lines [FIXME: NA/NaN ?]

	    context.strokeStyle = gp.stroke;
	    context.lineWidth = gp.lwd;
	    if (gp.fill === TRUE) context.fillStyle = gp.stroke;
	    else if (gp.fill !== FALSE) context.fillStyle = gp.fill;
	    rectFun = function(xl, yb, xr, yt) {
		if (gp.fill !== FALSE) context.fillRect(xl, yt, xr - xl, yb - yt);
		context.strokeRect(xl, yt, xr - xl, yb - yt);
	    }
	    for (i = 0; i < xleft.length; i++)
	    {
		rectFun(xleft[i], ybottom[i], xright[i], ytop[i]);
	    }
	},

	clear : function(xleft, ybottom, xright, ytop, context)
	{
	    context.clearRect(xleft, ybottom, xright - xleft, ytop - ybottom);
	},

	clip : function(xleft, ybottom, xright, ytop, context)
	{
	    context.beginPath();
	    context.moveTo(xleft, ybottom);
	    context.lineTo(xleft, ytop);
	    context.lineTo(xright, ytop);
	    context.lineTo(xright, ybottom);
	    context.closePath();
	    context.clip();
	}, 

	text : function(x, y, labels, context, gpar, align)
	{
	    var i;
	    var gp = modifyPar({ stroke : "black", cex : 1, font : "12pt Arial" },
			       gpar);
	    if (!align) align = "center";
	    if (x instanceof Numeric) x = x.data;
	    if (y instanceof Numeric) y = y.data;
	    // draw text
	    context.font = gp.font;
	    context.fillStyle = gp.stroke;
	    context.textAlign = align;
	    context.textBaseline = "middle";
	    for (i = 0; i < x.length; i++)
	    {
		// rotate context if necessary
		if (gp.rot != null) {
		    context.save();
		    context.translate(x[i], y[i]);
		    context.rotate(-Math.PI * gp.rot / 180);
		    context.fillText(labels[i], 0, 0);
		    context.restore();
		}
		else context.fillText(labels[i], x[i], y[i]);
	    }
	}
    }
    return ans;
}

// tessella API

canvas_primitives = function(canvas)
{

    var context = canvas.getContext('2d'); 
    var width = canvas.width, height = canvas.height;
    var rc = rcanvas();

    // ans will contain lots of functions.  As these are defined
    // inside here, 'context' will be available in the closure of
    // these functions.

    // vectorized versions of x2pixel and y2pixel

    var vx2pixel = function(x, vp) {
	if (x instanceof Numeric) x = x.data;
	return x.map(function(u) { return x2pixel(u, vp); });
    }
    var vy2pixel = function(y, vp) {
	if (y instanceof Numeric) y = y.data;
	return y.map(function(u) { return y2pixel(u, vp); });
    }

    ans = {

	// tdpi : 72,

	tget_context : function() {
            return tcontext(0, 0, width-1, height-1); // or, can make static (any chance width/height can change? maybe)
	},

	tinitialize : function(newpage)
	{
            if (newpage) {
		rc.clear(0, 0, width, height, context);
	    }
	},

	tfinalize : function()
	{
	    true;
	},
    
	// // helper function to compute bounding box after rotation
	// bbox_rot : function(w, h, rot)
	// {
        //     rad = rot / 180 * base::pi
        //     sr = sin(rad)
        //     cr = cos(rad)
        //     m = rbind(c(0, w, w, 0),
        //                c(0, 0, h, h))
        //     r = rbind(c(cr, -sr),
        //                c(sr,  cr))
        //     v = r %*% m
        //     apply(v, 1, function(x) diff(range(x)))
	// },

	// Only points (i.e., no other 'type')
	tpoints : function(x, y, vp, gpar)
	{
	    console.log("tpoints: x - " + x);
            rc.points(vx2pixel(x, vp), vy2pixel(y, vp), context, gpar);
	},
	tlines : function(x, y, vp, gpar)
	{
            rc.lines(vx2pixel(x, vp), vy2pixel(y, vp), context, gpar);
	},
	tsegments : function(x0, y0, x1, y1, vp, gpar)
	{
            rc.segments(vx2pixel(x0, vp), vy2pixel(y0, vp),
			     vx2pixel(x1, vp), vy2pixel(y1, vp),
			     context, gpar);
	},
	tpolygon : function(x, y, vp, gpar)
	{
            rc.polygon(vx2pixel(x, vp), vy2pixel(y, vp), context, gpar);
	},
	ttext : function(x, y, labels, vp, gpar,
			 adj, pos, offset)
	{
	    if (!adj) adj = NULL;
	    if (!pos) pos = NULL;
	    if (!offset) offset = 0.5
            xp = vx2pixel(x, vp)
            yp = vy2pixel(y, vp)
            off = offset * 15 // FIXME tstrheight("M", gpar)
            if (pos !== NULL)
            {
		switch(pos) {
		case 1: 
		    yp = yp - off;
		    adj = [.5, 1];
		    break;
		case 2:
		    xp = xp - off;
		    adj = [1, .5];
		    break;
		case 3:
		    yp = yp + off;
		    adj = [.5, 0];
		    break;
		case 4:
		    xp = xp + off;
		    adj = [0, .5];
		    break;
		default: throw "Invalid value of pos";
		}
	    }
	    rc.text(xp, yp, labels, context, gpar, adj);
	},
	trect : function(xleft, ybottom, xright, ytop, vp, gpar)
	{
            rc.rect(vx2pixel(xleft, vp), vy2pixel(ybottom, vp),
		    vx2pixel(xright, vp), vy2pixel(ytop, vp), 
		    context, gpar);
	},
	tclip : function(vp) 
	{
	    context.save();
            rc.clip(vp.x, vp.y, vp.x + vp.w, vp.y + vp.h, context)
	},
	tunclip : function(vp) 
	{
	    context.restore();
	    // setting clip region to a larger area does not work
            // rc.clip(vp.context.x, vp.context.y, 
	    // 	    vp.context.x + vp.context.w, vp.context.y + vp.context.h, context);
	},
	tstrheight : function(s, gpar)
	{
            // h = tdpi * graphics::strheight(s, units = "inches", cex = cex, font = font, family = family)
            // if (rot == 0 || rot == 180) return(h)
            // w = tdpi * graphics::strwidth(s, units = "inches", cex = cex, font = font, family = family)
            // if (rot == 90 || rot == 270) return(w)
            // n = length(h)
            // rot = rep(rot, length = n)
            // sapply(seq_len(n), function(k) {
	    // 	bbox_rot(w[k], h[k], rot[k])[2]
            // })
	    return 15;
	},
	tstrwidth : function(s, gpar)
	{
            // w = tdpi * graphics::strwidth(s, units = "inches", cex = cex, font = font, family = family)
            // if (rot == 0 || rot == 180) return(w)
            // h = tdpi * graphics::strheight(s, units = "inches", cex = cex, font = font, family = family)
            // if (rot == 90 || rot == 270) return(h)
            // n = length(h)
            // rot = rep(rot, length = n)
            // sapply(seq_len(n), function(k) {
	    // 	bbox_rot(w[k], h[k], rot[k])[1]
            // })
	    return 10 * s.length;
	}
    }
    
    return ans;
}


var cp;

function initCanvas() 
{
    var mycanvas = document.getElementById('mycanvas');
    var cont = mycanvas.getContext('2d');
    cont.save();

    cp = canvas_primitives(mycanvas);
    var tcntxt = cp.tget_context();
    var ROOT = tviewport(tcntxt, {});
    var vp = tviewport(ROOT, { x : 0.1, y: 0.1, w : 0.7, h : 0.7 });
    var unif = Distribution.Uniform();
    cp.trect([0], [0], [1], [1], ROOT);
    cp.trect([0], [0], [1], [1], vp);
    cp.tpoints(unif.r(10).sort(), unif.r(10).sort(), vp, { stroke: "red"} );

    cont.restore();
}

