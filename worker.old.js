onmessage = function(e) {	
	// the wrapper object we passed to this WebWorker
	var rtn_obj = e.data;
	// the image data object that will be given to putImageData in the main thread to write the pixels to the screen
	var imageData = rtn_obj.imageData;	
	// the width of the whole canvas element
	var canvasWidth = rtn_obj.canvasWidth;
	// the height of the whole canvas element
	var canvasHeight = rtn_obj.canvasHeight;
	// the height of the chunk this thread has been given to process
	var chunkHeight = rtn_obj.chunkHeight;
	// the y-position where the top of this chunk will be inserted
	// note: the very top line of the canvas is line 0, the bottom is line [canvas-height]
	var chunkStart = rtn_obj.chunkStart;
	
	// loop through every pixel in the imageData object
	// structured like [pixel1Red, pixel1Green, pixel1Blue, pixel1Alpha, pixel2Red, pixel2Green, pixel2Blue, pixel2Alpha, pixel3Red .... etc]
	// each value can be anywhere in the range of (0 - 255), inclusive
	for (var i = 0; i < imageData.data.length; i = i + 4) {
		var width_index = (i / 4) % canvasWidth;
		imageData.data[i] = Math.floor((width_index / canvasWidth) * 255);			// red
		imageData.data[i+1] = Math.floor((i / imageData.data.length) * 255);		// green
		imageData.data[i+2] = Math.floor(Math.random() * 128);	// blue
		imageData.data[i+3] = 255;													// alpha
	}
	
	// if you want to debug things, do it like this (this will write to the console in the main thread, since you can't do it directly in a WebWorker): 
	rtn_obj.debug = "Here's a debug statement.  This will show up in your browser's console.";
		
	done(rtn_obj);
}

function done(rtn_obj) {
	setTimeout(function() {
		postMessage(rtn_obj);
		close();
	}, Math.random() * 2000);
	
	
}
