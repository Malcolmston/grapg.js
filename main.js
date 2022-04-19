let Directions;
(function (Directions) {
  Directions[(Directions["up"] = 0)] = "up";
  Directions[(Directions["down"] = 1)] = "down";
  Directions[(Directions["left"] = 2)] = "left";
  Directions[(Directions["right"] = 3)] = "right";
})(Directions || (Directions = {}));

export class Graph {
  constructor() {
    this.handleMouseDown = ({ offsetX, offsetY }) => {
      this.mouseStart = {
        x: offsetX,
        y: offsetY
      };
      this.d.addEventListener("mouseup", this.handleMouseUp);
      this.d.addEventListener("mousemove", this.handleMouseMove);
    };
    this.handleMouseUp = () => {
      this.d.removeEventListener("mouseup", this.handleMouseUp);
      this.d.removeEventListener("mousemove", this.handleMouseMove);
    };
    this.handleMouseMove = (e) => {
      const { x: startX, y: startY } = this.mouseStart;
      const { offsetX, offsetY } = e;
      this.orientation.x = this.orientation.x + (offsetX - startX);
      this.orientation.y = this.orientation.y + (offsetY - startY);
      this.mouseStart = {
        x: offsetX,
        y: offsetY
      };
      this.grid();
    };
    this.handleScroll = (e) => {
      const { wheelDeltaY, offsetX, offsetY } = e;
      let dX =
        (offsetX - this.d.getBoundingClientRect().width / 2) /
        this.d.getBoundingClientRect().width;
      let dY =
        (offsetY - this.d.getBoundingClientRect().height / 2) /
        this.d.getBoundingClientRect().height;
      const zoomPanFactor = 100;
      if (wheelDeltaY > 0) {
        this.orientation.zoom = +(
          this.orientation.zoom *
          (1 + this.zoomPercentage)
        ).toFixed(4);
        this.orientation.x = Math.round(
          this.orientation.x - dX * zoomPanFactor
        );
        this.orientation.y = Math.round(
          this.orientation.y - dY * zoomPanFactor
        );
      } else {
        this.orientation.zoom = +(
          this.orientation.zoom /
          (1 + this.zoomPercentage)
        ).toFixed(4);
        this.orientation.x = Math.round(
          this.orientation.x + dX * zoomPanFactor
        );
        this.orientation.y = Math.round(
          this.orientation.y + dY * zoomPanFactor
        );
      }
      this.grid();
    };

    this.equation = []; //methids// ["Math.sin(x / 30) * 100", "x / 30"];

    this.plotGrid = () => {
      this.calculateBreakpoint();
      this.plotGridSegment(Directions.up);
      this.plotGridSegment(Directions.down);
      this.plotGridSegment(Directions.left);
      this.plotGridSegment(Directions.right);
    };

    //this.grid = document.getElementById("line");
    this.d = document.getElementById("line");
    this.orientation = {
      zoom: 1,
      x: this.d.getBoundingClientRect().width / 2,
      y: this.d.getBoundingClientRect().height / 2
    };
    this.mouseStart = {
      x: null,
      y: null
    };
    this.data = [];
    this.precision = 1; // num of pixels traveled horizontally before calculating another coordinate
    this.zoomPercentage = 0.05; // what percent one scroll event will zoom in/out
    this.sigFigs = 3; // significant figures of equation output
    this.gridSpacing = 0.01; // gridSpacing * zoom = number of pixels per grid square
    this.maxGridCells = 3; // the max number of grid cells before increasing the grid spacing factor

    this.addEventListeners();
  }

  clear() {
    this.d.innerHTML = "";
  }

  svg(type, tokens, style, text, txtTokens, txtstyle) {
    let newpath;
    newpath = document.createElementNS("http://www.w3.org/2000/svg", type);

    Object.entries(tokens).forEach(function (data) {
      newpath.setAttribute(...data);
    });

    newpath.style = style;

    if (text) {
      let txt = document.createTextNode(text);

      Object.entries(txtTokens).forEach(function (data) {
        newpath.setAttribute(...data);
      });

      txt.style = txtstyle;
      newpath.appendChild(txt);
    }

    this.d.appendChild(newpath);
  }

  addEventListeners() {
    window.addEventListener("resize", this.handleResize);
    this.d.addEventListener("mousedown", this.handleMouseDown);
    window.addEventListener("mousewheel", this.handleScroll);
  }
  calculate(x, i) {
    const equation = this.equation[i].replace(/x/gm, x);
    return eval(equation);
  }

  pointsLine(points, width = 0.4, color = "black") {
    let newpath;
    newpath = document.createElementNS(
      "http://www.w3.org/2000/svg",
      "polyline"
    );

    newpath.setAttribute("id", "pathIdD");
    newpath.setAttribute("points", points.join("\n"));
    newpath.setAttribute("stroke", color);
    newpath.setAttribute("stroke-width", width);
    newpath.setAttribute("opacity", 1);
    newpath.setAttribute("fill", "none");

    this.d.appendChild(newpath);
  }

  Text(x, y, text, width = 0.4, color = "black") {
    let newpath;
    newpath = document.createElementNS("http://www.w3.org/2000/svg", "text");
    newpath.setAttribute("id", "pathIdD");
    newpath.setAttribute("x", x);
    newpath.setAttribute("y", y);

    newpath.setAttribute("stroke", color);

    newpath.setAttribute("stroke-width", width);

    newpath.setAttribute("opacity", 1);
    newpath.setAttribute("fill", color);

    newpath.appendChild(document.createTextNode(text));

    newpath.style.font = "bold 10px arial,serif";

    this.d.appendChild(newpath);
  }



