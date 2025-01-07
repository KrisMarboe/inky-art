let canvas = document.getElementById("canvas");
let ctx = canvas.getContext("2d");
let full_picture_canvas = document.createElement("canvas");
let full_picture_ctx = full_picture_canvas.getContext("2d");
let resized_canvas = document.createElement("canvas");
let resized_ctx = resized_canvas.getContext("2d");
let expand_button = document.getElementById("expand");
let upload_button = document.getElementById("upload");
let upload_input = document.getElementById("load-img-input");
let save_button = document.getElementById("save");
let img;
let active_point = null;
let croping_point_radius = 20;
let mouse_down = false;
let last_mouse_position = {x: 0, y: 0};
let inky_size = 800;
let cropping_points = [];

window.onload = function() {

    // Add button functionality
    expand_button.onclick = toggle_options;
    upload_button.onclick = upload_image;
    save_button.onclick = save_image;
    upload_input.onchange = overwrite_canvas;
    canvas.onmousemove = function(e) {
        if (!mouse_down) return;
        
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        
        if (active_point == null) {
            // Move all points
            let dx = x - last_mouse_position.x;
            let dy = y - last_mouse_position.y;
            cropping_points.forEach(point => {
                point.x = Math.max(0, Math.min(canvas.width, point.x + dx));
                point.y = Math.max(0, Math.min(canvas.height, point.y + dy));
            });
            last_mouse_position = {x: x, y: y};

        } else {
            cropping_points[active_point].x = x;
            cropping_points[active_point].y = y;

            left_point = active_point == 0 ? 3 : active_point - 1;
            right_point = active_point == 3 ? 0 : active_point + 1;
            if (active_point % 2 == 0) {
                // Update left and right points
                cropping_points[left_point].x = x;
                cropping_points[right_point].y = y;
            } else {
                // Update top and bottom points
                cropping_points[left_point].y = y;
                cropping_points[right_point].x = x;
            }
        }

        draw_canvas();
    };

    canvas.onmousedown = function(e) {
        let rect = canvas.getBoundingClientRect();
        let x = e.clientX - rect.left;
        let y = e.clientY - rect.top;
        mouse_down = true;

        active_point = null;
        for (let i = 0; i < cropping_points.length; i++) {
            let point = cropping_points[i];
            let distance = Math.sqrt((point.x - x) ** 2 + (point.y - y) ** 2);
            if (distance < croping_point_radius) { // Assuming 10 is the radius of the cropping points
                active_point = i;
                return;
            }
        }

        if (active_point == null) {
            // Check if mouse is inside the cropping area
            mouse_down = (
                x > cropping_points[0].x) && (
                    x < cropping_points[2].x) && (
                        y > cropping_points[0].y) && (
                            y < cropping_points[2].y);
            last_mouse_position = {x: x, y: y};
        }
    };
    canvas.onmouseup = function(e) {
        mouse_down = false;
        active_point = null;
    };
    canvas.onmouseleave = function(e) {
        mouse_down = false;
        active_point = null;
    };
 }
 
 function overwrite_canvas() {
    let file = this.files[0];
    let reader = new FileReader();
    reader.onload = function(e) {
        img = new Image();
        img.onload = function() {
            // Set canvas size to image size but not larger than window size
            let width = img.width;
            let height = img.height;
            let window_width = window.innerWidth;
            let window_height = window.innerHeight;
            if (width / height > window_width / window_height) {
                width = window_width * 0.9;
                height *= width / img.width;
            } else {
                height = window_height * 0.9;
                width *= height / img.height;
            }
            canvas.width = width;
            canvas.height = height;
            full_picture_canvas.width = img.width;
            full_picture_canvas.height = img.height;
            full_picture_ctx.drawImage(img, 0, 0);

            // Draw canvas
            add_cropping_points(canvas.width, canvas.height);
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(file);

    // Show canvas and hide instructions
    if (canvas.style.display == "none") {
        canvas.style.display = "block";
        document.getElementById("instructions").style.display = "none";
    }

    // Reset input field
    this.value = "";
}

function toggle_options() {
    let options = document.getElementById("options");
    options.classList.toggle("slide-down")
    let expand_text = expand_button.innerHTML;
    expand_button.innerHTML = expand_text == "+" ? "-" : "+";
    expand_button.style.backgroundColor = expand_text == "+" ? "red" : "green";
}

function upload_image() {
    upload_input.click();
}

function save_image() {
    let form = document.getElementById("artist-form");
    form.elements["artist"].value = prompt("Please enter your artist name", "Anonymous");
    form.elements["data"].value = extract_cropping_and_resize();
    
    // form.submit();

}

function extract_cropping_and_resize() {
    // Get cropping points in full picture coordinates
    let cropping_points_full_picture = [];
    let width_ratio = full_picture_canvas.width / canvas.width;
    let height_ratio = full_picture_canvas.height / canvas.height;
    cropping_points.forEach(point => {
        cropping_points_full_picture.push({
            x: Math.round(point.x * width_ratio),
            y: Math.round(point.y * height_ratio)
        });
    });

    // Crop image
    let cropped_img = full_picture_ctx.getImageData(
        cropping_points_full_picture[0].x, cropping_points_full_picture[0].y,
        cropping_points_full_picture[1].x - cropping_points_full_picture[0].x,
        cropping_points_full_picture[2].y - cropping_points_full_picture[1].y
    );

    // Resize image
    if (cropped_img.width > cropped_img.height) {
        let new_height = inky_size * cropped_img.height / cropped_img.width;
        resized_canvas.width = inky_size;
        resized_canvas.height = new_height;
    } else {
        let new_width = inky_size * cropped_img.width / cropped_img.height;
        resized_canvas.width = new_width;
        resized_canvas.height = inky_size;
    }

    console.log(resized_canvas.width, resized_canvas.height);
    console.log(cropped_img)
    resized_ctx.drawImage(cropped_img, 0, 0, resized_canvas.width, resized_canvas);

    // Get custom string
    let custom_str = custom_stringify(resized_ctx);

    return custom_str;
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

function add_cropping_points(width, height) {
    // Add cropping points (one in each corner in order [top-left, top-right, bottom-right, bottom-left])
    cropping_points = [];
    cropping_points.push({x: 0, y: 0});
    cropping_points.push({x: width, y: 0});
    cropping_points.push({x: width, y: height});
    cropping_points.push({x: 0, y: height});
    draw_canvas();
}

function draw_canvas() {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    ctx.setLineDash([]);
    cropping_points.forEach(point => {
        ctx.beginPath();
        ctx.arc(point.x, point.y, croping_point_radius, 0, 2 * Math.PI);
        ctx.stroke();
    });
    // Draw lines between points
    ctx.setLineDash([10, 5]);
    ctx.beginPath();
    ctx.moveTo(cropping_points[0].x, cropping_points[0].y);
    cropping_points.forEach(point => {
        ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.stroke();
    // Draw darkened areas from image outside of cropping points
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    let points = [
        [{x: 0, y: 0}, cropping_points[0], cropping_points[1], {x: canvas.width, y: 0}],
        [{x: canvas.width, y: 0}, cropping_points[1], cropping_points[2], {x: canvas.width, y: canvas.height}],
        [{x: canvas.width, y: canvas.height}, cropping_points[2], cropping_points[3], {x: 0, y: canvas.height}],
        [{x: 0, y: canvas.height}, cropping_points[3], cropping_points[0], {x: 0, y: 0}]
    ];

    points.forEach(pointSet => {
        ctx.beginPath();
        ctx.moveTo(pointSet[0].x, pointSet[0].y);
        pointSet.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.closePath();
        ctx.fill();
    });

}