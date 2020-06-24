var c = document.getElementById("background");
var ctx = c.getContext("2d");
var cH;
var cW;
var animations = [];

var colorPicker = (function() {
    var colors = ["#FF6138", "#FFBE53", "#2980B9", "#282741"];
    var index = 0;
    function next() {
        index = index++ < colors.length-1 ? index : 0;
        return colors[index];
    }
    return {
        next: next,
    }
})();

function removeAnimation(animation) {
    var index = animations.indexOf(animation);
    if (index > -1) animations.splice(index, 1);
}

function handleEvent(e) {
    var currentColor = colorPicker.next();
    var rippleSize = Math.min(200, (cW * .4));

    var particles = [];
    for (var i=0; i<16; i++) {
        var particle = new Circle({
            x: e.pageX,
            y: e.pageY,
            fill: currentColor,
            r: anime.random(24, 48)
        })
        particles.push(particle);
    }
    var particlesAnimation = anime({
        targets: particles,
        x: function(particle){
            return particle.x + anime.random(rippleSize, -rippleSize);
        },
        y: function(particle){
            return particle.y + anime.random(rippleSize * 1.15, -rippleSize * 1.15);
        },
        r: 0,
        easing: "easeOutExpo",
        duration: anime.random(1000,1300),
        complete: removeAnimation
    });
    animations.push(particlesAnimation);
}

function extend(a, b){
    for(var key in b) {
        if(b.hasOwnProperty(key)) {
            a[key] = b[key];
        }
    }
    return a;
}

var Circle = function(opts) {
    extend(this, opts);
}

Circle.prototype.draw = function() {
    ctx.globalAlpha = this.opacity || 1;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.r, 0, 2 * Math.PI, false);
    if (this.stroke) {
        ctx.strokeStyle = this.stroke.color;
        ctx.lineWidth = this.stroke.width;
        ctx.stroke();
    }
    if (this.fill) {
        ctx.fillStyle = this.fill;
        ctx.fill();
    }
    ctx.closePath();
    ctx.globalAlpha = 1;
}

var animate = anime({
    duration: Infinity,
    update: function() {
        ctx.clearRect(0, 0, cW, cH);
        animations.forEach(function(anim) {
            anim.animatables.forEach(function(animatable) {
                animatable.target.draw();
            });
        });
    }
});

var resizeCanvas = function() {
    cW = window.innerWidth;
    cH = window.innerHeight;
    c.width = cW * devicePixelRatio;
    c.height = cH * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
};

(function init() {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    document.addEventListener("touchstart", handleEvent);
    document.addEventListener("mousedown", handleEvent);
    setTimeout(function() {fakeClick(cW/2 - 100,100)}, 200);
    setTimeout(function() {fakeClick(cW/2 + 100,200)}, 300);
})();

function fakeClick(x, y) {
    var fauxClick = new Event("mousedown");
    fauxClick.pageX = x;
    fauxClick.pageY = y;
    document.dispatchEvent(fauxClick);
}
