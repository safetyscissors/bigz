<?php
session_write_close();
/*
    getPlayers.php?id=0
*/
require 'db.php';

set_time_limit(30); // Set the appropriate time limit

if (!isset($_GET['id'])) {
    echo '[]';
    return;
}

$pdoDB = new DB();

for ($i = 0; $i < 30; $i++) {
  if (count($pdoDB->getLastPlayerUpdate($_GET['id'], $_GET['t'])) > 0) {
    $response = $pdoDB->getPlayers($_GET['id'], $_GET['t']);
    if (DEBUG) var_dump($response);
    echo "[".($_SERVER['REQUEST_TIME_FLOAT']*1000).",".json_encode($response)."]";
    break;
  }
  sleep(1);
}



?>
