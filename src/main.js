// Tesla Car Wrap Editor - TUI Dark Mode Edition
// Main application script

// Load Fabric.js from CDN
const script = document.createElement("script");
script.src =
  "https://cdnjs.cloudflare.com/ajax/libs/fabric.js/5.3.1/fabric.min.js";
script.onload = initEditor;
document.head.appendChild(script);

let canvas,
  templateImage = null;
let currentModel = null;
let layers = [];
let isPanning = false;
let lastPosX, lastPosY;

function initEditor() {
  console.log("Initializing Tesla Car Wrap Editor...");

  // Calculate viewport-based canvas size
  const canvasWidth = window.innerWidth - 280; // Subtract sidebar
  const canvasHeight = window.innerHeight; // Full viewport height

  // Initialize Fabric.js canvas
  canvas = new fabric.Canvas("editorCanvas", {
    width: canvasWidth,
    height: canvasHeight,
    backgroundColor: "#0d1117",
    selectionColor: "rgba(255, 68, 68, 0.2)",
    selectionBorderColor: "#ff4444",
    selectionLineWidth: 2,
  });

  // Set up event listeners
  setupEventListeners();

  // Setup pan/zoom
  setupPanZoom();

  // Add resize handler
  window.addEventListener("resize", handleCanvasResize);

  // Show instructions
  showInstructions();

  // Hide layers panel initially
  updateLayersPanelVisibility();

  console.log("Editor initialized successfully");
}

function setupEventListeners() {
  // Car model selection
  document
    .getElementById("carModelSelect")
    .addEventListener("change", function (e) {
      const model = e.target.value;
      if (model) {
        loadTemplate(model);
      }
    });

  // Add image button
  document.getElementById("addImageBtn").addEventListener("click", function () {
    document.getElementById("imageUpload").click();
  });

  // Image upload handler
  document
    .getElementById("imageUpload")
    .addEventListener("change", handleImageUpload);

  // Add text button
  document
    .getElementById("addTextBtn")
    .addEventListener("click", addTextElement);

  // Zoom controls
  document
    .getElementById("zoomInBtn")
    .addEventListener("click", () => zoomCanvas(1.2));
  document
    .getElementById("zoomOutBtn")
    .addEventListener("click", () => zoomCanvas(0.8));
  document.getElementById("resetViewBtn").addEventListener("click", resetView);

  // Download button
  document
    .getElementById("downloadBtn")
    .addEventListener("click", downloadDesign);

  // Reset button
  document.getElementById("resetBtn").addEventListener("click", resetEditor);

  // Canvas selection change for layer highlighting
  canvas.on("selection:created", updateLayerSelection);
  canvas.on("selection:updated", updateLayerSelection);
  canvas.on("selection:cleared", () => {
    document
      .querySelectorAll(".layer-item")
      .forEach((item) => item.classList.remove("selected"));
  });

  // Modal controls
  document.getElementById("modalClose").addEventListener("click", closeModal);
  document.getElementById("modalOkBtn").addEventListener("click", closeModal);

  // Close modal on background click
  document
    .getElementById("downloadModal")
    .addEventListener("click", function (e) {
      if (e.target.id === "downloadModal") {
        closeModal();
      }
    });

  // Keyboard shortcuts
  document.addEventListener("keydown", handleKeyDown);
}

function handleKeyDown(e) {
  // Delete key to remove selected object
  if (e.key === "Delete" || e.key === "Backspace") {
    const activeObject = canvas.getActiveObject();
    if (
      activeObject &&
      activeObject !== templateImage &&
      !e.target.matches("input, textarea, select")
    ) {
      removeObject(activeObject);
      e.preventDefault();
    }
  }
}

