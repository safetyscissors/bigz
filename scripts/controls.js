define(function() {
    let ajaxRef;
    let keyDown = {};
    let controlQueue = [];
    let mouse = {x: 0, y: 0, changed: false, clicked: false};

    function setupListeners(ajax, game, players) {
        document.onmousemove = logMousemove;
        document.getElementById('background').onclick = logClick;
        document.getElementById('background').ontap = logClick;
        document.getElementById('forceSkip').onclick = game.forceSkip;
        document.getElementById('forceSkip').ontap = game.forceSkip;
        document.getElementById('debug').onclick = game.debug;
        document.getElementById('debug').ontap = game.debug;
        document.getElementById('endGame').onclick = game.forceEndGame;
        document.getElementById('endGame').ontap = game.forceEndGame;

        document.getElementById('rulesBtn').onclick = function() {
            document.getElementById('rulesSlider').classList.remove('close');
        }
        document.getElementById('rulesBtn').ontap = function() {
            document.getElementById('rulesSlider').classList.remove('close');
        }

        document.getElementById('rulesSlider').onclick = function() {
            document.getElementById('rulesSlider').classList.add('close');
        }
        document.getElementById('rulesSlider').ontap = function() {
            document.getElementById('rulesSlider').classList.add('close');
        }

        document.getElementById('joinGameBtn').onclick = function() {
            window.location = '?id=' + document.getElementById('joinGameId').value;
        };
        document.getElementById('joinGameBtn').ontap = function() {
            window.location = '?id=' + document.getElementById('joinGameId').value;
        };


        function createGameClick() {
            ajax.post('server/postGame.php', new URLSearchParams([['updateTime', Date.now()]]), function(data) {
                const gameData = JSON.parse(data);
                if (gameData && gameData.length > 0) {
                    window.location = '?id=' + gameData[0];
                }else {
                    alert('uhoh. wait a few seconds and try again')
                }
            });
        }
        document.getElementById('createGameBtn').onclick = createGameClick;
        document.getElementById('createGameBtn').ontap = createGameClick;

        document.getElementById('createPlayerBtn').onclick = function() {
            players.joinGame(document.getElementById('playerName').value, game.getId());
        };
        document.getElementById('createPlayerBtn').ontap = function() {
            players.joinGame(document.getElementById('playerName').value, game.getId());
        };
        document.getElementById('startGameBtn').onclick = function() {
            players.setPlayerOrder(game.getId());
        };
        document.getElementById('startGameBtn').ontap = function() {
            players.setPlayerOrder(game.getId());
        };
    }
    function scale(e) {
        let action;
        if (e.deltaY < 0) {
            action = 'ZOOMIN'
        } else {
            action = 'ZOOMOUT'
        }
        if (controlQueue.indexOf(action) > -1) return;
        controlQueue.push(action);
    }

    function logMousemove(e) {
        if (mouse.clicked) return;
        mouse.x = (e.clientX || e.pageX) - e.target.offsetLeft;
        mouse.y = (e.clientY || e.pageY) - e.target.offsetTop;
        mouse.changed = true;
    }

    function logClick(e) {
        mouse.x = (e.clientX || e.pageX) - e.target.offsetLeft;
        mouse.y = (e.clientY || e.pageY) - e.target.offsetTop;
        mouse.clicked = true;
        mouse.changed = true;
    }

    function tick() {
        if (!mouse.changed) return;
        // document.getElementById('debug1').innerHTML =`${mouse.x}, ${mouse.y}`;
    }

    function latchKeyDown(e) {
        keyDown[e.code] = true;
    }

    function latchKeyUp(e) {
        keyDown[e.code] = false;
    }

    function getQueue() {
        let action = '';
        if (keyDown['KeyA'] || keyDown['ArrowLeft']) {
            controlQueue.push('LEFT');
        }
        if (keyDown['KeyD'] || keyDown['ArrowRight']) {
            controlQueue.push('RIGHT');
        }
        if (keyDown['KeyW'] || keyDown['ArrowUp']) {
            controlQueue.push('UP');
        }
        if (keyDown['KeyS'] || keyDown['ArrowDown']) {
            controlQueue.push('DOWN');
        }
        if (keyDown['KeyE']) {
            controlQueue.push('ROTATECW');
        }
        if (keyDown['KeyQ']) {
            controlQueue.push('ROTATECCW');
        }
        if (keyDown['KeyJ']) {
            controlQueue.push('RESET');
        }
        if (keyDown['Digit1']) {
            controlQueue.push('HORIZONTAL');
        }
        if (keyDown['Digit2']) {
            controlQueue.push('VERTICAL');
        }
        return controlQueue;
    }

    return {
        init: setupListeners,
        tick: tick,
        getMouse: function() {return mouse},
        getMouseMoved: function() {return mouse.changed},
        getQueue: function() {return getQueue()},
        resetQueue: function() {controlQueue = []; mouse.changed = false; mouse.clicked = false;}
    }
});