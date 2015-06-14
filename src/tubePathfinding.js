//Journey/Meal Planner
//http://www.dinosaursandmoustaches.com/tube-map
//Tom Curtis, October 2013
//In no way affiliated with TfL
//Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported 
//http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US

var routeTestLimit = 1000;
var overrideColour = "#dddddd";

//given arrays of possible starts, ends, and goals -> returns a route
function choosePath(choiceMethod, startIDs, goalIDs, viaIDs) {
	//choiceMethod must be an integer between 0 and 6
	if (isNaN(parseInt(choiceMethod)) || (parseInt(choiceMethod) < 0) || (parseInt(choiceMethod) > 6)) {
		throw new Error("Cannot choose path because choice method " + choiceMethod + " is not valid.");
	}

	//startIDs and goalIDs must be an array of stationIDs (vias are optional, so dealt with later)
	if ((typeof startIDs == "undefined") || !Array.isArray(startIDs) || (startIDs.length == 0)) {
		throw new Error("Cannot choose path because startIDs was not a valid array.");
	}
	if ((typeof goalIDs == "undefined") || !Array.isArray(goalIDs) || (goalIDs.length == 0)) {
		throw new Error("Cannot choose path because goalIDs was not a valid array.");
	}

	for (var i = 0; i < startIDs.length; i++) {
		var thisID = parseInt(startIDs[i]);
		if (isNaN(thisID) || (getById(stations, thisID) == null)) {
			throw new Error("Cannot choose path because startID " + i + " was not a valid station.");
		}
	}
	for (var i = 0; i < goalIDs.length; i++) {
		var thisID = parseInt(goalIDs[i]);
		if (isNaN(thisID) || (getById(stations, thisID) == null)) {
			throw new Error("Cannot choose path because goalID " + i + " was not a valid station.");
		}
	}

	var resultSet = [];
	for (var i = 0; i < startIDs.length; i++) {
		for (var j = 0; j < goalIDs.length; j++) {
			if (parseInt(startIDs[i]) != parseInt(goalIDs[j])) {
				if ((typeof viaIDs != "undefined") && (Array.isArray(viaIDs)) && (viaIDs.length > 0)) {
					for (k = 0; k < viaIDs.length; k++) {
						var thisResult = findPath(parseInt(startIDs[i]), parseInt(goalIDs[j]), parseInt(viaIDs[k]))
						resultSet.push(thisResult);
					}
				}
				else {
					var thisResult = findPath(parseInt(startIDs[i]), parseInt(goalIDs[j]));
					resultSet.push(thisResult);
				}
			}
		}
	}
	
	//choose one of the paths
	//choiceMethods -> 0 = random, 1 = shortest, 2 = longest, 3 = fewest links (inc virtual), 4 = most links (inc virtual), 5 = 
	switch(parseInt(choiceMethod)) {
		case 0: //random
			var randInt = Math.floor(Math.random() * resultSet.length);
			return makePathRoute(resultSet[randInt]);

		case 1: //shortest
			resultSet.sort(function compare(a, b) {
				if (a[1] < b[1]) {
					return -1;
				}
				if (a[1] > b[1]) {
					return 1;
				}
				return 0;
			});
			return makePathRoute(resultSet[0]);

		case 2: //longest
			resultSet.sort(function compare(a, b) {
				if (a[1] < b[1]) {
					return 1;
				}
				if (a[1] > b[1]) {
					return -1;
				}
				return 0;
			});
			return makePathRoute(resultSet[0]);

		case 3: //fewest links
			resultSet.sort(function compare(a, b) {
				if (a[0].length < b[0].length) {
					return -1;
				}
				if (a[0].length > b[0].length) {
					return 1;
				}
				return 0;
			});
			return makePathRoute(resultSet[0]);

		case 4: //most links
			resultSet.sort(function compare(a, b) {
				if (a[0].length < b[0].length) {
					return 1;
				}
				if (a[0].length > b[0].length) {
					return -1;
				}
				return 0;
			});
			return makePathRoute(resultSet[0]);

		case 5: //fewest stations (exc virtual)
			resultSet.sort(function compare(a, b) {
				var aRoute = makePathRoute(a);
				var bRoute = makePathRoute(b);

				var aStations = aRoute.getStations();
				var bStations = bRoute.getStations();

				if (aStations.length < bStations.length) {
					return -1;
				}
				if (aStations.length > bStations.length) {
					return 1;
				}
				return 0;
			});
			return makePathRoute(resultSet[0]);

		case 6: //most stations (exc virtual)
			resultSet.sort(function compare(a, b) {
				var aRoute = makePathRoute(a);
				var bRoute = makePathRoute(b);

				var aStations = aRoute.getStations();
				var bStations = bRoute.getStations();

				if (aStations.length < bStations.length) {
					return 1;
				}
				if (aStations.length > bStations.length) {
					return -1;
				}
				return 0;
			});
			return makePathRoute(resultSet[0]);
	}

	//failure
	return null;
}

