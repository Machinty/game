// 召唤物塔类（空模板），继承自基础塔类，用于后续扩展特殊功能
class Summoner extends Tower {
  /**
   * 构造函数（新增投掷手塔参数）
   * @param {number} x - 塔的x坐标
   * @param {number} y - 塔的y坐标
   * @param {number} damage - 基础攻击伤害
   * @param {number} range - （不再使用）原攻击范围
   * @param {string} color - 塔的颜色
   * @param {number} health - 塔的生命值
   * @param {Game} game - 游戏实例引用
   * @param {Thrower} throwerTower - 关联的投掷手塔实例
   */
  constructor(x, y, damage, range, color, health, game, throwerTower) {
    super(x, y, 'summoner', damage, range, color, health, game);
    this.throwerTower = throwerTower; // 存储关联的投掷手塔
    this.lastShot = 0; // 射击冷却计时
    // 修改：攻击间隔改为2-5秒随机（2000-5000毫秒）
    this.shootInterval = Math.floor(Math.random() * (5000 - 2000 + 1)) + 2000; // 射击间隔（2-5秒随机，毫秒）
  }

  // 更新方法（重写父类方法）
  update(deltaTime, enemies, bullets) {
    super.update(deltaTime, enemies, bullets);
    this.lastShot += deltaTime;

    // 寻找目标（简单逻辑：攻击最近的敌人）
    const target = this.findTarget(enemies);
    if (target && this.lastShot >= this.shootInterval) {
      this.shoot(bullets, target);
      this.lastShot = 0;
    }
  }

  // 射击方法，生成召唤物子弹
  shoot(bullets, target) {
    const angle = Math.atan2(target.y - this.y, target.x - this.x);
    bullets.push(new SummonerBullet(
      this.x, 
      this.y, 
      target, 
      this.damage, 
      angle, 
      this.color, 
      this.game // 传递游戏实例用于获取时间
    ));
  }

  // 寻找目标逻辑（修改为使用投掷手塔的网格范围判断）
  findTarget(enemies) {
    let closestEnemy = null;
    let minDistance = Infinity;
    const throwerTower = this.throwerTower; // 获取关联的投掷手塔实例

    for (const enemy of enemies) {
      // 关键修改：使用投掷手塔的 isEnemyInRange 方法判断敌人是否在攻击范围内
      if (throwerTower.isEnemyInRange(enemy)) {
        // 计算敌人与召唤物的距离（仅用于选择最近目标）
        const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (distance < minDistance) {
          minDistance = distance;
          closestEnemy = enemy;
        }
      }
    }
    return closestEnemy;
  }
}

  // 召唤物子弹类，继承自基础子弹类，命中时添加投掷手标记
class SummonerBullet extends Bullet {
  // 构造函数（保持不变）
  constructor(x, y, target, damage, angle, color, game) {
    super(x, y, target, damage, angle, color);
    this.game = game; // 存储游戏实例以获取时间
  }

  // 重写命中目标方法，添加减速效果
  hitTarget() {
    if (!this.target) return;

    // 基础伤害逻辑（保持不变）
    const mainDamage = Math.max(this.damage - (this.target.defense || 0), this.damage * 0.05);
    this.target.health -= mainDamage;

    // 添加投掷手标记（保持不变）
    this.target.throwerMark = true;
    this.target.markExpireTime = this.game.gameTime + 999000; // 标记持续5秒（根据需求调整时间）

    // 新增：减速效果（移动速度降低到20%，持续1秒）
    this.target.isSlowed = true;          // 标记为减速状态
    this.target.slowPercentage = 0.2;     // 速度降低到20%
    this.target.slowExpireTime = this.game.gameTime + 1000; // 持续1秒（1000毫秒）

    this.shouldRemove = true; // 标记子弹需移除（保持不变）
  }
}
 