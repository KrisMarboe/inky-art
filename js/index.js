let active_color;
let brush_size;
let saturation;
let image_loader;

const canvas = document.getElementById('canvas');
const context = canvas.getContext('2d');
let isDrawing = false;
let x = 0;
let y = 0;
var offsetX;
var offsetY;

let saturated_colors = {
    "black": [57, 48, 57],
    "white": [255, 255, 255],
    "green": [58, 91, 70],
    "blue": [61, 59, 94],
    "red": [156, 72, 75],
    "yellow": [208, 190, 71],
    "orange": [177, 106, 73]
}
let desaturated_colors = {
    "black": [0, 0, 0],
    "white": [255, 255, 255],
    "green": [0, 255, 0],
    "blue": [0, 0, 255],
    "red": [255, 0, 0],
    "yellow": [255, 255, 0],
    "orange": [255, 140, 0]
}

window.onload = function() {
    brush_size = parseInt(document.getElementById("brush-size-value").innerHTML);
    document.getElementById("brush-size").value = brush_size;
    saturation = parseFloat(document.getElementById("saturation-value").innerHTML);
    document.getElementById("saturation").value = saturation;
    update_color_palette(saturation);
    
    let colors_div = document.getElementById("colors");
    // Loop through color divs
    let color_div;
    let color_icon;
    for (let i = 0; i < colors_div.children.length; i++) {
        color_div = colors_div.children[i];
        color_icon = color_div.children[0];

        // Set background color of color icon to match saturation
        update_color(color_icon, saturation);
        if (color_div.classList.contains("active-color")) {
            active_color = parse_rgb(saturate(color_icon.id, saturation));
        }
        if (color_icon.id === "color-picker") {
            color_icon.onclick = function() {
                let color_picker = document.getElementById("color-picker-input");
                color_picker.click();
                color_picker.onchange = function() {
                    let color = color_picker.value;
                    let color_icon = document.getElementById("color-picker");
                    color_icon.style.backgroundColor = color;
                    active_color = color;
                    let active_color_div = document.getElementsByClassName("active-color")[0];
                    active_color_div.classList.remove("active-color");
                    color_div = this.parentElement;
                    color_div.classList.add("active-color");
                }
            }
        } else {
            color_icon.onclick = function() {
                active_color = parse_rgb(saturate(this.id, saturation));
                let active_color_div = document.getElementsByClassName("active-color")[0];
                active_color_div.classList.remove("active-color");
                color_div = this.parentElement;
                color_div.classList.add("active-color");
            }
        }
    }
    image_loader = document.getElementById("load-img-input");
    image_loader.onchange = function() {
        let file = this.files[0];
        let reader = new FileReader();
        reader.onload = function(e) {
            let img = new Image();
            img.onload = function() {
              // Set canvas size to image size but not larger than 800x800
              let width = img.width;
              let height = img.height;
              if ((width > height) && (width > 800)) {
                height *= 800 / width;
                width = 800;
              } else if ((height > width) && (height > 800)) {
                width *= 800 / height;
                height = 800;
              }
              canvas.width = width;
              canvas.height = height;

              // Draw image on canvas
              context.drawImage(img, 0, 0, width, height);
            }
            img.src = e.target.result;
        }
        reader.readAsDataURL(file);
    }
    document.getElementById("brush-size").oninput = function() {
        brush_size = this.value;
        document.getElementById("brush-size-value").innerHTML = brush_size;
    }
    document.getElementById("saturation").oninput = function() {
        saturation = this.value;
        document.getElementById("saturation-value").innerHTML = parseFloat(saturation).toFixed(1);
        update_color_palette(saturation);
        active_color = set_active_color(saturation);
    }
    document.getElementById("upload").onclick = function() {
      image_loader.click();
    }
    document.getElementById("save").onclick = function() {
      let form = document.getElementById("artist-form");
      form.elements["artist"].value = prompt("Please enter your artist name", "Anonymous");
      form.elements["data"].value = custom_stringify(context);
      form.submit();
    }
    document.getElementById("clear").onclick = function() {
        clearArea();
    }
}

let update_color_palette = function(saturation) {
    let colors_div = document.getElementById("colors");
    let color_icon;
    for (let i = 0; i < colors_div.children.length; i++) {
        color_icon = colors_div.children[i].children[0];
        update_color(color_icon, saturation);
    }
}

let update_color = function(color_icon, saturation) {
    if (color_icon.id !== "color-picker") {    
        rgb = saturate(color_icon.id, saturation)
        color_icon.style.backgroundColor = parse_rgb(rgb);
    }
}

