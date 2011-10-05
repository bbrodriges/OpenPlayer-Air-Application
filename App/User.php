<?php
namespace Manager;

class User extends \Lib\Base\Manager {
	const SESS_NS = 'op';
	const SESS_KEY = 'user';

	public static function getUser() {
		if ( !isset($_SESSION[ User::SESS_NS ][ User::SESS_KEY ]) ) {
			return false;
		}
		
		return $_SESSION[ User::SESS_NS ][ User::SESS_KEY ];
	}
    
    public function getHistory() {
        if ( !$this->getUser() ) return array();
        
        return \Lib\Helper::getArr($_SESSION[ User::SESS_NS ][ User::SESS_KEY ]->settings, 'history');
    }

    public function updateSettings( $settings ) {
        $user = User::getUser();
		$userId = intval($user->id);
        
        $_SESSION[ User::SESS_NS ][ User::SESS_KEY ]->settings = $settings;
        
        $serializedSettings = json_encode($settings);
		
		$res = $this->pdo->prepare("UPDATE user SET settings = ? WHERE id = ?");
		$res->execute(array($serializedSettings, $userId));
        
        return $res;
    }


    public function updatePLSettings ( $plId, $status ) {
        $user = User::getUser();
		$plId = intval($plId);
		$status = 1*$status;

		$settings = $user->settings;
		$settings['pl'][$plId] = $status;
		
		$res = $this->updateSettings($settings);
		return $res;
	}

	public static function getUserOption( $key ) {
		$user = self::getUser();
		return isset( $user->$key )
			? $user->$key
			: null;
	}

	public static function isLoggedIn() {
		return (boolean) self::getUser();
	}
	
	public function login ( $login, $password = null ) {
		$login = strip_tags($login);
		
		$loginQ = $this->pdo->quote($login);
		if ($password) {
			$password = strip_tags($password);
			$passwordMd5 = $this->pdo->quote(md5($password));
		}
		
		if ( !$login ) return false;
		
		$q = "SELECT * FROM user WHERE login = {$loginQ}";
		
		if ( $password ) {
			$q .= " AND password = {$passwordMd5} ";
		} else {
			$q .= " AND password IS NULL";
		}
		$res = $this->pdo->query($q);
		$user = $res->fetchObject();
		
		if ( !$user ) {
			$q = "INSERT INTO user VALUES (null, {$loginQ}, ". ( $password ? $passwordMd5 : "null" ) . ", null, null)";
			$res = $this->pdo->exec($q);
			
			if ($res) {
				return $this->login( $login, $password );
			} else {
				return false;
			}
		}
		
		return $this->store($user);
	}
	
	public function store( $user ) {
		$this->generateSessionKey( $user );
		
		unset( $user->password );
		unset( $user->sessionKey );
		$user->settings = (array) json_decode($user->settings);
		@$user->settings['pl'] = (array) $user->settings['pl'];
		
        $_SESSION[ User::SESS_NS ]['lang'] = $user->settings['lang'];
        
		return $_SESSION[ User::SESS_NS ][ User::SESS_KEY ] = $user;
	}
	
	private function generateSessionKey( $user ) {
		$userId = intval($user->id);
		
		$key = md5( microtime(true) . $user->id . 'secret' );
		
		setcookie('sessionKey', $key, time()+(60*60*60*24*14) , '/');
		
		$q = "UPDATE user SET sessionKey = '{$key}' WHERE id = {$userId}";
		$this->pdo->exec($q);
	}


	public function logout() {
        $lang = $_SESSION[ User::SESS_NS ][ 'lang' ];
		
        unset($_SESSION[ User::SESS_NS ]);
		setcookie('sessionKey', null, time() , '/');
        
        $_SESSION[ User::SESS_NS ][ 'lang' ] = $lang;
	}
	
	public function autologin() {
		if ( !User::isLoggedIn() && isset($_COOKIE[ 'sessionKey' ]) ) {
			$q = "SELECT * FROM user WHERE sessionKey = ?";
			$res = $this->pdo->prepare($q);
			$res->execute(array($_COOKIE['sessionKey']));
			
			$user = $res->fetchObject();
			
			if ( $user ) {
				self::store( $user );
			}
		}
	}
    
    public function logHistory( $q ) {
        $user = User::getUser();
        if ( !$user ) return false;
        
        $settings = $user->settings;
        
        if ( count( \Lib\Helper::getArr($settings, 'history') ) > \Lib\Config::getInstance()->getOption('app', 'historyLength') - 1 ) {
            array_shift($settings['history']);
        }
        
        $settings['history'][] = $q;
        
		$res = $this->updateSettings( $settings );
    }
	
	public function confirm ( $login, $password ) { // API confirm method
		if ( !$login ) return false;
	
		$login = strip_tags($login);
		$loginQ = $this->pdo->quote($login);
		
		if ($password) {
			$password = strip_tags($password);
			$passwordMd5 = $this->pdo->quote($password);
		}
		
		$q = "SELECT login, password FROM user WHERE login = {$loginQ}";
		
		if ( $password ) {
			$q .= " AND password = {$passwordMd5} ";
		} else {
			$q .= " AND password IS NULL";
		}
		
		$res = $this->pdo->query($q);
		$user = $res->fetchObject();
		if(is_object($user) && $user->login == $login && $user->password == $password) {
			return true;
		} else {
			return false;
		}
	}
        
}