// trellis.js
// A lightweight Trellis/Lattice layout manager and renderer for the browser.

class TrellisPlot {
  constructor(canvasId, payload) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.payload = payload;
    this.sceneGraph = new SceneGraph();
    
    // Set up high DPI canvas
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
    this.width = rect.width;
    this.height = rect.height;

    // Tooltip setup
    this.tooltip = document.createElement('div');
    this.tooltip.style.position = 'absolute';
    this.tooltip.style.display = 'none';
    this.tooltip.style.background = 'rgba(255, 255, 255, 0.9)';
    this.tooltip.style.border = '1px solid #ccc';
    this.tooltip.style.padding = '5px';
    this.tooltip.style.pointerEvents = 'none';
    this.tooltip.style.fontFamily = 'sans-serif';
    this.tooltip.style.fontSize = '12px';
    document.body.appendChild(this.tooltip);

    // Bind events
    this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));

    this.render();
  }

  // Simple implementation of R's pretty() algorithm for tick generation
  pretty(min, max, n = 5) {
    const range = max - min;
    const tickSpacing = range / (n - 1);
    const magnitude = Math.pow(10, Math.floor(Math.log10(tickSpacing)));
    const residual = tickSpacing / magnitude;
    let tick;
    if (residual > 5) tick = 10 * magnitude;
    else if (residual > 2) tick = 5 * magnitude;
    else if (residual > 1) tick = 2 * magnitude;
    else tick = magnitude;

    const start = Math.ceil(min / tick) * tick;
    const end = Math.floor(max / tick) * tick;
    const ticks = [];
    for (let t = start; t <= end + tick/2; t += tick) {
      ticks.push(t);
    }
    return ticks;
  }

  render() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.sceneGraph.clear();

    // Determine global limits
    const xlim = [Rstatic.min(this.payload.data.x), Rstatic.max(this.payload.data.x)];
    const ylim = [Rstatic.min(this.payload.data.y), Rstatic.max(this.payload.data.y)];
    
    // Add a 5% margin to data limits
    const xpad = (xlim[1] - xlim[0]) * 0.05;
    const ypad = (ylim[1] - ylim[0]) * 0.05;
    xlim[0] -= xpad; xlim[1] += xpad;
    ylim[0] -= ypad; ylim[1] += ypad;

    const xTicks = this.pretty(xlim[0], xlim[1]);
    const yTicks = this.pretty(ylim[0], ylim[1]);

    // Measure Y axis text width
    this.ctx.font = '12px sans-serif';
    let maxYTextWidth = 0;
    for (let t of yTicks) {
      maxYTextWidth = Math.max(maxYTextWidth, this.ctx.measureText(t.toString()).width);
    }

    // Layout configuration
    const margin = { left: maxYTextWidth + 20, right: 20, top: 20, bottom: 40 };
    const stripHeight = 20;
    
    const panels = this.payload.panels;
    const nPanels = panels.length;
    // Simple 1-row layout for prototype (could be generalized to grids)
    const panelWidth = (this.width - margin.left - margin.right) / nPanels;
    const panelHeight = this.height - margin.top - margin.bottom - stripHeight;

    // Draw Panels
    for (let i = 0; i < nPanels; i++) {
      const px = margin.left + i * panelWidth;
      const py = margin.top + stripHeight;
      
      // Draw strip
      this.ctx.fillStyle = '#ffe0b2';
      this.ctx.fillRect(px, margin.top, panelWidth, stripHeight);
      this.ctx.strokeRect(px, margin.top, panelWidth, stripHeight);
      this.ctx.fillStyle = '#000';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const panelName = this.payload.panelNames[i] || `Panel ${i+1}`;
      this.ctx.fillText(panelName, px + panelWidth / 2, margin.top + stripHeight / 2);

      // Draw panel border
      this.ctx.strokeRect(px, py, panelWidth, panelHeight);

      // Create a virtual viewport map for this panel
      const vp = {
        x: px, y: py, w: panelWidth, h: panelHeight,
        xlim: xlim, ylim: ylim,
        context: { invert_y: true } // Canvas y points down
      };

      // Draw gridlines
      this.ctx.strokeStyle = '#eee';
      this.ctx.beginPath();
      for (let tx of xTicks) {
        let vx = this.x2pixel(tx, vp);
        this.ctx.moveTo(vx, py);
        this.ctx.lineTo(vx, py + panelHeight);
      }
      for (let ty of yTicks) {
        let vy = this.y2pixel(ty, vp);
        this.ctx.moveTo(px, vy);
        this.ctx.lineTo(px + panelWidth, vy);
      }
      this.ctx.stroke();

      // Execute Transpiled Panel Function
      // The function expects (x, y, subscripts, vp, sceneGraph, gpar)
      const subscripts = panels[i];
      const subX = subscripts.map(idx => this.payload.data.x[idx]);
      const subY = subscripts.map(idx => this.payload.data.y[idx]);
      
      // Ensure the transpiled function was loaded globally
      if (typeof window[this.payload.panel_function_name] === 'function') {
         window[this.payload.panel_function_name](subX, subY, subscripts, vp, this.sceneGraph, {});
      } else {
         console.error("Transpiled panel function not found: " + this.payload.panel_function_name);
      }
    }

    // Draw Axes (bottom and left of the whole grid)
    this.ctx.fillStyle = '#000';
    this.ctx.strokeStyle = '#000';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    const firstVP = { x: margin.left, w: panelWidth, xlim: xlim }; // dummy for axis scale
    for (let tx of xTicks) {
      let vx = this.x2pixel(tx, firstVP);
      this.ctx.fillText(tx.toString(), vx, margin.top + stripHeight + panelHeight + 5);
    }

    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';
    const leftVP = { y: margin.top + stripHeight, h: panelHeight, ylim: ylim, context: { invert_y: true } };
    for (let ty of yTicks) {
      let vy = this.y2pixel(ty, leftVP);
      this.ctx.fillText(ty.toString(), margin.left - 5, vy);
    }

    // Finally, render the scene graph points!
    this.sceneGraph.render(this.ctx);
  }

  onMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const hit = this.sceneGraph.hitTest(x, y, 3);
    if (hit) {
      // Look up row data
      const rowIdx = hit.dataIndex;
      let html = `<strong>Index: ${rowIdx}</strong><br/>`;
      for (let key in this.payload.data) {
        html += `${key}: ${this.payload.data[key][rowIdx]}<br/>`;
      }
      this.tooltip.innerHTML = html;
      this.tooltip.style.left = (e.clientX + 15) + 'px';
      this.tooltip.style.top = (e.clientY + 15) + 'px';
      this.tooltip.style.display = 'block';
      this.canvas.style.cursor = 'pointer';
    } else {
      this.tooltip.style.display = 'none';
      this.canvas.style.cursor = 'default';
    }
  }

  // Coordinate mappers
  x2pixel(x, vp) {
    return vp.x + vp.w * (x - vp.xlim[0]) / (vp.xlim[1] - vp.xlim[0]);
  }
  y2pixel(y, vp) {
    const pixoffset = vp.h * (y - vp.ylim[0]) / (vp.ylim[1] - vp.ylim[0]);
    if (vp.context && vp.context.invert_y) {
        return vp.y + vp.h - pixoffset;
    }
    return vp.y + pixoffset;
  }
}

// Global interface for the transpiled primitive
// Our sceneGraph will replace 'cp.tpoints' logic directly for this prototype
var cp = {
  tpoints: function(x, y, subscripts, vp, sceneGraph, gpar) {
    // x and y are data coordinates here, let's map them
    // Note: in R we passed raw x, y to tpoints instead of mapped. 
    for (let i = 0; i < x.length; i++) {
        let px = vp.x + vp.w * (x[i] - vp.xlim[0]) / (vp.xlim[1] - vp.xlim[0]);
        
        let pixoffset = vp.h * (y[i] - vp.ylim[0]) / (vp.ylim[1] - vp.ylim[0]);
        let py = (vp.context && vp.context.invert_y) ? vp.y + vp.h - pixoffset : vp.y + pixoffset;

        sceneGraph.addNode(new PointNode(px, py, subscripts[i], gpar));
    }
  }
};
