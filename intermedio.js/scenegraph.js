// scenegraph.js
// A lightweight Scene Graph implementation for canvas primitives 
// designed to support tooltips, cross-filtering, and zooming.

class SceneGraph {
  constructor() {
    this.nodes = [];
    this.transform = { x: 0, y: 0, k: 1 }; // For Pan/Zoom
  }

  // Clear the scene graph
  clear() {
    this.nodes = [];
  }

  // Add a graphical node (points, lines, rects)
  addNode(node) {
    this.nodes.push(node);
  }

  // Draw all nodes onto the provided canvas context
  render(context) {
    context.save();
    // Apply pan/zoom transformations
    context.translate(this.transform.x, this.transform.y);
    context.scale(this.transform.k, this.transform.k);
    
    // Render each node
    for (let node of this.nodes) {
      node.draw(context);
    }
    
    context.restore();
  }

  // Find the node closest to the given (x,y) pixel coordinates.
  // This is used for tooltips and hover effects.
  hitTest(x, y, radius = 5) {
    // Reverse transform the mouse coordinates to scene coordinates
    const sceneX = (x - this.transform.x) / this.transform.k;
    const sceneY = (y - this.transform.y) / this.transform.k;

    // Search backwards to find top-most node (z-index)
    for (let i = this.nodes.length - 1; i >= 0; i--) {
      const node = this.nodes[i];
      if (node.contains(sceneX, sceneY, radius)) {
        return node;
      }
    }
    return null;
  }
}

// Base Node Class
class SceneNode {
  constructor(dataIndex, gpar) {
    this.dataIndex = dataIndex; // The row index in the data model (Model)
    this.gpar = gpar || {};
    this.selected = false;      // MVC State flag
  }
  
  applyGpar(context) {
    // Highlight selection state if true
    context.strokeStyle = this.selected ? "red" : (this.gpar.stroke || "black");
    context.fillStyle = this.selected ? "red" : (this.gpar.fill || "transparent");
    context.lineWidth = this.gpar.lwd || 1;
  }
}

// Point Node representing a single symbol (e.g., pch=1)
class PointNode extends SceneNode {
  constructor(x, y, dataIndex, gpar) {
    super(dataIndex, gpar);
    this.x = x;
    this.y = y;
    this.r = 5 * (this.gpar.cex || 1);
  }

  draw(context) {
    context.beginPath();
    
    // Keeping point size constant during zoom if desired (or scale it)
    // context.getTransform() could be used here. For simplicity, we just draw the arc.
    context.arc(this.x, this.y, this.r, 0, Math.PI * 2); 
    
    this.applyGpar(context);
    if (this.gpar.fill) context.fill();
    context.stroke();
  }

  contains(x, y, hitRadius) {
    const dx = this.x - x;
    const dy = this.y - y;
    return (dx * dx + dy * dy) <= (this.r + hitRadius) ** 2;
  }
}

// Rect Node representing a rectangle
class RectNode extends SceneNode {
  constructor(xleft, ybottom, width, height, dataIndex, gpar) {
    super(dataIndex, gpar);
    this.x = xleft;
    this.y = ybottom; // assuming top-left coordinates for canvas
    this.w = width;
    this.h = height;
  }

  draw(context) {
    context.beginPath();
    context.rect(this.x, this.y, this.w, this.h);
    this.applyGpar(context);
    if (this.gpar.fill) context.fill();
    context.stroke();
  }

  contains(x, y) {
    return (x >= this.x && x <= this.x + this.w && 
            y >= this.y && y <= this.y + this.h);
  }
}

// How to integrate this into canvas_primitives.js (cp.tpoints):
// 
// Instead of drawing directly, the tessella primitive pushes to the scene graph:
// 
// tpoints: function(x, y, vp, gpar) {
//     let xp = vx2pixel(x, vp);
//     let yp = vy2pixel(y, vp);
//     for (let i = 0; i < xp.length; i++) {
//         // Pass `i` as the data index so the controller knows what was hovered
//         sceneGraph.addNode(new PointNode(xp[i], yp[i], i, gpar)); 
//     }
// }
