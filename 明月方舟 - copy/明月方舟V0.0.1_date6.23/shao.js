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
    this.isEgoActive = false; // 新增：EGO展现状态标记
    this.egoBurnInterval = null; // 新增：存储定时器 ID
    this.specialCharge = 0; // 新增：特殊充能数量
  }




  update(deltaTime, enemies, bullets) {
    super.update(deltaTime, enemies, bullets);


    if(!this.isEgoActive){
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



    const currentGameTime = this.game.gameTime; 
    this.moodcoinupdate(currentGameTime)
    } 
    else {
      // EGO状态下的特殊充能逻辑
      this.charging=0
      if (this.specialCharge === 0) { // 仅当无特殊充能时才回复能量
        this.currentMana += deltaTime / 1000;
        // 能量回满时触发特殊充能
        if (this.currentMana >= this.maxMana) {
          this.specialCharge += 1;    // 获得1个特殊充能
          this.currentMana = 0;       // 清空当前能量
        }
      }
    }

    if (this.isEgoActive) {
      this.onEgoState(deltaTime, enemies, bullets);
    }



  }

  shoot(bullets, enemies) {
    if (!this.target) return;

    // 地面塔和邵塔共享攻击逻辑
    if (this.type === 'shao') {
      const targets = Array.isArray(this.target) ? this.target : [this.target];
      for (const enemy of targets) {
        if (enemy.health > 0) {
          // 计算基础伤害
          let baseDamage = this.physicalAttack(this.damage, enemy.defense);

          // 若情感硬币达到 4 个，计算伤害提升
          if (this.moodcoin >= 4) {
            const burnLayers = enemy.burnLayers;
            // 计算 8 的整倍数
            const eightMultiple = Math.floor(burnLayers / 8);
            const bonusPercentage = Math.min(eightMultiple * 0.05, 0.5);
            baseDamage *= (1 + bonusPercentage);
          }

          enemy.health -= baseDamage;

          // 邵塔专属逻辑：累计攻击伤害
          this.attackDamageCounter += baseDamage;
          // 添加 3 - 4 层烧伤
          const addedLayers = Math.floor(Math.random() * 2) + 3;
          enemy.burnLayers += addedLayers;
          // 施加星火状态
          enemy.spark = true;
          enemy.sparkBurnLayers = enemy.burnLayers;
        }
      }
    } else if (this.type === 'high') {
      // 高空塔/投掷塔原有逻辑
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

    if (this.moodcoin >= 16 && !this.isEgoActive) {
      this.isEgoActive = true;
      this.damage *= 1.3;
      this.maxMana = 28;
      this.currentMana=0
      this.onEgoState(0, this.game.enemies, []);
    }


  }



  // 技能激活方法（移除showSkillRange相关逻辑）
  activateSkill() {
    if(!this.isEgoActive){
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
          const isInRange = this.skillRangeGrids.some(g => g.x === enemyGridX && g.y === enemyGridY)
                            || this.blockedEnemies.includes(enemy); // 关键修改点
          if (isInRange) {
            let skillattack = this.damage * 4.2;

            let damage = this.physicalAttack(skillattack, enemy.defense);

            // 若情感硬币达到 4 个，额外伤害提升
            if (this.moodcoin >= 4) {
              const burnLayers = enemy.burnLayers;
              // 计算 8 的整倍数
              const eightMultiple = Math.floor(burnLayers / 8);
              const bonusPercentage = Math.min(eightMultiple * 0.05, 0.5);
              damage *= (1 + bonusPercentage);
            }


            this.damageTakenCounter += damage;
            enemy.spark = true;
            enemy.health -= damage;
            enemy.burnLayers += 28;
          }
        });
      }
      
  
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
    if(this.isEgoActive){


    }


  }

  onEgoState(deltaTime, enemies, bullets) {


    // 若 EGO 状态激活且定时器未设置，则启动定时器
    if (this.isEgoActive && !this.egoBurnInterval) {
      this.egoBurnInterval = setInterval(() => {
        const game = this.game;
        // 遍历所有敌人
        game.enemies.forEach((enemy) => {
          // 为每个敌人添加 1 层烧伤
          enemy.burnLayers += 2;
          // 若敌人未处于燃烧状态且烧伤层数大于 0，将其设为燃烧状态并记录开始时间
        });
      }, 1500);
    }
  }

    // 新增：清理EGO状态定时器的方法
    destroy() {
      if (this.egoBurnInterval) {
        clearInterval(this.egoBurnInterval); // 清除定时器
        this.egoBurnInterval = null; // 重置定时器ID
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

    this.drawBottomBorder(ctx)



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
  if(!this.isEgoActive){
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
}

  // drawAttackRange方法（保持原逻辑，由isSelected控制）

   /**
   * 绘制底部白色边框（原game.js中的drawFirstSegmentBorder逻辑）
   * @param {CanvasRenderingContext2D} ctx - 画布上下文
   */
    drawBottomBorder(ctx) {
      if(this.specialCharge == 1){
      const yStart = 350;    // 下方区域起始y坐标（与遮盖层一致）
      const yEnd = 450;      // 下方区域结束y坐标（与遮盖层一致）
      const totalSegments = 12; // 横向分割为12份（与game.js一致）
      const segmentWidth = this.game.width / totalSegments; // 每份宽度（依赖game的宽度）
      
      // 计算边框参数（与原逻辑一致）
      const borderX = 0;               // 第一个块从x=0开始
      const borderY = yStart;          // 边框y起始位置
      const borderWidth = segmentWidth; // 边框宽度
      const borderHeight = yEnd - yStart; // 边框高度
  
      // 绘制白色边框
      ctx.strokeStyle = 'white';  // 白色边框
      ctx.lineWidth = 2;          // 边框线宽
      ctx.strokeRect(borderX, borderY, borderWidth, borderHeight);
    }
  }




}