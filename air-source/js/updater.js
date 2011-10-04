var updateURL = 'https://raw.github.com/bbrodriges/OpenPlayer-Air-Application/master/update/';
var updateDescriptor = 'update.json';
var updateFile = 'OpenPlayer.air';
var currentVersion;
var latestVersion;
var top;
var UpdateFile = air.File.applicationStorageDirectory.resolvePath("updates/OpenPlayer.air");
var UpdateFileData;
var updateStream;
var urlUpdateStream;

function getVersion() {
    var xmlString = air.NativeApplication.nativeApplication.applicationDescriptor; 
	var appXml = new DOMParser(); 
	var xmlobject = appXml.parseFromString(xmlString, "text/xml"); 
	var root = xmlobject.getElementsByTagName('application')[0]; 
	var appVersion = root.getElementsByTagName('versionNumber')[0].firstChild.data;
	$('#version').text('v.'+appVersion);
	return appVersion.toString();
};

function checkForUpdate(url) {
	if(UpdateFile.exists) {
		UpdateFile.deleteFile();
	}
	var request = new air.URLRequest(url); 
	var loader = new air.URLLoader(); 
	loader.addEventListener(air.Event.COMPLETE, checkForUpdateComplete); 
	loader.load(request);
}

function checkForUpdateComplete(event) {  
	updatesChecked = true;
	latestVersion = jQuery.parseJSON( event.target.data );
	currentVersion = getVersion();
	
	if(latestVersion.version > currentVersion) {
	
		$('#update-available b.version').text(latestVersion.version);
		$('#update-available p.notes').html(latestVersion.notes);
		top = $('#update-available').height()-( $('#update-available').height() * 2 )-30;
		$('#update-available').css('top', top);
		$('#update-available').css('display', 'block');
		$('#update-available').animate({
			top: '0'
		}, 'slow');
		
		$('#update-available p.update').bind('click', function(){
		
			createUpdateDummie();
			
			// Initiate download
			urlUpdateStream = new air.URLStream();
			urlUpdateStream.load( new air.URLRequest(updateURL+updateFile) );
			 
			// Add event listeners
			urlUpdateStream.addEventListener(air.Event.COMPLETE, finishWriteUpdateFile);
			
		});
		$('#update-available p.cancel').bind('click', function(){
			$('#update-available').animate({
				top: top
			}, 'slow', function(){
				$('#update-available').css('display', 'none');
			});
		});
		
	}
}
 
// Called when download completes
function finishWriteUpdateFile() {
	// Write to file
	if(urlUpdateStream.bytesAvailable > 0) {
	
		var dataBuffer = new air.ByteArray();
		urlUpdateStream.readBytes(dataBuffer, 0, urlUpdateStream.bytesAvailable);
		updateStream.writeBytes(dataBuffer, 0, dataBuffer.length);
		updateStream.close();
		
		$('#update-available h2').text('Загрузка обновления');
		$('#update-available .notes').remove();
		$('#update-available .text').html('Обновление было <b>успешно загружено</b>. Нажмите "Установить", чтобы завершить процесс обновления.');
		$('#update-available .progress').html('<p class="button proceed">Установить</p>');
		$('#update-available .proceed').live('click', function(){	
			var updater = new air.Updater();
			updater.update(UpdateFile, latestVersion.version.toString());
		});
	}
}

function createUpdateDummie() { // CREATING EMPTY UPDATE FILE
	updateStream = new air.FileStream();
	updateStream.open(UpdateFile, air.FileMode.WRITE);
}