//Journey/Meal Planner
//http://www.dinosaursandmoustaches.com/tube-map
//Tom Curtis, October 2013
//In no way affiliated with TfL
//Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported 
//http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US

//define a station
function station(id, name, virtual, markerData, labelDirection, specialMarker, nationalRail, boats, trams) {
	//sanity checks
	//1. id is an integer, and not already in use
	if (isNaN(parseInt(id))) {
		throw new Error("Failed to create station " + id + " because id was not a number.");
	}
	if (getById(stations, parseInt(id)) != null) {
		throw new Error("Failed to create station " + id + " because id " + parseInt(id) + " is already in use.");
	}

	//2. name is a string, and not already in use -> prevents exact duplicates, though not ones which start the same way
	var checkStringStation = getByName(stations, String(name));
	if ((checkStringStation != null) && (checkStringStation.name == String(name))) {
		throw new Error("Failed to create station " + id + " because name '" + String(name) +  "' is already in use.");
	}

	//3. marker data is an array with sets of four members, each set of which is number, number, number, array of strings
	if (!Array.isArray(markerData)) {
		throw new Error("Failed to create station " + id + " because markerData was not an array.");
	}
	if ((markerData.length % 4) != 0) {
		throw new Error("Failed to create station " + id + " because markerData did not come in sets of four entries.");
	}
	//check the entries
	for (var i = 0; i < markerData.length; i++) {
		//accessibility needs to be 0 (no access), 1 (step free to platform) or 2 (step free to train)
		if ((i % 4) == 2) {
			if (parseInt(markerData[i] != 0) && (parseInt(markerData[i]) != 1) && (parseInt(markerData[i]) != 2)) {
				throw new Error("Failed to create station " + id + " because markerData entry " + i + " was not between 0 and 2");
			}
		}
		//lines going through each marker -> must be an array
		else if ((i % 4) == 3) {
			if (!Array.isArray(markerData[i])) {
				throw new Error("Failed to create station " + id + " because markerData entry " + i + " was not an array.");
			}
			//impact: stations must be on a line
			if (markerData[i].length == 0) {
				throw new Error("Failed to create station " + id + " because markerData entry " + i + " was an empty array.");
			}
		}
		else {
			//width and height must be numbers and fit on the map
			if ((typeof markerData[i] != 'number') || (isNaN(markerData[i]))) {
				throw new Error("Failed to create station " + id + " because markerData entry " + i + " was not a number.");
			}
			if (i % 4 == 0) { //width
				if ((markerData[i] < 0) || (markerData[i] > mapWidth)) {
					throw new Error("Failed to create station " + id + " because markerData entry " + i + " was not on the map (x-coordinate).");
				}
			}
			if (i % 4 == 1) { //height
				if ((markerData[i] < 0) || (markerData[i] > mapHeight)) {
					throw new Error("Failed to create station " + id + " because markerData entry " + i + " was not on the map (y-coordinate).");
				}
			}
		}
	}

	//4. labelDirection is an integer between 0 and 8
	if ((parseInt(labelDirection) < 0) || (parseInt(labelDirection) > 8)) {
		throw new Error("Failed to create station " + id + " because labelDirection was not a number between 0 and 8.")
	}

	//now we know it's ok, let's create the object
	this.id = parseInt(id);
	this.name = String(name);
	this.virtual = Boolean(virtual); //is it a real station (false) or one there to help draw the map (true)?

	//where to draw it on the map and how?
	this.mapMarkers = []; //give locations as an array of points - convert into an array of objects with an x and y component
	for (var i = 0; i < markerData.length; i += 4) {
		var thisMarker = {
			id: this.mapMarkers.length,
			x: markerData[i],
			y: markerData[i + 1],
			access: parseInt(markerData[i + 2]), //is the station accessible? 0 = bad, 1 = step free to platform, 2 = step free to train
			lines: [] //which lines is it on?
			};

		//lines are given as an array, so add them in one by one
		for (var j = 0; j < markerData[i + 3].length; j++) {
			var thisLine = getByName(lines, String(markerData[i + 3][j]));
			if (thisLine) {
				thisMarker.lines.push(thisLine.id);
			}
			else {
				throw new Error("Failed to create station because could not find line " + markerData[i + 3] + " for station " + id);
			}
		}
		this.mapMarkers.push(thisMarker);

	}

	this.labelDirection = parseInt(labelDirection); //0 = up, 1 = up-right, 2 = right, 3 = down-right, 4 = down, 5 = down-left, 6 = left, 7 = up-left
	this.specialMarker = Boolean(specialMarker); //is it a normal tick/circle, or something weird?
	this.nationalRail = Boolean(nationalRail); //does it connect to train services?
	this.boats = Boolean(boats); //does it have a pier connection?
	this.trams = Boolean(trams); //does it connect to the croydon tram?
	this.joined = []; //keep track of which stations this tube line is joined to

	stations.push(this); //add to container
}

