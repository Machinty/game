/**
 * 塔类，代表游戏中的防御塔
 * 有两种类型：地面塔和高空塔
 * 地面塔可以阻挡敌人并攻击被阻挡的敌人
 * 高空塔可以攻击范围内的敌人
 */

  // 导入其他必要的类或函数

class Tower {
  
  /**
   * 构造函数
   * @param {number} x - 塔的x坐标
   * @param {number} y - 塔的y坐标
   * @param {string} type - 塔的类型('ground'或'high')
   * @param {number} damage - 塔的攻击伤害
   * @param {number} range - 塔的攻击范围
   * @param {string} color - 塔的颜色
   * @param {number} health - 塔的生命值
   */
  constructor(x, y, type, damage, range, color, health, game, shootInterval) {
    this.defense = type === 'ground' ? 250 : type==='shao'? 140: 150; // 地面塔防御力更高
    this.x = x;
    this.y = y;
    this.type = type; // 'ground' 或 'high'
    this.damage = damage;
    this.range = range;
    this.color = color;
    this.health = health;
    this.maxHealth = health; // 新增：记录最大生命值（初始值为当前生命值）
    this.lastShot = 0;
    this.shootInterval = type === 'ground' ? 1700 :type==='thrower'? 1000: type==='shao'? 1200: 250; 
    this.target = null;
    this.canBlock = this.type === 'ground' ||this.type === 'shao'; // 地面塔可以阻挡敌人
    this.direction = 0; // 塔的朝向角度(弧度)
    this.isDragging = false; // 是否正在拖拽旋转
    this.maxBlockedEnemies = type === 'ground' ? 3 : 1; // 地面塔最多阻挡3个敌人
    this.blockedEnemies = []; // 当前阻挡的敌人数组
    this.targetEnemies = []; // 目标敌人
    this.isDragging = false;
    this.game = game; // 存储游戏实例，方便塔类与游戏环境进行交互
    this.diamondSize = 15;       // 菱形尺寸（半长）
    this.diamondOffset = 30;     // 菱形在塔上方的垂直偏移量
    this.diamondColor = 'rgba(128, 128, 128, 0.8)'; // 灰色透明
  }

  /**
   * 更新塔的状态
   * @param {number} deltaTime - 距离上次更新的时间(毫秒)
   * @param {Array} enemies - 敌人数组
   * @param {Array} bullets - 子弹数组
   */
  update(deltaTime, enemies, bullets) {
    this.lastShot += deltaTime;

    // 关键修改：地面塔和邵塔共享阻挡逻辑
    if (this.type === 'ground' || this.type === 'shao') { 
      const gridSize = this.game.gridSize;
      const towerGridX = Math.floor(this.x / gridSize);
      const towerGridY = Math.floor(this.y / gridSize);

      // 过滤已失效的阻挡敌人（仅保留在当前网格内的敌人）
      this.blockedEnemies = this.blockedEnemies.filter(enemy => {
        const enemyGridX = Math.floor(enemy.x / gridSize);
        const enemyGridY = Math.floor(enemy.y / gridSize);
        return (
          !enemy.isStunned &&
          !enemy.flying &&
          enemyGridX === towerGridX &&
          enemyGridY === towerGridY &&
          enemies.includes(enemy)
        );
      });

      // 添加新敌人到阻挡列表（仅添加当前网格内的敌人）
      for (const enemy of enemies) {
        const enemyGridX = Math.floor(enemy.x / gridSize);
        const enemyGridY = Math.floor(enemy.y / gridSize);
        if (
          !enemy.flying &&
          !enemy.isStunned &&
          enemyGridX === towerGridX &&
          enemyGridY === towerGridY &&
          !this.blockedEnemies.includes(enemy) &&
          this.blockedEnemies.length < this.maxBlockedEnemies
        ) {
          this.blockedEnemies.push(enemy);
        }
      }
    }

    // 如果有目标，检查是否还在范围内或已死亡
    if (this.target) {
      if (Array.isArray(this.target)) {
        // 处理地面塔的多个阻挡敌人目标
        const validEnemies = this.target.filter(enemy => 
          enemy.health > 0 && 
          enemies.includes(enemy) && 
          this.isEnemyInRangeForGround(enemy) // 使用地面塔专用范围检查
        );
        if (validEnemies.length === 0) {
          this.target = null;
        } else {
          this.target = validEnemies; // 保留有效敌人
        }
      } else {
        // 处理单个敌人目标（高空塔/投掷塔）
        if (this.target.health <= 0 || !enemies.includes(this.target)) {
          this.target = null;
        } else {         // 检查是否在高空塔/投掷塔的攻击范围内
          

          
          if (!this.isEnemyInRange(this.target)&&(!this.isEnemyInFront(this.target)||!this.target.isBlocked)) {
            this.target = null;
          }
        }
      }
    }
    
    // 如果没有目标，寻找一个新目标
    if (!this.target) {
      this.target = this.findTarget(enemies)
    }
    
    // 如果有目标且冷却时间已过，射击
    if (this.target && this.lastShot >= this.shootInterval) {
      this.shoot(bullets, enemies);
      this.lastShot = 0;
    }
  }

