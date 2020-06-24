<?php
/*
    getPlayers.php?id=0
*/
require 'db.php';
$pdoDB = new DB();
$response = $pdoDB->createGame($_SERVER['REQUEST_TIME_FLOAT']*1000);
if (DEBUG) var_dump($response);
echo json_encode($response);
?>
