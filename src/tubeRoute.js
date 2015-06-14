//Journey/Meal Planner
//http://www.dinosaursandmoustaches.com/tube-map
//Tom Curtis, October 2013
//In no way affiliated with TfL
//Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported 
//http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US

//keep an index of linePairs from the various lines, in order to highlight them when needed for drawing paths
var linePathIndex = []; //keys are links minus the distance (calculation might go slightly differently when done t'other way round)

function getIndexPath(link) {
	if (typeof linePathIndex[link] == "undefined") {
		var newLink = [link[3], link[4], link[5], link[0], link[1], link[2]]; //swap it around
		return linePathIndex[newLink];
	}
	else {
		return linePathIndex[link]; //will return undefined if not found
	}
}

//define a route
function route(inOrder, rPairs, lineID) {
	//need rPairs to be an array
	if (!Array.isArray(rPairs)) {
		throw new Error("Failed to create a route because input wasn't an array.");
	}

	//check each item in the array is itself an array with two or four or six members
	for (var i = 0; i < rPairs.length; i++) {
		//check it's an array
		if (!Array.isArray(rPairs[i])) {
			throw new Error("Failed to create a route because member " + i + " is not an array.");
		}

		//check it's the right sort of length
		if ((rPairs[i].length != 2) && (rPairs[i].length != 4) && (rPairs[i].length != 6)) {
			throw new Error("Failed to create a route because member " + i + " has " + rPairs[i].length + " members. It can only have 2, 4 or 6.");
		}
		
		//if it's not got all six defined, need to check it's a valid lineID
		if ((rPairs[i].length == 2) || (rPairs[i].length == 4)) {
			if ((typeof lineID == 'undefined') || (isNaN(parseInt(lineID))) || (getById(lines, lineID) == null)) {
				throw new Error("Failed to create a route because member " + i + " has 2 or 4 members, but supplied lineID '" + lineID + "' is not valid.");
			}
		}
	}

	this.ordered = Boolean(inOrder); //keep a record of whether pairs is a list in order from A to B

	//create the array itself
	//each entry will be an array with six members, being two sets of three -> [station1, line1, marker1, station2, line2, marker2]
	this.links = [];
	for (var i = 0; i < rPairs.length; i++) {
		//easy case -> already got input in the right formula. Just add it on the end. 
		if (rPairs[i].length == 6) {
			this.links.push(rPairs[i]);
		}
		else {
			//else need to make it up to a six member set
			if (rPairs[i].length == 4) { //four members to start with -> [station1, marker1, station2, marker2]
				var newLink = [rPairs[i][0], lineID, rPairs[i][1], rPairs[i][2], lineID, rPairs[i][3]];
				this.links.push(newLink);
			}

			else { //two members to start with -> just got [station1, station2]
				var station1 = getById(stations, rPairs[i][0]);
				var station2 = getById(stations, rPairs[i][1]);
				var marker1 = station1.findLineMarker(lineID);
				var marker2 = station2.findLineMarker(lineID);
				var newLink = [station1.id, lineID, marker1.id, station2.id, lineID, marker2.id];
				this.links.push(newLink);
			}
		}
	}
	
	//keep a list of stations on this line -> associative array from id to true
	this.stations = new Array(); 
	for (var i = 0; i < this.links.length; i++) {
 		if (i == 0) { //start off with the first one of the first pair. Then on, only need the second one from each pair
			this.stations[this.links[i][0]] = true;
		}
		this.stations[this.links[i][3]] = true;
	}
}

//v important -> draw a route!
route.prototype.draw = function() {
	var linePairs = [];

	for (var i = 0; i < this.links.length; i++) {
		var thisLink = this.links[i];

		//each link will have seven members -> [station1, line1, marker1, station2, line2, marker2, distance]
		var firstStation = getById(stations, thisLink[0]);
		var secondStation = getById(stations, thisLink[3]);

		var firstMarker = firstStation.mapMarkers[thisLink[2]];
		var secondMarker = secondStation.mapMarkers[thisLink[5]];

		//get the colours of this route
		var line = getById(lines, thisLink[1]);
		name = line.name;
		colour = line.colour;
		dash = line.dashArray;
		thickness = line.thickness;

		if ((firstMarker == null) || (typeof firstMarker == 'undefined') || (secondMarker == null) || (typeof secondMarker == 'undefined')) {
			throw new Error("Cannot draw line between " + firstStation.name + " and " + secondStation.name);
		}

		//optional diagnostic - check which angles each line is at - expecting a few regular ones
		var yDiff = firstMarker.y - secondMarker.y;
		var xDiff = firstMarker.x - secondMarker.x;
		var Ygradient = (yDiff / xDiff);
		var Xgradient = (xDiff / yDiff);
		if ((Math.abs(Xgradient) != 0) && (Math.abs(Xgradient) != 1) && (Math.abs(Xgradient) != Infinity)) {
			console.log("Unusual line angle: " + String(name) + ", " + firstStation.name + ", " + secondStation.name + ", " + Ygradient.toFixed(2) + " / " + Xgradient.toFixed(2));
		}

		var thisLinePairPath = "M" + firstMarker.x + "," + firstMarker.y + "L" + secondMarker.x + "," + secondMarker.y;
		var thisLinePair = tubeMap.path(thisLinePairPath);
		thisLinePair.attr({stroke: String(colour), "stroke-dasharray": dash, fill: "none", "stroke-width": thickness, "stroke-linecap": "round"});
		thisLinePair.data("colour", String(colour));
		linePairs.push(thisLinePair);
		linePathIndex[thisLink.slice(0, 6)] = thisLinePair;
	}
	this.linePairs = linePairs;
}

