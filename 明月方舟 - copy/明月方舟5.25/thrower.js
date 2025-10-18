// 投掷者塔类，继承自基础塔类，具有范围伤害能力
class Thrower extends Tower {
  // 构造函数
  // @param x,y 塔的位置坐标
  // @param damage 基础伤害值
  // @param range 攻击范围
  // @param color 塔的颜色
  // @param health 塔的生命值
  // 构造函数（新增技力属性）
  constructor(x, y, damage, range, color, health, game) {
    super(x, y, 'thrower', damage, range, color, health, game);
    this.aoeRadius = 50; // 二次伤害范围
    this.secondaryDamage = this.damage * 0.5; // 余震伤害（基于当前攻击力）
    this.maxMana = 54; // 技力上限
    this.currentMana = 54; // 初始技力（满状态）
    this.maxBullets = 6; // 最大子弹数量（初始值）
  }




            // 新增：投掷手塔技力自动回复（每秒1点）
  update(deltaTime, enemies, bullets){
    super.update(deltaTime, enemies, bullets);
    if (!this.isSkillActive) {
   // 按时间增量计算回复量（deltaTime是毫秒，转换为秒）
      this.currentMana = Math.min(
      this.currentMana + deltaTime / 1000, // 每秒回复1点
      this.maxMana // 不超过上限
                );
              }
            }

  // 射击方法，创建并发射投掷子弹
  // @param bullets 子弹数组，用于存储发射的子弹
  // @param enemies 敌人数组，用于计算目标
  shoot(bullets, enemies) {
    if (!this.target) return;

    // 仅当技能激活时处理子弹计数和耗尽逻辑
    if (this.isSkillActive) {
      // 子弹耗尽时关闭技能
      if (this.bulletsLeft <= 0) {
        this.closeSkill(); // 恢复基础属性并关闭技能
        return;
      }
      // 技能激活时递减子弹计数
      this.bulletsLeft--;
    }

    // 发射子弹逻辑（无论技能是否激活都执行）
    const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
    bullets.push(new ThrowerBullet(
      this.x, 
      this.y, 
      this.target, 
      this.damage,
      angle,
      this.color,  // 直接使用塔的颜色（已改为暗红色）
      this.aoeRadius,
      this.secondaryDamage,
      enemies,
      this.game
    ));
  }

  /**
   * 部署召唤物（修改后）
   * 在投掷手塔的攻击范围内（根据方向调整）寻找可用网格，生成召唤物
   */
  deploySummoner() {
    const { game, x: towerX, y: towerY, range, direction } = this;
    const gridSize = game.gridSize;
    const towerGridX = Math.floor(towerX / gridSize);
    const towerGridY = Math.floor(towerY / gridSize);
    const roundedDirection = Math.round(direction / (Math.PI / 2)) * (Math.PI / 2);
    let searchGrids = [];

    // 根据方向生成完整攻击范围内的网格（包含塔所在行/列）
    switch (roundedDirection) {
      case 0: // 右方向（塔所在列到右侧3列，上下各1行）
        for (let dx = 0; dx <= 3; dx++) { // 覆盖dx=0（塔所在列）到dx=3
          for (let dy = -1; dy <= 1; dy++) {
            searchGrids.push({ 
              x: towerGridX + dx, 
              y: towerGridY + dy, 
              distance: dx // 距离为dx（离塔越近值越小）
            });
          }
        }
        break;
      case Math.PI / 2: // 下方向（塔所在行到下方3行，左右各1列）
        for (let dy = 0; dy <= 3; dy++) { // 覆盖dy=0（塔所在行）到dy=3
          for (let dx = -1; dx <= 1; dx++) {
            searchGrids.push({ 
              x: towerGridX + dx, 
              y: towerGridY + dy, 
              distance: dy // 距离为dy（离塔越近值越小）
            });
          }
        }
        break;
      case Math.PI: // 左方向（塔所在列到左侧3列，上下各1行）
        for (let dx = 0; dx >= -3; dx--) { // 覆盖dx=0（塔所在列）到dx=-3
          for (let dy = -1; dy <= 1; dy++) {
            searchGrids.push({ 
              x: towerGridX + dx, 
              y: towerGridY + dy, 
              distance: -dx // 距离为-dx（离塔越近值越小）
            });
          }
        }
        break;
      default: // 上方向（塔所在行到上方3行，左右各1列）
        for (let dy = 0; dy >= -3; dy--) { // 覆盖dy=0（塔所在行）到dy=-3
          for (let dx = -1; dx <= 1; dx++) {
            searchGrids.push({ 
              x: towerGridX + dx, 
              y: towerGridY + dy, 
              distance: -dy // 距离为-dy（离塔越近值越小）
            });
          }
        }
        break;
    }

    // 按离塔距离从小到大排序（优先检查近的位置）
    searchGrids.sort((a, b) => a.distance - b.distance);

    // 遍历网格，寻找第一个未被占用的位置
    for (const { x: gridX, y: gridY } of searchGrids) {
      // 跳过塔自身所在的网格（已被占用）
      if (gridX === towerGridX && gridY === towerGridY) continue;
      
      if (gridX >= 0 && gridX < game.grid[0].length && 
          gridY >= 0 && gridY < game.grid.length && 
          !game.grid[gridY][gridX]) {
        
        const summonX = gridX * gridSize + gridSize / 2;
        const summonY = gridY * gridSize + gridSize / 2;
        // 新增：传递当前投掷手塔实例给召唤物
        const summoner = new Summoner(summonX, summonY, 10, 50, 'purple', 200, game, this);
        game.towers.push(summoner);
        
        // 关键修复：标记网格为已占用，避免重复部署
        game.grid[gridY][gridX] = true;
        
        return;
      }
    }
  }

