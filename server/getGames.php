
<?php
session_write_close();
/*
    server/getGames.php returns all game ids
    server/getGames.php?id=0&t='YYYY-MM-DD HH:MM:SS' returns data for 1 game
*/
require 'db.php';

set_time_limit(30); // Set the appropriate time limit

$pdoDB = new DB();

// get list is not polling.
if (!isset($_GET['id'])) {
    $response = $pdoDB->getGames();
    echo json_encode($response);
    if (DEBUG) var_dump($response);
    return;
}

// get specific id is polling.
for ($i = 0; $i < 30; $i++) {
    $response = $pdoDB->getGame($_GET['id'], $_GET['t']);
    if (count($response) > 0) {
        echo "[".($_SERVER['REQUEST_TIME_FLOAT']*1000).",".json_encode($response)."]";
        if (DEBUG) var_dump($response);
        break;
    }
    sleep(1);
}
?>
