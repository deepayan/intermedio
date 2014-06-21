intermedio
==========

A HTML5 canvas based Jacascript API for statistical graphics.

The project is in its very early stages.  The primary goal is to
develop a Canvas-based Javascript API for static and interactive
graphics that is similar to (and developed in parallel with) a similar
R graphics API (tessella).  Eventually, the hope is that we may even
be able to export (interactive) tessella-based plots developed in R in
an automated way.

In addition to the graphics tools, this needs a reimplementation of
many of the tools we take for granted in R.  This would be a lot
easier with Node.js, but that would tie us to a server-side setuo, and
we still hope to make this work with client-side execution only.

intermedio.js/ consists of code for the graphics API.

interstat.js/ consists of support code that is not directly related to
graphics.