//which of a station's markers does this tube line run to?
station.prototype.findLineMarker = function(lineID) {
	//check lineID is a number
	if (isNaN(parseInt(lineID))) {
		throw Error("Cannot find line " + lineID + " at this station because the lineID is not a number.");
	}

	for (var i = 0; i < this.mapMarkers.length; i++) {
		var thisMarker = this.mapMarkers[i];
		for (var j = 0; j < thisMarker.lines.length; j++) {
			var thisLine = thisMarker.lines[j];
			if (thisLine == lineID) {
				return thisMarker;
			}
		}
	}
	return null; //that line doesn't go through this station
}

//if we know the marker number, check which actual map symbol we need -> returns the symbol
station.prototype.findMarkerSymbol = function(markerNumber) {
	//check it's a valid start
	if ((typeof markerNumber == 'undefined') || (isNaN(parseInt(markerNumber)))) {
		throw new Error("Cannot find marker for station " + this.id + " because " + markerNumber + " is not a valid number.");
	}
	if (parseInt(markerNumber) >= this.mapMarkers.length) {
		throw new Error("Cannot find marker " + markerNumber + " at station " + this.id + " because it has only got " + this.mapMarkers.length + " markers.");
	}

	//simple search -> check each symbol's marker array in the format given -> list of pairs [stationID, markerNumber]
	for (var i = 0; i < this.symbols.length; i++) {
		var thisSymbol = this.symbols[i];
		if ((thisSymbol.data("type") == "interchange") || (thisSymbol.data("type") == "tick")) {
			var markerArray = thisSymbol.data("markers");
			for (var j = 0; j < markerArray.length; j++) {
				if (markerArray[j][1] == parseInt(markerNumber)) {
					return thisSymbol;
				}
			}
		}
	}
	return null; //last resort -> not found a symbol for that marker. I don't think there should be any cases of this though?
}

//join two arbitrary stations using a line between two of their markers
//slightly cheating - can use lineID of -1 to indicate two stations joined by walking (e.g. Bank-Monument) rather than a tube line
station.prototype.join = function(otherStationID, lineID, thisStationMarkerNumber, otherStationMarkerNumber) {
	//simple checks - based on type only
	if ((typeof otherStationID == 'undefined') || (isNaN(parseInt(otherStationID)))) {
		throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because " + otherStationID + " is not a valid station ID");
	}
	if ((typeof lineID == 'undefined') || (isNaN(parseInt(lineID)))) {
		throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because " + lineID + " is not a valid line ID");
	}
	if ((lineID != -1) && ((typeof thisStationMarkerNumber == 'undefined') || (isNaN(parseInt(thisStationMarkerNumber))))) {
		throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because " + thisStationMarkerNumber + " is not a valid marker number at station " + this.id);
	}
	if ((lineID != -1 ) && ((typeof otherStationMarkerNumber == 'undefined') || (isNaN(parseInt(otherStationMarkerNumber))))) {
		throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because " + otherStationMarkerNumber + " is not a valid marker number at station " + otherStationID);
	}

	//now check the actual content
	var otherStation = getById(stations, parseInt(otherStationID));
	if ((otherStation == null) || (typeof otherStation == 'undefined')) { //check there is the other station
		throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because there is no station with ID " + otherStationID);
	}
	var thisLine = getById(lines, parseInt(lineID));
	if ((lineID != -1) && ((thisLine == null) || (typeof thisLine == 'undefined'))) { //check there is the line
		throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because there is no line with ID " + lineID);
	}
	if ((lineID != -1) && (parseInt(thisStationMarkerNumber) >= this.mapMarkers.length)) { //check this station has that many markers
		throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because the station marker number is too high for station " + this.id);
	}
	else if ((lineID != -1) && (typeof this.mapMarkers[parseInt(thisStationMarkerNumber)] == 'undefined')) { //and check it actually is a real marker
		throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because station " + this.id + " station does not have a marker with number  " + thisStationMarkerNumber);
	}
	if ((lineID != -1) && (parseInt(otherStationMarkerNumber) >= otherStation.mapMarkers.length)) { //ditto for other station
		throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because the station marker number is too high for station " + otherStationID);
	}
	else if ((lineID != -1) && (typeof otherStation.mapMarkers[parseInt(otherStationMarkerNumber)] == 'undefined')) { //ditto for other station
		throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because station " + otherStationID + " station does not have a marker with number  " + otherStationMarkerNumber);
	}

	//check the same line goes through both markers
	if (lineID != -1) {
		var thisMarker = this.mapMarkers[parseInt(thisStationMarkerNumber)];
		var otherMarker = otherStation.mapMarkers[parseInt(otherStationMarkerNumber)];
		var thisOnLine = false;
		var otherOnLine = false;
		for (var i = 0; i < thisMarker.lines.length; i++) {
			if (thisMarker.lines[i] == thisLine.id) {
				thisOnLine = true;
				break;
			}
		}
		for (var i = 0; i < otherMarker.lines.length; i++) {
			if (otherMarker.lines[i] == thisLine.id) {
				otherOnLine = true;
				break;
			}
		}
		if ((!thisOnLine) || (!otherOnLine)) {
			throw new Error("Cannot join station " + this.id + " to station " + otherStationID + " because station " + otherStationID + " because markers given are not both on line " + thisLine.id);
		}
	}

	//now actually add the references to each station -> and keep track of the distance along there for routing purposes
	if (lineID != -1) {
		var distance = Math.sqrt(Math.pow(thisMarker.x - otherMarker.x, 2) + Math.pow(thisMarker.y - otherMarker.y, 2));
		var newJoin = [otherStation.id, parseInt(lineID), thisMarker.id, otherMarker.id, distance];
	}
	else {
		var newJoin = [otherStation.id, -1, -1, -1, 0];
	}
	this.joined.push(newJoin);
}

