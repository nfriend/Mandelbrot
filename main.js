$(init);

function init() {
	if (typeof(Worker) === "undefined") {
		$('#no-workers-modal').modal('show');
		return;
	}
	
	$(window).on('keydown', function(e) {		
		if (e.which === 65) {
			var a_modal_is_open = false;
			$('.modal').each(function() {
				if ($(this).css('display') !== 'none') {
					a_modal_is_open = true;
				}
			});
			
			if (! a_modal_is_open) {
				$('#secret-modal').modal('show');	
			}			
		}			
	});
	
	$('#secret-modal').on('hide', function() {
		var new_accuracy = parseInt($('#secret-accuracy').val());
		
		if(new_accuracy > 0 && !isNaN(new_accuracy)) {
			$('#accuracy').val(new_accuracy);	
		}
		
		console.log("new acuracy: " + new_accuracy);
	});
	
	// hide the 32 thread option, it breaks in Firefox
	if (BrowserDetect.browser === 'Firefox') {
		$('#32threads').remove();
		$('#16threads').attr('selected', 'selected');
	}

	$('#generate-button').click(function() {
		var all_good = true;
		
		var accuracy = parseInt($('#accuracy').val());
		if (accuracy > 1000000 || accuracy < 1 || isNaN(accuracy)) {
			$('#accuracy-control-group').addClass('error');
			$('#accuracy').val('Range: 1 through 1000000').focus(function() {
				$(this).val('10000').off('focus');	
				$('#accuracy-control-group').removeClass('error');			
			});
			all_good = false;
		}
		
		var custom_width = parseInt($('#custom-width').val());
		if (custom_width < 7 || custom_width > 3500 || isNaN(custom_width)) {
			$('#width-control-group').addClass('error');
			$('#custom-width').val('Range: 7 through 3500').focus(function() {
				$(this).val(1920).off('focus').trigger('keyup');
				$('#width-control-group, #height-control-group').removeClass('error');				
			});
			
			all_good = false;
		}
		
		var custom_height = parseInt($('#custom-height').val());
		if (custom_height < 4 || custom_height > 2000 || isNaN(custom_height)) {
			$('#height-control-group').addClass('error');
			$('#custom-height').val('Range: 4 through 2000').focus(function() {
				$(this).val(1097).off('focus').trigger('keyup');
				$('#height-control-group, #width-control-group').removeClass('error');
			});
			
			all_good = false;
		}
		
		if (all_good) {
			$("#options-modal").modal('hide');
			$('#accuracy-control-group').removeClass('error');	
			$('#width-control-group').removeClass('error');	
			$('#height-control-group').removeClass('error');			
			window.zoom = 1;
			window.offset = {left: 0, top: 0};			
		}
	});
	
	$("#options-modal").modal('show').on('hidden', function() {
		var width = undefined;
		var height = undefined;
		
		if (! $('#fittopage').is(':checked')) {
			width = parseInt($('#custom-width').val());
			height = parseInt($('#custom-height').val());				
		}
		
		initializePage(width, height);
	}).on('open', function() {
		$('#fittopage').trigger('change');
	})
	
	$('#again').click(function() {		
		$("#options-modal").modal('show');
		resetPage();
	});
	
	$('#fittopage').on('change', function() {
		if ($(this).is(':checked')) {			
			$('#custom-dimensions-container').css('display', 'none');
		} else {
			$('#custom-dimensions-container').css('display', 'inline');
		}
	});
	
	$('#custom-width').on('keyup', function() {
		var new_width = parseInt($(this).val());
		
		if (new_width >= 0 && !isNaN(new_width)) {
			$('#custom-height').val(parseInt(new_width * 2/3.5));	
		}
	});
	
	$('#custom-height').on('keyup', function() {
		var new_height = parseInt($(this).val());
		
		if (new_height >= 0 && !isNaN(new_height)) {
			$('#custom-width').val(parseInt(new_height * 3.5/2));	
		}	
	});
}

function initializePage(existing_width, existing_height) {
	var width = $('#canvas-container').width() - 40;
	var height = $('#canvas-container').height() - 40;		
	
	if (height * (3.5/2) > width) {
		height = width * (2/3.5);
	} else if (width * (2/3.5) > height) {
		width = height * 3.5/2;
	}
	
	width = existing_width ? existing_width : width;
	height = existing_height ? existing_height : height;
	
	$('#canvas-container').html('<canvas id="fractal-display" width="' + width + '" height="' + height + '"></canvas>');
	
	$('#fractal-header').css('display', 'inline');
	$('#canvas-container').css('display', 'inline');
	
	setTimeout(function() {
		beginFractalGeneration();
	}, 10);	
}

function beginFractalGeneration() {	
	window.workerArray = [];
	
	var stopWatch = new StopWatch();
	stopWatch.start();
	
	var canvas = document.getElementById('fractal-display');
	var context = canvas.getContext('2d');
	var width = $(canvas).width();
	var height = $(canvas).height();
	var threadCount = $('#thread-count option:selected').val();
	var threadHeight = Math.floor(height / Math.floor(parseInt(threadCount, 10))) + 1;	
		
	for (var i = 0; i < height; i = i + threadHeight) {
		
		if (i + threadHeight > height) {
			threadHeight = height - i;
		}			
		
		var workerData = {
			imageData: context.getImageData(0, i, width, threadHeight),
			canvasWidth: width,
			canvasHeight: height,
			chunkStart: i,
			chunkHeight: threadHeight,
			accuracy: parseInt($('#accuracy').val()),
			color: $('#color option:selected').val(),
			inverse: ($('#inverse').is(':checked')),
			x_start: window.offset.left,
			y_start: window.offset.top,
			zoom: window.zoom
		}
					
		var worker = new Worker("worker.js");
		window.workerArray.push(worker);		
					
		(function(i) {					
			worker.onmessage = function(e) {
				window.workerArray.splice(window.workerArray.indexOf(worker), 1);				
				
				if (e.data.debug) {
					console.log("WebWorker debug: " + e.data.debug);
				}
				
				context.putImageData(e.data.imageData, 0, i);
				
				if (window.workerArray.length === 0) {
					stopWatch.stop();
					allDone(stopWatch.duration());
				}				
			};
		})(i);			
		
		worker.postMessage(workerData);
	}
}

function allDone(time) {	
	$('#header-text').fadeOut(500, function() {
		$(this).html('<h1 style="color:grey; float: left;">Time: ' + time + 's</h1><h1 style="float:left">&nbsp;&nbsp;&nbsp;&nbsp;Click to zoom:</h1>').fadeIn(500, function() {
			$('#again').removeAttr('disabled').addClass('in');	
			$('#download').removeAttr('disabled').addClass('in');		
		});
	});
	
	var dataURL = document.getElementById('fractal-display').toDataURL();
	document.getElementById('download').href = dataURL;
	
	$('#fractal-display').on('click', function(e) {
		resetPage();		
				
		var x = e.pageX - $(this).offset().left;
		var y = e.pageY - $(this).offset().top;		
		var width = $('#fractal-display').width();
		var height = $('#fractal-display').height();

		window.offset.left += (x - width/4) / zoom;
		window.offset.top += (y - height/4) / zoom;
		
		window.zoom *= 2;
				
		setTimeout(function() {
			initializePage(width, height);
		}, 300);	
		
	});
}

function resetPage() {
	$('#header-text').html('<h1>Thinking...</h1>');
	$('#again').attr('disabled', 'true').removeClass('in');
	$('#download').attr('disabled', 'true').removeClass('in');
}