function setupPanZoom() {
  // Mouse wheel zoom
  canvas.on("mouse:wheel", function (opt) {
    const delta = opt.e.deltaY;
    let zoom = canvas.getZoom();
    zoom *= 0.999 ** delta;
    zoom = Math.max(0.1, Math.min(5, zoom)); // Clamp between 0.1x and 5x

    canvas.zoomToPoint({ x: opt.e.offsetX, y: opt.e.offsetY }, zoom);
    opt.e.preventDefault();
    opt.e.stopPropagation();

    updateZoomDisplay(zoom);
  });

  // Pan with Space + drag or middle mouse button
  canvas.on("mouse:down", function (opt) {
    const evt = opt.e;
    if (evt.shiftKey || evt.button === 1) {
      // Shift key or middle mouse
      isPanning = true;
      canvas.selection = false;
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
      canvas.defaultCursor = "grabbing";
    }
  });

  canvas.on("mouse:move", function (opt) {
    if (isPanning) {
      const evt = opt.e;
      const vpt = canvas.viewportTransform;
      vpt[4] += evt.clientX - lastPosX;
      vpt[5] += evt.clientY - lastPosY;
      canvas.requestRenderAll();
      lastPosX = evt.clientX;
      lastPosY = evt.clientY;
    }
  });

  canvas.on("mouse:up", function () {
    isPanning = false;
    canvas.selection = true;
    canvas.defaultCursor = "default";
  });

  // Space key for pan mode indicator
  document.addEventListener("keydown", (e) => {
    if (e.code === "Space" && !e.target.matches("input, textarea, select")) {
      e.preventDefault();
    }
  });
}

function zoomCanvas(factor) {
  const zoom = canvas.getZoom() * factor;
  const clampedZoom = Math.max(0.1, Math.min(5, zoom));
  canvas.setZoom(clampedZoom);
  canvas.requestRenderAll();
  updateZoomDisplay(clampedZoom);
}

function resetView() {
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.setZoom(1);
  updateZoomDisplay(1);

  // Re-center template if loaded
  if (templateImage) {
    centerAndScaleTemplate();
  }
}

function updateZoomDisplay(zoom) {
  const zoomPercent = Math.round(zoom * 100);
  document.getElementById("zoomDisplay").textContent = `${zoomPercent}%`;
}

function handleCanvasResize() {
  const canvasWidth = window.innerWidth - 280;
  const canvasHeight = window.innerHeight;

  canvas.setDimensions({
    width: canvasWidth,
    height: canvasHeight,
  });

  // Re-center template if loaded
  if (templateImage) {
    centerAndScaleTemplate();
  }
}

function showInstructions() {
  const instructions = new fabric.Text("Select a Tesla model to begin", {
    fontSize: 24,
    fill: "#8b949e",
    fontFamily: "JetBrains Mono, monospace",
    fontWeight: "normal",
  });
  canvas.add(instructions);
  canvas.centerObject(instructions);
}

function loadTemplate(model) {
  currentModel = model;

  // Clear existing canvas
  canvas.clear();
  layers = [];
  document.getElementById("layersList").innerHTML = "";

  console.log(`Loading template for ${model}...`);

  // Load the actual template image
  const templateImg = new Image();
  templateImg.crossOrigin = "anonymous";
  templateImg.onload = function () {
    // Create Fabric.js image from the loaded template
    const fabricTemplate = new fabric.Image(templateImg, {
      selectable: false,
      hasControls: false,
      hasBorders: false,
      evented: false,
      originX: "left",
      originY: "top",
    });

    // Store original template dimensions for export
    fabricTemplate.originalWidth = templateImg.width;
    fabricTemplate.originalHeight = templateImg.height;

    canvas.add(fabricTemplate);
    templateImage = fabricTemplate;

    // Center and scale template
    centerAndScaleTemplate();

    // Create masking clipPath from template's white areas
    createMaskFromTemplate();

    // Enable download button
    document.getElementById("downloadBtn").disabled = false;

    console.log("Template loaded successfully");
  };

  templateImg.onerror = function () {
    console.error("Failed to load template image");
    alert(
      `Failed to load template for ${model}. Make sure the template file exists.`,
    );

    // Reset selection
    document.getElementById("carModelSelect").value = "";
    document.getElementById("downloadBtn").disabled = true;
    showInstructions();
  };

  // Try to load the template image
  templateImg.src = `/templates/${model}.png`;
}