//return a list of adjacent stationIDs
station.prototype.getNeighbours = function() {
	var neighbours = [];

	for (var i = 0; i < this.joined.length; i++) {
		var stationID = this.joined[i][0];
		if (neighbours.indexOf(stationID) == -1) {
			neighbours.push([stationID, this.joined[i][4]]);
		}
		else {
			neighbours.push([stationID, 0]);
		}
	}

	return neighbours.sort();
}

//as it gets called in a few different places -> draws a circle marker for a station, depending on accessibility level
station.prototype.drawInterchange = function(x, y, accessibility, markerArray) {
	//check input
	if ((typeof x == "undefined") || (isNaN(parseFloat(x))) || (x < 0) || (x > mapWidth)) {
		throw new Error("Unable to draw interchange for station " + this.id + " because x coordinate is not a valid number");
	}
	if ((typeof y == "undefined") || (isNaN(parseFloat(y))) || (y < 0) || (y > mapHeight)) {
		throw new Error("Unable to draw interchange for station " + this.id + " because y coordinate is not a valid number");
	}
	if ((parseInt(accessibility) != 0) && (parseInt(accessibility) != 1) && (parseInt(accessibility) != 2)) {
		throw new Error("Unable to draw interchange for station " + this.id + " because accessibility value not valid. Can be 0, 1 or 2 only, but was given " + accessibility)
	}
	if ((typeof markerArray == "undefined") || (!Array.isArray(markerArray))) {
		throw new Error("Unable to draw interchange for station " + this.id + " because markerArray is not a valid array.");
	}
	else {
		for (var i = 0; i < markerArray.length; i++) {
			if ((!Array.isArray(markerArray[i])) || (markerArray[i].length != 2)) {
				throw new Error("Unable to draw interchange for station " + this.id + " because markerArray member " + i + " is not a valid 2-member array");
			}
			else {
				var checkStation = getById(stations, markerArray[i][0]);
				if ((checkStation == null) || (typeof checkStation == undefined)) {
					throw new Error("Unable to draw interchange for station " + this.id + " because markerArray member " + i + " refers to non-existent station " + markerArray[i][0]);
				}
				if ((parseInt(markerArray[i][1]) < 0) || (parseInt(markerArray[i][1]) >= checkStation.mapMarkers.length)) {
					throw new Error("Unable to draw interchange for station " + this.id + " because markerArray member " + i + " refers to non-existent marker number " + markerArray[i][1] + " at station " + checkStation.id);
				}
			}
		}
	}

	//draw the symbol -> depending on how accessible it is
	if (accessibility == 0) { //not step free
		var markerSymbol = tubeMap.circle(x, y, 9);
		markerSymbol.attr({fill: "white"});
		markerSymbol.attr({"stroke-width": 3, stroke: "black"});
	}
	if (accessibility == 1) { //step free access to platform
		var markerSymbol = tubeMap.circle(x, y, 9);
		markerSymbol.attr({stroke: "#1C3F94"}); //piccadilly line blue
		markerSymbol.attr({fill: "white"});
		markerSymbol.attr({"stroke-width": 1});
		var wheelChair = this.drawWheelchair(x, y, false);
	}
	if (accessibility == 2) { //step free access to train
		var markerSymbol = tubeMap.circle(x, y, 9);
		markerSymbol.attr({fill: "#1C3F94"});
		markerSymbol.attr({"stroke-width": 0});
		var wheelChair = this.drawWheelchair(x, y, true);
	}

	//will be useful later for drawing other jobbies
	markerSymbol.data("x", x);
	markerSymbol.data("y", y);
	markerSymbol.data("access", parseInt(accessibility));
	markerSymbol.data("type", "interchange");
	markerSymbol.data("markers", markerArray);
	this.symbols.push(markerSymbol); //keep a track of these

	//if we made a wheelchair, add it to symbols, and link to and from the main symbol icon
	if (typeof wheelChair != 'undefined') {
		markerSymbol.data("wheelChair", wheelChair);
		wheelChair.data("symbol", markerSymbol);
		this.symbols.push(wheelChair);
	}
}

