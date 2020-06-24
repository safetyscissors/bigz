define(function(){
    let game = {};
    let ctxRef;
    let ajaxRef;
    let started = false;
    let lastStartedState = false;
    let ended = false;
    let isPendingGamePoll = false;
    let selfId;
    let hovered;
    let selected;
    let lastGamePollTime = 1588000000000;
    let lastGameRequestTime = lastGamePollTime;
    let repeatedGameRequests = 0;

    function init(ajax, ctx) {
        started = false;
        ajaxRef = ajax;
        ctxRef = ctx;
        isPendingGamePoll = false;
        const queryString = window.location.search;
        if (queryString.indexOf('id') > 0) {
            game.attemptedId = queryString.split('&')
                .find(param=>param.includes('id='))
                .split('id=')[1];
        }
    }

    function loadGameData(loadGameData) {
        if (isPendingGamePoll) return;
        isPendingGamePoll = true;
        if (!game.attemptedId && !game.id) return;
        let id = game.id || game.attemptedId;
        let t = lastGamePollTime;

        let params = new URLSearchParams([
            ['id', id],
            ['t', t],
        ]);
        let wasOldGame = game.won;
        ajaxRef.get('server/getGames.php?' + params.toString(), function (data, error) {
            if (!data || (data!="[]" && data.length < 5) || error) {
                failedRequestRateLimiting();
                return;
            }

            isPendingGamePoll = false;
            let responseObj;
            try {
                responseObj = JSON.parse(data);
            }catch(e) {
                failedRequestRateLimiting(e);
                return;
            }

            lastGamePollTime = responseObj[0];
            lastGameRequestTime = lastGamePollTime;
            repeatedGameRequests = 0;

            const gameData = responseObj[1];
            if (gameData && gameData.length > 0) {
                if (!game.id) game.id = Number(game.attemptedId);
                if (gameData.length > 0 && gameData[0]["gameData"]) {
                    if (started && gameData[0]["gameData"] == "[]") {
                        backToLobby(loadGameData);
                        return
                    }
                    // gamedata still a string at this point
                    if (gameData[0]["gameData"].length > 2) {
                        unminify(gameData[0]["gameData"]);
                        positionHand();
                        started = true;
                    }
                }
                game.updated = true;

                if (game && game.hands) {
                    if (isTurn()) {
                        let audio = new Audio('audio/ding.ogg');
                        audio.volume = .05;
                        audio.play();
                        game.message = 'your turn'; // reset game messages every turn change.
                    } else {
                        let currentPlayer = game.hands[game.turn % game.hands.length].player.name || '';
                        game.message = `${currentPlayer}'s turn`; // reset game messages every turn change.
                    }
                }
                if (game.won) {
                    game.message = game.won;
                    ended = true;
                }
                if (wasOldGame && !game.won) {
                    console.log('restart detected');
                    started = true;
                    lastStartedState = true;
                    ended = false;
                    selected = undefined;
                    hovered = undefined;
                }
            }
        })
    }

    function failedRequestRateLimiting(error) {
        isPendingGamePoll = true;
        console.log('empty response', repeatedGameRequests, error);
        if (lastGameRequestTime === lastGamePollTime) {
            if (repeatedGameRequests > 15) {
                alert('lost game connection. please restart');
                return;
            }
            repeatedGameRequests++;
            // wait 1+ seconds before re-requesting
            setTimeout(function() {
                isPendingGamePoll = false;
            }, 1000 + 200 * repeatedGameRequests);
        } else {
            lastGameRequestTime = lastGamePollTime;
            repeatedGameRequests = 0;
        }

        return;
    }

    function startedEvent() {
        if (!started || lastStartedState) return false;
        lastStartedState = started;
        return true;
    }

    function joinedEvent() {
        if (game.id && game.attemptedId) {
            delete game.attemptedId;
            return true;
        }
        return false;
    }

    function generateDeck(players) {
        const suit = 'A234567890JQK';
        const decks = [1,1,1,1,2,2,2,2,3,3,3,3,4,4,4,4,5,5,5,5];
        let deckStr = '';
        for (let i = 0; i < 4 * decks[players.size]; ++i) {
            deckStr += suit;
        }
        let deck = deckStr.split('');

        for(var i = deck.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    }

    function generateHands(players, deck) {
        let hands = [];
        for(let [id, player] of players) {
            hands[player.position] = {
                player: {id: Number(player.id), name: player.name, position: player.position},
                up: [],
                down: [],
                hand: [],
                ready: 0
            };
            for (let i = 0; i < 3; ++i) {
                hands[player.position].up.push(deck.pop());
                hands[player.position].down.push(deck.pop());
                hands[player.position].hand.push(deck.pop());
            }
        }
        return hands;
    }

    function unminify(dataStr) {
        let data = JSON.parse(dataStr.replace(/\'/g, '"'));
        let hands = [];
        if (!data || data.length == 0) return;
        for (let row of data[0]) {
            hands[row[2]] = {
                player: {id: row[0], name: row[1], position: row[2]},
                up: [],
                down: [],
                hand: row[5].split(''),
                ready: Number(row[6]) || 0
            }
            let ups = row[3].split('');
            let downs = row[4].split('');
            for (let i = 0; i < 3; i++) {
                if (ups[i] != '-') hands[row[2]].up[i] = ups[i];
                if (downs[i] != '-') hands[row[2]].down[i] = downs[i];
            }

        }
        game.hands = hands;
        game.deck = data[1].split('');
        game.pile = data[2].split('');
        game.turn = data[3];
        game.won = data[4];
        game.feed = data[5];
    }

    function minify(target) {
        let hands = target.hands.map(hand => {
            return [
                hand.player.id, hand.player.name, hand.player.position,
                [hand.up[0] || '-', hand.up[1] || '-', hand.up[2] || '-'].join(''),
                [hand.down[0] || '-', hand.down[1] || '-', hand.down[2] || '-'].join(''),
                hand.hand.join(''),
                hand.ready
            ];
        });
        let deck = target.deck.join('');
        let pile = target.pile.join('');
        return JSON.stringify([hands, deck, pile, target.turn, game.won, game.feed]).replace(/\"/g, "'");
    }

    function createGame(players) {
        // generate gameboard
        game.pile = [];
        game.deck = generateDeck(players);
        game.hands = generateHands(players, game.deck);
        game.turn = 0;
        game.won = '';
        let data = [game.id, minify(game), Date.now()];
        ajaxRef.update('server/updateGame.php', data, function(data) {})
    }

    function gameUpdated() {
        if (!game.updated) return false;
        delete game.updated;
        return true;
    }

    function isTurn() {
        if (!game.myHand) return false;
        return ((game.turn % game.hands.length) == game.myHand.i);
    }
    function tick(mouse) {
        if (!mouse.changed) return;
        cardHovered(mouse);
        if (mouse.clicked) cardClicked();
        if (mouse.clicked) deckClicked(mouse);
        checkEndGame();
    }

    function checkEndGame() {
        if (game.myHand.hand.length == 0 &&
            !game.myHand.up[0] && !game.myHand.up[1] && !game.myHand.up[2] &&
            !game.myHand.down[0] && !game.myHand.down[1] && !game.myHand.down[2]) {
            game.won = `${game.hands[game.myHand.i].player.name} wins! restart?`;
            addToFeed(`won!`);
            updateGameData();
        }
    }

    function drawCards() {
        while(game.deck.length > 0 && game.myHand.hand.length < 3) {
            game.myHand.hand.push({
                value: game.deck.pop(),
            });
        }
    }

    function swapCardClick() {
        if (!hovered) {
            resetSelectedCards()
            return;
        }
        if (!selected) selected = [];
        // nothing selected yet
        if (selected.length == 0) {
            hovered.selected = true;
            selected.push(hovered)
            return;
        }

        let hasSelectedUp = selected.find(card=>card.type=='up');
        let hasSelectedHand = selected.find(card=>card.type=='hand');
        // if one is selected
        if (hasSelectedUp && !hasSelectedHand) {
            if (hovered.type == 'hand') {
                // swap
                let swapVal = hasSelectedUp.value;
                game.myHand.up[hasSelectedUp.i].value = hovered.value;
                game.myHand.hand[hovered.i].value = swapVal;
                resetSelectedCards();
            } else {
                resetSelectedCards();
                return;
            }
        }
        if (hasSelectedHand && !hasSelectedUp) {
            if (hovered.type == 'up') {
                // swap
                let swapVal = hasSelectedHand.value;
                game.myHand.hand[hasSelectedHand.i].value = hovered.value;
                game.myHand.up[hovered.i].value = swapVal;
                resetSelectedCards();
            } else {
                resetSelectedCards();
                return;
            }
        }
        updateGameData();
    }

    function resetSelectedCards() {
        if (selected && selected.length > 0) {
            for (let card of selected) {
                card.selected = false;
                card.hovered = 0;
            }
        }
        selected = [];
    }
    function cardClicked() {
        if (!hovered) {
            resetSelectedCards()
            return;
        }
        // check any move is possible.
        if (!hasAnyValidOption(game.myHand, game.pile[game.pile.length-1])) {
            game.message = 'No cards can be played. Click the pile to take cards.';
            return;
        }

        if (!selected) selected = [];
        if (!hovered.selected && hasMultiples(hovered)) {
            selectCards();
        } else if (!hovered.selected && selected.length > 0) {
            if (hovered.value === selected[0].value) return;
        } else {
            if (!hovered.selected) {
                hovered.selected = true;
                selected.push(hovered);
            }
            playCards();
        }
    }
    function hasMultiples(target) {
        let dupes = game.myHand.hand.filter(card => card.value == target.value);
        return dupes.length > 1
    }
    function selectCards() {
        if (!selected) selected = [];
        if (selected.length == 0 || hovered.value == selected[0].value) {
            hovered.selected = true;
            let hoverHeight = (game.myHand.hand.length > 6)? 60 : 20;
            hovered.hovered = hoverHeight;
            selected.push(hovered);
        } else {
            game.message = 'Only multiple cards of the same value can be selected';
        }

        if (selected.length > 1) {
            game.message = 'click here to put cards back';
        } else if(selected.length == 1) {
            game.message = 'click again to place or select multiple of the same card';
        } else {
            game.message = '';
        }
    }
    function playCards() {
        if (!selected || selected.length == 0) return;
         // add to pile
        let isABomb = selected[0].value == 0 || false;
         if (canAddCardToPile(selected[0].value, game.pile[game.pile.length-1])) {
             selected = selected.sort((a, b) => {return a.i < b.i});
             for (let card of selected) {
                 if (card.value == 0) {
                     game.pile = [];
                 } else {
                     game.pile.push(card.value);
                 }

                 // remove from source
                 if (card.type == 'hand') {
                     game.myHand.hand[card.i] = undefined;
                 } else {
                     game.myHand[card.type][card.i] = undefined;
                 }
             }
             addToFeed(`-> ||${selected.length}||${selected[0].value}`);

             if (game.pile.length >= 4) {
                 let i = game.pile.length-1;
                 if ((game.pile[i] == game.pile[i-1]) &&
                     (game.pile[i-1] == game.pile[i-2]) &&
                     (game.pile[i-2] == game.pile[i-3]) &&
                     (game.pile[i-3] == game.pile[i])) {
                     addToFeed(`bombed with ||4||${game.pile[i]}`);
                     game.pile = [];
                     isABomb = true;
                     console.log('bombed')
                 }
             }
             console.log(selected);
             game.myHand.hand = game.myHand.hand.filter( x => x != undefined);
             resetSelectedCards();
             hovered = undefined;
             drawCards();
             if (!isABomb) {
                 game.turn++;
             }
             updateGameData();
         } else if(hovered.type == 'down') {
             game.pile.push(hovered.value);
             cantAddMessage(hovered.value, game.pile[game.pile.length-1]);
             addToFeed(`-> ||1||${hovered.value}`);
             game.myHand['down'][hovered.i] = undefined;
             game.myHand.hand = game.pile.map(value =>{ return {value: value}});
             setTimeout(function() {
                 addToFeed(`took ${game.pile.length} cards`);
                 resetSelectedCards();
                 hovered = undefined;
                 game.pile = [];
                 game.turn++;
                 updateGameData();
             }, 500);
         } else {
             cantAddMessage(hovered.value, game.pile[game.pile.length-1]);
             resetSelectedCards();
             hovered = undefined;
         }
    }

    function cantAddMessage(a,b) {
        if (b == 7) {
            game.message = `${a} must be less than 7`;
            return;
        }
        if (b == 3) {
            game.message = `${a} must be greater than shown`;
            return;
        }
        game.message = `Cant put ${a} on top of ${b}`;
    }

    function hasAnyValidOption(myHand, topValue) {
        let anyOption = false;
        for (let card of myHand.hand) {
            anyOption = anyOption || canAddCardToPile(card.value, topValue);
        }
        if (myHand.hand.length == 0) {
            for (let i = 0; i < 3; i++) {
                anyOption = anyOption || (myHand.up[i] && canAddCardToPile(myHand.up[i].value, topValue));
            }
        }
        if (!myHand.up[0] && !myHand.up[1] && !myHand.up[2] && myHand.hand.length === 0) {
            return true;
        }
        return anyOption;
    }

    function canAddCardToPile(value, topValue) {
        if (!topValue) return true;
        const numberMap = {'2': 2, '3': 3, '4': 4, '5':5, '6':6, '7':7, '8':8, '9':9, '0':10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14};
        let n = numberMap[value];
        let topN = numberMap[topValue];

        if (topN == 3) {
            let lastValue;
            let k = game.pile.length-1;
            while(!lastValue && k >= 0) {
                if (game.pile[k] != 3) lastValue = game.pile[k];
                k--;
            }
            if (lastValue) {
                topN = numberMap[lastValue];
            }
        }

        if (topN == 2) return true;
        if (n == 2 || n == 3 || n == 10) return true;
        if (topN == 7 && n > 7) return false;
        if (topN == 7 && n <= 7) return true;
        if (n >= topN) return true;
        return false;
    }

    function updateGameData() {
        // sync myHand to gameData
        game.hands[game.myHand.i].up = game.myHand.up.map(card => (card) ? card.value : undefined);
        game.hands[game.myHand.i].down = game.myHand.down.map(card => (card) ? card.value : undefined);
        game.hands[game.myHand.i].hand = game.myHand.hand.map(card => card.value);

        // force gameData update
        let data = [game.id, minify(game), Date.now()];
        ajaxRef.update('server/updateGame.php', data, function(data) {});
    }

    function addToFeed(action) {
        if (!game.hands || !game.myHand) return;
        if (!game.feed) {
            game.feed = [];
        }
        let name = game.hands[game.myHand.i].player.name;
        game.feed.push(`${name} ${action}`);
        while (game.feed.length > 10) {
            game.feed.shift();
        }
    }

    function deckClicked(mouse) {
        if (!game.pile || game.pile.length == 0 || !ctxRef) return;

        let left = ctxRef.canvas.width/2;
        let top = ctxRef.canvas.height/2-140;
        // if mouse.
        let height = Math.min(game.pile.length, 10);
        let pile = {x: left-3*height, y: top-3*height, w: 110+3*height, h: 140+3*height, hovered: 0};
        if (inRectangle(pile, mouse)) {
            // check any move is possible.
            // if (hasAnyValidOption(game.myHand, game.pile[game.pile.length-1])) {
            //     game.message = 'A card can be played.'
            //     return;
            // }
            for (let i = 0; i<game.pile.length; i++) {
                game.myHand.hand.push({
                    value: game.pile[i]
                })
            }
            addToFeed(`took ${game.pile.length} cards`);
            game.pile = [];
            game.turn++;
            updateGameData();
        }
    }

    function cardHovered(mouse, allowFaceupHover) {
        if (!game.myHand || !ctxRef) return;
        let allHovered = [];

        // all facedown/faceup. only if no hand cards are present
        if (game.myHand.hand.length === 0 || allowFaceupHover) {
            for (let i = 0; i < 3; i++) {
                // check facedown only if no faceup cards.
                // all facedown first. lower in queue
                if (!game.myHand.up[0] && !game.myHand.up[1] && !game.myHand.up[2]) {
                    if (game.myHand.down[i] && inRectangle(game.myHand.down[i], mouse)) {
                        allHovered.push(game.myHand.down[i]);
                    }
                }
                // all faceup second. higher in queue
                if (inRectangle(game.myHand.up[i], mouse)) {
                    allHovered.push(game.myHand.up[i]);
                }
            }
        }
        // all hand cards.
        for (let card of game.myHand.hand) {
            if (inRectangle(card, mouse)) {
                allHovered.push(card);
            }
        }
        // select top most element
        if (hovered && !hovered.selected) {
            hovered.hovered = 0;
        }
        if (allHovered.length === 0) {
            hovered = undefined;
            return;
        }
        hovered = allHovered.pop();
        let hoverHeight = (game.myHand.hand.length > 6)? 60 : 20;
        hovered.hovered = hoverHeight;
    }
    function inRectangle(card, mouse) {
        if (!card) return false;
        return (
            mouse.x+10 > card.x &&
            mouse.x+10 < card.x + card.w &&
            mouse.y > card.y-card.hovered &&
            mouse.y < card.y+ card.h
        );
    }

    function positionHand() {
        if (!selfId || !game.hands || !ctxRef) return;
        const myHandIndex = game.hands.findIndex(hand => hand.player.id == selfId);
        game.hands[myHandIndex].hand = game.hands[myHandIndex].hand.sort((a,b) => {
            let key = ['0','2','3','4','5','6','7','8','9','J','Q','K','A'];
            return key.indexOf(a) - key.indexOf(b);
        });
        const myHand = game.hands[myHandIndex];
        game.myHand = {i: myHandIndex, up: [], down: [], hand: []};
        game.myHand.position = myHand.player.position;
        let center = ctxRef.canvas.width/2;
        let bottom = ctxRef.canvas.height - 200;
        for (let i = 0; i < 3; i++) {
            if (myHand.down[i]) {
                game.myHand.down[i] = {
                    type: 'down', i: i,
                    x: center - 340 + 80*i,
                    y: bottom,
                    w: 72,
                    h: 96,
                    hovered: 0,
                    value: myHand.down[i],
                }
            }
            if (myHand.up[i]) {
                game.myHand.up[i] = {
                    type: 'up', i: i,
                    x: center - 350 + 80*i,
                    y: bottom - 10,
                    w: 72,
                    h: 96,
                    hovered: 0,
                    value: myHand.up[i],
                };
            }
        }

        let cardCount = myHand.hand.length;
        let spacing = (cardCount > 12) ? 80-(cardCount-12)*2.1 : 80;
        let handOffset = (cardCount > 6) ? (cardCount)/2 * spacing : 0;
        for (let i = 0; i <myHand.hand.length; i++) {
            game.myHand.hand[i] = {
                type: 'hand', i: i,
                x: center - handOffset - 10 + spacing * i,
                y: bottom + 20,
                w: 110,
                h: 140,
                hovered: 0,
                value: myHand.hand[i],
            }
        }
    }

    function messageClicked(mouse) {
        if (!mouse.clicked) return;
        let center = ctxRef.canvas.width/2;
        let bottom = ctxRef.canvas.height - 220;
        let width = game.message.length*14;
        let height = 60;
        let message = {x: center - width/2, y: bottom - height, w: width, h: height, hovered: 0};
        return inRectangle(message, mouse);
    }

    function reset() {
        let players = new Map();
        for (let hand of game.hands) {
            players.set(hand.player.id, hand.player);
        }
        createGame(players);
    }

    function backToLobby(loadGameData) {
        started = false;
        lastStartedState = false;
        loadGameData(game.id);
    }

    function handSwap(mouse) {
        game.message = 'Swap faceup cards with your hand. Click here when ready.';
        if (!mouse.changed) return;
        cardHovered(mouse, true); // allow faceup cards to hover
        if (mouse.clicked) swapCardClick();
        if (messageClicked(mouse)) {
            game.hands[game.myHand.i].ready = 1;
            addToFeed(`is ready`);
            updateGameData();
        }
    }

    function isNotReady() {
        return (game.myHand && !game.hands[game.myHand.i].ready)
    }

    function everyoneReady() {
        if (isNotReady()) return;
        if (!game.hands) return;
        if (game.hands.filter(hand=>!hand.ready).length > 0) {
            game.message = 'Waiting for everyone to get ready.';
            return false;
        }
        return true;
    }

    function forceEndGame() {
        const params = new URLSearchParams([
            ['gameId', game.id],
        ]);
        ajaxRef.update('server/updateGame.php', [game.id, "[]", Date.now()], function(data) {});
        ajaxRef.post('server/removeGamePlayers.php', params, function(){});
    }

    function debug() {
        document.getElementById('debug1').innerHTML = JSON.stringify(selected);
        resetSelectedCards();
    }
    return {
        joinedEvent: joinedEvent,
        init: init,
        tick: tick,
        isTurn: isTurn,
        loadGameData: loadGameData,
        getGame: function() {return game},
        getId: function() {return game.id},
        createGame: createGame,
        gameUpdated: gameUpdated,
        isLobbyTime: function() {return !started},
        started: function() {return started},
        startedEvent: startedEvent,
        getHands: function() {return game.hands},
        setSelfId: function(id) {selfId = id; if (game.hands && game.hands.length > 0) { positionHand() }},
        forceSkip: function() {
            game.turn++;
            addToFeed(`advanced the turn`);
            updateGameData();
        },
        isEnded: function() {return ended},
        messageClicked: messageClicked,
        reset: reset,
        isNotReady: isNotReady,
        everyoneReady:everyoneReady,
        handSwap: handSwap,
        forceEndGame: forceEndGame,
        debug: debug,
        updateCtx: function (ctx) {ctxRef = ctx; positionHand()},
    }
});