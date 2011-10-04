/* CONFIG READER AND WRITER */

var prefsFile;
var prefsStream;
var prefsData;

function readConfig() {

    prefsFile = air.File.applicationStorageDirectory;
	prefsFile = prefsFile.resolvePath("config.json"); 
	serversFile = air.File.applicationStorageDirectory;
	serversFile = prefsFile.resolvePath("servers.json"); 
	prefsStream = new air.FileStream();
	
	if (prefsFile.exists) {
		prefsStream.open(prefsFile, air.FileMode.READ);
		processPrefData();
	} else {
		createDummie();
	}
}

function processPrefData() { // GETTING DATA FROM CONFIG
	prefsData = prefsStream.readUTFBytes(prefsStream.bytesAvailable);
	prefsStream.close();
	
	var confData = JSON.parse(prefsData);
	userSearchHistory = confData.history;
	
}

function createDummie() { // CREATING EMPTY CONFIG
	prefsData =   '{' + 
						'"history":[]'+
					'}';
	writePrefData();
}
			
function writePrefData() { // WRITING DATA TO CONFIG
	stream = new air.FileStream();
	stream.open(prefsFile, air.FileMode.WRITE);
	stream.writeUTFBytes(prefsData);
	stream.close();
}

/* SAVING USER CREDENTIALS */

function saveCredentials() {
	
	//collecting user search history
	var history = '';
	for(var i=0; i<userSearchHistory.length; i++) {
		history = history +'"'+ userSearchHistory[i]+'"';
		if(i<userSearchHistory.length-1) {
			history = history + ',';
		}
	}
	
	prefsData =   '{' + 
						'"history":['+history+']'+
					'}';
	writePrefData();
}

/* END SAVING USER CREDENTIALS */