//given two station IDs (or a third one on the way), how do you get between them? -> returns [path, distance_along_path]
function findPath(startID, goalID, via) {
	//check inputs are numbers
	if ((typeof startID == "undefined") || (isNaN(parseInt(startID))) || (getById(stations, parseInt(startID)) == null)) {
		throw new Error("Cannot find path between stations " + startID + " and " + goalID + " because " + startID + " is not a valid station id");
	}
	if ((typeof goalID == "undefined") || (isNaN(parseInt(goalID))) || (getById(stations, parseInt(goalID)) == null)) {
		throw new Error("Cannot find path between stations " + startID + " and " + goalID + " because " + goalID + " is not a valid station id");
	}

	var openSet = [parseInt(startID)]; //set of stations to evaluate, starting with the first station
	var closedSet = [];
	var cameFrom = []; //list of nodes followed so far

	//keep track of routes + distances
	var g_scores = []; //keep track of distances travelled to each point
	var f_scores = []; //associative array to keep track of f_scores tested so far
	f_scores[startID] = get_f_score(startID);

	//look it up if you can, otherwise don't
	function get_f_score(ID) {
		if (typeof f_scores[ID] == "undefined") {
			f_scores[ID] = get_g_score(ID) + distance_estimate(ID, goalID);
		}
		return f_scores[ID];
	}

	function get_g_score(ID) {
		if (typeof g_scores[ID] == "undefined") {
			g_scores[ID] = 0;
		}
		return g_scores[ID];
	}

	var counter = 0;
	while (openSet.length > 0) {
		//pick the lowest f_score value first
		var current = null;
		var lowest = 99999;
		for (var i = 0; i < openSet.length; i++) {
			if (get_f_score(openSet[i]) < lowest) {
				current = openSet[i];
				lowest = get_f_score(current, goalID);
			}
		}

		//check if we've arrived at the right station yet
		if (current == goalID) {
			//find how we got here
			var pathTaken = reconstruct_path(cameFrom, goalID, 0);

			//if no via option, no need to check
			if ((typeof via == "undefined") || (isNaN(parseInt(via))) || (getById(stations, parseInt(via)) == null))  {
				return [pathTaken, get_g_score(goalID)];
			}

			//is the via station on the way?
			for (var i = 0; i < pathTaken.length; i++) {
				if (pathTaken[i] == via) {
					return [pathTaken, get_g_score(goalID)];	
				}
			}

			//if neither of those, do it in two parts
			var partA = findPath(startID, via);
			var partB = findPath(via, goalID);
			var fullPath = partA[0].concat(partB[0]);
			var fullScore = partA[1] + partB[1];
			return [fullPath, fullScore];

		}

		//remove current option from openSet and add to closedSet
		openSet.splice(openSet.indexOf(current), 1);
		if (closedSet.indexOf(current) == -1) {
			closedSet.push(current);
		}
		
		//time out to limit route searching
		counter++;
		if (counter >= routeTestLimit) {
			return;
		}

		//test each of the current station's neighbours
		var currentStation = getById(stations, current);
		var currentNeighbours = currentStation.getNeighbours();
		for (var i = 0; i < currentNeighbours.length; i++) {
			var neighbour = currentNeighbours[i][0];
			var neighbourDistance = currentNeighbours[i][1];
			
			var tentative_g = get_g_score(current) + neighbourDistance;
			var tentative_f = tentative_g + distance_estimate(current, neighbour);
			if ((closedSet.indexOf(neighbour) != -1) && (tentative_f >= get_f_score(neighbour))) {
				continue;
			}

			//don't double back on yourself!
			if (cameFrom[current] == neighbour) {
				continue;
			}

			//only do further steps if it's worth it
			if ((openSet.indexOf(neighbour) == -1) || (tentative_f < get_f_score[neighbour])) {
				cameFrom[neighbour] = current;
				g_scores[neighbour] = tentative_g;
				f_scores[neighbour] = tentative_f;
				if (openSet.indexOf(neighbour) == -1) {
					openSet.push(neighbour);
				}
			}
		}
 	}

 	return null;
}