//draw a wheel chair icon at a given location. Invert determines whether it should be white or piccadilly blue.
station.prototype.drawWheelchair = function(x, y, invert) {
	//check input
	if ((typeof x == "undefined") || (isNaN(parseFloat(x))) || (x < 0) || (x > mapWidth)) {
		throw new Error("Unable to draw wheelchair icon for station " + this.id + " because x coordinate is not a valid number");
	}
	if ((typeof y == "undefined") || (isNaN(parseFloat(y))) || (y < 0) || (y > mapHeight)) {
		throw new Error("Unable to draw wheelchair icon for station " + this.id + " because y coordinate is not a valid number");
	}

	//path from Raphaeljs site icons http://raphaeljs.com/icons/#wheelchair -- many thanks!
	var wheelChair = tubeMap.path("M20.373,19.85c0,4.079-3.318,7.397-7.398,7.397c-4.079,0-7.398-3.318-7.398-7.397c0-2.466,1.213-4.652,3.073-5.997l-0.251-2.21c-2.875,1.609-4.825,4.684-4.825,8.207c0,5.184,4.217,9.4,9.401,9.4c4.395,0,8.093-3.031,9.117-7.111L20.37,19.73C20.37,19.771,20.373,19.81,20.373,19.85zM11.768,6.534c1.321,0,2.392-1.071,2.392-2.392c0-1.321-1.071-2.392-2.392-2.392c-1.321,0-2.392,1.071-2.392,2.392C9.375,5.463,10.446,6.534,11.768,6.534zM27.188,22.677l-5.367-7.505c-0.28-0.393-0.749-0.579-1.226-0.538c-0.035-0.003-0.071-0.006-0.106-0.006h-6.132l-0.152-1.335h4.557c0.53,0,0.96-0.429,0.96-0.959c0-0.53-0.43-0.959-0.96-0.959h-4.776l-0.25-2.192c-0.146-1.282-1.303-2.203-2.585-2.057C9.869,7.271,8.948,8.428,9.094,9.71l0.705,6.19c0.136,1.197,1.154,2.078,2.332,2.071c0.004,0,0.007,0.001,0.012,0.001h8.023l4.603,6.436c0.439,0.615,1.338,0.727,2.007,0.248C27.442,24.178,27.628,23.292,27.188,22.677z");
	wheelChair.transform("S -1, 1, s 0.5, 0.5, T" + (x - 16)  + "," + (y - 16)); //worked out by trial and error
	if (invert) {
		wheelChair.attr({fill: "white"});
		wheelChair.data("access", 2);
	}
	else {
		wheelChair.attr({fill: "#1C3F94"});
		wheelChair.data("access", 1);
	}
	wheelChair.attr({"stroke-width": 0});
	wheelChair.data("type", "wheelChair");
	return wheelChair;
}

//in some cases, you have more than one marker that needs drawn
//markerArray should be an array of pairs: [stationID, markerNumber]
station.prototype.drawMergedInterchange = function(markerArray) {
	var totalX = 0;
	var totalY = 0;
	var access = 0;
	for (var i = 0; i < markerArray.length; i++) {
		var thisStation = getById(stations, markerArray[i][0]);
		var thisMarker = thisStation.mapMarkers[markerArray[i][1]];
		if (i == 0) {
			access = thisMarker.access;
		}
		totalX += parseFloat(thisMarker.x);
		totalY += parseFloat(thisMarker.y);
	}
	var averageX = totalX / markerArray.length;
	var averageY = totalY / markerArray.length;
	return this.drawInterchange(averageX, averageY, access, markerArray);
}

