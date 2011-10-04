/* checking network status */

    function handlerConnectionEventComplete(e) { // Connected
    	if( $('#noSearchMessage').hasClass('no-internet') ) {
			$('#noSearchMessage').removeClass('no-internet');
			if(allSongs) {
				$('#noSearchMessage').css('display', 'none');
				$('#songsHolder').html( allSongs );
			} else {
				$('#noSearchMessage').css('display', 'block').text('Тут появятся поисковые результаты');
			}
		}
		
		if(serverChecked && serverURL) {
			$('#searchField').removeClass('disabled').attr('disabled', false);
			$('#searchRequest').removeClass('disabled').attr('disabled', false);
			$('#settings li a').removeClass('disabled').addClass('enabled').attr('disabled', false);
		}
		
		if(!serverChecked) {
			checkForServer(); // CHECKING FOR LIVING SERVER
		}
		
		if(!updatesChecked) {
			checkForUpdate(updateURL+updateDescriptor); // CHECKING FOR UPDATES
		}
	}
	
    function handlerConnectionIoError(e) { // Not connected
		$('#songsHolder p').remove();
		$('#noSearchMessage').addClass('no-internet').css('display', 'block').html('<img src="../icons/wifi.png"><br>Невозможно подключиться к серверу.<br>Проверьте соединение с Интернетом и <a href="#" id="internet-refresh">попробуйте снова</a>.');
		nextSong = null;
		$('#searchField').addClass('disabled').attr('disabled', true).val('');
		$('#searchRequest').addClass('disabled').attr('disabled', true);
		$('#settings li a').addClass('disabled').attr('disabled', true);
	}
	
    function checkInternetConnection() {
        var r = new air.URLRequest('http://google.com/');
        r.useCache = false; // force a new fetch
        var l = new air.URLLoader();
        l.addEventListener(air.Event.COMPLETE, handlerConnectionEventComplete);
        l.addEventListener(air.IOErrorEvent.IO_ERROR, handlerConnectionIoError);
        l.load(r); // execute request
    }
	
	function checkForServer(){ // Searching live server from list on github
		var request = new air.URLRequest('https://raw.github.com/bbrodriges/OpenPlayer-Air-Application/master/update/servers.json'); 
		var loader = new air.URLLoader(); 
		loader.addEventListener(air.Event.COMPLETE, checkForServerComplete); 
		loader.load(request);
	}
	
		function checkForServerComplete(event){ // Server list successfully loaded, processing
			serverChecked = true;
			var serverFounded = false;
			var ServersList = jQuery.parseJSON( event.target.data );
			for(var i=0; i<ServersList.server.length; i++) {
				if(!serverFounded) {
					$.ajax({
						url: ServersList.server[i],
						data: {
							app:    'api',
							method: 'ping'
						},
						dataType:   'json',
						type: 'get',
						async: false,
						
						success: function(heartbeat) {
							if(heartbeat) {
								serverURL = ServersList.server[i];
								serverFounded = true;
								unblockAll();
							}
						}
						
					}); 
				} else {
					break;
				}
			}
			if(!serverFounded) {
				$('#noSearchMessage').css('display', 'block').html('Не найдено ни одного сервера. Попробуйте запустить программу позже.');
			}
		}
	
	$('#internet-refresh').live('click', function(){
		checkInternetConnection();
	});