//used to generate the path recursively -> work back from end making longer array
function reconstruct_path(cameFrom, currentNode, i) {
	//currentNode should be an an integer
	if ((parseInt(currentNode) < 0) || (isNaN(parseInt(currentNode))) || (getById(stations, parseInt(currentNode)) == null)) {
		throw new Error("Cannot reconstruct path for station " + currentNode + " because it is not a valid station id");
	}

	//cameFrom should be an array
	if (!Array.isArray(cameFrom)) {
		throw new Error("Cannot reconstruct path as cameFrom was not an array");	
	}

	//stop any infinite regress
	if (i > routeTestLimit) {
		return null;
	}

	if ((cameFrom.length >= currentNode) && (typeof cameFrom[currentNode] != "undefined")) {
		var p = reconstruct_path(cameFrom, cameFrom[currentNode], i + 1);
		p.push(currentNode);
		return p;
	}
	else {
		return [currentNode];
	}
}

//heuristic - straight line distance between two points
function distance_estimate(station1id, station2id) {
	if ((typeof station1id == "undefined") || (isNaN(parseInt(station1id)))) {
		throw new Error("Cannot find straight line distance between stations " + station1id + " and " + station2id + " because " + station1id + " is not a valid id");
	}
	if ((typeof station2id == "undefined") || (isNaN(parseInt(station2id)))) {
		throw new Error("Cannot find straight line distance between stations " + station1id + " and " + station2id + " because " + station2id + " is not a valid id");
	}

	if (station1id == station2id) {
		return 0;
	}

	var station1 = getById(stations, parseInt(station1id));
	var station2 = getById(stations, parseInt(station2id));

	//more error checking
	if (typeof station1 == "undefined") {
		throw new Error("Cannot find straight line distance between stations " + station1id + " and " + station2id + " because there is no station with id " + station1id);
	}
	if (typeof station2 == "undefined") {
		throw new Error("Cannot find straight line distance between stations " + station1id + " and " + station2id + " because there is no station with id " + station2id);
	}

	//if joined, then count as one station
	var neighbours = station1.getNeighbours();
	for (var i = 0; i < neighbours.length; i++) {
		if (neighbours[i][0] == station2id) {
			return 0;
		}
	}

	//find straight line distance between all pairs of markers at the stations. return the shortest distance.
	var shortest = 99999;
	for (var i = 0; i < station2.mapMarkers.length; i++) {
		var marker2 = station2.mapMarkers[i];
		
		for (var j = 0; j < station1.mapMarkers.length; j++) {
			var marker1 = station1.mapMarkers[j];
			var distance = Math.sqrt(Math.pow(marker2.x - marker1.x, 2) + Math.pow(marker2.y - marker1.y, 2));
			shortest = Math.min(shortest, distance);
		}
	}
	return shortest;
}

