<?php
/*
    getPlayers.php?id=0
*/
require 'db.php';

if (!isset($_POST['name']) && !isset($_POST['id'])) {
    echo '[]';
    return;
}

$pdoDB = new DB();
$response = $pdoDB->createPlayer($_POST['name'], $_POST['id'], $_SERVER['REQUEST_TIME_FLOAT']*1000);
if (DEBUG) var_dump($response);
echo json_encode($response);
?>
