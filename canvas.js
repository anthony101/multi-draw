/* eslint-env browser */

document.addEventListener('DOMContentLoaded', init);

var CIRCLE_SIZE = 10;
var DOT_SIZE = 1;

//var ctxt;
//var ws;
var painter;

// Painter: primitve methods for drawing
// Normally, __drawCircleBase(...) should not be call by external code, this method is used internally
var Painter = {
  new: function(context) {
    return {
      __proto__: this,
      context: context
    };
  },
  drawDot: function(x, y, size, color) {
    this.context.beginPath();
    this.context.moveTo(x, y);
    this.context.lineTo(x + size, y + size);
    this.context.strokeStyle = color;
    this.context.stroke();
    //console.log("dot: x= "+x+", y="+y+", size="+size);
  },
  __drawCircleBase: function(x, y, size, color) {
    this.context.beginPath();
    this.context.arc(x, y, size, 0, Math.PI*2);
    //this.context.stroke();
    return this.context;
    //console.log("circle: x= "+x+", y="+y+", size="+size);
  },
  drawCircle: function(x, y, size, color) {
    var draw = this.__drawCircleBase(x, y, size, color);
    draw.strokeStyle = color;
    draw.stroke();
  },
  drawFilledCircle: function(x, y, size, color) {
    var draw = this.__drawCircleBase(x, y, size, color);
    draw.fillStyle = color;
    draw.fill();
  },
  erase: function(x, y, size) {
    var draw = this.drawFilledCircle(x, y, size, 'white');
  }
};

// Structure for network messages sent throught the WebSocket
// Contains default configuration
var data = {
    'point' : {
        'x': 0,
        'y': 0
    },
    'brush' : {
        'type': 'dot',
        'size': DOT_SIZE,
        'color': 'black'
    }
};

function init() {
  var canvas = document.querySelector('canvas');
  canvas.width  = 640;
  canvas.height = 480;
  var ctxt = canvas.getContext('2d');
  painter = Painter.new(ctxt);

  var ws = setupWebSocket();

  canvas.addEventListener('mousemove', send(ws));
  canvas.addEventListener('mouseup', clickCallback);
  canvas.addEventListener('mousedown', clickCallback);

  // Callback second arg forces canDraw boolean to true to draw something without mousemove event
  canvas.addEventListener('click', send(ws, true));
  
  /*
  document.getElementById('brushbutton-dot').addEventListener('click', chooseBrush('dot'));
  document.getElementById('brushbutton-circle').addEventListener('click', chooseBrush('circle'));
  document.getElementById('brushbutton-filledcircle').addEventListener('click', chooseBrush('filledcircle'));
  document.getElementById('eraserbutton').addEventListener('click', chooseBrush('eraser'));
  */
  var binding = [['brushbutton-dot', 'dot'],
                 ['brushbutton-circle', 'circle'],
                 ['brushbutton-filledcircle', 'filledcircle'],
                 ['eraserbutton', 'eraser']];
  for(var i = 0; i < binding.length; i++) {
    document.getElementById(binding[i][0]).addEventListener('click', chooseBrush(binding[i][1]));
  }

  var colorPicker = document.getElementById('colorpicker');
  colorPicker.addEventListener('change', switchColor(colorPicker));
}

// Setup WebSocket
function setupWebSocket() {
  var url = 'ws:' + document.location.hostname + ':3001';
  var ws = new WebSocket(url);
  ws.onopen = function() { console.log('CONNECTED'); };
  ws.onclose = function() { console.log('DISCONNECTED'); };

  // When a message is received from the server, draw the point
  ws.onmessage = function(event) {
    // Need to unserialize data first
    var data = JSON.parse(event.data);
    draw(painter, data.point, data.brush);
  };
  return ws;
}

// Serialize coordinates then send to the server
var canDraw = false;
function send(ws, forceToDraw) {
  return function(event) {
    if (canDraw || forceToDraw) {
      data.point.x = event.pageX;
      data.point.y = event.pageY;
      ws.send(JSON.stringify(data));
    }
  }
}

function draw(painter, point, brush) {
  var method;
  // Maps brush type and method call identifier
  switch(brush.type) {
    case 'dot':          method = 'drawDot'; break; //painter.drawDot(x, y, brush.size, brush.color); break;
    case 'circle':       method = 'drawCircle'; break; //painter.drawCircle(x, y, brush.size, brush.color); break;
    case 'filledcircle': method = 'drawFilledCircle'; break; //painter.drawFilledCircle(x, y, brush.size, brush.color); break;
    case 'eraser':       method = 'erase'; break; //painter.erase(x, y, brush.size); break;
  }
  painter[method](point.x, point.y, brush.size, brush.color);
}

function clickCallback(event) {
  canDraw = !canDraw;
}

function switchColor(colorPicker) {
  //data.brush.color = document.getElementById('colorpicker').value;
  //console.log(color);
  return function(event) {
    data.brush.color = colorPicker.value;
  }
}

function chooseBrush(type) {
  return function(event) {
    data.brush.type = type;
    data.brush.size = (type === 'dot') ? DOT_SIZE : CIRCLE_SIZE;
  }
}
