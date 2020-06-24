<?php
/*
    getPlayers.php?id=0
*/
require 'db.php';

$data = json_decode(file_get_contents('php://input'), true);
$pdoDB = new DB();
$response = $pdoDB->updateGameBoard($data, $_SERVER['REQUEST_TIME_FLOAT']*1000);
if (DEBUG) var_dump($response);
echo json_encode($response);

?>