  /**
   * 寻找攻击目标
   * 地面塔：优先攻击自身阻挡的敌人，若无则攻击前方范围内最近的非阻挡敌人
   * 高空塔/投掷塔：保持原有逻辑（攻击范围内最近的敌人）
   * @param {Array} enemies - 敌人数组
   * @return {Object|Array} - 返回单个敌人或敌人数组
   */
  findTarget(enemies) {
    // 关键修改：地面塔和邵塔共享索敌逻辑
    if (this.type === 'ground' || this.type === 'shao') { 
      // 优先选择被阻挡的敌人（最多3个）
      if (this.blockedEnemies.length > 0) {
        return this.blockedEnemies;
      } else {
        // 若无阻挡敌人，寻找前方一格内的非阻挡敌人
        let closestEnemy = null;
        let minDistance = Infinity;
        for (const enemy of enemies) {
 


          if (!enemy.isBlocked && !enemy.flying && this.isEnemyInFront(enemy)) {
            const distance = this.getDistanceToEnemy(enemy);
            if (distance < minDistance) {
              minDistance = distance;
              closestEnemy = enemy;
            }
          }
        }
        return closestEnemy;
      }
    }

    // 高空塔/投掷塔原有逻辑（未修改）
    let closestEnemy = null;
    let minDistance = Infinity;
    for (const enemy of enemies) {

      
      

      if ((this.type === 'thrower' || this.type === 'high') && !enemy.flying && this.isEnemyInRange(enemy)) {
        const distance = this.getDistanceToEnemy(enemy);
        if (distance < minDistance) {
          minDistance = distance;
          closestEnemy = enemy;
        }
      }
    }
    return closestEnemy;
  }
  
  /**
   * 检查敌人是否在塔的正前方
   * @param {Object} enemy - 敌人对象
   * @return {boolean} - 如果再前方返回true
   */
  isEnemyInFront(enemy) {
    const gridSize = 50;
    const towerGridX = Math.floor(this.x / gridSize);
    const towerGridY = Math.floor(this.y / gridSize);
    const enemyGridX = Math.floor(enemy.x / gridSize);
    const enemyGridY = Math.floor(enemy.y / gridSize);
    
    const direction = Math.round(this.direction / (Math.PI / 2)) * (Math.PI / 2);
    
    if (direction === 0) { // 右
      return enemyGridX === towerGridX + 1 && enemyGridY === towerGridY;
    } else if (direction === Math.PI / 2) { // 下
      return enemyGridY === towerGridY + 1 && enemyGridX === towerGridX;
    } else if (direction === Math.PI) { // 左
      return enemyGridX === towerGridX - 1 && enemyGridY === towerGridY;
    } else { // 上
      return enemyGridY === towerGridY - 1 && enemyGridX === towerGridX;
    }
  }