function centerAndScaleTemplate() {
  if (!templateImage) return;

  // Scale the template to fit the canvas (90% of available space)
  const scaleFactor = Math.min(
    (canvas.width * 0.9) / templateImage.width,
    (canvas.height * 0.9) / templateImage.height,
  );

  templateImage.scale(scaleFactor);

  // Center the template (using top-left origin)
  const scaledWidth = templateImage.width * scaleFactor;
  const scaledHeight = templateImage.height * scaleFactor;

  templateImage.set({
    left: (canvas.width - scaledWidth) / 2,
    top: (canvas.height - scaledHeight) / 2,
  });

  canvas.renderAll();
}

function createMaskFromTemplate() {
  if (!templateImage) return;

  // Create an off-screen canvas to analyze the template
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  const img = templateImage.getElement();

  tempCanvas.width = img.width;
  tempCanvas.height = img.height;
  tempCtx.drawImage(img, 0, 0);

  // Get image data
  const imageData = tempCtx.getImageData(0, 0, img.width, img.height);
  const pixels = imageData.data;

  // Create a new canvas for the mask (white areas become opaque, black becomes transparent)
  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d");
  maskCanvas.width = img.width;
  maskCanvas.height = img.height;

  const maskImageData = maskCtx.createImageData(img.width, img.height);
  const maskPixels = maskImageData.data;

  // Process pixels: white areas (with tolerance) = editable
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Check if pixel is white (editable area) - with tolerance for slight color variation
    if (r > 180 && g > 180 && b > 180) {
      maskPixels[i] = 255; // R
      maskPixels[i + 1] = 255; // G
      maskPixels[i + 2] = 255; // B
      maskPixels[i + 3] = 255; // A (opaque)
    } else {
      maskPixels[i] = 0; // R
      maskPixels[i + 1] = 0; // G
      maskPixels[i + 2] = 0; // B
      maskPixels[i + 3] = 0; // A (transparent)
    }
  }

  maskCtx.putImageData(maskImageData, 0, 0);

  // Store the mask canvas for later use
  templateImage.maskCanvas = maskCanvas;
}

function detectPanelBlobs(maskCanvas) {
  const ctx = maskCanvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
  const pixels = imageData.data;
  const width = maskCanvas.width;
  const height = maskCanvas.height;

  const visited = new Uint8Array(width * height);
  const blobs = [];

  function floodFill(startX, startY) {
    const stack = [[startX, startY]];
    const blob = {
      minX: startX,
      maxX: startX,
      minY: startY,
      maxY: startY,
      pixels: [],
    };

    while (stack.length > 0) {
      const [x, y] = stack.pop();
      const idx = y * width + x;

      if (x < 0 || x >= width || y < 0 || y >= height) continue;
      if (visited[idx]) continue;

      const pixelIdx = idx * 4;
      const alpha = pixels[pixelIdx + 3];

      if (alpha < 10) continue; // Transparent, skip

      visited[idx] = 1;
      blob.pixels.push([x, y]);
      blob.minX = Math.min(blob.minX, x);
      blob.maxX = Math.max(blob.maxX, x);
      blob.minY = Math.min(blob.minY, y);
      blob.maxY = Math.max(blob.maxY, y);

      // Check 4-connected neighbors
      stack.push([x + 1, y]);
      stack.push([x - 1, y]);
      stack.push([x, y + 1]);
      stack.push([x, y - 1]);
    }

    return blob;
  }

  // Find all blobs
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      if (visited[idx]) continue;

      const pixelIdx = idx * 4;
      const alpha = pixels[pixelIdx + 3];

      if (alpha > 10) {
        const blob = floodFill(x, y);
        if (blob.pixels.length > 100) {
          // Ignore tiny blobs
          blobs.push(blob);
        }
      }
    }
  }

  return blobs;
}