//v important -> draw a station
station.prototype.draw = function() {
	this.symbols = [];
	if (!this.virtual) { //don't draw markers for virtual stations
		if (!this.specialMarker) {
			for (var j = 0; j < this.mapMarkers.length; j++) { //stations can have more than one marker
				//add a marker to the map
				var thisMarker = this.mapMarkers[j];

				//interchange or accessible
				if ((thisMarker.access > 0) || (thisMarker.lines.length > 1) || (this.nationalRail)) {
					this.drawInterchange(thisMarker.x, thisMarker.y, thisMarker.access, [[this.id, j]]);
				}

				//not an interchange
				else {
					var markerColour = getById(lines, thisMarker.lines[0]).colour;
					var markerSymbol = tubeMap.rect(thisMarker.x - 2, thisMarker.y - 6, 4, 6);
					markerSymbol.transform("r" + (45 * this.labelDirection) + "," + thisMarker.x + "," + thisMarker.y);
					markerSymbol.attr({fill: markerColour});
					markerSymbol.attr({"stroke-width": 0});
					markerSymbol.data("type", "tick")
					markerSymbol.data("x", thisMarker.x);
					markerSymbol.data("y", thisMarker.y);
					markerSymbol.data("defaultFill", markerColour);
					markerSymbol.data("markers", [[this.id, j]]);
					this.symbols.push(markerSymbol);
				}
			}
		}
		//it is a special marker station -> what to do with it??
		else {
			//is this a station where there is one symbol covering several lines? as opposed to tick marks
			for (var i = 0; i < mergedSymbolStations.length; i++) {
				if (mergedSymbolStations[i] == this.id) {
					//need to get it into right format for drawing a merged interchange: list of [[stationID, markerNum], [stationID, markerNum]]
					var markerArray = [];
					for (var j = 0; j < this.mapMarkers.length; j++) {
						markerArray.push([this.id, j]); //one entry in the list for each marker, and all from same station
					}
					this.drawMergedInterchange(markerArray);
				}
			}

			//is it a station where there are a couple of symbols - some of which cover more than one marker?
			for (var i = 0; i < multipleInterchanges.length; i++) {
				var thisMultipleInterchange = multipleInterchanges[i];
				if (thisMultipleInterchange[0] == this.id) {
					for (var j = 1; j < thisMultipleInterchange.length; j++) {
						//need to get it into the right format for drawing a merged interchange: list of [[stationID, markerNum], [stationID, markerNum]]
						var markerNumbers = thisMultipleInterchange[j]; //given a set of markerNumbers in the input and we know they're in the same station
						var markerArray = [];
						for (var k = 0; k < markerNumbers.length; k++) {
							markerArray.push([this.id, markerNumbers[k]]); //so make a list of pairs
						}
						this.drawMergedInterchange(markerArray);
					}
				}
			}

			//stations joined to another station
			for (var i = 0; i < joinedStations.length; i++) {
				var thisJoinedStation = joinedStations[i];
				if (thisJoinedStation[0] == this.id) { //only draw it the once, for the first station
					var otherStation;
					for (var j = 0; j < thisJoinedStation.length; j+=2) {
						var markerStation = thisJoinedStation[j];
						if (markerStation != this.id) {
							otherStation = getById(stations, markerStation);
						}
						var markerNumbers = thisJoinedStation[j + 1];
						var markerArray = [];
						for (var k = 0; k < markerNumbers.length; k++) {
							markerArray.push([markerStation, markerNumbers[k]]);
						}
						this.drawMergedInterchange(markerArray);
					}
				}
			}

			//now we've made the interchanges, join them up! -> should only run for ones with more than one interchange
			for (var j = 0; j < this.symbols.length - 1; j++) {
				//go back over the symbols in pairs
				var symbol1 = this.symbols[j];

				if (symbol1.data("type") != "interchange") {
					continue;
				}

				var symbol2 = this.symbols[j + 1];
				
				//need to skip joining rectangles to avoid infinite regress
				//otherwise, were adding joining rectangles between joining rectangles and so on
				while ((symbol2.data("type") != "interchange") && (j < this.symbols.length - 2)) {
					symbol2 = this.symbols[j + 2];
					j++;
				}

				if (symbol2.data("type") == "interchange") {
					//get the coordinates
					var x1 = symbol1.data("x");
					var y1 = symbol1.data("y");
					var x2 = symbol2.data("x");
					var y2 = symbol2.data("y");

					//work out the length and angle so we can draw the line
					var xDiff = parseFloat(x2) - x1;
					var yDiff = parseFloat(y2) - y1;
					var length = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
					var angle = ((180.0 / Math.PI) * Math.atan2(yDiff, xDiff)) + 90;

					//diagnostic check
					if (((Math.abs(angle) % 45) % 1) != 0) {
						console.log("Unusual station join angle: " + this.name + ", " + j + ", " + (j + 1) + ", " + (yDiff / xDiff).toFixed(2) + ", " + (xDiff / yDiff).toFixed(2));
					}
	 
					//draw a big black rectangle from here to there
					var joinRect1 = tubeMap.rect((x1 - 4.5), (y1 + 8), 9, length - 15.5); //draw the right size on the edge of the first marker
					joinRect1.transform("r" + (180 + angle) + "," + x1 + "," + y1); // then rotate it round the circle to point to the second one
					joinRect1.attr({"stroke-width": 0, fill: "black"});
					joinRect1.data("type", "joinRect1"); // mark that this is not a normal station shape - it can't itself join up to other symbols
					this.symbols.push(joinRect1);
					//then draw a thinner white one over it, so you get just the sides filled in black
					var joinRect2 = tubeMap.rect((x1 - 1.5), (y1), 3, length);
					joinRect2.transform("r" + (180 + angle) + "," + x1 + "," + y1);
					joinRect2.attr({"stroke-width": 0, fill: "white"});
					joinRect2.data("type", "joinRect2");
					this.symbols.push(joinRect2);

					//accessibility symbols don't get broken up in the way traditional interchanges do, so bring them back on top
					if ((symbol1.data("access") == 1) || (symbol1.data("access") == 2)) {
						symbol1.toFront();
						symbol1.data("wheelChair").toFront();
					}
					if ((symbol2.data("access") == 1) || (symbol2.data("access") == 2)) {
						symbol2.toFront();
						symbol2.data("wheelChair").toFront();
					}
				}
			}
		}
	}
}

