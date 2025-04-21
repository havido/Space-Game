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
}

class Hero extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.type = "Hero";
    this.width = 90;
    this.height = 90;
    this.speed = 5;
  }
}

class Enemy extends GameObject {
  constructor(x, y) {
    super(x, y);
    this.type = "Enemy";
    this.width = 98;
    this.height = 50;
    this.speed = 2;
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

let onKeyDown = function(e) {
  console.log(e.keyCode);
  if (e.keyCode === 37) {
    // left arrow
    e.preventDefault();
    Hero.x -= Hero.speed;
  } else if (e.keyCode === 39) {
    // right arrow
    e.preventDefault();
    Hero.x += Hero.speed;
  } else if (e.keyCode === 38) {
    // up arrow
    e.preventDefault();
    Hero.y -= Hero.speed;
  } else if (e.keyCode === 40) {
    // down arrow
    e.preventDefault();
    Hero.y += Hero.speed;
  }
}
window.addEventListener('keydown', onKeyDown);

function loadTexture(path) {
  return new Promise((resolve) => {
    const img = new Image()
    img.src = path
    img.onload = () => {
      resolve(img)
    }
  })
}

function createEnemies(ctx, canvas, enemyImg) {
  // TODO draw enemies
  const MONSTER_TOTAL = 5;
  const MONSTER_WIDTH = MONSTER_TOTAL * 98;
  const START_X = (canvas.width - MONSTER_WIDTH) / 2;
  const STOP_X = START_X + MONSTER_WIDTH;
  for (let x = START_X; x < STOP_X; x += 98) {
    for (let y = 0; y < 50 * 5; y += 50) {
      ctx.drawImage(enemyImg, x, y);
    }
  }
}

window.onload = async () => {
  canvas = document.getElementById('canvas')
  ctx = canvas.getContext('2d')
  // TODO load textures
  const hero = await loadTexture('./assets/player.png')
  const enemy = await loadTexture('./assets/enemyShip.png')

  // TODO draw black background
  ctx.fillStyle = 'black';
  ctx.fillRect(0,0,canvas.width,canvas.height);

  // TODO draw hero
  ctx.drawImage(hero, canvas.width/2 - 45, canvas.height - canvas.height/4);

  // TODO uncomment the next line when you add enemies to screen
  createEnemies(ctx, canvas, enemy);
}