//add up lengths of each segment to get total length
route.prototype.getLength = function() {
	var total = 0;
	for (var i = 0; i < this.links.length; i++) {
		var thisLink = this.links[i];
		total += thisLink[6];
	}
	return total;
}

//count how many stations are on the route -> ignore virtuals by default, unless all == true
route.prototype.getStations = function(includeVirtual) {
	var stationSet = [];
	for (var i = 0; i < this.links.length; i++) {
		var thisLink = this.links[i];

		var firstStationID = thisLink[0];
		var secondStationID = thisLink[3];

		//easy if you include them all
		if (includeVirtual) {
			if (stationSet.indexOf(firstStationID) == -1) {
				stationSet.push(firstStationID);
			}
			if (stationSet.indexOf(secondStationID) == -1) {
				stationSet.push(secondStationID);
			}
		}
		//otherwise, need to check if it's real or not
		else {
			if (stationSet.indexOf(firstStationID) == -1) {
				var firstStation = getById(stations, firstStationID);
				if (!firstStation.virtual) {
					stationSet.push(firstStationID);
				}
			}
			if (stationSet.indexOf(secondStationID) == -1) {
				var secondStation = getById(stations, secondStationID);
				if (!secondStation.virtual) {
					stationSet.push(secondStationID);
				}
			}
		}
	}
	return stationSet.sort();
}

//once the lines are drawn, we may want to change / reset the colours
route.prototype.changeColour = function(overrideColour) {
	for (var i = 0; i < this.linePairs.length; i++) {
		var thisLinePair = this.linePairs[i];
		if (typeof overrideColour == "undefined") {
			thisLinePair.attr({stroke: thisLinePair.data("colour")});
		}
		else {
			thisLinePair.attr({stroke: String(overrideColour)});
		}
	}
}

//now we've made a route, highlight it (as opposed to drawing it from scratch
route.prototype.highlight = function() {
	//reset the map to uniform colour
	lines.changeColour(overrideColour);
	stations.changeColour(overrideColour);

	var linePairs = this.getLinePairs();
	for	(var i = 0; i < linePairs.length; i++) {
		var thisLinePair = linePairs[i];
		thisLinePair.attr({stroke: thisLinePair.data("colour")});
		thisLinePair.toFront();
	}

	//do the stations too
	var stationList = this.getStations(false);
	for (var i = 0; i < stationList.length; i++) {
		var thisStation = getById(stations, stationList[i]);
		thisStation.changeColour();
		thisStation.toFront();

		//check any tick symbols -> should be grey if they're not used in link
		for (var j = 0; j < thisStation.symbols.length; j++) {
			var thisSymbol = thisStation.symbols[j];
			if (thisSymbol.data("type") == "tick") {
				var symbolMarkers = thisSymbol.data("markers");
				var inUse = false;
				for (var k = 0; k < symbolMarkers.length; k++) {
					if (!inUse) {
						for (var l = 0; l < this.links.length; l++) {
							var thisLink = this.links[l];
							var station1id = thisLink[0];
							var station2id = thisLink[3];
							if (station1id == thisStation.id) {
								var markerNum = thisLink[2];
								if (symbolMarkers[k][1] == markerNum) {
									inUse = true;
									break;
								}
							}
							if (station2id == thisStation.id) {
								var markerNum = thisLink[5];
								if (symbolMarkers[k][1] == markerNum) {
									inUse = true;
									break;
								}
							}
						}
					}
				}
				//tried all the markers, not found any in use -> so make it grey again
				if (!inUse) {
					thisSymbol.attr({fill: overrideColour});
				}
			}
		}
	}
}

//get the linePairs (should you ever need them)
route.prototype.getLinePairs = function() {
	//if they're already indexed (as for a line, use that)
	if (typeof this.linePairs != "undefined") {
		return this.linePairs;
	}
	else {
		//otherwise, go fetch from index
		var newPairs = [];
		for (var i = 0; i < this.links.length; i++) {
			var thisPair = getIndexPath(this.links[i]);
			if (typeof thisPair != "undefined") {
				newPairs.push(thisPair);
			}
		}
		return newPairs;
	}
}