station.prototype.writeLabel = function(dictionary) {
	if (!this.virtual) {
		// write the text label -> same whether special or not
		var labelSymbol = this.findLabelSymbol(); //which symbol is the best to use?
		var labelxOffset = 0; //set default values and override only if necessary
		var labelyOffset = 0;
		var anchor = "middle";

		//defaults -> for a tick mark
		switch(this.labelDirection) {
			case 0: //up
				labelyOffset = -16;
				break;

			case 1: //up-right
				labelyOffset = -10;
				labelxOffset = 10;
				anchor = "start";
				break;

			case 2: //right
				labelxOffset = 12;
				anchor = "start";
				break;

			case 3: //down-right
				labelxOffset = 10;
				labelyOffset = 10;
				anchor = "start";
				break;

			case 4: //down
				labelyOffset = 16;
				break;

			case 5: //down-left
				labelyOffset = 10;
				labelxOffset = -10;
				anchor = "end";
				break;

			case 6: //left
				labelxOffset = -12;
				anchor = "end";
				break;

			case 7: //up-left
				labelyOffset = -10;
				labelxOffset = -10;
				anchor = "end";
				break;
		}

		//compensate where the interchange has more than one line -> because tick marks on the same length won't line up with interchanges
		if ((labelSymbol.data("type") == "interchange") && (labelSymbol.data("markers").length > 1)) {
			var linesCount = labelSymbol.data("markers").length;
			switch(this.labelDirection) {
				case 0: //up
					labelyOffset -= (1.5 * linesCount);
					break;

				case 1: //up-left
					labelyOffset -= (1.5 * linesCount);
					labelxOffset += (1.5 * linesCount);
					break;

				case 2: //left
					labelxOffset += (1.5 * linesCount);
					break;

				case 3: //down-left
					labelyOffset += (1.5 * linesCount);
					labelxOffset += (1.5 * linesCount);
					break;

				case 4: // down
					labelyOffset += (1.5 * linesCount);
					break;

				case 5: //down-right
					labelxOffset -= (1.5 * linesCount);
					labelyOffset += (1.5 * linesCount);
					break;

				case 6: //right
					labelxOffset -= (1.5 * linesCount);
					break;

				case 7: //up-right
					labelyOffset -= (1.5 * linesCount);
					labelxOffset -= (1.5 * linesCount);
					break;
			}
		}

		//if we gave it a valid dictionary array, use that. Otherwise, use default name
		if ((typeof dictionary == "undefined") || (typeof dictionary[this.name] == "undefined") || (!Array.isArray(dictionary))) {
			var labelText = this.name;
			var labelData = this.name;
			if (typeof dictionary != "undefined") { //if you did actually give it a 
				console.log("Dictionary did not contain a value for station " + this.name);
			}
		}
		else {
			var labelText = dictionary[this.name].toString().trim();
		}

		//work out the text -> longer ones may need splitting
		var lineCount = 1;
		for (var i = 0; i < wrapStations.length; i++) {
			if (wrapStations[i] == this.id) {
				var stationWords = labelText.split(" ");
				var labelText = "";
				for (var j = 0; j < stationWords.length; j++) {
					if ((j % 2) == 0) {
						var separator = "\n";
						lineCount++;
					}
					else {
						var separator = " ";
					}
					labelText = labelText + stationWords[j] + separator;
				}
				labelText = labelText.trim();
				break;
			}
		}

		//write the text
		this.label = tubeMap.text(labelSymbol.data("x") + labelxOffset, labelSymbol.data("y") + labelyOffset, labelText);
		this.label.attr({"font-family": "johnston itc, gill sans", "text-anchor": anchor, "font-size": 6, "fill": "black"});
		this.label.data("lineCount", lineCount);

		//certain directions need moving up/down since aligned to middle/end
		if (this.labelDirection == 0) {
			this.label.attr({"y": this.label.attr("y") - (3 * (this.label.data("lineCount") - 1))})
		}
		if (this.labelDirection == 3) {
			this.label.attr({"y": this.label.attr("y") + (9 * (this.label.data("lineCount") - 1))})
		}
		if (this.labelDirection == 4) {
			this.label.attr({"y": this.label.attr("y") + (3 * (this.label.data("lineCount") - 1))})
		}
	}
}

