import { getEnhanced, getPrediction } from "./api.js";

let canvas, ctx, memCanvas, memCtx;

let myFrame,
  colorPickerBtn,
  widthPickerBtn,
  eraserPickerBtn,
  colorList,
  widthList,
  eraserList,
  colorElements,
  widthElements,
  eraserElements,
  predictionElement,
  enhancedPreview,
  predictBtn,
  enhanceBtn,
  saveDrawingBtn,
  saveEnhancedBtn,
  enhancedImage,
  clearBtn;

const Option = {
  DRAWING: 1,
  ERASING: 0,
};

let selected = Option.DRAWING;
let drawing = false;
let points = [];

let config = {
  line_width: 2,
  color: "#000000",
  eraser_width: 8,
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

  // Check if device is mobile
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  // Set both canvases to the same size
  canvas.width = window.innerWidth - 40;
  canvas.height = isMobile ? 500 : window.innerHeight - 35;
  memCanvas.width = canvas.width;
  memCanvas.height = canvas.height;

  ctx = canvas.getContext("2d");
  memCtx = memCanvas.getContext("2d");

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  memCtx.fillStyle = "#FFFFFF";
  memCtx.fillRect(0, 0, memCanvas.width, memCanvas.height);

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
  colorPickerBtn = document.getElementById("color-picker");
  widthPickerBtn = document.getElementById("width-picker");
  eraserPickerBtn = document.getElementById("eraser-picker");
  colorList = document.getElementById("color-list");
  widthList = document.getElementById("width-list");
  eraserList = document.getElementById("eraser-list");
  colorElements = colorList.querySelectorAll("li:not(.custom-color)");
  widthElements = widthList.querySelectorAll("li");
  eraserElements = eraserList.querySelectorAll("li");
  predictionElement = document.getElementById("prediction");
  enhancedPreview = document.getElementById("enhancedPreview");
  predictBtn = document.getElementById("predict-btn");
  enhanceBtn = document.getElementById("enhance-btn");
  saveDrawingBtn = document.getElementById("save-drawing-btn");
  saveEnhancedBtn = document.getElementById("save-enhanced-btn");
  clearBtn = document.getElementById("clear-btn");

  if (colorPickerBtn) {
    colorPickerBtn.style.backgroundColor = config.color;
    colorPickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selected === Option.DRAWING) {
        colorList.classList.toggle("open");
        widthList.classList.remove("open");
        eraserList.classList.remove("open");
      } else {
        widthPickerBtn.classList.add("selected");
        eraserPickerBtn.classList.remove("selected");
        selected = Option.DRAWING;
      }
    });
  }

  if (widthPickerBtn) {
    widthPickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selected === Option.DRAWING) {
        widthList.classList.toggle("open");
        eraserList.classList.remove("open");
        colorList.classList.remove("open");
      } else {
        widthPickerBtn.classList.add("selected");
        eraserPickerBtn.classList.remove("selected");
        selected = Option.DRAWING;
      }
    });
  }

  if (eraserPickerBtn) {
    eraserPickerBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (selected === Option.ERASING) {
        eraserList.classList.toggle("open");
        colorList.classList.remove("open");
        widthList.classList.remove("open");
      } else {
        eraserPickerBtn.classList.add("selected");
        widthPickerBtn.classList.remove("selected");
        selected = Option.ERASING;
      }
    });
  }

  if (colorList) {
    colorList.addEventListener("blur", () => {
      colorList.classList.remove("open");
    });
  }

  if (widthList) {
    widthList.addEventListener("blur", () => {
      widthList.classList.remove("open");
    });
  }

  if (eraserList) {
    eraserList.addEventListener("blur", () => {
      eraserList.classList.remove("open");
    });
  }

  if (colorElements) {
    colorElements.forEach((el) => {
      let myColor = el.dataset.color;
      el.style.setProperty("--color", myColor);
      el.addEventListener("click", (e) => {
        // e.stopPropagation();
        config.color = myColor;
        colorPickerBtn.style.backgroundColor = myColor;
        let myShadow = "0 0 0 3px " + myColor + "66";
        colorPickerBtn.style.boxShadow = myShadow;
      });
    });
  }

  const alwan = new Alwan("#custom-color-ref", {
    classname: "custom-color-picker",
  });

  alwan.on("change", (e) => {
    const myColor = e.hex;
    config.color = myColor;
    colorPickerBtn.style.backgroundColor = myColor;
  });

  if (widthElements) {
    widthElements.forEach((el) => {
      let myWidth = el.dataset.width;
      el.style.setProperty("--line-width", myWidth + "px");
      el.addEventListener("click", (e) => {
        config.line_width = myWidth;
        widthPickerBtn.style.setProperty("--line-width", +myWidth + "px");
        ctx.lineWidth = myWidth;
      });
    });
  }

  if (eraserElements) {
    eraserElements.forEach((el) => {
      let myWidth = el.dataset.width;
      el.style.setProperty("--line-width", myWidth + "px");
      el.addEventListener("click", () => {
        config.eraser_width = myWidth;
        ctx.lineWidth = myWidth;
      });
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", clear);
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
  canvas.height = canvas.height;
  memCanvas.width = canvas.width;
  memCanvas.height = canvas.height;

  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  memCtx.fillStyle = "#FFFFFF";
  memCtx.fillRect(0, 0, memCanvas.width, memCanvas.height);

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
  // Mouse events
  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  // Touch events
  canvas.addEventListener("touchstart", handleTouchStart);
  canvas.addEventListener("touchmove", handleTouchMove);
  canvas.addEventListener("touchend", stopDrawing);
  canvas.addEventListener("touchcancel", stopDrawing);

  window.addEventListener("resize", resizeCanvas);
}

function startDrawing(e) {
  colorList.classList.remove("open");
  widthList.classList.remove("open");
  eraserList.classList.remove("open");

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
    if (selected === Option.DRAWING) {
      ctx.lineWidth = config.line_width;
      ctx.strokeStyle = config.color;
      ctx.fillStyle = config.color;
    } else {
      ctx.lineWidth = config.eraser_width;
      ctx.strokeStyle = "#ffffff";
      ctx.fillStyle = "#ffffff";
    }

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
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  memCtx.fillStyle = "#FFFFFF";
  memCtx.fillRect(0, 0, memCanvas.width, memCanvas.height);
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
  predictionElement.textContent = "predicting (first request may take a while) ...";

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );

  try {
    // Added basic try/catch for API call error
    let res = await getPrediction(blob);

    // Handle potential errors returned from the backend API
    if (res.error) {
      predictionElement.textContent = `Error: ${res.error}`;
    } else {
      predictionElement.textContent =
        "prediction: " + res.prediction || "No prediction received.";
    }
  } catch (error) {
    console.error("Error calling getPrediction:", error);
    predictionElement.textContent = "Error sending drawing for prediction.";
  }
}

async function enhanceDrawing() {
  enhancedPreview.textContent = "getting you enhanced drawing (first request may take a while) ...";

  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );

  try {
    // Added basic try/catch
    const enhancedURL = await getEnhanced(blob); // Send blob with background
    // Clear previous enhanced image if any
    enhancedPreview.innerHTML = ""; // Clear the container

    enhancedImage = document.createElement("img");
    enhancedImage.onload = () => {
      enhancedPreview.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    };
    enhancedImage.onerror = () => {
      console.error("Failed to load enhanced image URL:", enhancedURL);
      // Maybe revoke here too on error
      // URL.revokeObjectURL(enhancedURL);
    };
    enhancedImage.src = enhancedURL;
    enhancedPreview.appendChild(enhancedImage);
  } catch (error) {
    console.error("Error calling getEnhanced:", error);
    // Display error to user?
  }
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

function handleTouchStart(e) {
  e.preventDefault(); // Prevent scrolling
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent("mousedown", {
    clientX: touch.clientX,
    clientY: touch.clientY,
  });
  startDrawing(mouseEvent);
}

function handleTouchMove(e) {
  e.preventDefault(); // Prevent scrolling
  const touch = e.touches[0];
  const mouseEvent = new MouseEvent("mousemove", {
    clientX: touch.clientX,
    clientY: touch.clientY,
  });
  draw(mouseEvent);
}
