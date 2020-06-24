<?php
    require './config.php';
    require './vendor/autoload.php';

  $options = array(
    'cluster' => 'us3',
    'useTLS' => false
  );
  $pusher = new Pusher\Pusher(
    $key,
    $secret,
    $appId,
    $options
  );

  echo $key;

  // $pusher->trigger('my-channel', $_POST['type'], $_POST['data']);
?>