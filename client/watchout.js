// start slingin' some d3 here.
var gameOptions = {
  height: 450,
  width: 700,
  nEnemies: 30,
  padding: 20
};

var gameStats = {
  score: 0,
  bestScore:0
};

var axes = {
  x : d3.scale.linear().domain([0, 100]).range([0, gameOptions.width]),
  y : d3.scale.linear().domain([0, 100]).range([0, gameOptions.height])
};

var gameBoard = d3.select('.board').append('svg:svg')
                    .attr('width', gameOptions.width)
                    .attr('height', gameOptions.height);

var updateScore = function(){ 
  d3.select('.current')
  .text(gameStats.score.toString());
};

var updateBestScore = function() {
  if(gameStats.score > gameStats.bestScore) {
    gameStats.bestScore = gameStats.score;
  }
  d3.select('.highscore').text(gameStats.bestScore.toString());
};

var Player = function(gameOptions) {
// path: '../images/spaceship.png'
  this.gameOptions = gameOptions;

  this.path = 'm-7.5,1.62413c0,-5.04095 4.08318,-9.12413 9.12414,-9.12413c5.04096,0 9.70345,5.53145 11.87586,9.12413c-2.02759,2.72372 -6.8349,9.12415 -11.87586,9.12415c-5.04096,0 -9.12414,-4.08318 -9.12414,-9.12415z';
  this.x = gameOptions.width/2;
  this.y = gameOptions.height/2;
  this.angle = 0;
  this.fill = '#ff6600';
  
};

Player.prototype.render = function(to){
  this.el = to.append('svg:path').attr('d', this.path).attr('fill', this.fill);

  this.transform({x: this.gameOptions.width/2, 
                  y: this.gameOptions.height/2});
  this.setupDragging();
  return this;
};

Player.prototype.getX = function(){
  return this.x;
};

Player.prototype.setX = function(value){
  var minX = this.gameOptions.padding;
  var maxX = this.gameOptions.width - this.gameOptions.padding;
  if(value <= minX){
    value = minX;
  }
  if(value >= maxX){
    value = maxX;
  } 
  this.x = value;
};

Player.prototype.getY = function(){
  return this.y;
};

Player.prototype.setY = function(value){
  var minY = this.gameOptions.padding;
  var maxY = this.gameOptions.height - this.gameOptions.padding;
  if(value <= minY){
    value = minY;
  }
  if(value >= maxY){
    value = maxY;
  }
  this.y = value;
};

Player.prototype.transform = function(opts){
  this.angle = opts.angle || this.angle;
  if(opts.x){
    this.setX(opts.x);
  } else {
    this.setX(this.x);
  }
  if(opts.y){
    this.setY(opts.y);
  } else{
    this.setY(this.y);
  }

  this.el.attr('transform', 'rotate(' + this.angle + ','+this.getX() + ',' + this.getY()+') ' +
               'translate('+ this.getX() + ',' + this.getY()+ ')');
};

Player.prototype.moveAbsolute = function(x, y) {
  this.transform( {x: x, y: y});
};

Player.prototype.moveRelative = function(dx, dy) {
  this.transform( { x: this.getX() + dx,
                    y: this.getY() + dy,
                angle: 360 * (Math.atan2(dy/dx)/(Math.PI*2))});
};


// this.el.attr('transform', 'rotate(#{this.angle}, #{this.getX()}, ')

Player.prototype.setupDragging = function() {
  var dragMove = function() {
    this.moveRelative(d3.event.dx, d3.event.dy);
  };
  var drag = d3.behavior.drag().on('drag', dragMove.bind(this));
  this.el.call(drag);
};


var players = [];
players.push( new Player(gameOptions).render(gameBoard));

// players.push( new Player(gameOptions).render(gameBoard) );

var createEnemies = function(){
    return _.range(0, gameOptions.nEnemies).map(
      function(i){
        return {id: i, x:Math.random()*100, y: Math.random()*100};
      });
};

var render = function(enemy_data){

  var enemies = gameBoard.selectAll('circle.enemy').data(enemy_data, function(d){return d.id;} );

  enemies.enter().append('svg:circle')
          .attr('class', 'enemy')
          .attr('cx', function(enemy){return axes.x(enemy.x);})
          .attr('cy', function(enemy){return axes.y(enemy.y);})
          .attr('r', 0);

  enemies.exit().remove();

  var checkCollision = function(enemy, collidedCallback) {
    _.each(players, function(player) {
      var radiusSum = parseFloat(enemy.attr('r')) + player.r;
      var xDiff = parseFloat(enemy.attr('cx')) - player.x;
      var yDiff = parseFloat(enemy.attr('cy')) - player.y;

      var separation = Math.sqrt(Math.pow(xDiff, 2) + Math.pow(yDiff, 2));
      if(separation < radiusSum){
        collidedCallback(player, enemy);
      }
    });
  };

  var onCollision = function(){
    updateBestScore();
    gameStats.score = 0;
    updateScore();
  };


  var tweenWithCollisionDetection = function(endData) {
    var enemy = d3.select(this);
    var startPos = { x: parseFloat(enemy.attr('cx')),
                     y: parseFloat(enemy.attr('cy'))};
    var endPos = {x: axes.x(endData.x),
                  y: axes.y(endData.y)};
    return function(t) {
      checkCollision(enemy, onCollision);
      var enemyNexPos = {x: startPos.x + (endPos.x - startPos.x)*t,
                         y: startPos.y + (endPos.y - startPos.y)*t};
      enemy.attr('cx', enemyNexPos.x).attr('cy', enemyNexPos.y);
    };
  };

enemies
  .transition()
    .duration(500)
    .attr('r', 10)
  .transition()
    .duration(2000)
    .tween('custom', tweenWithCollisionDetection);

};




var play = function() {

  var gameTurn = function() {
    var newEnemyPositions = createEnemies();
    render(newEnemyPositions);
  };

  var increaseScore = function() {
    gameStats.score++;
    updateScore();
  };

  gameTurn();
  setInterval(gameTurn, 2000);
  setInterval(increaseScore, 50);



};


play();










