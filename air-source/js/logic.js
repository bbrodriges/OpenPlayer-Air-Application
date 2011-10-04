    var nextSong; // next song id
	var thisSong; // currents song id
	var allSongs; // Search results
	var mp3; // mp3 URL
	var sampleMp3; // mp3 object
	var soundChannel = null; //sound channel object
	var songProgressTimer; // setInterval object
	var pausePosition = 0; //initial song start position
	var soundVolume = 1; //Initial sound volume
	var appSettings; //Application settings from conf.json
	var updatesChecked; //updates trigger
	var repeatMode = 'sequential'; // "sequential", "song" ("playlist" in future)
	var userSearchHistory; //Contains user search history
	var fromSearchHistory = false; //Check for query instanse
	var serverChecked = false; //Server checker trigger
	var serverURL; // OpenPlayer server url, e.g. 'http://openplayer.com/' (including trailing slash)
	
	function htmlspecialchars_decode(string) {
		string = string.replace(new RegExp("&quot;",'g'), '"');
		string = string.replace(new RegExp("&amp;",'g'), '&');
		string = string.replace(new RegExp("&#39;",'g'), '\'');
		return string;
	}
	
	function getNextSong(id) {
		if(repeatMode == 'sequential') {
			nextSong = $('.wq-song#'+id).next().attr('id');
		} else if(repeatMode == 'song') {
			nextSong = id;
		}
	}
	
	function cleanSoundChannel() {
		sampleMp3.removeEventListener(air.Event.OPEN, soundOpen); //Song stream opened
		sampleMp3.removeEventListener(air.ProgressEvent.PROGRESS, soundProgress); //Song loading
		sampleMp3.removeEventListener(air.Event.COMPLETE, soundLoaded); //Song load compleate
		sampleMp3.removeEventListener(air.IOErrorEvent.IO_ERROR, soundError); //Error handler 
		soundChannel.stop();
		clearInterval(songProgressTimer);
		$('#seek').css('width', '0%');
	}
	
	function playMP3(url) {
		
		if (soundChannel != null) {
			cleanSoundChannel();
		}
		
		$('#settings .repeat-mode a').removeClass('enabled').addClass('disabled');
		
		$('#progress').animate({
				width: '300px'
			}, 'slow', function(){
				$('#loaded').text('').addClass('loading');
				$('#loaded').css('display', 'block');
				$('#loaded').animate({
					opacity: '1'
				}, 'slow');
			});
		
		var req = new air.URLRequest(url);
        /* Start downloading song */
        sampleMp3 = new air.Sound(req);
		
		/* Adding event listeners for actual states*/
		sampleMp3.addEventListener(air.Event.OPEN, soundOpen); //Song stream opened
		sampleMp3.addEventListener(air.ProgressEvent.PROGRESS, soundProgress); //Song loading
		sampleMp3.addEventListener(air.Event.COMPLETE, soundLoaded); //Song load compleate
		sampleMp3.addEventListener(air.IOErrorEvent.IO_ERROR, soundError); //Error handler 
		
		/* Start playing the song */
        soundChannel = sampleMp3.play();
	}
	
		function soundOpen(event) {
			/* Progress monitoring */
			$('#loaded').removeClass('loading');
			$('#play').removeClass('play').addClass('pause');
			$('#settings .repeat-mode a').removeClass('disabled').addClass('enabled');
			songProgressTimer = setInterval(monitorProgress, 500);
		}
		
		function soundProgress(event) {
			var loadedPct = Math.round(100 * (event.bytesLoaded / event.bytesTotal)); 
			$('#progress #seekload').css('width', loadedPct+'%');
		}
		
		function soundLoaded(event) {
		}
		
		function soundError(event) {
			air.trace("The sound could not be loaded: " + event.text);
		}
		
		function monitorProgress(event) {
			var estimatedLength = Math.ceil(sampleMp3.length / (sampleMp3.bytesLoaded / sampleMp3.bytesTotal)); 
			var playbackPercent = Math.round(100 * (soundChannel.position / estimatedLength));
			
			if( soundChannel.position < sampleMp3.length ) {
				$('#loaded').removeClass('loading');
				/* PRETTY TIMER*/
				var soundMinutes = Math.floor((soundChannel.position % (1000*60*60)) / (1000*60));
				var soundSeconds = Math.floor(((soundChannel.position % (1000*60*60)) % (1000*60)) / 1000);
				if(soundSeconds > 0 && soundSeconds < 10) { soundSeconds = '0'+soundSeconds; }
				if(soundSeconds == 0 || soundSeconds == 60) { soundSeconds = '00'; }
				$('#loaded').text(soundMinutes+':'+soundSeconds);
				/* END PRETTY TIMER*/
			} else {
				$('#loaded').text('').addClass('loading');
			}
			
			$('#seek').css('width', playbackPercent+'%');
			if(playbackPercent == 100) { // end of song reached
				endOfSong();
			}
		}
		
		function setVolume(volume) {
			soundChannel.soundTransform = new air.SoundTransform(volume, 0);
		}
		
		function pause() {
			pausePosition = soundChannel.position;
			soundChannel.stop();
		}
		
		function playAfterPause() {
			soundChannel = sampleMp3.play(pausePosition);
		}
		
		function endOfSong() {
			$('.wq-song').removeClass('current');
			$('.wq-play').removeClass('pause').addClass('play');
			$('#loaded').text('');
			clearInterval(songProgressTimer);
			if(typeof(nextSong) != 'undefined') { // checking for next song exsistance
				mp3 = serverURL+'?app=api&method=getsound&url='+$('.'+nextSong+'.wq-play').data('url');
				thisSong = $('.wq-play.'+nextSong).data('id');
				getNextSong(thisSong);
				
				$('.wq-song#'+thisSong).addClass('current');
				$('.wq-play').removeClass('pause').addClass('play');
				$('.wq-play.'+thisSong).removeClass('play').addClass('pause');
				$('#progress #title').text( $('.wq-play.'+thisSong).data('artist')+' - '+$('.wq-play.'+thisSong).data('name') );
				
				$('#player').animate({
					bottom: '10px'
				}, 1000, function() {
					playMP3(mp3);
				});
			} else {
				$('#play').removeClass('pause').addClass('play');
				$('#player').animate({
					bottom: '-60px'
				}, 1000);
			}
		}
	
	function startSearch(query) {
	
		$('#songsHolder').html('');
		$('#noSearchMessage').css('display', 'block').html('<img src="../icons/loader.gif"><br>&nbsp;&nbsp;Ищем...');
		$('#settings .search-results').css('display', 'none');
		$('#settings .view-playlists').css('display', 'block');
		$('#settings li.view-playlists a').removeClass('enabled').addClass('disabled');
		
		if(!fromSearchHistory) {
			rotateSearchHistory(query);
		}
		fromSearchHistory = false;
		
		$.ajax({
            url: serverURL,
            data: {
                app:    'api',
				method: 'search',
                query:  query
            },
			dataType:   'json',
            type: 'get',
			
            success: function(songs) {
				$('#noSearchMessage').css('display', 'none');
				if(songs == ''){
					$('#noSearchMessage').css('display', 'block').text('Ничего не найдено. Попробуйте что-то менее точное.');
				} else {
					$.each(songs, function(id, song) {
						var artist = htmlspecialchars_decode(song.artist);
						var name = htmlspecialchars_decode(song.name);
						$('#songsHolder').append( $('<div class="wq-song" id="'+song.id+'" data-duration="'+ song.duration +'"><p class="wq-play play '+song.id+'" data-url="'+song.url+'" data-id="'+song.id+'" data-artist="'+artist+'" data-name="'+name+'">&nbsp;&nbsp;&nbsp;</p> <p class="wq-title"><a class="wq-song-artist" data-target="'+artist+'">'+artist+'</a> - <a class="wq-song-name" data-target="'+name+'">'+name+'</a> ('+ song.duration +')</p></div>') );
					});
					$(".wq-song:odd").addClass('odd');
					allSongs = $('#songsHolder').html();
					$('#settings li.view-playlists a').removeClass('disabled').addClass('enabled');
				}
            },
			error: function() {
				$('#songsHolder').html('');
				$('#noSearchMessage').css('display', 'block').text('Что-то пошло не так. Попробуйте позже.');
			}
			
        });
	}

