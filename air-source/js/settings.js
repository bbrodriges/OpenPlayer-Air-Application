    /* ROTATING SEARCH HISTORY */
	function rotateSearchHistory(query) {
		userSearchHistory.splice(9,1);
		for(var i=userSearchHistory.length-1; i>=0; i--) {
			userSearchHistory[i+1] = userSearchHistory[i];
		}
		userSearchHistory[0] = query;
		saveCredentials();
	}
	/* END ROTATING SEARCH HISTORY */
	
	function unblockAll() {
		$('#noSearchMessage').css('display', 'block').html('Сервер найден: '+serverURL+'<br>Плеер активирован.');
		$('#searchField').removeClass('disabled').attr('disabled', false);
		$('#searchRequest').removeClass('disabled').attr('disabled', false);
		$('#settings li a').removeClass('disabled').addClass('enabled').attr('disabled', false);
	}

$(document).ready(function(){

/* VIEW SEARCH RESULTS */

	$('#settings .search-results a').click(function(){
		$('#settings .search-results').css('display', 'none');
		if(allSongs) {
			$('#songsHolder').html( allSongs );
		} else {
			$('#songsHolder').html('');
			$('#noSearchMessage').css('display', 'block').text('Тут появятся поисковые результаты');
		}
	});

/* END VIEW SEARCH RESULTS */

/* REPEAT MODE */

	$('#settings .repeat-mode a.enabled').live('click', function(){
		if(repeatMode == 'sequential') {
			repeatMode = 'song';
			getNextSong(thisSong);
			$('#settings .repeat-mode a').text('Повтор песни');
		} else if(repeatMode == 'song') {
			repeatMode = 'sequential';
			getNextSong(thisSong);
			$('#settings .repeat-mode a').text('Играть последовательно');
		}
	});

/* END REPEAT MODE */

/* SEARCH HISTORY */

	$('#settings .search-history a').live('click', function(){
		allSongs = $('#songsHolder').html();
		if(userSearchHistory.length > 0){
			$('#noSearchMessage').css('display', 'none');
			$('#songsHolder').html('');
			$('#songsHolder').append( $('<p class="back-to-search-results">&larr; <a href="#">К результатам поиска</a></p>') );
			$.each(userSearchHistory, function(index, value){
				$('#songsHolder').append( $('<p class="search-history">'+value+'</p>') );
			});
			$('#songsHolder p.search-history:even').addClass('even');
		} else {
			$('#noSearchMessage').css('display', 'block').html('История поиска пуста');
		}
	});
	
	$('p.search-history').live('click', function(){
		$('#searchField').val( $(this).text() );
		fromSearchHistory = true;
		startSearch( $(this).text() );
	});
	
	$('p.back-to-search-results').live('click', function(){
		if(allSongs) {
			$('#songsHolder').html(allSongs);
		} else {
			$('#songsHolder').html('');
			$('#noSearchMessage').css('display', 'block').html('Тут появятся поисковые результаты');
		}
	});

/* END SEARCH HISTORY */

});