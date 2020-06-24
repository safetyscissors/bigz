(function () {
    init();
})();

function init() {
    require([
        'scripts/configs.js',
        'scripts/states.js',
        'scripts/players.js',
        'scripts/game.js',
        'scripts/ajax.js',
        'scripts/controls.js',
        'scripts/render.js',
    ], function (configs, states, players, game, ajax, controls, render) {

        players.init(ajax);
        window.onresize = configs.updateSize;
        controls.init(ajax, game, players);
        render.init(document.getElementById('boardCanvas'));
        render.resize(configs.canvasSize);
        game.init(ajax, render.getCtx());

        // game loop
        setInterval(function () {
            tick(game, players, render, controls);
            draw(players, render, configs, game);
        }, 1000 / configs.fps);
    });
}

function tick(game, players, render, controls) {
    controls.tick();
    game.loadGameData(players.joinExistingPlayer); // attempt to restart polling
    render.tick();

    // left menu. joined game lobby
    if (game.joinedEvent()) {
        document.getElementById('lobbySlider').classList.remove('close');
        document.getElementById('menuWrapper').classList.remove('disabled');
        document.getElementById('game').classList.add('close');
        document.getElementById('background').style.zIndex = 1;
        players.joinExistingPlayer(game.getId());
    }
    // created a player profile
    else if (players.joinedEvent()) {
        document.getElementById('lobbySlider').classList.remove('close');
        document.getElementById('menuWrapper').classList.remove('disabled');
        document.getElementById('game').classList.add('close');
        game.setSelfId(players.getId());
        document.getElementById('createPlayer').classList.add('disabled');
        document.getElementById('background').style.zIndex = 1;
    }
    // waiting in lobby
    else if (game.getId() > 0 && game.isLobbyTime()) {
        document.getElementById('lobbySlider').classList.remove('close');
        document.getElementById('game').classList.add('close');
        document.getElementById('background').style.zIndex = 1;
        players.getPlayersData(game.getId());
        if (players.readyEvent()) {
            game.createGame(players.getPlayers());
        }
    }
    // game started event
    else if (game.startedEvent()) {
        document.getElementById('lobbySlider').classList.add('close');
        document.getElementById('game').classList.remove('close');
        document.getElementById('menuWrapper').classList.add('disabled');
        document.getElementById('background').style.zIndex = 5;
    }
    // get ready
    else if (game.isNotReady()) {
        document.getElementById('lobbySlider').classList.add('close');
        document.getElementById('game').classList.remove('close');
        document.getElementById('menuWrapper').classList.add('disabled');
        document.getElementById('background').style.zIndex = 5;
        game.handSwap(controls.getMouse());
    }
    // in game
    else if (game.everyoneReady() && !game.isLobbyTime() && !game.isEnded()) {
        document.getElementById('lobbySlider').classList.add('close');
        document.getElementById('game').classList.remove('close');
        document.getElementById('menuWrapper').classList.add('disabled');
        document.getElementById('background').style.zIndex = 5;
        if (game.gameUpdated()) {
            players.setPlayersFromGameData(game.getHands());
        }
        if (controls.getMouseMoved() && game.isTurn()) {
            game.tick(controls.getMouse());
        }
    }
    else if (game.isEnded()) {
        if (game.messageClicked(controls.getMouse())) {
            game.reset()
        }
    }
    controls.resetQueue();
}

function draw(players, render, configs, game) {
    render.resize(configs.canvasSize, game.updateCtx);

    render.draw(game.getGame(), players.getId());
    players.displayLobbyPlayers(document.getElementById('playersList'));
}
