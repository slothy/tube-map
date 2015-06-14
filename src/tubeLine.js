//Journey/Meal Planner
//Tom Curtis, October 2013
//In no way affiliated with TfL
//Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported 

//define a tube line
function tubeLine(id, name, colour, dash, thickness) {
	//sanity checks
	//1. id is an integer and not already in use
	if (isNaN(parseInt(id))) {
		throw new Error("Failed to create line " + id + " because id was not a number.");
	}
	if (getById(lines, parseInt(id)) != null) {
		throw new Error("Failed to create line " + id + " because id " + parseInt(id) + " is already in use.");
	}

	//2. name is not already in use -> prevents exact duplicates, though not ones which start the same way
	var checkStringLine = getByName(lines, String(name));
	if ((checkStringLine != null) && (checkStringLine.name == String(name))) {
		throw new Error("Failed to create line " + id + " because name '" + String(name) + "'' is already in use.");
	}

	//3. check dash array is a valid value
	var dashValues = ["", "-", ".", "-.", "-..", ". ", "- ", "--", "- .", "--.", "--.."];
	var dashString = String(dash);
	var foundDash = false;
	for (var i = 0; i < dashValues.length; i++) {
		if (dashString == dashValues[i]) {
			foundDash = true;
			break;
		}
	}
	if (!foundDash) {
		throw new Error("Failed to create line " + id + " because dash array '" + dashString + "' is not a valid dash type.");
	}

	//4. check thickness is a valid number
	if (isNaN(parseFloat(thickness))) {
		throw new Error("Failed to create line " + id + " because thickness value was not a number.")
	}
	
	this.id = parseInt(id);
	this.name = String(name);
	this.colour = String(colour); //going to leave it to Raphael to check this works or not. I can't fathom how to test it.
	this.dashArray = String(dash); // empty string = solid
	this.thickness = parseFloat(thickness); //default size for line width

	this.paths = []; //temporary - will remove once the 
	lines.push(this); //add to container
}

tubeLine.prototype.draw = function() {
	//check for route, since it wasn't defined in the constructor, so it could be missing
	if (typeof this.route == 'undefined') {
		throw new Error("Tried to draw line " + this.id + " but it doesn't have a route defined yet.");
	}

	this.route.draw();
}

//add details to the stations on a line telling them what stations they're joined to
//each link is an array in the form [stationID, lineID, otherStationMarker]
tubeLine.prototype.joinStations = function() {
	//check there's a route to work with first
	if (typeof this.route == 'undefined') {
		throw new Error("Cannot join stations on line " + this.id + " because no route has been set yet.");
	}

	//go through the pairs of links on the route
	for (var i = 0; i < this.route.links.length; i++) {
		//extract data from route array
		var firstStationID = this.route.links[i][0];
		var firstMarker = this.route.links[i][2];
		var secondStationID = this.route.links[i][3];
		var secondMarker = this.route.links[i][5];
		var lineID = this.id;

		//get the real objects referred to
		var firstStation = getById(stations, firstStationID);
		var secondStation = getById(stations, secondStationID);

		firstStation.join(secondStation.id, this.id, firstMarker, secondMarker);
		secondStation.join(firstStation.id, this.id, secondMarker, firstMarker);
	}
}

//draw all the lines in one call
lines.draw = function() {
	for (var i = 0; i < lines.length; i++) {
		var thisLine = getById(lines, i);
		if (thisLine != null) {
			thisLine.draw();
		}
	}
}

//join all stations up in one call
lines.joinStations = function() {
	for (var i = 0; i < lines.length; i++) {
		var thisLine = getById(lines, i);
		if ((thisLine != null) && (thisLine.id != River.id)) {
			//specifically exclude the river -> even if some how it got linked up, shouldn't be used for routing
			thisLine.joinStations();
		}
	}
}

//shorthands for easier calling the lot at once
lines.changeColour = function(overrideColour) {
	for (var i = 0; i < lines.length; i++) {
		var thisLine = getById(lines, i);
		if (thisLine != null) {
			thisLine.route.changeColour(overrideColour);
		}
	}
}