  setData(i) {
    const data = [];
    let x = 0;
    while (x < this.d.getBoundingClientRect().width + this.precision) {
      let _x = x;
      // horizontal pan
      _x -= this.orientation.x;
      // horizontal zoom
      _x /= this.orientation.zoom;
      let y = this.calculate(_x.toFixed(this.sigFigs), i);
      // flip y coordinate because canvas paints \ instead of  /
      y *= -1;
      // vertical zoom
      y *= this.orientation.zoom;
      // vertical pan
      y += this.orientation.y;
      data.push([x, y]);
      x += this.precision;
    }
    this.data = data;
  }
  plotData() {
    for (let i in this.equation) {
      this.setData(i);
      if (!this.data || !this.data.length) return;
      //points,width=0.4, color = "black"
      this.pointsLine(this.data, 0.4, "rgba(100, 0, 139, 0.7)");
      this.data = [];
    }
  }
  calculateSigFigs() {
    this.sigFigs = this.orientation.zoom.toFixed(0).length + 1;
  }
  plotAxes() {
    const { x, y } = this.orientation;
    const { width, height } = this.d.getBoundingClientRect(); //this.canvas;

    //console.log( this.d.getBoundingClientRect() )

    const line = {
      stroke: "#000",
      "stroke-width": 2
    };

    // x right
    if (x <= width) {
      line["points"] = [
        [x, y],
        [width, y]
      ];

      this.svg("polyline", line);
    }
    // x left
    if (x >= 0) {
      line["points"] = [
        [x, y],
        [0, y]
      ];
      this.svg("polyline", line);
    }
    // y up
    if (y <= height) {
      line["points"] = [
        [x, y],
        [x, height]
      ];
      this.svg("polyline", line);
    }
    // y down
    if (y >= 0) {
      line["points"] = [
        [x, y],
        [x, 0]
      ];
      this.svg("polyline", line);
    }
  }
  plotGridSegment(direction) {
    const {
      gridSpacing,
      orientation: { x, y, zoom }
    } = this;

    let width = this.d.getBoundingClientRect().width;
    let height = this.d.getBoundingClientRect().height;

    let pt =
      direction === Directions.up || direction === Directions.down ? y : x;
    let label = 0;
    let index = 0;
    const setCondition = (point) => {
      if (direction === Directions.down) return point < height;
      if (direction === Directions.up) return point > 0;
      if (direction === Directions.left) return point > 0;
      if (direction === Directions.right) return point < width;
      return false;
    };
    let condition = setCondition(pt);
    while (condition) {
      const line = {
        stroke: index % 5 === 0 ? "rgba(0,0,0,0.8)" : "rgba(0,0,0,0.2)",
        "stroke-width": 1
      };

      // add grid line
      if (direction === Directions.down || direction === Directions.up) {
        line["points"] = [
          [0, pt],
          [width, pt]
        ];

        this.svg("polyline", line, "text-align: right");
      } else if (
        direction === Directions.left ||
        direction === Directions.right
      ) {
        line["points"] = [
          [pt, 0],
          [pt, height]
        ];
        this.svg("polyline", line, "text-align: center");
      }
      // add label
      if (label !== 0 && index % 5 === 0 && index < 1000) {
        const bg = new Array(label.toString().length + 2).join("█");
        if (direction === Directions.down || direction === Directions.up) {
          this.Text(x - 12, pt + 5, bg, false, "lightblue");
          this.Text(x - 12, pt + 3, label.toString(), false, "black");
        } else if (
          direction === Directions.left ||
          direction === Directions.right
        ) {
          this.Text(pt, y + 11, "█", false, "lightblue");
          this.Text(pt, y + 11, label.toString(), false, "black");
        }
      }
      if (index % 5 === 0)
        label +=
          direction === Directions.right || direction === Directions.up
            ? gridSpacing
            : -gridSpacing;
      // we are dividing here instead of at the gridSpacing variable so
      // that the labels are more round numbers
      if (direction === Directions.down) pt += (gridSpacing / 5) * zoom;
      else if (direction === Directions.up) pt -= (gridSpacing / 5) * zoom;
      else if (direction === Directions.left) pt -= (gridSpacing / 5) * zoom;
      else if (direction === Directions.right) pt += (gridSpacing / 5) * zoom;
      else
        throw new Error(
          "Invalid direction specified, this will cause an infinite loop"
        );
      condition = setCondition(pt);
      index++;
    }
  }
  calculateBreakpoint() {
    const {
      maxGridCells,
      orientation: { zoom }
    } = this;

    let width = this.d.getBoundingClientRect().width;
    let height = this.d.getBoundingClientRect().height;

    const size = Math.max(width, height) / zoom;
    let gridSpacing = 0.025;
    const breakpoints = [
      0.05,
      0.1,
      0.25,
      0.5,
      1,
      2,
      5,
      10,
      25,
      50,
      100,
      250,
      500,
      1000,
      2500,
      10000,
      25000,
      50000,
      100000
    ];
    let i = 0;
    while (breakpoints[i] && breakpoints[i] < size / (maxGridCells + 1)) {
      gridSpacing = breakpoints[i];
      i++;
    }
    this.gridSpacing = gridSpacing;
  }
  grid() {
    this.clear();
    this.calculateSigFigs();
    this.plotData();
    this.plotAxes();
    this.plotGrid();
  }
}

