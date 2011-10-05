<?php

namespace App;

use \Lib\Request,
	\Manager\User;

class Api extends \Lib\Base\App {

    public function init() {
    	if(Request::get('method')) {
			switch(Request::get('method')) {
				case 'ping':
					echo '{"result":"enabled"}';
					die;
					break;
					
				case 'search':
					$result = \Lib\AudioParser::search($_GET['query'], 0);
					echo json_encode($result);
					die;
					break;
					
				case 'getsound':
					$url = Request::get('url');
					
					$ch = curl_init($url);
					curl_setopt($ch, CURLOPT_NOBODY, true);
					curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
					curl_setopt($ch, CURLOPT_HEADER, true);
					$data = curl_exec($ch);
					curl_close($ch);
			
					if (preg_match('/Content-Length: (\d+)/', $data, $matches)) {
						$contentLength = (int)$matches[1];
					}
					
					header('Last-Modified:');
					header('ETag:');
					header('Content-Type: audio/mpeg');
					header('Accept-Ranges: bytes');
					header('Content-Length: '.$contentLength);
					
					set_time_limit(0);
					$ch = curl_init($url);
					curl_setopt($ch, CURLOPT_BINARYTRANSFER, 1);
					curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
					$song = curl_exec($ch);
					curl_close($ch);
			        	echo $song;
					die;
					break;
					
				case 'userconfirm':
					$usermanager = new User;
					echo $usermanager->confirm(
						Request::get('login'), Request::get('md5password')
					);
					die;
					break;
					
					die;
					break;
					
				default:
					die;
					break;
			}
    	}
	}

}

?>