//if given the output from findPath, make a corresponding route
function makePathRoute(input) {
	// input needs to be an array produced by findPath -> [Array of ints, distance]
	if (!Array.isArray(input) || (input.length != 2)) {
		throw new Error("Failed to create new route because input was not a suitable array.");
	}

	if ((parseInt(input[1]) < 0) || (isNaN(parseInt(input[1])))) {
		throw new Error("Failed to create new route because second value was not a valid distance.");	
	}

	for (var i = 0; i < input[0].length; i++) {
		var idNum = input[0][i];
		if ((parseInt(idNum < 0)) || (isNaN(parseInt(idNum))) || (getById(stations, idNum) == null)) {
			throw new Error("Failed to create new route because path member " + i + " was not a valid stationID.");	
		}
	}

	var path = input[0]; //don't care about the distance for this purpose
	var rPairs = []; //make array of pairs to build a route with
	for (var i = 0; i < path.length - 1; i++) {
		var station1id = parseInt(path[i]); //deal with each link, a pair at a time
		var station2id = parseInt(path[i + 1]);

		//get the joins, make a route pair, turn it into a route
		var station1 = getById(stations, station1id);
		for (var j = 0; j < station1.joined.length; j++) {
			var thisJoin = station1.joined[j];
			if (thisJoin[0] == station2id) {
				//make a new entry suitable for building a route with
				var rPair = [station1id, thisJoin[1], thisJoin[2], station2id, thisJoin[1], thisJoin[3]];
				rPairs.push(rPair);
			}
		}
	}

	//if there's more than one symbol in use at a station, check it goes both ways. If not, remove the relevant rPair
	var startID = parseInt(path[0]);
	var goalID = parseInt(path[path.length - 1]);
	var symbolPairs = []; //keep track of which ones go where -> [[stationID, symbolNumber], [array of rPairs]]
	
	//step 1: compile a list of them all
	for (var i = 0; i < rPairs.length; i++) {
		var thisPair = rPairs[i];
		var station1ID = thisPair[0];
		var marker1num = thisPair[2];
		var station2ID = thisPair[3];
		var marker2num = thisPair[5];

		//get the details
		var station1 = getById(stations, parseInt(station1ID));
		var station2 = getById(stations, parseInt(station2ID));
		var symbol1 = station1.findMarkerSymbol(marker1num);
		var symbol2 = station2.findMarkerSymbol(marker2num);

		//get symbol numbers
		if (station1.virtual) {
			var symbol1num = 0;
		}
		else {
			for (var j = 0; j < station1.symbols.length; j++) {
				if (station1.symbols[j] == symbol1) {
					var symbol1num = j;
					break;
				}
			}
		}
		if (station2.virtual) {
			var symbol2num = 0;
		}
		else {
			for (var j = 0; j < station2.symbols.length; j++) {
				if (station2.symbols[j] == symbol2) {
					var symbol2num = j;
					break;
				}
			}
		}

		if (typeof symbolPairs[station1ID] == "undefined") {
			symbolPairs[station1ID] = [];
		}
		if (typeof symbolPairs[station1ID][symbol1num] == "undefined") {
			symbolPairs[station1ID][symbol1num] = []
		}
		if (typeof symbolPairs[station2ID] == "undefined") {
			symbolPairs[station2ID] = [];
		}
		if (typeof symbolPairs[station2ID][symbol2num] == "undefined") {
			symbolPairs[station2ID][symbol2num] = []
		}
		symbolPairs[station1ID][symbol1num].push(thisPair);
		symbolPairs[station2ID][symbol2num].push(thisPair);
	}

	//step 2: see which ones you want to keep -> not done quite right at the moment
	var checkedPairs = [];
	for (var i = 0; i < symbolPairs.length; i++) {
		if (typeof symbolPairs[i] != "undefined") {
			//if there is only one line to start/end, make sure we have it
			if ((i == startID) || (i == goalID)) {
				var multiple = false;
				for (var j = 0; j < symbolPairs[i].length; j++) { //check each symbol
					if (typeof symbolPairs[i][j] != "undefined") {
						if (symbolPairs[i][j].length > 1) {
							multiple = true;
							break;
						}
					}
				}
				//go get it, wherever it was
				if (!multiple) {
					for (var j = 0; j < symbolPairs[i].length; j++) {
						if (typeof symbolPairs[i][j] != "undefined") {
							for (var k = 0; k < symbolPairs[i][j].length; k++) {
								checkedPairs.push(symbolPairs[i][j][k]); //do it as a loop in case there are zero at this symbol
							}
						}
					}
				}
			}

			//otherwise, get every pair going through a symbol
			for (var j = 0; j < symbolPairs[i].length; j++) {
				if (typeof symbolPairs[i][j] != "undefined") {
					//if more than one link touches the station or it's a start/end station, have it 
					if (symbolPairs[i][j].length > 1) {
						for (var k = 0; k < symbolPairs[i][j].length; k++) {
							checkedPairs.push(symbolPairs[i][j][k]);
						}
					}
				}
			}
		}
	}

	//step 3: check you've got some way between each set of stations you should have!
	for (var i = 0; i < path.length - 1; i++) {
		var station1id = parseInt(path[i]); //deal with each link, a pair at a time
		var station2id = parseInt(path[i + 1]);
		var found = false;

		//see if there is a link for the two stations in our final set
		for (var j = 0; j < checkedPairs.length; j++) {
			var thisPair = checkedPairs[j];
			if (((thisPair[0] == station1id) && (thisPair[3] == station2id)) || ((thisPair[0] == station2id) && (thisPair[3] == station1id))) {
				found = true;
				break;
			}
		}

		//if not, add anything that will join them!
		if (!found) {
			for (var j = 0; j < rPairs.length; j++) {
				var thisPair = rPairs[j];
				if (((thisPair[0] == station1id) && (thisPair[3] == station2id)) || ((thisPair[0] == station2id) && (thisPair[3] == station1id))) {
					checkedPairs.push(thisPair);
				}
			}
		}
	}

	//give the result
	return new route(false, checkedPairs);
}