function findNearestBlob(x, y) {
  if (!templateImage || !templateImage.panelBlobs) return null;

  // Convert canvas coordinates to template image coordinates
  const bounds = templateImage.getBoundingRect();
  const scaleX = templateImage.scaleX || 1;
  const scaleY = templateImage.scaleY || 1;
  const imgX = Math.floor((x - bounds.left) / scaleX);
  const imgY = Math.floor((y - bounds.top) / scaleY);

  let nearestBlob = null;
  let minDistance = Infinity;

  for (const blob of templateImage.panelBlobs) {
    // Check if point is inside blob
    if (
      imgX >= blob.minX &&
      imgX <= blob.maxX &&
      imgY >= blob.minY &&
      imgY <= blob.maxY
    ) {
      // Check if actually on a pixel in this blob
      const isInside = blob.pixels.some(
        ([px, py]) => Math.abs(px - imgX) < 5 && Math.abs(py - imgY) < 5,
      );
      if (isInside) {
        return blob;
      }
    }

    // Calculate distance to blob center
    const centerX = (blob.minX + blob.maxX) / 2;
    const centerY = (blob.minY + blob.maxY) / 2;
    const distance = Math.sqrt((imgX - centerX) ** 2 + (imgY - centerY) ** 2);

    if (distance < minDistance) {
      minDistance = distance;
      nearestBlob = blob;
    }
  }

  return nearestBlob;
}

function createSingleBlobMask(blob) {
  if (!blob || !templateImage) return null;

  const img = templateImage.getElement();
  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d");
  maskCanvas.width = img.width;
  maskCanvas.height = img.height;

  const maskImageData = maskCtx.createImageData(img.width, img.height);
  const maskPixels = maskImageData.data;

  // Create a Set for fast lookup of blob pixels
  const blobPixelSet = new Set();
  for (const [x, y] of blob.pixels) {
    blobPixelSet.add(`${x},${y}`);
  }

  // Only make pixels in this specific blob visible
  for (let y = 0; y < img.height; y++) {
    for (let x = 0; x < img.width; x++) {
      const i = (y * img.width + x) * 4;

      if (blobPixelSet.has(`${x},${y}`)) {
        maskPixels[i] = 255; // R
        maskPixels[i + 1] = 255; // G
        maskPixels[i + 2] = 255; // B
        maskPixels[i + 3] = 255; // A (opaque)
      } else {
        maskPixels[i] = 0;
        maskPixels[i + 1] = 0;
        maskPixels[i + 2] = 0;
        maskPixels[i + 3] = 0; // Transparent
      }
    }
  }

  maskCtx.putImageData(maskImageData, 0, 0);
  return maskCanvas;
}

function applyMaskToObject(obj) {
  if (!templateImage || !templateImage.maskCanvas) return;

  // Cache the mask image if not already created
  if (!templateImage.cachedMaskImage) {
    templateImage.cachedMaskImage = new fabric.Image(templateImage.maskCanvas, {
      left: templateImage.left,
      top: templateImage.top,
      scaleX: templateImage.scaleX,
      scaleY: templateImage.scaleY,
      originX: "left",
      originY: "top",
      absolutePositioned: true,
    });
  }

  // Reuse the cached mask
  obj.clipPath = templateImage.cachedMaskImage;
  canvas.requestRenderAll();
}

function handleImageUpload(e) {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (event) {
    const img = new Image();
    img.onload = function () {
      addImageToCanvas(img);
    };
    img.src = event.target.result;
  };
  reader.readAsDataURL(file);

  // Reset file input
  e.target.value = "";
}

