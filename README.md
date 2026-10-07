intermedio
==========

A HTML5 canvas based Jacascript API for statistical graphics.

The project is in its very early stages.  The primary goal is to
develop a Canvas-based Javascript API for static and interactive
graphics that is similar to (and developed in parallel with) a similar
R graphics API (tessella).  Eventually, the hope is that we may even
be able to export (interactive) tessella-based plots developed in R in
an automated way. The `intermedio.js/` folder has code for the
graphics API.

In addition to the graphics tools, this needs a reimplementation of
many of the tools not directly related to graphics that we take for
granted in R. These are in the `interstat.js/`.


## Status Update (October 2026 --- with AI assistance)

We have developed a patially working prototype for exporting
interactive R plots to the browser. The essential pieces are:

- **AST Transpiler (`R/r2js.R`)**: Parses custom R panel functions and
  translates them to Javascript, preserving procedural style and
  mapping standard operations to vectorized equivalents.

- **Vectorized JS Core (`interstat.js/rstatic.js`)**: Extended with
  mathematical and logical operations that mimic R's implicit array
  vectorization.

- **Scene Graph (`intermedio.js/scenegraph.js`)**: Implemented a
  retained-mode scene graph over HTML5 Canvas, which links drawn
  graphical primitives back to their global dataset row indices via
  `subscripts`.

- **Trellis Layout Manager (`trellis.js`)**: A JS-based manager that
  calculates coordinate grids, dynamically measures margin text sizes,
  splits space for small multiples, and orchestrates the transpiled
  panel functions.

## Planned Features (Future Work)

- **Advanced MVC & Linked Brushing**: Finalize the
  Model-View-Controller pattern so that brushing in one panel
  dynamically updates the state of shared data indices and reacts
  immediately across all other linked panels.

- **WebAssembly Integration**: Compile C/C++ modules into WebAssembly
  to replace `Rstatic`'s Javascript loops for large array operations,
  achieving near-native performance for dense data manipulation.

- **WebGL Rendering Option**: Provide a pluggable backend (e.g.,
  PixiJS) for the `SceneGraph.render()` method to support plots with a
  large number points at 60fps using GPU acceleration, while keeping
  HTML/SVG for text-heavy axes and tooltips.

- **Robust Transpilation Scope**: Further extend the `r2js.R`
  transpiler to handle R environments, closures, and more complex
  subsetting (`[]`) semantics.


