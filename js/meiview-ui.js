meiView.UI = {};
meiView.UI.dots = {};

meiView.UI.fillSideBar = function(sidebardiv, sources, sidebar_class) {
  for(src in sources){
    var source = sources[src];
    sidebardiv.append('<h3 class="' + sidebar_class + '">'+src+'</h3><div class="' + sidebar_class + '"><ul id="' + src + '"></ul></div>');
    var listElem = sidebardiv.find('ul[id="'+src+'"]');
    for (var i=0; i<source.length; i++) {
      listElem.append('<li>' + source[i].appID + '</li>')
    }
  }
}

meiView.UI.DisplayMainMEI = function(score, canvas) {
  var score_width = $(canvas).attr('width') - 20;
  var score_height = $(canvas).attr('height') - 20;
  Vex.LogInfo('Rendering main MEI... ');
  MEI2VF.render_notation(score, canvas, score_width, score_height);
  Vex.LogInfo('Done rendering main MEI');
  return canvas;  
}

meiView.UI.displayDots = function() {
  for (dot in meiView.UI.dots) {
    meiView.UI.fabrCanvas.remove(meiView.UI.dots[dot]);
  }
  for (appID in meiView.MEI.APPs) {
    meiView.UI.displayDotForAPP(appID);
  }
}

meiView.UI.displayDotForAPP = function(appID) {

  // In order to know what coordiantes to display the dot at, we have to
  // get the coordinates of the VexFlow staff object. VexFlow staff objects are 
  // exposed by MEI2VF via the MEI2VF.rendered_measures:
  // MEI2VF.rendered_measures is indexed by the measure number and staff number.
  // so, in order to retreive the right measure we have to know the measure number and the 
  // staff number:

  // get the meausure number first, 
  var app = $(meiView.MEI.score).find('app[xml\\:id="' + appID + '"]')[0];
  var parent_measure = $(app).parents('measure');
  var measure_n = parent_measure.attr('n');

  // then the staff number...
  var parent_staff = $(app).parents('staff');
  var staff_n;
  if (parent_staff.length === 0) {
    var child = $(app).find('[staff]')
    staff_n = $(child).attr('staff');
  } else {
    staff_n = parent_staff.attr('n');
  }

  // ...then display the dot at the coordinates specified by the
  // properties of MEI2VF.rendered_measures[measure_n][staff_n];
  var vexStaffs = MEI2VF.rendered_measures[measure_n];
  if (vexStaffs) {
    meiView.UI.displayDotForMeasure(vexStaffs[staff_n]);
  }

}
meiView.UI.displayDotForMeasure = function(vexStaff) { 
  if (vexStaff) {
    var left = (vexStaff.x + vexStaff.width-12) * meiView.UI.scale;
    var top = (vexStaff.y+25) * meiView.UI.scale;

    var circle = new fabric.Circle({
      radius: 5, 
      fill: 'green', 
      left:left, 
      top:top, 
      lockMovementX: true,
      lockMovementY: true,
      lockScalingX: true,
      lockScalingY: true,
      lockRotation: true,
      hasControls: false,
      hasBorders: false,
    });
    circle.meiViewID = appID;
    meiView.UI.fabrCanvas.add(circle);
    meiView.UI.dots[appID] = circle;
  }
}

meiView.UI.renderPage = function(pageXML) { 
  var tempCanvas = new fabric.StaticCanvas();
  tempCanvas.setDimensions({width:meiView.scoreWidth, height:meiView.scoreHeight});
  meiView.UI.DisplayMainMEI(pageXML, tempCanvas);
  var img = new Image;
  img.src = tempCanvas.toDataURL();
  if (meiView.UI.scoreImg) {
    meiView.UI.fabrCanvas.remove(meiView.UI.scoreImg);    
  }
  meiView.UI.scale = meiView.UI.fabrCanvas.width/meiView.scoreWidth;
  var W = meiView.UI.fabrCanvas.width;
  var H = meiView.scoreHeight * meiView.UI.scale;
  meiView.UI.scoreImg = new fabric.Image(img, {
    width:W,height:H, left:W/2, top:H/2,
    lockMovementX: true,
    lockMovementY: true,
    lockScalingX: true,
    lockScalingY: true,
    lockRotation: true,
    hasControls: false,
    hasBorders: false,
    selectable: false,
  });
  meiView.UI.fabrCanvas.add(meiView.UI.scoreImg);
}

meiView.UI.initCanvas = function(canvasid) {

  var canvas = new fabric.Canvas(canvasid);
  canvas.hoverCursor = 'pointer';

  canvas.findTarget = (function(originalFn) {
    return function() {
      var target = originalFn.apply(this, arguments);
      if (target) {
        if (this._hoveredTarget !== target) {
          canvas.fire('object:over', { target: target });
          if (this._hoveredTarget) {
            canvas.fire('object:out', { target: this._hoveredTarget });
          }
          this._hoveredTarget = target;
        }
      }
      else if (this._hoveredTarget) {
        canvas.fire('object:out', { target: this._hoveredTarget });
        this._hoveredTarget = null;
      }
      return target;
    };
  })(canvas.findTarget);
  
  canvas.on('object:over', function(e) {
    e.target.setFill('red');
    canvas.renderAll();
  });

  canvas.on('object:out', function(e) {
    e.target.setFill('green');
    canvas.renderAll();
  });

  canvas.on('mouse:down', function(e) {
    if (e.target) {
      //TODO: show variant Selector
      //
      console.log(e.target.meiViewID);
    }
  });
  
  return canvas;
}