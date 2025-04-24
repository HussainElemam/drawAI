import { getEnhanced, getPrediction } from "./api.js";

let canvas, ctx, memCanvas, memCtx;

let myFrame,
  saveBtn,
  colorPickerBtn,
  widthPickerBtn,
  colorList,
  widthList,
  colorElements,
  widthElements,
  predictionElement,
  enhancedPreview,
  predictBtn,
  enhanceBtn,
  saveDrawingBtn,
  saveEnhancedBtn,
  enhancedImage;

let drawing = false;
let points = [];
let lastx = 0,
  lasty = 0;

let config = {
  line_width: 2,
  color: "#000000",
};

window.addEventListener("load", () => {
  initializeCanvas();
  initializeControls();
  bindCanvasEvents();
});

function initializeCanvas() {
  canvas = document.createElement("canvas");
  memCanvas = document.createElement("canvas");
  myFrame = document.getElementById("frame");
  myFrame.appendChild(canvas);

  // Set both canvases to the same size
  canvas.width = window.innerWidth - 40;
  canvas.height = window.innerHeight - 35;
  memCanvas.width = canvas.width;
  memCanvas.height = canvas.height;

  ctx = canvas.getContext("2d");
  memCtx = memCanvas.getContext("2d");

  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = config.line_width;
  ctx.strokeStyle = config.color;
  ctx.fillStyle = config.color;

  // Also set the same properties for memCtx
  memCtx.lineJoin = "round";
  memCtx.lineCap = "round";
  memCtx.lineWidth = config.line_width;
  memCtx.strokeStyle = config.color;
  memCtx.fillStyle = config.color;
}

function initializeControls() {
  saveBtn = document.getElementById("save-btn");
  colorPickerBtn = document.getElementById("color-picker");
  widthPickerBtn = document.getElementById("width-picker");
  colorList = document.getElementById("color-list");
  widthList = document.getElementById("width-list");
  colorElements = colorList.querySelectorAll("li");
  widthElements = widthList.querySelectorAll("li");
  predictionElement = document.getElementById("prediction");
  enhancedPreview = document.getElementById("enhancedPreview");
  predictBtn = document.getElementById("predict-btn");
  enhanceBtn = document.getElementById("enhance-btn");
  saveDrawingBtn = document.getElementById("save-drawing-btn");
  saveEnhancedBtn = document.getElementById("save-enhanced-btn");

  if (colorPickerBtn) {
    colorPickerBtn.style.backgroundColor = config.color;
  }

  if (colorPickerBtn) {
    colorPickerBtn.addEventListener("click", () => {
      colorList.classList.toggle("open");
    });
  }

  if (colorList) {
    colorList.addEventListener("blur", () => {
      console.log("blur on color picker");
      colorList.classList.remove("open");
    });
  }

  if (widthList) {
    widthList.addEventListener("blur", () => {
      console.log("blur on color picker");
      colorList.classList.remove("open");
    });
  }

  if (widthPickerBtn) {
    widthPickerBtn.addEventListener("click", () => {
      widthList.classList.toggle("open");
    });
    widthPickerBtn.addEventListener("blur", () => {
      console.log("blur on width picker");
      widthList.classList.toggle("open");
    });
  }

  if (colorElements) {
    colorElements.forEach((el) => {
      let myColor = el.dataset.color;
      el.style.setProperty("--color", myColor);
      el.addEventListener("click", () => {
        config.color = myColor;
        colorPickerBtn.style.backgroundColor = myColor;
        let myShadow = "0 0 0 3px " + myColor + "66";
        colorPickerBtn.style.boxShadow = myShadow;
      });
    });
  }

  if (widthElements) {
    widthElements.forEach((el) => {
      let myWidth = el.dataset.width;
      el.style.setProperty("--line-width", myWidth + "px");
      el.addEventListener("click", () => {
        config.line_width = myWidth;
        widthPickerBtn.style.setProperty("--line-width", +myWidth + "px");
        ctx.lineWidth = myWidth;
      });
    });
  }

  if (predictBtn) {
    predictBtn.addEventListener("click", predictDrawing);
  }

  if (enhanceBtn) {
    enhanceBtn.addEventListener("click", enhanceDrawing);
  }

  if (saveDrawingBtn) {
    saveDrawingBtn.addEventListener("click", saveDrawing);
  }

  if (saveEnhancedBtn) {
    saveEnhancedBtn.addEventListener("click", saveEnhanced);
  }
}