let saturate = function(color, saturation) {
    let rgb = [0, 0, 0];
    for (let i = 0; i < 3; i++) {
        rgb[i] = saturated_colors[color][i] * saturation + desaturated_colors[color][i] * (1 - saturation);
    }
    return rgb;
}

let parse_rgb = function(rgb) {
    return "rgb(" + rgb[0] + ", " + rgb[1] + ", " + rgb[2] + ")";
}

let set_active_color = function(saturation) {
    let color = document.getElementsByClassName("active-color")[0].children[0].id;
    return parse_rgb(saturate(color, saturation));
}

function startup() {
  canvas.addEventListener('touchstart', handleStart);
  canvas.addEventListener('touchend', handleEnd);
  canvas.addEventListener('touchcancel', handleCancel);
  canvas.addEventListener('touchmove', handleMove);
  canvas.addEventListener('mousedown', (e) => {
    x = e.offsetX;
    y = e.offsetY;
    isDrawing = true;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (isDrawing) {
      drawLine(context, x, y, e.offsetX, e.offsetY);
      x = e.offsetX;
      y = e.offsetY;
    }
  });

  canvas.addEventListener('mouseup', (e) => {
    if (isDrawing) {
      drawLine(context, x, y, e.offsetX, e.offsetY);
      x = 0;
      y = 0;
      isDrawing = false;
    }
  });
}

document.addEventListener("DOMContentLoaded", startup);

const ongoingTouches = [];

function handleStart(evt) {
  evt.preventDefault();
  const touches = evt.changedTouches;
  offsetX = canvas.getBoundingClientRect().left;
  offsetY = canvas.getBoundingClientRect().top;
  for (let i = 0; i < touches.length; i++) {
    ongoingTouches.push(copyTouch(touches[i]));
  }
}

function handleMove(evt) {
  evt.preventDefault();
  const touches = evt.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    const color = active_color;
    const idx = ongoingTouchIndexById(touches[i].identifier);
    if (idx >= 0) {
      context.beginPath();
      context.moveTo(ongoingTouches[idx].clientX - offsetX, ongoingTouches[idx].clientY - offsetY);
      context.lineTo(touches[i].clientX - offsetX, touches[i].clientY - offsetY);
      context.lineWidth = brush_size;
      context.strokeStyle = color;
      context.lineJoin = "round";
      context.closePath();
      context.stroke();
      ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
    }
  }
}

function handleEnd(evt) {
  evt.preventDefault();
  const touches = evt.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    const color = active_color;
    let idx = ongoingTouchIndexById(touches[i].identifier);
    if (idx >= 0) {
      context.lineWidth = brush_size;
      context.fillStyle = color;
      ongoingTouches.splice(idx, 1);  // remove it; we're done
    }
  }
}

function handleCancel(evt) {
  evt.preventDefault();
  const touches = evt.changedTouches;
  for (let i = 0; i < touches.length; i++) {
    let idx = ongoingTouchIndexById(touches[i].identifier);
    ongoingTouches.splice(idx, 1);  // remove it; we're done
  }
}

function copyTouch({ identifier, clientX, clientY }) {
  return { identifier, clientX, clientY };
}

function ongoingTouchIndexById(idToFind) {
  for (let i = 0; i < ongoingTouches.length; i++) {
    const id = ongoingTouches[i].identifier;
    if (id === idToFind) {
      return i;
    }
  }
  return -1;    // not found
}

function drawLine(context, x1, y1, x2, y2) {
  context.beginPath();
  
  context.strokeStyle = active_color;
  context.lineWidth = brush_size;
  context.lineJoin = "round";
  context.moveTo(x1, y1);
  context.lineTo(x2, y2);
  context.closePath();
  context.stroke();
}

function clearArea() {
  // Set width to 800x480
  canvas.width = 800;
  canvas.height = 480;
  context.setTransform(1, 0, 0, 1, 0, 0);
  context.clearRect(0, 0, context.canvas.width, context.canvas.height);
}

function custom_stringify(context) {
    let str = "";
    let data = context.getImageData(0, 0, canvas.width, canvas.height).data;
    for (let i = 0; i < data.length/4; i++) {
        str += data[i*4] + ":" + data[i*4 + 1] + ":" + data[i*4 + 2] + ":" + data[i*4 + 3];
        if (!((i + 1) % canvas.width)) {
          str += ";";
        }
        else {
          str += ",";
        } 
    }
    str = str.slice(0, -1);
    console.log(str);
    return str;
}