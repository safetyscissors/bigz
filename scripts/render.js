define(function(){
    let dom;
    let ctx;
    const colors = ['blue','green','red','yellow','blue','green','red','yellow','blue','green','red','yellow','blue','green','red','yellow'];
    const hexColors = ['#4285F4','#34A853','#EA4335','#FBBC05','#4285F4','#34A853','#EA4335','#FBBC05','#4285F4','#34A853','#EA4335','#FBBC05'];
    let canvasSize = {
        w: window.innerWidth,
        h: window.innerHeight
    };
    function init(target) {
        dom = target;
        ctx = target.getContext("2d");
    }
    function tick() {

    }
    function draw(game, playerId) {
        if (!game || !game.hands) return;
        ctx.clearRect(0, 0, dom.width, dom.height);
        drawTurn(game.turn, game.hands);
        drawMyHand(game.myHand);
        drawHandsBar(game.hands);
        drawDeck(game.deck, game.pile, game.hands.length, game.turn);
        drawFeed(game.feed);
        drawMessage(game.message);
    }

    function drawMessage(msg) {
        if (!msg) return;
        let center = ctx.canvas.width/2;
        let bottom = ctx.canvas.height - 240;
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillStyle = 'black';
        ctx.fillText(msg, center, bottom);
    }

    function drawFeed(feed) {
        if (!feed) return;
        for (let i = 0; i < feed.length; i++) {
            let action = feed[i];
            ctx.font = "12px Arial";
            ctx.textAlign = "right";
            ctx.fillStyle = 'black';
            // parse card
            if (action.indexOf('||')>0){
                let drawCard = action.split('||');

                ctx.fillText(drawCard[0], ctx.canvas.width - 20 - (18 * Number(drawCard[1])), 20 + (feed.length-i) * 32);
                for (let j = 0; j < Number(drawCard[1]); j++) {
                    ctx.textAlign = "center";
                    ctx.strokeStyle = 'grey';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(ctx.canvas.width - 32 - (18 * j), 8 + (feed.length-i) * 32, 14, 16);

                    ctx.fillText(getText(drawCard[2]), ctx.canvas.width - 25 - (18 * j), 20 + (feed.length-i) * 32);
                }
            } else {
                ctx.fillText(action, ctx.canvas.width - 20, 20 + (feed.length - i) * 32);
            }
        }
    }

    function getText(val) {
        if (val == '0') return '💣';
        if (val == '2') return '✨';
        if (val == '7') return '≤7';
        if (val == '3') return '*';
        return val;
    }

    function drawMyHand(myHand) {
        if (!myHand) return;
        // get hand
        for (let i = 0; i < 3; i++) {
            if (myHand.down[i]) {
                let card = document.getElementById(`${colors[myHand.position]}Card`);
                ctx.drawImage(card, myHand.down[i].x, myHand.down[i].y - myHand.down[i].hovered, myHand.down[i].w, myHand.down[i].h);
            }
            if (myHand.up[i]) {
                let card = document.getElementById(`${colors[myHand.position]}2Card`);
                ctx.drawImage(card, myHand.up[i].x, myHand.up[i].y - myHand.up[i].hovered, myHand.up[i].w, myHand.up[i].h);
                ctx.font = "44px Arial";
                ctx.textAlign = "center";
                ctx.fillStyle = 'black';
                ctx.fillText(getText(myHand.up[i].value), myHand.up[i].x + 36, myHand.up[i].y + 54 - myHand.up[i].hovered);
            }
        }

        for (let i = 0; i < Object.keys(myHand.hand).length; i++) {
            let card = document.getElementById(`${colors[myHand.position]}2Card`);
            ctx.drawImage(card, myHand.hand[i].x, myHand.hand[i].y - myHand.hand[i].hovered, myHand.hand[i].w, myHand.hand[i].h);
            ctx.font = "54px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = 'black';
            ctx.fillText(getText(myHand.hand[i].value), myHand.hand[i].x + 52, myHand.hand[i].y + 68 - myHand.hand[i].hovered );

        }
    }
    function drawTurn(turn, hands) {
        let position = turn % hands.length;
        let cardCount = hands[position].hand.length;
        let extension = (cardCount > 3) ? (cardCount-3) * 14 : 0;
        ctx.beginPath();
        ctx.fillStyle = '#ffe5b4';
        ctx.rect(0, 20 + 74 * position, 200 + extension , 70);
        ctx.fill();
    }
    function drawHandsBar(hands) {
        for (let hand of hands){
            // hand.player.name
            ctx.beginPath();
            ctx.fillStyle = hexColors[hand.player.position];
            ctx.rect(0, 20 + 74  * hand.player.position, 20 + hand.player.name.length * 8 , 20);
            ctx.fill();

            ctx.font = "14px Arial";
            ctx.fillStyle = 'white';
            ctx.textAlign = "left";
            ctx.fillText(hand.player.name, 10, 36 + 74 * hand.player.position);

            for (let i = 0; i < 3; i++) {
                if (hand.down[i]) {
                    let card = document.getElementById(`${colors[hand.player.position]}Card`);
                    ctx.drawImage(card, 10 + 34 * i, 50 + 74 * hand.player.position, 24, 30);

                }
                if (hand.up[i]) {
                    let card = document.getElementById(`${colors[hand.player.position]}2Card`);
                    ctx.drawImage(card, 6 + 34 * i, 46 + 74 * hand.player.position, 24, 30);
                    ctx.font = "14px Arial";
                    ctx.textAlign = "center";
                    ctx.fillStyle = 'black';
                    ctx.fillText(getText(hand.up[i]), 19 + 34 * i, 66 + 74 * hand.player.position);
                }
            }

            for (let i = 0; i < hand.hand.length; i++) {
                let card = document.getElementById(`${colors[hand.player.position]}Card`);
                ctx.drawImage(card, 114 + 14 * i, 46 + 74 * hand.player.position, 30, 40);
            }
        }
    }

    function drawDeck(deck, pile, playerCount, turn) {
        let left = ctx.canvas.width/2;
        let top = ctx.canvas.height/2-140;
        // draw pile marker
        ctx.beginPath();
        ctx.strokeStyle = '#ffe5b4';
        ctx.lineWidth = 10;
        ctx.rect(left, top, 110, 140);
        ctx.stroke();

        let maxj = Math.min(pile.length, 10) - 1;
        for (let j = 0; j <= maxj; j++) {
            let card = document.getElementById(`${colors[(turn-1) % playerCount]}2Card`);
            ctx.drawImage(card, left-j*3, top-j*3, 110, 140);
            ctx.font = "44px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = 'black';
            let text = getText(pile[pile.length-1]);
            // exception for 3
            if (j == maxj && text == '*') {
                let lastValue;
                let k = pile.length-1;
                while(!lastValue && k >= 0) {
                    if (pile[k] != 3) lastValue = pile[k];
                    k--;
                }
                if (!lastValue) {
                    text = '3*';
                } else {
                    text = getText(lastValue) + '*'
                }

            }
            ctx.fillText(text, left+55-j*3, top+70 -j*3);
        }

        for (let i = 0; i < Math.min(deck.length, 10); i++) {
            let card = document.getElementById(`${colors[turn % playerCount]}Card`);
            ctx.drawImage(card, left-140-i*3, top-i*3, 110, 140);
        }

        // show deck size
        if (deck.length > 0) {
            let minDeckOffset = 3 * Math.min(deck.length, 10);
            ctx.beginPath();
            ctx.arc(left - 130 - minDeckOffset, top + 10 - minDeckOffset, 10, 0, 2 * Math.PI);
            ctx.fillStyle = 'red';
            ctx.fill();
            ctx.font = "12px Arial";
            ctx.textAlign = "center";
            ctx.fillStyle = 'white';
            ctx.fillText(deck.length, left - 130 - minDeckOffset, top + 13 - minDeckOffset);
        }

    }

    return {
        init: init,
        resize: function(size, callback) {
            if (ctx.canvas.width == size.w && ctx.canvas.height == size.h) return;
            ctx.canvas.width = size.w;
            ctx.canvas.height = size.h;
            if (callback) callback(ctx);
        },
        tick: tick,
        draw: draw,
        getCtx: function() { return ctx; },
    }
});