function resizeCanvas() {
  // Store the current canvas content
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = canvas.width;
  tempCanvas.height = canvas.height;
  tempCtx.drawImage(canvas, 0, 0);

  // Resize both canvases
  canvas.width = window.innerWidth - 40;
  canvas.height = window.innerHeight - 35;
  memCanvas.width = canvas.width;
  memCanvas.height = canvas.height;

  // Restore the content
  ctx.drawImage(tempCanvas, 0, 0);
  memCtx.drawImage(tempCanvas, 0, 0);

  // Reset context properties that get cleared on resize
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.lineWidth = config.line_width;
  ctx.strokeStyle = config.color;
  ctx.fillStyle = config.color;

  memCtx.lineJoin = "round";
  memCtx.lineCap = "round";
  memCtx.lineWidth = config.line_width;
  memCtx.strokeStyle = config.color;
  memCtx.fillStyle = config.color;
}

// ========== Canvas Events ==========
function bindCanvasEvents() {
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  window.addEventListener("resize", resizeCanvas);
}

function startDrawing(e) {
  colorList.classList.remove("open");
  widthList.classList.remove("open");
  const [x, y] = getMousePosition(e);
  points.push({
    x: x,
    y: y,
  });
  drawing = true;
}

function stopDrawing(e) {
  if (drawing) {
    drawing = false;
    // When the pen is done, save the resulting context
    // to the in-memory canvas
    memCtx.clearRect(0, 0, memCanvas.width, memCanvas.height);
    memCtx.drawImage(canvas, 0, 0);
    points = [];
  }
}

function draw(e) {
  if (drawing) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // put back the saved content
    ctx.drawImage(memCanvas, 0, 0);

    // Set current styles before drawing
    ctx.lineWidth = config.line_width;
    ctx.strokeStyle = config.color;
    ctx.fillStyle = config.color;

    let [x, y] = getMousePosition(e);
    points.push({
      x: x,
      y: y,
    });
    drawPoints(ctx, points);
  }
}

function clear() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  memCtx.clearRect(0, 0, memCanvas.width, memCanvas.height);
}

function drawPoints(ctx, points) {
  // draw a basic circle instead
  if (points.length < 6) {
    var b = points[0];
    ctx.beginPath();
    ctx.arc(b.x, b.y, ctx.lineWidth / 2, 0, Math.PI * 2, !0);
    ctx.closePath();
    ctx.fill();
    return;
  }
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  // draw a bunch of quadratics, using the average of two points as the control point
  let i;
  for (i = 1; i < points.length - 2; i++) {
    var c = (points[i].x + points[i + 1].x) / 2,
      d = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, c, d);
  }
  ctx.quadraticCurveTo(
    points[i].x,
    points[i].y,
    points[i + 1].x,
    points[i + 1].y
  );
  ctx.stroke();
}

function getMousePosition(e) {
  const rect = canvas.getBoundingClientRect();
  return [e.clientX - rect.left, e.clientY - rect.top];
}

// ========== Stub Functions ==========
async function predictDrawing() {
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );

  let res = await getPrediction(blob);
  console.log(res);
  predictionElement.textContent = res["prediction"];
  predictionElement.scrollIntoView({
    behavior: "smooth",
    block: "start",
  });
}

async function enhanceDrawing() {
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  const enhancedURL = await getEnhanced(blob);
  console.log("enhancedURL", enhancedURL);

  enhancedImage = document.createElement("img");
  enhancedImage.src = enhancedURL;
  enhancedPreview.appendChild(enhancedImage);
  // enhancedPreview.scrollIntoView({
  //   behavior: "smooth",
  //   block: "bottom",
  // });
}

function saveDrawing() {
  const link = document.createElement("a");
  link.download = "drawing.png";
  link.href = canvas.toDataURL();
  link.click();
}

function saveEnhanced() {
  if (enhancedImage) {
    const url = enhancedImage.src;

    const link = document.createElement("a");
    link.href = url;
    link.download = "enhanced_image.png"; // you can set the filename here
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } else {
    alert("No image yet");
  }
}