  /**
   * 检查敌人是否在攻击范围内(仅高空塔使用)
   * @param {Object} enemy - 敌人对象
   * @return {boolean} - 如果再范围内返回true
   */
  isEnemyInRange(enemy) {
    if (this.type==='thrower'||this.type==='high') {
      const gridSize = 50;
      const towerGridX = Math.floor(this.x / gridSize);
      const towerGridY = Math.floor(this.y / gridSize);
      const enemyGridX = Math.floor(enemy.x / gridSize);
      const enemyGridY = Math.floor(enemy.y / gridSize);
      
      // 根据塔的朝向调整攻击范围
      const direction = Math.round(this.direction / (Math.PI / 2)) * (Math.PI / 2);
      let inXRange, inYRange;
      
      if (direction === 0) { // 右
        inXRange = enemyGridX >= towerGridX && enemyGridX <= towerGridX + 3;
        inYRange = enemyGridY >= towerGridY - 1 && enemyGridY <= towerGridY + 1;
      } else if (direction === Math.PI / 2) { // 下
        inXRange = enemyGridX >= towerGridX - 1 && enemyGridX <= towerGridX + 1;
        inYRange = enemyGridY >= towerGridY && enemyGridY <= towerGridY + 3;
      } else if (direction === Math.PI) { // 左
        inXRange = enemyGridX >= towerGridX - 3 && enemyGridX <= towerGridX;
        inYRange = enemyGridY >= towerGridY - 1 && enemyGridY <= towerGridY + 1;
      } else { // 上
        inXRange = enemyGridX >= towerGridX - 1 && enemyGridX <= towerGridX + 1;
        inYRange = enemyGridY >= towerGridY - 3 && enemyGridY <= towerGridY;
      }
      
      return inXRange && inYRange;
    } else {
      return false; // 地面塔不再使用此方法判断范围
    }
  }

