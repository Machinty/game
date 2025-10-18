class ShaoTower extends Tower {
  // 构造函数
  // @param x,y 塔的位置坐标
  // @param damage 基础伤害值
  // @param range 攻击范围
  // @param color 塔的颜色
  // @param health 塔的生命值
  // 构造函数（新增技力属性）

  constructor(x, y, damage, range, health, game) {
    // 调用父类构造函数（类型设为'shao'，颜色设为橙色）
    super(x, y, 'shao', damage, range, '#FFA500', health, game);
    
    // 关键新增：设置阻挡相关属性（与地面塔一致）
    this.canBlock = true;         // 允许阻挡敌人
    this.maxBlockedEnemies = 1;   // 最多阻挡3个敌人（与地面塔一致）

    // 新增：技能相关属性（参考投掷手塔）
    this.maxMana = 18;       // 最大技力值（与投掷手塔一致）
    this.currentMana = 18;   // 初始技力（满状态）
    this.isSkillActive = false; // 技能激活状态
  }

  // 新增：技力自动回复（每秒1点，类似投掷手塔）
  update(deltaTime, enemies, bullets) {
    super.update(deltaTime, enemies, bullets);
    if (!this.isSkillActive) {
      // 按时间增量计算回复量（deltaTime是毫秒，转换为秒）
      this.currentMana = Math.min(
        this.currentMana + deltaTime / 1000, // 每秒回复1点
        this.maxMana // 不超过上限
      );
    }
  }

  // 预留技能方法（空框架，后续填充具体效果）
  // 新增：技能激活方法（完整实现）
  activateSkill() {
    if (this.currentMana >= this.maxMana && !this.isSkillActive) {
      this.isSkillActive = true;
      this.currentMana = 0; // 消耗技力
  
      // 获取游戏实例和网格尺寸
      const game = this.game;
      const gridSize = game.gridSize;
  
      // 计算塔的网格坐标（基于像素位置）
      const towerGridX = Math.floor(this.x / gridSize);
      const towerGridY = Math.floor(this.y / gridSize);
  
      // 将方向弧度映射到四个主方向（上/右/下/左）
      const roundedDirection = Math.round(this.direction / (Math.PI/2)) * (Math.PI/2);
      let dx = 0, dy = 0;
      switch (roundedDirection) {
        case 0:         // 右方向
          dx = 1;
          break;
        case Math.PI/2: // 下方向
          dy = 1;
          break;
        case Math.PI:   // 左方向
          dx = -1;
          break;
        case -Math.PI/2:// 上方向
          dy = -1;
          break;
      }
  
      // 生成三角形范围内的所有网格坐标（1层1格/2层3格/3层5格）
      const triangleGrids = [];
      // 层1（距离1，宽度1）
      for (let offset = -0; offset <= 0; offset++) {
        triangleGrids.push({
          x: towerGridX + dx * 1,
          y: towerGridY + dy * 1 + (dx !== 0 ? offset : 0)
        });
      }
      // 层2（距离2，宽度3）
      for (let offset = -1; offset <= 1; offset++) {
        triangleGrids.push({
          x: towerGridX + dx * 2 + (dy !== 0 ? offset : 0),
          y: towerGridY + dy * 2 + (dx !== 0 ? offset : 0)
        });
      }
      // 层3（距离3，宽度5）
      for (let offset = -2; offset <= 2; offset++) {
        triangleGrids.push({
          x: towerGridX + dx * 3 + (dy !== 0 ? offset : 0),
          y: towerGridY + dy * 3 + (dx !== 0 ? offset : 0)
        });
      }
  
      // 检索范围内的敌人并造成伤害
      const applyDamage = () => {
        game.enemies.forEach(enemy => {
          const enemyGridX = Math.floor(enemy.x / gridSize);
          const enemyGridY = Math.floor(enemy.y / gridSize);
          const isInRange = triangleGrids.some(grid => 
            grid.x === enemyGridX && grid.y === enemyGridY
          );
  
          if (isInRange) {
            const damage = Math.max(this.damage * 4.2 - (enemy.defense || 0), this.damage * 4.2 * 0.05);
            enemy.spark = true;
            enemy.health -= damage;
            enemy.burnLayers += 28;
          }
        });
      };
  
      // 第一次攻击（立即执行）
      applyDamage();
  
      // 第二次攻击（延迟1秒执行）
      setTimeout(() => {
        applyDamage(); // 重复应用伤害
        this.isSkillActive = false; // 两次攻击完成后关闭技能
      }, 1000);
    }
  }

  // 预留技能关闭方法（空框架）
  deactivateSkill() {
    this.isSkillActive = false;
    // 后续添加技能结束后的恢复逻辑
  }
}