  closeSkill() {
    // 恢复基础属性（与 game.js 中增强的属性对应）
    this.damage = this.baseDamage;
    this.secondaryDamage = this.baseDamage * 0.5;
    this.aoeRadius = 50;
    this.shootInterval = 1200;
    this.explosionChance = 0.15;
    this.isSkillActive = false; // 关闭技能标记
  }

  // 新增：绘制方法，覆盖父类的绘制逻辑
  draw(ctx) {
    // 调用父类绘制方法（绘制塔的基础形状、颜色等）
    super.draw(ctx);

    // 仅当技能激活时绘制技能条
    if (this.isSkillActive) {
      const skillBarWidth = 30;    // 技能条总宽度
      const skillBarHeight = 5;    // 技能条高度
      const maxBullets = this.maxBullets; // 最大子弹数（6）
      const segmentWidth = skillBarWidth / maxBullets; // 每段宽度（5px）
      const skillPercentage = Math.min(this.bulletsLeft / maxBullets, 1); // 剩余子弹比例

      // 绘制背景条（灰色）
      ctx.fillStyle = '#999';
      ctx.fillRect(
        this.x - skillBarWidth / 2,  // 水平居中对齐塔中心（保持不变）
        this.y + 15,                // 垂直位置调整为塔中心下方15像素（原：y - 25）
        skillBarWidth,
        skillBarHeight
      );

      // 新增：绘制分隔线（浅灰色，5条）
      ctx.strokeStyle = '#000'; // 浅灰色分隔线
      ctx.lineWidth = 1;
      for (let i = 1; i < maxBullets; i++) { // 从第1段到第5段边界
        const lineX = this.x - skillBarWidth / 2 + segmentWidth * i; // 分隔线x坐标
        ctx.beginPath();
        ctx.moveTo(lineX, this.y + 15); // 分隔线起点（技能条顶部）
        ctx.lineTo(lineX, this.y + 15 + skillBarHeight); // 分隔线终点（技能条底部）
        ctx.stroke();
      }

      // 绘制技能条进度（黄色）
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(
        this.x - skillBarWidth / 2,
        this.y + 15,                // 垂直位置同步调整
        skillBarWidth * skillPercentage,
        skillBarHeight
      );}
  }
}



// 投掷子弹类，继承自基础子弹类，具有范围伤害效果
class ThrowerBullet extends Bullet {
  // 构造函数
  // @param x,y 子弹初始位置
  // @param target 攻击目标
  // @param damage 主伤害值
  // @param angle 发射角度
  // @param color 子弹颜色
  // @param aoeRadius 范围伤害半径
  // @param secondaryDamage 范围伤害值
  constructor(x, y, target, damage, angle, color, aoeRadius, secondaryDamage, enemy,game) {
    super(x, y, target, damage, angle, color);
    this.aoeRadius = aoeRadius;
    this.secondaryDamage = secondaryDamage;
    this.allenemy = enemy;
    this.game = game;
  }

  // 命中目标方法，计算主伤害和范围伤害
  hitTarget() {
    if (!this.target) return;
    
    // 主伤害（物理伤害计算，提升125%）
    const mainDamage = Math.max(this.damage * 1.25 - (this.target.defense || 0), (this.damage * 1.25) * 0.05);
    this.target.health -= mainDamage;
    this.target.throwerMark = true;
    this.target.markExpireTime = this.game.gameTime + 999000; // 标记持续5秒

    // 二次伤害（物理伤害计算，提升125%）
    const enemiesInRange = this.allenemy.filter(enemy => {
      const dx = enemy.x - this.target.x;
      const dy = enemy.y - this.target.y;
      return Math.sqrt(dx * dx + dy * dy) <= this.aoeRadius;
    });
    
    enemiesInRange.forEach(enemy => {
  const secondaryDamage = Math.max(this.secondaryDamage * 1.25 - (enemy.defense || 0), (this.secondaryDamage * 1.25) * 0.05);
  enemy.health -= secondaryDamage;
  
  // 检查是否有投掷手标记并触发爆炸（15%概率）
  const throwerTower = this.game.towers.find(t => t.type === 'thrower');
  const explosionChance = throwerTower ? throwerTower.explosionChance : 0.15;
  if (enemy.throwerMark && Math.random() < explosionChance) {
    // 计算爆炸伤害（提升125%）
    const explosionDamage = Math.max(this.damage * 1.25 * 1.75 - (enemy.defense || 0), (this.damage * 1.25 * 1.75) * 0.05);
    // 对周围所有敌人造成伤害
    const allEnemies = this.allenemy;
    allEnemies.forEach(e => {
      const dx = e.x - enemy.x;
      const dy = e.y - enemy.y;
      if (Math.sqrt(dx * dx + dy * dy) <= 40) {
        e.health -= explosionDamage;
        e.isStunned = true;
        e.stunExpireTime = this.game.gameTime + 1000; // 晕眩1秒
      }
    });
    // 移除标记
    enemy.throwerMark = false;
    enemy.markExpireTime = 0;
  }
  });
    
    // 触发余震效果动画
    this.game.addEffect({
      type: 'aoe',
      x: this.target.x,
      y: this.target.y,
      radius: this.aoeRadius,
      color: 'rgba(139, 0, 0, 0.3)',  // 改为暗红色半透明（#8B0000的RGBA形式）
      duration: 300
    });
    
    this.shouldRemove = true;
  }

}
