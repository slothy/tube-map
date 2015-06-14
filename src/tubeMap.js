//Journey/Meal Planner
//http://www.dinosaursandmoustaches.com/tube-map
//Tom Curtis, October 2013
//In no way affiliated with TfL
//Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported 
//http://creativecommons.org/licenses/by-nc-sa/3.0/deed.en_US 

//overall containers
var stations = [];
var lines = [];

//drawing size
var mapWidth = 2426;
var mapHeight = 1615;

//return a line/station beginning with the search string given
function getByName(lookIn, searchName, exact) {
	searchName = String(searchName); //can always convert it to a string, it just might not find anything

	if (!Array.isArray(lookIn)) {
		throw new Error("Cannot search for " + searchName + " in something that isn't an array.");
	}

	//temporary - cope with branches of the overground separately
	if ((searchName == "Overground")) {
		searchName = "London Overground";
	}

	for (var i = 0; i < lookIn.length; i++) {
		var thisObject = lookIn[i];
		
		if (exact) {
			//look for exact match
			if (thisObject.name.toLowerCase() == searchName.toLowerCase()) {
				return thisObject;
			}
		}
		else {
			//if more than one result begins that way, give the first one it finds
			var startName = thisObject.name.substring(0, searchName.length).toLowerCase();
			if (startName == searchName.toLowerCase()) {
				return thisObject;
			}
		}	
	}
	return null; //nothing found
}

//look up in an array by object ID
function getById(lookIn, searchID) {
	if ((typeof searchID != 'number') || (isNaN(searchID))) {
		throw new Error("Cannot search for " + searchID + " as it is a non-numeric id.");
	}

	if (!Array.isArray(lookIn)) {
		throw new Error("Cannot search for " + searchID + " in something that isn't an array.");
	}

	//try a shortcut first -> I should have pushed stations and lines into their arrays in id order
	if (searchID <= lookIn.length) { //can do <= since ids count from 0
		var thisObject = lookIn[searchID];
		if (typeof thisObject != 'undefined') {
			if (thisObject.id == searchID) {
				return thisObject;
			}
		}
	}

	//if not - do a general search
	for (var i = 0; i < lookIn.length; i++) {
		var thisObject = lookIn[i];

		//if more than one result begins that way, give the first one it finds (but shouldn't be the case...)
		if (thisObject.id == searchID) {
			return thisObject;
		}
	}
	return null; //not found
}

//work out how wide a text ztring would be printed up
function getTextWidth(textString) {
	var textBox = tubeMap.text(0, 0, String(textString));
	textBox.attr({"font-family": "gill sans"});
	var width = textBox.getBBox().width;
	textBox.remove();
	return width;
}

//if window resized, make map fit the right space
function setSizes() {
	tubeMap.setSize(window.innerWidth - 305, window.innerHeight);
}

//for using the interface
function switchMode(newMode, firstGo) {
	//can only cope with the two valid options
	if ((newMode != "journey") && (newMode != "meal")) {
		return;
	}

	//write the labels
	if (newMode == "journey") {
		stations.writeLabels();
	}
	else {
		stations.writeLabels(tastes);
	}

	makeSelectOptions(newMode);

	//last thing, swap the options around
	if (!firstGo) {
		//clear everything back to before
		lines.changeColour();
		stations.changeColour();

		//swap which button is disabled
		var journeyButton = document.getElementById("journeyButton");
		journeyButton.disabled = !journeyButton.disabled;
		
		var mealButton = document.getElementById("mealButton");
		mealButton.disabled = !mealButton.disabled;
	}
}

function makeSelectOptions(newMode) {
	//can only cope with the two valid options
	if ((newMode != "journey") && (newMode != "meal")) {
		return;
	}

	var selectors = [document.getElementById("fromSelect"), document.getElementById("toSelect"), document.getElementById("viaSelect")];
	var sortOrder = [];

	//make a list of all the unique label values, each with an array of the relevant station ids
	for (var i = 0; i < stations.length; i++) {
		var thisStation = stations[i];
		if (!thisStation.virtual) {
			//ignore virtual, and look up in the dictionary if relevant
			if (newMode == "meal") {
				labelText = tastes[thisStation.name];
				if (typeof labelText == "undefined") {
					continue; //will show non-dictionary items if they're on a route, but can't search for them as a goal/destination
				}
			}
			else {
				labelText = thisStation.name;
			}

			//with food, there are some duplicates -> so use arrays and pick your way through later
			var found = false
			for (var j = 0; j < sortOrder.length; j++) {
				if (sortOrder[j][0] == labelText) {
					sortOrder[j][1].push(thisStation.id);
					found = true;
					break;
				}
			}
			if (!found) {
				sortOrder.push([labelText, [thisStation.id]]);
			}
		}
	}

	//sort it into alphabetical order
	sortOrder.sort(function compare(a, b) {
		if (a[0] < b[0]) {
			return -1;
		}
		if (a[0] > b[0]) {
			return 1;
		}
		return 0;
	});

	for (var j = 0; j < selectors.length; j++) {
		//remove the old options
		while (selectors[j].options.length) {
			selectors[j].options.remove(0);
		}

		//add a special blank option for the via select
		if (j == (selectors.length - 1)) {
			var newOption = document.createElement("option");
			selectors[j].add(newOption)
		}

		//add the new options
		for (var i = 0; i < sortOrder.length; i++) {
			var newOption = document.createElement("option");
			newOption.value = sortOrder[i][1];
			newOption.text = sortOrder[i][0];
			selectors[j].add(newOption);
		}
	}
}

//plot a path from the drop down menus
function plotPath() {
	//need to convert input back to ints, since option elements give you strings for some reason
	var fromSelect = document.getElementById("fromSelect");
	var fromValue = fromSelect.options[fromSelect.selectedIndex].value.split(",");
	for (var i = 0; i < fromValue.length; i++) {
		fromValue[i] = parseInt(fromValue[i]);
	}

	var toSelect = document.getElementById("toSelect");
	var toValue = toSelect.options[toSelect.selectedIndex].value.split(",");
	for (var i = 0; i < toValue.length; i++) {
		toValue[i] = parseInt(toValue[i]);
	}

	var viaSelect = document.getElementById("viaSelect");
	var viaValue = viaSelect.options[viaSelect.selectedIndex].value.split(",");
	if ((viaValue.length == 1) && (viaValue[0] == "")) {
		viaValue = null;
	}
	else {
		for (var i = 0; i < viaValue.length; i++) {
			viaValue[i] = parseInt(viaValue[i]);
		}
	}

	//check up what to do if more than one option
	var methodSelect = document.getElementById("methodSelect");
	var methodValue = parseInt(methodSelect.options[methodSelect.selectedIndex].value);

	//draw and highlight. easy!
	choosePath(methodValue, fromValue, toValue, viaValue).highlight();
}