function addImageToCanvas(img) {
  if (!templateImage) {
    alert("Please select a car model first");
    return;
  }

  const fabricImg = new fabric.Image(img, {
    left: canvas.width / 2,
    top: canvas.height / 2,
    originX: "center",
    originY: "center",
    scaleX: 0.3,
    scaleY: 0.3,
    borderColor: "#ff4444",
    cornerColor: "#ff4444",
    cornerSize: 10,
    transparentCorners: false,
    cornerStyle: "circle",
  });

  // Apply visual mask when object stops being manipulated (not during movement)
  fabricImg.on("modified", function () {
    applyMaskToObject(fabricImg);
  });

  canvas.add(fabricImg);
  canvas.setActiveObject(fabricImg);

  // Apply initial mask
  applyMaskToObject(fabricImg);

  canvas.renderAll();

  // Add to layers
  addToLayers("Image", fabricImg);
}

function addTextElement() {
  if (!templateImage) {
    alert("Please select a car model first");
    return;
  }

  const text = new fabric.IText("Double click to edit", {
    left: canvas.width / 2,
    top: canvas.height / 2,
    originX: "center",
    originY: "center",
    fontSize: 32,
    fill: "#000000",
    fontFamily: "Arial",
    borderColor: "#ff4444",
    cornerColor: "#ff4444",
    cornerSize: 10,
    transparentCorners: false,
    cornerStyle: "circle",
  });

  // Apply visual mask when object stops being manipulated (not during movement)
  text.on("modified", function () {
    applyMaskToObject(text);
  });

  // Also apply mask when text is edited
  text.on("changed", function () {
    applyMaskToObject(text);
  });

  canvas.add(text);
  canvas.setActiveObject(text);

  // Apply initial mask
  applyMaskToObject(text);

  canvas.renderAll();

  // Add to layers
  addToLayers("Text", text);
}

function addToLayers(type, object) {
  const layerId = `layer-${Date.now()}`;

  const layerItem = document.createElement("div");
  layerItem.className = "layer-item";
  layerItem.id = layerId;

  const layerName = document.createElement("span");
  layerName.className = "layer-name";
  layerName.textContent = `${type} ${layers.length + 1}`;

  const layerControls = document.createElement("div");
  layerControls.className = "layer-controls";

  // Visibility toggle button
  const visibilityBtn = document.createElement("button");
  visibilityBtn.className = "layer-btn visibility";
  visibilityBtn.textContent = "👁";
  visibilityBtn.title = "Toggle visibility";
  visibilityBtn.onclick = (e) => {
    e.stopPropagation();
    toggleLayerVisibility(object, visibilityBtn);
  };

  // Delete button
  const deleteBtn = document.createElement("button");
  deleteBtn.className = "layer-btn";
  deleteBtn.textContent = "✕";
  deleteBtn.title = "Delete layer";
  deleteBtn.onclick = (e) => {
    e.stopPropagation();
    removeObject(object);
  };

  layerControls.appendChild(visibilityBtn);
  layerControls.appendChild(deleteBtn);

  layerItem.appendChild(layerName);
  layerItem.appendChild(layerControls);

  // Click to select
  layerItem.onclick = () => {
    canvas.setActiveObject(object);
    canvas.requestRenderAll();
    updateLayerSelection();
  };

  document.getElementById("layersList").appendChild(layerItem);

  layers.push({
    id: layerId,
    type: type,
    object: object,
  });

  // Show layers panel if it was hidden
  updateLayersPanelVisibility();
}

function updateLayersPanelVisibility() {
  const layersPanel = document.querySelector(".layers-panel");
  if (layers.length > 0) {
    layersPanel.classList.remove("hidden");
  } else {
    layersPanel.classList.add("hidden");
  }
}

function toggleLayerVisibility(object, button) {
  object.visible = !object.visible;
  button.textContent = object.visible ? "👁" : "—";
  button.style.opacity = object.visible ? "1" : "0.5";
  canvas.requestRenderAll();
}

function removeObject(object) {
  // Find and remove from layers array
  const layerIndex = layers.findIndex((l) => l.object === object);
  if (layerIndex !== -1) {
    const layerId = layers[layerIndex].id;
    const layerElement = document.getElementById(layerId);
    if (layerElement) {
      layerElement.remove();
    }
    layers.splice(layerIndex, 1);
  }

  // Remove from canvas
  canvas.remove(object);
  canvas.requestRenderAll();

  // Update panel visibility
  updateLayersPanelVisibility();
}