//which of a station's symbols is nearest its label?
station.prototype.findLabelSymbol = function() {
	if (this.virtual) {
		return null;
	}

	var bestSymbol;
	if ((typeof this.symbols != "undefined") && (this.symbols.length > 0)) {
		for (var i = 0; i < this.symbols.length; i++) {
			var thisSymbol = this.symbols[i];
			if ((thisSymbol.data("type") == "tick") || (thisSymbol.data("type") == "interchange")) {
				
				//make sure we always have something defined
				if (typeof bestSymbol == 'undefined') {
					bestSymbol = thisSymbol;
				}

				//whether this one is better depends on the direction
				switch(this.labelDirection) {
					case 0: //up
						if (thisSymbol.data("y") < bestSymbol.data("y")) {
							bestSymbol = thisSymbol;
						}
						break;

					case 1: //up-right
						if ((thisSymbol.data("x") >= bestSymbol.data("x")) && (thisSymbol.data("y") <= bestSymbol.data("y"))) {
							bestSymbol = thisSymbol;
						}
						break;

					case 2: //right
						if (thisSymbol.data("x") > bestSymbol.data("x")) {
							bestSymbol = thisSymbol;
						}
						break;

					case 3: //down-right
						if ((thisSymbol.data("x") >= bestSymbol.data("x")) && (thisSymbol.data("y") >= bestSymbol.data("y"))) {
							bestSymbol = thisSymbol;
						}
						break;

					case 4: //down
						if (thisSymbol.data("y") > bestSymbol.data("y")) {
							bestSymbol = thisSymbol;
						}
						break;

					case 5: //down-left
						if ((thisSymbol.data("x") <= bestSymbol.data("x")) && (thisSymbol.data("y") >= bestSymbol.data("y"))) {
							bestSymbol = thisSymbol;
						}
						break;

					case 6: //left
						if (thisSymbol.data("x") < bestSymbol.data("x")) {
							bestSymbol = thisSymbol;
						}
						break;

					case 7: //up-left
						if ((thisSymbol.data("x") <= bestSymbol.data("x")) && (thisSymbol.data("y") <= bestSymbol.data("y"))) {
							bestSymbol = thisSymbol;
						}
						break;
				}
			}
		}
	}

	else {
		for (var m = 0; m < this.joined.length; m++) {
			if (this.joined[m][1] == -1) { //joined by walking
				var otherStation = getById(stations, this.joined[m][0]);
				for (var n = 0; n < otherStation.symbols.length; n++) { //look at the other stations symbols
					var otherSymbol = otherStation.symbols[n];
					if (otherSymbol.data("type") == "interchange") {
						var markerArray = otherSymbol.data("markers");
						if (markerArray[0][0] == this.id) {
							bestSymbol = otherSymbol;
						}
					}
				}
			}
		}
	}

	return bestSymbol;
}

//convenience function - do them all at once
stations.draw = function(dictionary) {
	stations.joinWalking();
	for (var i = 0; i < stations.length; i++) {
		stations[i].draw();
	}
}

//convenience method because i keep typing it
stations.getById = function(ID) {
	return getById(stations, ID);
}

//convenience method because i keep typing it
stations.getByName = function(name, exact) {
	return getByName(stations, name, exact);
}

//write the labels -> need to remove old ones first
stations.writeLabels = function(dictionary) {
	for (var i = 0; i < stations.length; i++) {
		var thisStation = stations[i];
		if (typeof thisStation.label != "undefined") {
			thisStation.label.remove();
		}
		thisStation.writeLabel(dictionary);
	}
}

stations.getFromDictionary = function(dictionary, searchName, exact) {
	//find the first dictionary result for a given string -> what was that station really called?
	var foundName = "";
	for (var k in dictionary) {
		var v = dictionary[k];
		if (exact) {
			if (searchName.toLowerCase() == v.toLowerCase()) {
				foundName = v;
				foundName = k;
				break;
			}
		}
		else {
			var startName = v.substring(0, searchName.length).toLowerCase();
			if (startName == searchName.toLowerCase()) {
				foundName = k;
				break;
			}
		}
	}
	
	//now we know the name you're looking for, go and get the station
	if (foundName.length > 0) {
		return getByName(stations, foundName, true);
	}
	
	return null; //nothing found
}

