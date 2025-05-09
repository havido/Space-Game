class EventEmitter {
  constructor() {
    this.listeners = {};
  }
  on(message, listener) {
    if (!this.listeners[message]) {
      this.listeners[message] = [];
    }
    this.listeners[message].push(listener);
  }
  emit(message, payload = null) {
    if (this.listeners[message]) {
      this.listeners[message].forEach((l) => l(message, payload));
    }
  }
  clear() {
    this.listeners = {};
  }
}

function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = path
    img.onload = () => {
      resolve(img)
    }
  })
}

class GameObject {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.dead = false;
    this.type = "";
    this.width = 0;
    this.height = 0;
    this.img = undefined;
  }
  draw(ctx) {
    ctx.drawImage(this.img, this.x, this.y, this.width, this.height);
  }
  rectFromGameObject() {
    return {
      left: this.x,
      top: this.y,
      right: this.width + this.x,
      bottom: this.height + this.y,
    };
  }
}

class Hero extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.type = "Hero";
    this.width = 99;
    this.height = 75;
    this.speed = { x:0, y:0};
    this.cooldown = 0; // init to 0
    this.life = 3;
    this.points = 0;
  }
  fire() {
    gameObjects.push(new Laser(this.x + 45, this.y - 10));
    this.cooldown = 500;

    let id = setInterval(() => {
      if (this.cooldown > 0) {
        this.cooldown -= 100;
      } else {
          clearInterval(id);
      }
    }, 200);
  }
  canFire() {
    return this.cooldown === 0;
  }
  decrementLife() {
    this.life--;
    if (this.life <= 0) {
      this.dead = true;
    }
  }
  incrementPoints() {
    this.points += 100;
  }
}

function isHeroDead() {
  return hero.life <= 0;
}

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.type = "Enemy";
    this.width = 98;
    this.height = 50;
    // this.speed = 2;
    let id = setInterval(() => {
      if (this.y < canvas.height - this.height) {
        this.y += 5;
      } else {
        console.log('Stopped at', this.y);
        clearInterval(id);
      }
    }, 300);
  }
}

function isEnemiesDead() {
  const enemies = gameObjects.filter((go) => go.type === "Enemy" && !go.dead);
  return enemies.length === 0;
}

class Laser extends GameObject {
  constructor(x, y) {
    super(x,y);
    this.type = 'Laser';
    this.width = 9; 
    this.height = 33;
    this.img = laserImg;
    let id = setInterval(() => {
      if (this.y > 0) {
        this.y -= 15;
      } else {
        this.dead = true;
        clearInterval(id);
      }
    }, 100)
  }
}

function intersectRect(r1, r2) {
  return !(
    r2.left > r1.right ||
    r2.right < r1.left ||
    r2.top > r1.bottom ||
    r2.bottom < r1.top
  );
}

function updateGameObjects() {
  const enemies = gameObjects.filter(go => go.type === 'Enemy');
  const lasers = gameObjects.filter((go) => go.type === "Laser");
  // laser hit something
  lasers.forEach((l) => {
    enemies.forEach((m) => {
      if (intersectRect(l.rectFromGameObject(), m.rectFromGameObject())) {
        eventEmitter.emit(Messages.COLLISION_ENEMY_LASER, {
          first: l,
          second: m,
        });
      }
    });  
  });

  // enemy hit hero
  enemies.forEach((enemy) => {
    if (intersectRect(hero.rectFromGameObject(), enemy.rectFromGameObject())) {
      eventEmitter.emit(Messages.COLLISION_ENEMY_HERO, { enemy });
    }
  });

  gameObjects = gameObjects.filter(go => !go.dead);
}  

const Messages = {
  KEY_EVENT_UP: 'KEY_EVENT_UP',
  KEY_EVENT_DOWN: 'KEY_EVENT_DOWN',
  KEY_EVENT_LEFT: 'KEY_EVENT_LEFT',
  KEY_EVENT_RIGHT: 'KEY_EVENT_RIGHT',
  KEY_EVENT_SPACE: 'KEY_EVENT_SPACE',
  KEY_EVENT_ENTER: 'KEY_EVENT_ENTER',
  COLLISION_ENEMY_LASER: 'COLLISION_ENEMY_LASER',
  COLLISION_ENEMY_HERO: 'COLLISION_ENEMY_HERO',
  GAME_END_WIN: 'GAME_END_WIN',
  GAME_END_LOSS: 'GAME_END_LOSS',
};

let heroImg, enemyImg, laserImg, lifeImg, canvas, ctx, gameObjects = [], hero, eventEmitter = new EventEmitter();
let gameLoopId;

let onKeyDown = function(e) {
  console.log(e.keyCode);
  switch (e.keyCode) {
    case 37: // left arrow
    case 38: // up arrow
    case 39: // right arrow
    case 40: // down arrow
    case 32: // space
      e.preventDefault();
      break;
    default: break; // don't block other keys
  }
}

window.addEventListener('keydown', onKeyDown);

