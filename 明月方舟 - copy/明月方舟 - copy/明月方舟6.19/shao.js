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
    this.canBlock = true;
    this.maxBlockedEnemies = 1;
    this.maxMana = 18;
    this.currentMana = 18;
    this.isSkillActive = false;
    this.skillRangeGrids = [];
    this.showSkillRange = false;
    this.direction = 0; // 新增：默认方向为右侧（0弧度）
    this.charging=0 //技能充能数
    this.moodcoin=0//情感硬币
    this.moodcointime=0
    // 新增：攻击伤害累计和受击伤害累计
    this.attackDamageCounter = 0; // 累计造成的攻击伤害
    this.damageTakenCounter = 0;  // 累计受到的伤害
  }

  update(deltaTime, enemies, bullets) {
    super.update(deltaTime, enemies, bullets);
    const currentGameTime = this.game.gameTime;
    this.moodcoinupdate(currentGameTime)
    if(this.charging==0 && this.currentMana==this.maxMana){
      this.charging = 1;
      this.currentMana=0;
    }
    if (!this.isSkillActive) {
      this.currentMana = Math.min(
        this.currentMana + deltaTime / 1000, // 每秒回复1点
        this.maxMana // 不超过上限
      );
    }
    


    
  }
  moodcoinmain(gametime) {

    this.moodcointime = gametime
  }

  // 修改：仅保留时间条件的检查（其他条件在攻击/受击时触发）
  moodcoinupdate(gametime) {
    // 条件1：每25秒触发一次
    if (gametime - this.moodcointime >= 25000) {
      this.moodcoin += 1;
      this.moodcointime = gametime
    }
    if (this.attackDamageCounter >= this.damage * 5) {
      this.moodcoin += 1;
      this.attackDamageCounter = 0; // 重置计数器
    }

    if (this.damageTakenCounter >= this.maxHealth * 0.25) {
      this.moodcoin += 1;
      this.damageTakenCounter = 0; // 重置计数器
    }


  }



  // 技能激活方法（移除showSkillRange相关逻辑）
  activateSkill() {
    if ((this.currentMana >= this.maxMana || this.charging==1) && !this.isSkillActive) {
      this.isSkillActive = true;
      if(this.charging==1){
        this.charging=0
    }

      // 保留原有伤害逻辑（移除showSkillRange设置）
      const game = this.game;
      const gridSize = game.gridSize;
      const ctx = game.ctx; // 获取画布上下文
  
      // 计算塔的网格坐标（基于像素位置）
      const towerGridX = Math.floor(this.x / gridSize);
      const towerGridY = Math.floor(this.y / gridSize);
  
      // 将方向弧度映射到四个主方向（上/右/下/左）
      const roundedDirection = Math.round(this.direction / (Math.PI/2)) * (Math.PI/2);
      let dx = 0, dy = 0;
      switch (roundedDirection) {
        case 0: dx = 1; break;
        case Math.PI/2: dy = 1; break;
        case Math.PI: dx = -1; break;
        case -Math.PI/2: dy = -1; break;
      }
  
      // 生成1+3+5攻击范围网格（与技能逻辑一致）
      const triangleGrids = [];
      // 层1（1格）
      for (let offset = 0; offset <= 0; offset++) { // 关键修正：明确循环范围
        triangleGrids.push({ x: towerGridX + dx * 1, y: towerGridY + dy * 1 + (dx !== 0 ? offset : 0) });
      }
      // 层2（3格）
      for (let offset = -1; offset <= 1; offset++) {
        triangleGrids.push({ x: towerGridX + dx * 2 + (dy !== 0 ? offset : 0), y: towerGridY + dy * 2 + (dx !== 0 ? offset : 0) });
      }
      // 层3（5格）
      for (let offset = -2; offset <= 2; offset++) {
        triangleGrids.push({ x: towerGridX + dx * 3 + (dy !== 0 ? offset : 0), y: towerGridY + dy * 3 + (dx !== 0 ? offset : 0) });
      }
      this.skillRangeGrids = triangleGrids;
      this.showSkillRange = true; // 确保网格计算完成后再标记显示

      const applyDamage = () => {
        game.enemies.forEach(enemy => {
          const enemyGridX = Math.floor(enemy.x / gridSize);
          const enemyGridY = Math.floor(enemy.y / gridSize);
          const isInRange = this.skillRangeGrids.some(g => g.x === enemyGridX && g.y === enemyGridY);
          if (isInRange) {
            const skillattack = this.damage * 4.2;
            const damage = this.physicalAttack(skillattack, enemy.defense);
            this.damageTakenCounter += damage;
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
        applyDamage();
        this.isSkillActive = false;
        this.showSkillRange = false; // 两次攻击后隐藏范围
      }, 1000);
    }
  }

  deactivateSkill() {
    this.isSkillActive = false;
  }

  // 重写绘制方法（移除边框绘制）
  draw(ctx) {
    super.draw(ctx); // 绘制塔本身

    // 仅当塔被选中时，绘制技能范围填充
    if (this.isSelected) {
        this.drawSkillRangeFill(ctx); // 绘制填充（实时计算网格）
    }

    // 调用封装的充电状态绘制方法
    this.drawChargingIndicator(ctx);
  }

  // 新增：封装充电状态绘制方法
  drawChargingIndicator(ctx) {
    if (this.charging === 1) {
      ctx.save();
      // 基础配置
      const centerX = this.x;          // 数字中心x坐标（与数字位置一致）
      const centerY = this.y - 20;     // 数字中心y坐标（与数字位置一致）
      const currentTime = this.game.gameTime; // 游戏时间（用于动画）
      const rotateSpeed = 0.0015;      // 旋转速度（弧度/毫秒）
      const arrowRadius = 12;          // 箭头圆弧半径（同轨）
      const arrowLength = 6;           // 箭头尖端长度
      const lineWidth = 2;             // 箭头线宽
  
      // 绘制黄色数字"1"
      ctx.font = 'bold 16px Arial';
      ctx.fillStyle = '#FFD700';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText('1', centerX, centerY);
  
      // 箭头样式统一配置
      ctx.strokeStyle = '#FFD700';     // 黄色箭头
      ctx.lineWidth = lineWidth;
      ctx.lineCap = 'round';           // 线条端点圆形
  
      // 计算统一旋转角度（同向同速）
      const baseAngle = currentTime * rotateSpeed;
  
      // 绘制箭头1（起始角度baseAngle）
      ctx.beginPath();
      // 绘制1/3圆弧（0.6π弧度，约108度）
      ctx.arc(centerX, centerY-10, arrowRadius, baseAngle, baseAngle + 0.6 * Math.PI);
      // 绘制箭头尖端（圆弧结束点的切线方向）
      const endX1 = centerX + arrowRadius * Math.cos(baseAngle + 0.6 * Math.PI);
      const endY1 = centerY-10 + arrowRadius * Math.sin(baseAngle + 0.6 * Math.PI);
      const tipAngle1 = baseAngle + 0.6 * Math.PI - Math.PI/3; // 尖端偏离60度
      ctx.lineTo(
        endX1 + arrowLength * Math.cos(tipAngle1),
        endY1 + arrowLength * Math.sin(tipAngle1)
      );
      ctx.stroke();
  
      // 绘制箭头2（起始角度baseAngle + π，与箭头1对称）
      ctx.beginPath();
      ctx.arc(centerX, centerY-10, arrowRadius, baseAngle + Math.PI, baseAngle + Math.PI + 0.6 * Math.PI);
      // 绘制箭头尖端
      const endX2 = centerX + arrowRadius * Math.cos(baseAngle + Math.PI + 0.6 * Math.PI);
      const endY2 = centerY-10 + arrowRadius * Math.sin(baseAngle + Math.PI + 0.6 * Math.PI);
      const tipAngle2 = baseAngle + Math.PI + 0.6 * Math.PI - Math.PI/3;
      ctx.lineTo(
        endX2 + arrowLength * Math.cos(tipAngle2),
        endY2 + arrowLength * Math.sin(tipAngle2)
      );
      ctx.stroke();
  
      ctx.restore();
    }
  }

// 新增：实时计算并绘制技能范围填充
drawSkillRangeFill(ctx) {
    const gridSize = this.game.gridSize;
    const towerGridX = Math.floor(this.x / gridSize);
    const towerGridY = Math.floor(this.y / gridSize);
    const roundedDirection = Math.round(this.direction / (Math.PI/2)) * (Math.PI/2);
    let dx = 0, dy = 0;
    
    // 根据方向确定dx/dy（与技能逻辑一致）
    switch (roundedDirection) {
        case 0:         dx = 1; break;
        case Math.PI/2: dy = 1; break;
        case Math.PI:   dx = -1; break;
        case -Math.PI/2: dy = -1; break;
    }

    // 实时生成1+3+5攻击范围网格（与drawAttackRange逻辑一致）
    const triangleGrids = [];
    // 层1（1格）
    for (let offset = 0; offset <= 0; offset++) {
        triangleGrids.push({ x: towerGridX + dx * 1, y: towerGridY + dy * 1 + (dx !== 0 ? offset : 0) });
    }
    // 层2（3格）
    for (let offset = -1; offset <= 1; offset++) {
        triangleGrids.push({ x: towerGridX + dx * 2 + (dy !== 0 ? offset : 0), y: towerGridY + dy * 2 + (dx !== 0 ? offset : 0) });
    }
    // 层3（5格）
    for (let offset = -2; offset <= 2; offset++) {
        triangleGrids.push({ x: towerGridX + dx * 3 + (dy !== 0 ? offset : 0), y: towerGridY + dy * 3 + (dx !== 0 ? offset : 0) });
    }

    // 绘制填充
    ctx.save();
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)'; // 与普通攻击范围透明度一致
    triangleGrids.forEach(grid => {
        const x = grid.x * gridSize;
        const y = grid.y * gridSize;
        ctx.fillRect(x, y, gridSize, gridSize);
    });
    ctx.restore();
}

  // drawAttackRange方法（保持原逻辑，由isSelected控制）
}