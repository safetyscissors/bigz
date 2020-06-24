<?php
require 'config.php';
class DB {
  protected $pdo = null;
  protected $stmt = null;
  function __construct() {
    try {
      $this->pdo = new PDO(
        "mysql:host=" . DB_HOST . ";charset=" . DB_CHARSET . ";dbname=" . DB_NAME,
        DB_USER, DB_PASSWORD, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC, PDO::ATTR_EMULATE_PREPARES => false]
      );
      return true;
    } catch (Exception $ex) {
      print_r($ex);
      die();
    }
  }
  function __destruct() {
    if ($this->stmt !== null) { $this->stmt = null; }
    if ($this->pdo !== null) { $this->pdo = null; }
  }
  function runSimpleInsert($sql) {
  if (DEBUG) echo $sql.'<br>';
      $this->stmt = $this->pdo->prepare($sql);
      $this->stmt->execute();
      $result = [$this->pdo->lastInsertId()];
      return $result;

  }
  function runSimpleQuery($sql) {
  if (DEBUG) echo $sql.'<br>';
    $this->stmt = $this->pdo->prepare($sql);
    $this->stmt->execute();
    $result = $this->stmt->fetchAll();
    return $result;
  }
  function getGames() {
    return $this->runSimpleQuery("SELECT gameId FROM `games`");
  }
  function getGame($id, $updateTime) {
    return $this->runSimpleQuery("SELECT gameData FROM `games` WHERE gameId = " . $id . " AND updateTimeMillis >= \"" . $updateTime . "\"");
  }
  function createGame($updateTime) {
    return $this->runSimpleInsert("INSERT INTO `games`(`gameData`,`updateTimeMillis`) VALUES (\"[]\", ".$updateTime.")");
  }
  function updateGameBoard($minifiedData, $updateTime) {
    $this->runSimpleQuery("UPDATE `games` SET gameData = \"".$minifiedData[1]."\", updateTimeMillis = ".$updateTime." WHERE gameId = ".$minifiedData[0].";");
    return [];
  }
  function getPlayers($gameId) {
    return $this->runSimpleQuery("SELECT id, name FROM `players` WHERE gameId = " . $gameId);
  }
  function createPlayer($name, $gameId, $updateTime) {
    return $this->runSimpleInsert("INSERT INTO `players`(`name`, `gameId`, `updateTimeMillis`) VALUES (\"" . $name . "\"," . $gameId . ", ".$updateTime.")");
  }
  function getLastPlayerUpdate($gameId, $updateTime) {
    return $this->runSimpleQuery("SELECT id FROM `players` WHERE gameId = " . $gameId . " AND updateTimeMillis >= \"" . $updateTime . "\"");
  }
  function removePlayersFrom($gameId, $updateTime) {
    $this->runSimpleQuery("UPDATE `players` SET gameId = NULL, updateTimeMillis = ".$updateTime." WHERE gameId = ".$gameId.";");
  }
  function updatePlayerPosition($playerIdAndPosition, $updateTime) {
    $dataRows = [];
    $ids = [];
    foreach ($playerIdAndPosition as $player) {
      if (!is_null($player[1])) {
        $this->runSimpleQuery("UPDATE `players` SET position = ".$player[1].", gameId = ".$player[2].", updateTimeMillis = ".$updateTime." WHERE id = ".$player[0].";");
      } else {
        $this->runSimpleQuery("UPDATE `players` SET gameId = ".$player[2].", updateTimeMillis = ".$updateTime." WHERE id = ".$player[0].";");
      }
    }
    return [];
  }
}
?>