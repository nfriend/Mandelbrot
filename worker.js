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
	// number of iterations
	var accuracy = rtn_obj.accuracy;
	// color of the fractal
	var color = rtn_obj.color;
	// whether we should inverse the colors or not
	var inverse = rtn_obj.inverse;
	// the zoom scale to use while rendering the fractal
	var zoom = rtn_obj.zoom;
	// the x-offset
	var x_start = rtn_obj.x_start;
	// the y-offset
	var y_start = rtn_obj.y_start;
	
	
	
	
	//variable to hold current y position
	var pixel_y = chunkStart;

	//variable to hold current x position
	var pixel_x = 0;

	//variables for mandelbrot calculations
	var mand_x = 0; //scaled x coord
	var mand_y = 0; //scaled y coord
	var calc_x = 0; // temp variable for calc
	var calc_y = 0; // temp variable for calc
	var temp = 0;	// temp variable for calc
	var iter = 0;

	// loop through every pixel in the imageData object
	// structured like [pixel1Red, pixel1Green, pixel1Blue, pixel1Alpha, pixel2Red, pixel2Green, pixel2Blue, pixel2Alpha, pixel3Red .... etc]
	// each value can be anywhere in the range of (0 - 255), inclusive
	for (var i = 0; i < imageData.data.length; i = i + 4) {
		
		//initalize variables
		calc_x = 0;
		calc_y = 0;
		iter = 0;

		//determine where a pixel lies within the mandlebrot set -2.5<=x<=1 -1<=y<=1		
		mand_x = (3.5*((pixel_x/zoom + x_start)/canvasWidth)) - 2.5;
		mand_y = (2*((pixel_y/zoom + y_start)/canvasHeight)) - 1;
		
		//test if point lies in the 2 largest bulbs, speed calculation for those parts
		temp = (mand_x-0.25)*(mand_x-0.25)+(mand_y * mand_y);

		if(((temp*(temp+(mand_x-0.25)))<(0.25*mand_y*mand_y)) || ((mand_x+1)*(mand_x+1)+(mand_y*mand_y)<0.0625)) {
			iter = accuracy;
		}
		
		//determine if point is in set
		while (iter < accuracy && ((calc_x * calc_x) + (calc_y * calc_y) < 4)) {
			iter++;

			temp = (calc_x * calc_x) - (calc_y * calc_y) + mand_x;
			calc_y = 2*calc_x*calc_y + mand_y;
			calc_x = temp;
		}
		
		//draw image
		if(iter === accuracy) {
			imageData.data[i+0] = 0;
			imageData.data[i+1] = 0;
			imageData.data[i+2] = 0;
			imageData.data[i+3] = 255;
		} else {
			imageData.data[i+0] = (color === 'Blue' || color === 'Green' || color === 'Black' ? Math.log(iter)*50 : 100);
			imageData.data[i+1] = (color === 'Red' || color === 'Blue' || color === 'Black' || color === 'Purple' ? Math.log(iter)*50 : 100);
			imageData.data[i+2] = (color === 'Red' || color === 'Green' || color === 'Black' || color === 'Yellow' ? Math.log(iter)*50 : 100);
			imageData.data[i+3] = 255;
		}
		
		if (inverse) {
			imageData.data[i+0] = 255 - imageData.data[i+0];
			imageData.data[i+1] = 255 - imageData.data[i+1];
			imageData.data[i+2] = 255 - imageData.data[i+2];		
		}

		pixel_x ++;
		if (pixel_x == canvasWidth) {
			pixel_x = 0;
			pixel_y ++;
		}
	}
	
	// if you want to debug things, do it like this (this will write to the console in the main thread, since you can't do it directly in a WebWorker): 
	// rtn_obj.debug = "inverse: " + rtn_obj.inverse;
		
	done(rtn_obj);
}

function done(rtn_obj) {	
	postMessage(rtn_obj);
	close();
}