$(document).ready(function(){

	/* CHECKING FOR INTERNET CONNCTION */
	checkInternetConnection();
	air.NativeApplication.nativeApplication.addEventListener(air.Event.NETWORK_CHANGE, checkInternetConnection);
	
	/* READING CONFIG.XML */
	readConfig();

	/* SETTING INITIAL FOCUS */
	$('#searchField').focus();
	
	$('#searchRequest').bind('click', function(){
		var query = $('#searchField').val();
		startSearch(query);
	});
	
	
	/* TARGET SEARCH*/
	
	$('.wq-song-artist').live('click', function(){
		var query = 'artist:' + $(this).data('target');
		$('#searchField').val(query);
		startSearch(query);
	});
	
	$('.wq-song-name').live('click', function(){
		var query = 'song:' + $(this).data('target');
		$('#searchField').val(query);
		startSearch(query);
	});
	
	/* END TARGET SEARCH*/
	
	/* START PLAYING */
	
	$('.wq-play.play').live('click', function(){
		mp3 = serverURL+'?app=api&method=getsound&url='+$(this).data('url');
		
		thisSong = $(this).data('id');
		getNextSong(thisSong);
		
		$('.wq-song').removeClass('current');
		$('.wq-song#'+$(this).data('id')).addClass('current');
		$('.wq-play').removeClass('pause').addClass('play');
		$(this).removeClass('play').addClass('pause');
		$('#progress #title').text( $(this).data('artist')+' - '+$(this).data('name') );
		
		$('#player').animate({
			bottom: '10px'
		}, 1000, function() {
			playMP3(mp3);
		});
	});
	
	/* END START PLAYING */
	
	/* SEARCH ON ENTER HIT */
	
	$("#searchField").keypress(function(event) {
		if ( event.which == 13 ) {
			var query = $('#searchField').val();
			startSearch(query);
		}
	});
	
	/* END SEARCH ON ENTER HIT */
	
	/* PLAYER CONTROLS */
	
		$('#play').click(function(){ // play button
			if( $(this).hasClass('play') ) {
				$(this).removeClass('play').addClass('pause');
				playAfterPause();
			} else {
				$(this).removeClass('pause').addClass('play');
				pause();
			}
		});
		
		$('#volume').click(function(){ // volume button
			if( $(this).hasClass('level100') ) {
				$(this).removeClass('level100').addClass('level60');
				setVolume(0.6);
			} else if( $(this).hasClass('level60') ) {
				$(this).removeClass('level60').addClass('level30');
				setVolume(0.3);
			} else if( $(this).hasClass('level30') ) {
				$(this).removeClass('level30').addClass('level0');
				setVolume(0);
			} else {
				$(this).removeClass('level0').addClass('level100');
				setVolume(1);
			}
		});
		
		$('#progress').click(function(e){ // progress rewind
			var x = e.pageX - $(this).offset().left;
			var percent = Math.round(x / $('#progress').width() * 100);
			var totalTime = $('.wq-song#'+thisSong).data('duration').split(':');
			var milliseconds = (totalTime[0]*60 + parseInt(totalTime[1])) * 1000;
			var newPos = milliseconds/100*percent;
			soundChannel.stop();
			soundChannel = sampleMp3.play(newPos);
		});
	
	/* END PLAYER CONTROLS */
	
	/* SONG LINK POPUP */
	
	/* $('.wq-link').live('click', function(){
		var link = 'http://winamq.com/?id='+$(this).data('id')+'&t='+$(this).data('translate');
		$('#track-link').val(link);
		$('#link-popup').css('display', 'block');
		$('#link-popup').animate({
			top: '0'
		}, 500);
	}); */
	
	/* $('#link-popup .button.close').click(function(){
		$('#link-popup').animate({
			top: '-170px'
		}, 500, function(){
			$('#link-popup').css('display', 'none');
		});
	}); */
	
	/* END COPY SONG LINK TO CLIPBOARD */
	
});