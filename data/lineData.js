//Journey/Meal Planner
//Tom Curtis, October 2013
//In no way affiliated with TfL
//Creative Commons Attribution-NonCommercial-ShareAlike 3.0 Unported 

//standard tube thickness
var tubeThickness = 6;

//define the lines first
var River = new tubeLine(0, "River Thames", "#87CEEB", "", 12);
var Bakerloo = new tubeLine(1, "Bakerloo line", "#AF6010", "", tubeThickness);
var Victoria = new tubeLine(2, "Victoria Line", "#009CDB", "", tubeThickness);
var Jubilee = new tubeLine(3, "Jubilee Line", "#939BA0", "", tubeThickness);
var DLR = new tubeLine(4, "Docklands Light Railway", "#00A99D", "", tubeThickness);
var Northern = new tubeLine(5, "Northern Line", "#231F20", "", tubeThickness);
var Central = new tubeLine(6, "Central line", "#EE3224", "", tubeThickness); 
var Piccadilly = new tubeLine(7, "Piccadilly line", "#1C3F94", "", tubeThickness);
var Waterloo = new tubeLine(8, "Waterloo and City Line", "#7DD1B8", "", tubeThickness);
var Hammersmith = new tubeLine(9, "Hammersmith and City line", "#F285A0", "", tubeThickness);
var Circle = new tubeLine(10, "Circle Line", "#FFD200", "", tubeThickness);
var District = new tubeLine(11, "District Line", "#00843F", "", tubeThickness);
var Overground = new tubeLine(12, "London Overground", "#F7931E", "", tubeThickness);
var Metropolitan = new tubeLine(13, "Metropolitan line", "#96005E", "", tubeThickness);
var Emirates = new tubeLine(14, "Emirates Air Line", "#FF0000", "", tubeThickness);