  /**
   * 计算与敌人的距离
   * @param {Object} enemy - 敌人对象
   * @return {number} - 返回与敌人的距离
   */
  getDistanceToEnemy(enemy) {
    const dx = this.x - enemy.x;
    const dy = this.y - enemy.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 射击方法
   * 根据塔的类型创建不同类型的子弹
   /**
    *@param {Array} enemies - 敌人数组，包含游戏中当前所有的敌人对象
    *@param {Array} bullets - 子弹数组
   */
  /**
   * 射击方法
   * 地面塔：直接对目标敌人造成伤害（不发射子弹）
   * 其他塔：保持发射子弹的逻辑
   * @param {Array} bullets - 子弹数组
   * @param {Array} enemies - 敌人数组
   */
  shoot(bullets, enemies) {
    if (!this.target) return;
  
    // 地面塔和邵塔共享攻击逻辑
    if (this.type === 'ground' || this.type === 'shao') { 
      const targets = Array.isArray(this.target) ? this.target : [this.target];
      for (const enemy of targets) {
        if (enemy.health > 0) {
          // 基础伤害
          const finalDamage = this.physicalAttack(this.damage, enemy.defense);
          enemy.health -= finalDamage;

          // 邵塔专属逻辑：累计攻击伤害并检查条件2（300%基础伤害）
          if (this.type === 'shao') {
            // 添加3-4层烧伤（与原shao.js逻辑一致）
            const addedLayers = Math.floor(Math.random() * 2) + 3;
            enemy.burnLayers += addedLayers;
            
            // 新增：施加星火状态（每次攻击都更新）
            enemy.spark = true;
            enemy.sparkBurnLayers = enemy.burnLayers; // 记录当前烧伤层数
            this.attackDamageCounter += finalDamage;
          }
        }
      }
    } if (this.type==='high') {
      // 高空塔/投掷塔原有逻辑（未修改）
      const angle = Math.atan2(this.target.y - this.y, this.target.x - this.x);
      bullets.push(new Bullet(
        this.x, 
        this.y, 
        this.target, 
        this.damage,
        angle,
        this.color,
        this.type
      ));
    }
  }
  
  /**
   * 绘制塔
   * @param {Object} ctx - 画布上下文
   */
  draw(ctx) {
    // 绘制塔基座
    ctx.beginPath();
    ctx.arc(this.x, this.y, 15, 0, Math.PI * 2);
    ctx.fillStyle = '#666';
    ctx.fill();
    
    // 保存当前画布状态
    ctx.save();
    // 移动坐标系到塔中心
    ctx.translate(this.x, this.y);
    // 旋转画布到塔的朝向
    ctx.rotate(this.direction);
    
    // 绘制塔主体（根据类型调整颜色和形状）
    ctx.beginPath();
    ctx.rect(-10, -10, 20, 20); // 正方形主体
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // 绘制方向指示箭头
    ctx.beginPath();
    ctx.moveTo(0, -10);
    ctx.lineTo(10, 0);
    ctx.lineTo(-10, 0);
    ctx.fillStyle = '#fff';
    ctx.fill();
    
    // 恢复画布状态
    ctx.restore();
    
    // 绘制塔类型特定部分
    ctx.beginPath();
    if (this.type === 'ground') {
      // 地面塔
      ctx.rect(-10, -20, 20, 20);
    } else {
      // 高空塔
      ctx.moveTo(0, -25);
      ctx.lineTo(-10, -10);
      ctx.lineTo(10, -10);
      ctx.closePath();
    }
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // 恢复画布状态
    ctx.restore();
    
    // 绘制塔的生命值（替换原有文本，改为血条）
    const healthBarWidth = 30;    // 血条宽度
    const healthBarHeight = 5;    // 血条高度
    const healthPercentage = Math.min(this.health / this.maxHealth, 1); // 生命值百分比（不超过100%）
    
    // 绘制血条背景（灰色）
    ctx.fillStyle = '#999';
    ctx.fillRect(
      this.x - healthBarWidth / 2,  // 水平居中对齐塔中心
      this.y + 10,                  // 垂直位置在技力条上方（技力条在y+20）
      healthBarWidth,
      healthBarHeight
    );
    
    // 绘制血条填充（蓝色）
    ctx.fillStyle = '#87CEFA'; // 改为天蓝色（淡蓝色）
    ctx.fillRect(
      this.x - healthBarWidth / 2,
      this.y + 10,
      healthBarWidth * healthPercentage,
      healthBarHeight
    );
    ctx.fillStyle = '#000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`HP: ${Math.floor(this.health)}`, this.x, this.y + 30);
    
    // 绘制射程范围（3x3网格样式）
    if (this.type === 'high'||this.type==='thrower') {
      const gridSize = 50;
      const gridX = Math.floor(this.x / gridSize);
      const gridY = Math.floor(this.y / gridSize);
      
      ctx.fillStyle = 'rgba(0, 0, 255, 0.1)';
      
      // 根据塔的朝向调整攻击范围绘制
      const direction = Math.round(this.direction / (Math.PI / 2)) * (Math.PI / 2);
      
      if (direction === 0) { // 右
        for (let y = gridY - 1; y <= gridY + 1; y++) {
          for (let x = gridX; x <= gridX + 3; x++) {
            ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
          }
        }
      } else if (direction === Math.PI / 2) { // 下
        for (let y = gridY; y <= gridY + 3; y++) {
          for (let x = gridX - 1; x <= gridX + 1; x++) {
            ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
          }
        }
      } else if (direction === Math.PI) { // 左
        for (let y = gridY - 1; y <= gridY + 1; y++) {
          for (let x = gridX - 3; x <= gridX; x++) {
            ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
          }
        }
      } else { // 上
        for (let y = gridY - 3; y <= gridY; y++) {
          for (let x = gridX - 1; x <= gridX + 1; x++) {
            ctx.fillRect(x * gridSize, y * gridSize, gridSize, gridSize);
          }
        }
      }
    } else if (this.type === 'ground'||this.type==='shao') {
      const gridSize = 50;
      const gridX = Math.floor(this.x / gridSize);
      const gridY = Math.floor(this.y / gridSize);
      
      ctx.fillStyle = 'rgba(255, 255, 0, 0.2)';
      
      // 新增：定义direction变量（关键修复）
      const direction = Math.round(this.direction / (Math.PI / 2)) * (Math.PI / 2);
      
      // 根据朝向绘制前方一格的攻击范围（与目标搜索逻辑一致）
      switch (direction) {
        case 0: // 右
          ctx.fillRect((gridX + 1) * gridSize, gridY * gridSize, gridSize, gridSize);
          break;
        case Math.PI / 2: // 下
          ctx.fillRect(gridX * gridSize, (gridY + 1) * gridSize, gridSize, gridSize);
          break;
        case Math.PI: // 左
          ctx.fillRect((gridX - 1) * gridSize, gridY * gridSize, gridSize, gridSize);
          break;
        default: // 上
          ctx.fillRect(gridX * gridSize, (gridY - 1) * gridSize, gridSize, gridSize);
      }
    }
    // 绘制目标指示（调试用）
    if (this.target) {
      ctx.beginPath();
      ctx.moveTo(this.x, this.y);
      ctx.lineTo(this.target.x, this.target.y);
      ctx.strokeStyle = 'red';
      ctx.stroke();
    }
    // 新增：绘制技力条（仅适用于有技力的塔）
    if (this.currentMana !== undefined && this.maxMana !== undefined) {
      const manaBarWidth = 30;    // 技力条宽度
      const manaBarHeight = 5;    // 技力条高度
      const manaPercentage = Math.min(this.currentMana / this.maxMana, 1); // 防止超过100%
      
      // 绘制背景条（灰色）
      ctx.fillStyle = '#999';
      ctx.fillRect(
        this.x - manaBarWidth / 2,  // 水平居中对齐塔中心（保持不变）
        this.y + 15,                // 垂直位置调整为塔中心下方15像素（原：y - 25）
        manaBarWidth,
        manaBarHeight
      );
      
      // 绘制填充条（绿色）
      ctx.fillStyle = '#0f0';
      ctx.fillRect(
        this.x - manaBarWidth / 2,
        this.y + 15,                // 垂直位置同步调整
        manaBarWidth * manaPercentage,
        manaBarHeight
      );
    }
  }
  
  // 键盘控制方向方法
  /**
   * 设置塔的朝向
   * @param {number} direction - 朝向角度(弧度)
   */
  setDirection(direction) {
    this.direction = direction;
  }
  
  // 检查是否点击在塔上
  // 修改 isClicked 方法中的判定半径（原 25 → 30）
  isClicked(x, y) {
    const distance = Math.sqrt((x - this.x) ** 2 + (y - this.y) ** 2);
    // 关键修改：增大判定半径以匹配投掷手塔的实际尺寸
    const isClicked = distance <= 30;  // 原：25
  
    if (isClicked) {
      // 仅当塔已部署（在游戏塔数组中）时显示按钮
      if (this.game.towers.includes(this)) {
        // 获取画布在页面中的位置偏移
        const canvasRect = this.game.canvas.getBoundingClientRect();
        // 显示撤退按钮（调整为塔的左上方，避免与技能按钮重叠）
        const retreatBtn = document.getElementById('retreatBtn');
        retreatBtn.style.display = 'block';
        retreatBtn.style.left = `${this.x + canvasRect.left - 50}px`;  // 塔左侧-50px（比之前更靠左）
        retreatBtn.style.top = `${this.y + canvasRect.top - 40}px`;    // 塔上方-40px（与技能按钮同高度但左右错开）
        
        // 关键新增：在游戏实例中记录当前被点击的塔
        this.game.currentRetreatTower = this;
        
        // 隐藏技能按钮（强化互斥）
        document.getElementById('throwerSkillBtn').style.display = 'none';
      }
    } else {
      // 点击非塔区域时隐藏按钮并清除记录
      document.getElementById('retreatBtn').style.display = 'none';
      this.game.currentRetreatTower = null;
    }

    return isClicked;
  }
  updateDirection(x, y) {
    // 这里可以添加更新方向的逻辑，例如根据鼠标位置计算方向
    // 目前简单示例可以不做处理
  }
  startDrag() {
    this.isDragging = true;
    // 这里可以添加开始拖拽时需要执行的逻辑，例如记录初始位置等
  }

  endDrag() {
    this.isDragging = false;
    // 这里可以添加结束拖拽时需要执行的逻辑，例如更新位置等
  }


/**
 * 检查敌人是否在地面塔的阻挡攻击范围内（结合方向和网格判断）
 * @param {Object} enemy - 敌人对象
 * @return {boolean} - 是否在范围内
 */
isEnemyInRangeForGround(enemy) {
  // 关键修改：使用isEnemyInFront判断敌人是否在正前方的攻击格内
  return this.isEnemyInFront(enemy);
  }

    /**
   * 物理攻击伤害计算函数
   * @param {number} initialDamage - 初始伤害值
   * @param {number} defense - 目标防御力
   * @returns {number} 最终伤害值（不小于初始伤害的5%）
   */
     physicalAttack(initialDamage, defense) {
      return Math.max(initialDamage - defense, initialDamage * 0.05);
    }

}