window.addEventListener('keyup', (evt) => {
  if (evt.key == 'ArrowUp') {
    eventEmitter.emit(Messages.KEY_EVENT_UP);
  } else if (evt.key == 'ArrowDown') {
    eventEmitter.emit(Messages.KEY_EVENT_DOWN);
  } else if (evt.key == 'ArrowLeft') {
    eventEmitter.emit(Messages.KEY_EVENT_LEFT);
  } else if (evt.key == 'ArrowRight') {
    eventEmitter.emit(Messages.KEY_EVENT_RIGHT);
  } else if (evt.key == ' ') {
    eventEmitter.emit(Messages.KEY_EVENT_SPACE);
    // console.log('should have fired laser');
  } else if (evt.key == 'Enter') {
    eventEmitter.emit(Messages.KEY_EVENT_ENTER);
  }
});

function createEnemies() {
  const MONSTER_TOTAL = 5;
  const MONSTER_WIDTH = MONSTER_TOTAL * 98;
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;
  const STOP_X = START_X + MONSTER_WIDTH;

  for (let x = START_X; x < STOP_X; x += 98) {
    for (let y = 0; y < 50 * 5; y += 50) {
      const enemy = new Enemy(x, y);
      enemy.img = enemyImg;
      gameObjects.push(enemy);
    }
  }
}

function createHero() {
  hero = new Hero(
    canvas.width / 2 - 45,
    canvas.height - canvas.height / 4
  );
  hero.img = heroImg;
  gameObjects.push(hero);
}

function drawGameObjects(ctx) {
  gameObjects.forEach(go => go.draw(ctx));
}

function drawLife() {
  // TODO, 35, 27
  const START_POS = canvas.width - 180;
  for (let i = 0; i < hero.life; i++) {
    ctx.drawImage(lifeImg, START_POS + (45 * (i+1)), canvas.height - 37);
  }
}

function drawPoints() {
  ctx.font = '30px Arial';
  ctx.fillStyle = 'red';
  ctx.textAlign = 'left';
  drawText("Points: " + hero.points, 10, canvas.height - 20);
}

function drawText(message, x, y) {
  ctx.fillText(message, x, y);
}

function displayMessage(message, color = 'red') {
  ctx.font = '30px Arial';
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.fillText(message, canvas.width / 2, canvas.height / 2);
}

function endGame(win) {
  clearInterval(gameLoopId);

  // set a delay so we are sure any paints have finished
  setTimeout(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (win) {
      displayMessage("YOU WON! - Press [Enter] to start a new game", 'green');
    } else {
      displayMessage("YOU DIED! - Press [Enter] to start a new game");
    }
  }, 200);
}

function resetGame() {
  if (gameLoopId) {
    clearInterval(gameLoopId);
    eventEmitter.clear();
    initGame();
    gameLoopId = setInterval(() => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = 'black';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      updateGameObjects();
      drawPoints();
      drawLife();
      drawGameObjects(ctx);
    }, 100);
  }
}

function initGame() {
  gameObjects = [];
  createEnemies();
  createHero();

  // Keyboard events
  eventEmitter.on(Messages.KEY_EVENT_UP, () => {
    hero.y -= 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_DOWN, () => {
    hero.y += 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_LEFT, () => {
    hero.x -= 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_RIGHT, () => {
    hero.x += 5;
  });
  eventEmitter.on(Messages.KEY_EVENT_SPACE, () => {
    if (hero.canFire()) {
      // console.log('able to fire');
      hero.fire();
    } else {
      // console.log('not able to fire - in cd');
    }
  });

  // Collision events
  eventEmitter.on(Messages.COLLISION_ENEMY_LASER, (_, { first, second }) => {
    first.dead = true;
    second.dead = true;
    hero.incrementPoints();
    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  eventEmitter.on(Messages.COLLISION_ENEMY_HERO, (_, { enemy }) => {
    enemy.dead = true;
    hero.decrementLife();
    if (isHeroDead()) {
      eventEmitter.emit(Messages.GAME_END_LOSS);
      return; // loss before victory
    }
    if (isEnemiesDead()) {
      eventEmitter.emit(Messages.GAME_END_WIN);
    }
  });

  // Endgame events
  eventEmitter.on(Messages.GAME_END_WIN, () => {
    endGame(true);
  });
  eventEmitter.on(Messages.GAME_END_LOSS, () => {
    endGame(false);
  });
  eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
    if (isHeroDead() || isEnemiesDead()) {
      resetGame();
    }
  });
  eventEmitter.on(Messages.KEY_EVENT_ENTER, () => {
    resetGame();
  });
}

window.onload = async () => {
  canvas = document.getElementById('canvas');
  ctx = canvas.getContext('2d');
  heroImg = await loadTexture('./assets/player.png');
  enemyImg = await loadTexture('./assets/enemyShip.png');
  laserImg = await loadTexture('./assets/laserRed.png');
  lifeImg = await loadTexture('./assets/life.png');

  initGame();
  gameLoopId = setInterval(() => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    updateGameObjects();
    drawPoints();
    drawLife();
    drawGameObjects(ctx);
  }, 100)
};