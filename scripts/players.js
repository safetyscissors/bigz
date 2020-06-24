define(function(){
    let self = {};
    let ajaxRef = {};
    let players = new Map();
    let playersChanged = false;
    let isPendingPlayerPoll = false;
    let ready = false;
    let lastPlayerPollTime = 1588000000000;

    function init(ajax) {
        ajaxRef = ajax;
        ready = false;
        const queryString = window.location.search;
        let userId;
        if (queryString.indexOf('u=') > 0) {
            userId = queryString.split('&')
                .find(param=>param.includes('u='))
                .split('u=')[1];
            localStorage.setItem('uid', userId);
        }else {
            userId = localStorage.getItem('uid');
        }

        if (userId) {
            self.localId = Number(userId);
        }

    }

    function joinExistingPlayer(gameId) {
        if (self.localId) {
            const params = [[self.localId, null, gameId]];
            ajaxRef.update('server/updatePlayers.php', params, function(data) {
                self.joined = true;
                self.id = Number(self.localId);
            })
        }
    }

    function joinGame(name, gameId) {
        if (self.id) return;
        if (!gameId) return;
        const params = new URLSearchParams([
            ['id', gameId],
            ['name', name],
        ]);
        ajaxRef.post('server/postPlayer.php', params, function (data) {
            if (!data) {
                console.log('timeout');
                return;
            }
            const playerData = JSON.parse(data);
            if (playerData && playerData.length > 0) {
                self.id = Number(playerData[0]);
                self.joined = true;
                localStorage.setItem('uid', self.id);
            }
        })

    }

    function joinedEvent() {
        if (!self.joined) return false;
        delete self.joined;
        return true;
    }

    function getPlayersData(gameId) {
        if (isPendingPlayerPoll) return;
        isPendingPlayerPoll = true;

        let t = lastPlayerPollTime;
        const params = new URLSearchParams([
            ['id', gameId],
            ['t', t]
        ]);
        ajaxRef.get('server/getPlayers.php?' + params, function(data) {
            players = new Map();
            playersChanged = true;
            isPendingPlayerPoll = false;
            if (!data) { console.log('timeout'); return; }
            const responseObj = JSON.parse(data);
            lastPlayerPollTime = responseObj[0];
            const rawPlayers = responseObj[1];
            if (rawPlayers && rawPlayers.length > 0) {
                for(let player of rawPlayers) {
                    players.set(Number(player.id), player);
                }
            }
        })
    }

    function playersReadyEvent() {
        if (!ready) return false;
        ready = false;
        return true;
    }

    function displayLobbyPlayers(dom) {
        if (!playersChanged) return;
        dom.innerHTML = '';
        for(let [id, player] of players) {
            dom.innerHTML += `${player.id} - ${player.name}<br>`;
        }
        playersChanged = false;
    }

    function setPlayerOrder(gameId) {
        const data = [];
        let i = 0;
        for (let [id, name] of players) {
            players.get(id).position = i;
            data.push([id, i++, gameId, Date.now()]);
        }
        ajaxRef.update('server/updatePlayers.php', data, function(data) {
            ready = true;
        })
    }

    function setPlayersFromGameData(hands) {
        if (!hands) return;
        for (let hand of hands) {
            players.set(hand.player.id, hand.player);
        }
    }


    return {
        init: init,
        joinGame: joinGame,
        joinedEvent: joinedEvent,
        getPlayersData: getPlayersData,
        joinExistingPlayer: joinExistingPlayer,
        displayLobbyPlayers: displayLobbyPlayers,
        setPlayerOrder: setPlayerOrder,
        getPlayers: function() {return players},
        setPlayersFromGameData: setPlayersFromGameData,
        readyEvent: playersReadyEvent,
        getId: function() {return self.id},
        getPosition: function() {return players.get(self.id).position},
        resetPlayerPolltime: function() {lastPlayerPollTime = 1588000000000;}
    }
});