//join up stations where they are linked by being in walking distance. They will, after all, only get drawn once
stations.joinWalking = function() {
	for (var i = 0; i < joinedStations.length; i++) {
		var firstStationID = joinedStations[i][0];
		var secondStationID = firstStationID;
		var firstMarkerID = -1;
		var secondMarkerID = -1;
		for (var j = 2; j < joinedStations[i].length; j+=2) {
			if (joinedStations[i][j] != firstStationID) {
				secondStationID = joinedStations[i][j];
				secondMarkerID = joinedStations[i][j + 1][0];
				firstMarkerID = joinedStations[i][j - 1][0];
				break;
			}
		}
		var firstStation = getById(stations, firstStationID);
		var secondStation = getById(stations, secondStationID);
		firstStation.join(secondStation.id, -1); //use special lineID to show it connects to the whole lot
		secondStation.join(firstStation.id, -1);
		firstStation.joinedStation = secondStation;
		secondStation.joinedStation = firstStation;
	}
}

station.prototype.toFront = function(beenDone) {
	//if joined to another station, make sure you do both -> but don't get trapped in infinite loop
	if ((typeof this.joinedStation != "undefined") && (!beenDone)) {
		this.joinedStation.toFront(true);
	}

	var orderedSymbols = []; //need to decorate-sort-undecorate
	for (var i = 0; i < this.symbols.length; i++) {
		var thisSymbol = this.symbols[i];
		var type = thisSymbol.data("type");
		if (type == "tick") {
			orderedSymbols.push([0, thisSymbol]);
		}
		if (type == "interchange") {
			var access = thisSymbol.data("access");
			if (access == 0) {
				orderedSymbols.push([1, thisSymbol]);
			}
			if (access > 0) {
				orderedSymbols.push([4, thisSymbol]);
			}
		}
		if (type == "joinRect1") {
			orderedSymbols.push([2, thisSymbol]);
		}
		if (type == "joinRect2") {
			orderedSymbols.push([3, thisSymbol]);
		}
		if (type == "wheelChair") {
			orderedSymbols.push([5, thisSymbol]);
		}
	}

	orderedSymbols.sort(function(a, b) {
		if (a[0] < b[0]) {
			return -1;
		}
		if (a[0] > b[0]) {
			return 1;
		}
		return 0;
	});

	for (var i = 0; i < orderedSymbols.length; i++) {
		orderedSymbols[i][1].toFront();
	}
}

//once it's draw, you may want to change / reset the colours of symbols
station.prototype.changeColour = function(overrideColour, beenDone) {
	//change the label text
	if (!this.virtual) {
		//if joined to another station, make sure you do both bits
		if ((typeof this.joinedStation != "undefined") && (!beenDone)) {
			if (typeof overrideColour == "undefined") { //reset
				this.joinedStation.changeColour(undefined, true);
			}
			else {
				this.joinedStation.changeColour(overrideColour, true);
			}
			
		}

		if (typeof overrideColour == "undefined") { //reset
			this.label.attr({fill: "black"});
		}
		else {
			this.label.attr({fill: String(overrideColour)});
		}

		//change each symbol -> precise requirements change depending on type of symbol
		for (var i = 0; i < this.symbols.length; i++) {
			var thisSymbol = this.symbols[i];
			var type = thisSymbol.data("type");
			if (type == "tick") {
				if (typeof overrideColour == "undefined") { //reset
					thisSymbol.attr({fill: thisSymbol.data("defaultFill")});
				}
				else {
					thisSymbol.attr({fill: String(overrideColour)});
				}
			}
			if (type == "joinRect1") {
				if (typeof overrideColour == "undefined") { //reset
					thisSymbol.attr({fill: "black"});
				}
				else {
					thisSymbol.attr({fill: String(overrideColour)});
				}
			}
			if (type == "interchange") {
				var access = thisSymbol.data("access");
				if (access == 0) {
					if (typeof overrideColour == "undefined") { //reset
						thisSymbol.attr({stroke: "black"});
					}
					else {
						thisSymbol.attr({stroke: String(overrideColour)});
					}
				}
				else if (access == 1) {
					var wheelChair = thisSymbol.data("wheelChair");
					if (typeof overrideColour == "undefined") { //reset
						thisSymbol.attr({stroke: "#1C3F94"});
						wheelChair.attr({fill: "#1C3F94"});
					}
					else {
						thisSymbol.attr({stroke: String(overrideColour)});
						wheelChair.attr({fill: String(overrideColour)});
					}

				}
				else if (access == 2) {
					var wheelChair = thisSymbol.data("wheelChair");
					if (typeof overrideColour == "undefined") { //reset
						thisSymbol.attr({fill: "#1C3F94"});
					}
					else {
						thisSymbol.attr({fill: String(overrideColour)});
					}
				}
			}
		}
	}
}

//do the lot at once
stations.changeColour = function(overrideColour) {
	for (var i = 0; i < stations.length; i++) {
		var thisStation = stations[i];
		thisStation.changeColour(String(overrideColour));
	}
}