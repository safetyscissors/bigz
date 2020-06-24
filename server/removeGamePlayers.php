<?php
/*
    getPlayers.php?id=0
*/
require 'db.php';
if (!isset($_POST['gameId'])) {
    echo '[]';
    return;
}

$pdoDB = new DB();
$response = $pdoDB->removePlayersFrom($_POST['gameId'], $_SERVER['REQUEST_TIME_FLOAT']*1000);
if (DEBUG) var_dump($response);
echo json_encode($response);
?>