function updateLayerSelection() {
  const activeObject = canvas.getActiveObject();

  document.querySelectorAll(".layer-item").forEach((item) => {
    item.classList.remove("selected");
  });

  if (activeObject && activeObject !== templateImage) {
    const layer = layers.find((l) => l.object === activeObject);
    if (layer) {
      const layerElement = document.getElementById(layer.id);
      if (layerElement) {
        layerElement.classList.add("selected");
      }
    }
  }
}

function downloadDesign() {
  if (!templateImage) {
    alert("No design to download");
    return;
  }

  // Save current viewport transform (zoom/pan)
  const vpt = canvas.viewportTransform.slice();
  const currentZoom = canvas.getZoom();

  // Temporarily reset viewport to identity (no zoom/pan)
  canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
  canvas.setZoom(1);
  canvas.renderAll();

  // Create export canvas at original template size
  const exportCanvas = document.createElement("canvas");
  const ctx = exportCanvas.getContext("2d");

  const origWidth = templateImage.originalWidth;
  const origHeight = templateImage.originalHeight;

  exportCanvas.width = origWidth;
  exportCanvas.height = origHeight;

  // Calculate scale factor from display to original
  const displayWidth = templateImage.getScaledWidth();
  const displayHeight = templateImage.getScaledHeight();
  const scaleX = origWidth / displayWidth;
  const scaleY = origHeight / displayHeight;

  // Draw original template
  ctx.drawImage(templateImage.getElement(), 0, 0, origWidth, origHeight);

  // Create mask from template at original size
  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d");
  maskCanvas.width = origWidth;
  maskCanvas.height = origHeight;

  // Draw template to get pixel data
  maskCtx.drawImage(templateImage.getElement(), 0, 0, origWidth, origHeight);
  const imageData = maskCtx.getImageData(0, 0, origWidth, origHeight);
  const pixels = imageData.data;

  // Create mask: white areas stay, everything else becomes transparent
  const maskImageData = maskCtx.createImageData(origWidth, origHeight);
  const maskPixels = maskImageData.data;

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    // Check if pixel is white (editable area) - with tolerance
    if (r > 180 && g > 180 && b > 180) {
      maskPixels[i] = 255;
      maskPixels[i + 1] = 255;
      maskPixels[i + 2] = 255;
      maskPixels[i + 3] = 255; // Opaque
    } else {
      maskPixels[i] = 0;
      maskPixels[i + 1] = 0;
      maskPixels[i + 2] = 0;
      maskPixels[i + 3] = 0; // Transparent
    }
  }

  maskCtx.putImageData(maskImageData, 0, 0);

  // Get template position on display canvas (after reset)
  const templateLeft = templateImage.left;
  const templateTop = templateImage.top;

  // Render each object
  canvas.getObjects().forEach((obj) => {
    if (obj === templateImage || !obj.visible) return; // Skip template and hidden objects

    ctx.save();

    // Calculate object center in template space
    const objCenter = obj.getCenterPoint();
    const relX = (objCenter.x - templateLeft) * scaleX;
    const relY = (objCenter.y - templateTop) * scaleY;

    // Move to object position
    ctx.translate(relX, relY);

    // Apply rotation
    if (obj.angle) {
      ctx.rotate((obj.angle * Math.PI) / 180);
    }

    // Apply scale
    const finalScaleX = (obj.scaleX || 1) * scaleX;
    const finalScaleY = (obj.scaleY || 1) * scaleY;

    // Handle text objects
    if (obj.type === "i-text" || obj.type === "text") {
      ctx.scale(finalScaleX, finalScaleY);
      ctx.font = `${obj.fontSize}px ${obj.fontFamily}`;
      ctx.fillStyle = obj.fill;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(obj.text, 0, 0);
    }
    // Handle image objects
    else if (obj.type === "image") {
      const img = obj.getElement();
      const imgWidth = obj.width * finalScaleX;
      const imgHeight = obj.height * finalScaleY;
      ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
    }

    ctx.restore();
  });

  // Apply mask to final composite - clip everything outside white areas
  ctx.globalCompositeOperation = "destination-in";
  ctx.drawImage(maskCanvas, 0, 0, origWidth, origHeight);
  ctx.globalCompositeOperation = "source-over";

  // Restore viewport transform (zoom/pan)
  canvas.setViewportTransform(vpt);
  canvas.setZoom(currentZoom);
  canvas.requestRenderAll();

  // Download
  const link = document.createElement("a");
  link.download = `tesla-wrap-${currentModel}-${Date.now()}.png`;
  link.href = exportCanvas.toDataURL("image/png");
  link.click();

  console.log("Design exported successfully");

  // Show the modal with instructions
  showModal();
}

function showModal() {
  document.getElementById("downloadModal").style.display = "flex";
}

function closeModal() {
  document.getElementById("downloadModal").style.display = "none";
}

function resetEditor() {
  if (!confirm("Are you sure you want to reset? All changes will be lost.")) {
    return;
  }

  canvas.clear();
  layers = [];
  document.getElementById("layersList").innerHTML = "";
  document.getElementById("carModelSelect").value = "";
  document.getElementById("downloadBtn").disabled = true;
  currentModel = null;
  templateImage = null;
  resetView();
  showInstructions();

  // Hide layers panel
  updateLayersPanelVisibility();
}

// Helper function to check if a point is within the editable (white) area
function isPointInEditableArea(x, y) {
  if (!templateImage || !templateImage.getElement()) return true; // Allow if no template

  const imgElement = templateImage.getElement();
  const bounds = templateImage.getBoundingRect();

  // Check if point is within template bounds
  if (
    x < bounds.left ||
    x > bounds.left + bounds.width ||
    y < bounds.top ||
    y > bounds.top + bounds.height
  ) {
    return false;
  }

  // Calculate position in original image coordinates
  const scaleX = templateImage.scaleX || 1;
  const scaleY = templateImage.scaleY || 1;
  const imgX = Math.floor((x - bounds.left) / scaleX);
  const imgY = Math.floor((y - bounds.top) / scaleY);

  // Check bounds
  if (
    imgX < 0 ||
    imgX >= imgElement.width ||
    imgY < 0 ||
    imgY >= imgElement.height
  ) {
    return false;
  }

  // Create a temporary canvas to check pixel color
  const tempCanvas = document.createElement("canvas");
  const tempCtx = tempCanvas.getContext("2d");
  tempCanvas.width = imgElement.width;
  tempCanvas.height = imgElement.height;
  tempCtx.drawImage(imgElement, 0, 0);

  // Get pixel data
  const pixelData = tempCtx.getImageData(imgX, imgY, 1, 1).data;

  // Check if the pixel is white (editable area)
  const isWhite =
    pixelData[0] > 200 && pixelData[1] > 200 && pixelData[2] > 200;

  return isWhite;
}

// Function to constrain objects to editable areas
function constrainToEditableArea(obj) {
  if (!templateImage) return;

  const center = obj.getCenterPoint();

  // Check if the center point is in an editable area
  if (!isPointInEditableArea(center.x, center.y)) {
    // Find the nearest editable point
    let nearestX = center.x;
    let nearestY = center.y;
    let found = false;

    // Search for nearest editable point
    for (let radius = 5; radius < 100; radius += 5) {
      for (let angle = 0; angle < 360; angle += 15) {
        const rad = (angle * Math.PI) / 180;
        const testX = center.x + radius * Math.cos(rad);
        const testY = center.y + radius * Math.sin(rad);

        if (isPointInEditableArea(testX, testY)) {
          nearestX = testX;
          nearestY = testY;
          found = true;
          break;
        }
      }
      if (found) break;
    }

    if (found) {
      obj.set({
        left: nearestX,
        top: nearestY,
      });
      obj.setCoords();
    }
  }
}
