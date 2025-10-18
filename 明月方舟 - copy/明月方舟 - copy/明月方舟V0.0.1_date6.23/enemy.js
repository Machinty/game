class Enemy {
  constructor(x, y, health, speed, type, color, path, game,defense) {
    this.defense = defense; // 敌人基础防御力
    this.x = x;
    this.y = y;
    this.maxHealth = health;
    this.health = health;
    this.speed = speed;
    this.type = type;
    this.color = color;
    this.path = path;
    this.currentWaypoint = 0;
    this.width = 20;
    this.height = 20;
       // 新增：碰撞半径（假设敌人为圆形，半径为宽度的一半）
    this.radius = 5; // 关键修改
    this.flying = false; // 所有敌人都是地面单位
    this.isBlocked = false; // 是否被地面塔阻挡
    this.targetTower = null; // 攻击目标塔（改为最近的阻挡塔）
    this.attackDamage = 300; // 攻击伤害值
    this.baseAttackDamage = this.attackDamage; // 存储原始攻击力
    this.lastAttackTime = 0; // 上次攻击时间
    this.attackInterval = 3000; // 攻击间隔(毫秒)
    this.attackCooldown = false; // 攻击冷却状态
    this.timestamp = Date.now(); // 当前时间戳
    this.isStunned = false; // 是否被眩晕（无法移动/攻击/被阻挡）
    this.throwerMark = false; // 是否被投掷手标记
    this.markExpireTime = 0; // 标记过期时间（毫秒）
    this.stunExpireTime = 0; // 晕眩过期时间（毫秒）
    this.game = game; // 引用游戏实例
    this.particleEffectAdded = false; // 标记是否已经添加粒子特效
    this.isSlowed = false;       // 是否处于减速状态
    this.slowExpireTime = 0;     // 减速效果过期时间（毫秒）
    this.slowPercentage = 1;     // 减速百分比（0-1，1表示原速）
    this.blockOffsetX = 0;       // 水平方向偏移量
    this.blockOffsetY = 0;       // 垂直方向偏移量
    this.hasInitialBlockOffset = false; // 标记是否已处理第一次阻挡

    // 新增：烧伤相关属性
    this.burnLayers = 0;         // 当前烧伤层数
    this.isBurning = false;      // 是否处于燃烧状态
    this.burnStartTime = 0;      // 进入燃烧状态时间
    // 新增星火状态属性
    this.spark = false;          // 是否拥有星火状态
    this.sparkBurnLayers = 0;    // 触发星火时的烧伤层数（用于计算传递层数）
    // 新增：烧伤结算后记录的层数（关键修改）
    this.lastBurnLayersAfterSettlement = 0; // 初始为0（第一次结算前无记录）
    this.summationSparkBurn=0
    // 原有烧伤伤害显示属性（未修改）
    this.displayBurnDamage = null; 
    this.displayBurnDamageTime = 0; 

    this.attackedByFireDragon=false
    this.isBeingHitByDragon = false; // 新增：状态锁，防止重复触发

    
  }

  update(deltaTime, towers = [], gameTime = 0) {
    // 处理标记过期
    if (this.throwerMark && gameTime > this.markExpireTime) {
      this.throwerMark = false;
    }

    // 处理晕眩过期
    if (this.isStunned && gameTime > this.stunExpireTime) {
      this.isStunned = false;
    }

    // 新增：处理减速过期
    if (this.isSlowed && gameTime > this.slowExpireTime) {
      this.isSlowed = false;
      this.slowPercentage = 1; // 恢复原速度百分比
    }

    if (this.displayBurnDamageTime > 0) {
      this.displayBurnDamageTime -= deltaTime;
      if (this.displayBurnDamageTime <= 0) {
        this.displayBurnDamage = null; // 时间耗尽后清空
      }
    }

    if(this.attackedByFireDragon&& !this.isBeingHitByDragon){

      this.isBeingHitByDragon = true; // 加锁防止重复调用
      this.hitByShaoDragon(towers)
    }


    // 新增：处理烧伤状态
    if (this.burnLayers > 0) {
      // 未进入燃烧状态时，触发进入燃烧状态
      if (!this.isBurning) {
        this.isBurning = true;
        this.burnStartTime = gameTime; // 记录当前时刻
      }
    
      // 计算烧伤触发间隔（层数越高间隔越短）
      const minLayers = 5;    // 最低层数（4秒）
      const maxLayers = 200;  // 最高层数（2秒）
      const minInterval = 1000; // 2秒（毫秒）
      const maxInterval = 3000; // 4秒（毫秒）
    
      // 计算线性插值的间隔时间
      let interval;
      if (this.burnLayers <= minLayers) {
        interval = maxInterval; // 层数≤5时保持4秒
      } else if (this.burnLayers >= maxLayers) {
        interval = minInterval; // 层数≥200时保持2秒
      } else {
        // 线性插值公式：interval = maxInterval - (层数差) * (时间差)/(层数差)
        const layerDiff = this.burnLayers - minLayers;
        const totalLayerRange = maxLayers - minLayers;
        const timeDiff = maxInterval - minInterval;
        interval = maxInterval - (layerDiff * timeDiff) / totalLayerRange;
      }
    
      // 处于燃烧状态时，按动态间隔触发伤害
      const burnDuration = gameTime - this.burnStartTime;
      if (burnDuration >= interval) { // 使用动态间隔替代固定4秒
        // 计算并扣除伤害（250 * 当前层数）
        const burnDamage = 250 * this.burnLayers;

        this.health -= burnDamage;
        if (burnDamage > this.maxHealth * 0.1) {
          this.displayBurnDamage = burnDamage; // 记录本次伤害值
          this.displayBurnDamageTime = 700; // 显示时间为动态间隔  
        }
    
        // 层数减半（向下取整）
        this.burnLayers = Math.floor(this.burnLayers / 2);

        this.lastBurnLayersAfterSettlement = this.burnLayers;
        this.summationSparkBurn = 0
    
        // 重置计时，继续下一轮燃烧（若层数>0）
        this.burnStartTime = gameTime;
    
        // 层数减到0时退出燃烧状态
        if (this.burnLayers <= 0) {
          this.isBurning = false;
          this.burnStartTime = 0;
        }
      }
    } else {
      // 无层数时强制退出燃烧状态
      this.isBurning = false;
      this.burnStartTime = 0;
    }

    // 新增：燃烧状态结束时清除星火
    if (!this.isBurning && this.burnLayers <= 0) {
      this.spark = false;
    }
  
    // 敌人死亡时处理星火效果
    if (this.health <= 0 && this.spark) {
      // 计算范围伤害（Shao塔攻击力1.5倍）
      const shaoTower = towers.find(t => t.type === 'shao');
      const explosionDamage = shaoTower ? shaoTower.damage * 1.5 : 100;

      
      // 查找范围内敌人并施加效果
      this.game.enemies.forEach(enemy => {
        if (enemy === this) return; // 排除自身
        const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
        if (distance <= 60) {
          // 范围伤害
          enemy.health -= explosionDamage;
          
          // 施加烧伤（层数为自身层数的一半向下取整）
          const transferLayers = Math.floor(this.burnLayers / 2);
          if (transferLayers > 0) {
            if((enemy.summationSparkBurn+transferLayers)>=enemy.lastBurnLayersAfterSettlement){
              enemy.burnLayers = enemy.lastBurnLayersAfterSettlement
              enemy.summationSparkBurn = enemy.lastBurnLayersAfterSettlement
            }

            else{
            enemy.burnLayers += transferLayers;
            enemy.summationSparkBurn +=transferLayers
            }
          }
        }
      });

      // 添加范围伤害视觉特效
      this.game.addEffect({
        type: 'aoe',
        x: this.x,
        y: this.y,
        radius: 60,
        color: 'rgba(255, 165, 0, 0.4)', // 橙色半透明
        duration: 300
      });

      // 清除星火状态
      this.spark = false;
    }





    if (this.currentWaypoint >= this.path.length || this.isStunned) return;

    // 新增：检查是否被任意地面塔或邵塔阻挡（存在于至少一个塔的blockedEnemies中）
    const isBlockedByAnyTower = towers.some(tower => 
      (tower.type === 'ground' || tower.type === 'shao') &&  // 关键修改：添加对邵塔的判断
      tower.blockedEnemies.includes(this)
    );

    // 计算阻挡偏移量（仅第一次被阻挡时更新）
    if (isBlockedByAnyTower) {
      if (!this.hasInitialBlockOffset) { 
        const blockingTower = towers.find(tower => 
          tower.type === 'ground' && tower.blockedEnemies.includes(this)
        );
        
        if (blockingTower) {
          // 获取敌人在阻挡列表中的索引（0=第1个，1=第2个，2=第3个）
          const enemyIndex = blockingTower.blockedEnemies.indexOf(this);
          // 将塔的弧度方向转换为0-3的方向编号（0=右，1=下，2=左，3=上）
          const towerDirection = Math.round(blockingTower.direction / (Math.PI / 2)) % 4;
      
          // 根据塔方向和敌人索引设置偏移量（用户需求示例逻辑）
          switch (towerDirection) {
            case 0: // 塔方向：右（朝右）
              switch (enemyIndex) {
                case 0: this.blockOffsetX = 0; this.blockOffsetY = 5; break;  // 第1个敌人：右偏移
                case 1: this.blockOffsetX = 0; this.blockOffsetY = 0; break;  // 第2个敌人：无偏移
                case 2: this.blockOffsetX = 0; this.blockOffsetY = -5; break; // 第3个敌人：左偏移
              }
              break;
            case 1: // 塔方向：下（朝下）
              switch (enemyIndex) {
                case 0: this.blockOffsetX = 5; this.blockOffsetY = 0; break;  // 第1个敌人：下偏移
                case 1: this.blockOffsetX = 0; this.blockOffsetY = 0; break;  // 第2个敌人：无偏移
                case 2: this.blockOffsetX = -5; this.blockOffsetY = 0; break; // 第3个敌人：上偏移
              }
              break;
            case 2: // 塔方向：左（朝左）
              switch (enemyIndex) {
                case 0: this.blockOffsetX = 0; this.blockOffsetY = 5; break;  // 第1个敌人：上偏移（用户需求示例）
                case 1: this.blockOffsetX = 0; this.blockOffsetY = 0; break;  // 第2个敌人：无偏移
                case 2: this.blockOffsetX = 0; this.blockOffsetY = -5; break; // 第3个敌人：下偏移（用户需求示例）
              }
              break;
            case 3: // 塔方向：上（朝上）
              switch (enemyIndex) {
                case 0: this.blockOffsetX = -5; this.blockOffsetY = 0; break; // 第1个敌人：左偏移（示例）
                case 1: this.blockOffsetX = 0; this.blockOffsetY = 0; break;  // 第2个敌人：无偏移
                case 2: this.blockOffsetX = 5; this.blockOffsetY = 0; break;  // 第3个敌人：右偏移（示例）
              }
              break;
          }
      
          this.hasInitialBlockOffset = true; // 标记已处理第一次阻挡
        }
      }
    } else {
      // 未被阻挡时重置偏移和标记，以便下次被阻挡时重新计算
      this.blockOffset = 0;
      this.hasInitialBlockOffset = false;
    }

    // 移动逻辑：仅当未被任何塔阻挡且未眩晕时移动
    if (!isBlockedByAnyTower && !this.isStunned) {
      const target = this.path[this.currentWaypoint];
      const dx = target.x - this.x;
      const dy = target.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const actualSpeed = this.speed * (this.isSlowed ? this.slowPercentage : 1) * (deltaTime / 10);

      if (distance < actualSpeed) {
        this.x = target.x;
        this.y = target.y;
        this.currentWaypoint++;
      } else {
        this.x += (dx / distance) * actualSpeed;
        this.y += (dy / distance) * actualSpeed;
      }
    }

    // 攻击逻辑：寻找最近的阻挡塔作为目标
    if (!this.isStunned) {
      let closestBlockedTower = null;
      let minDistance = Infinity;
      for (const tower of towers) {
        // 关键修改：同时检查地面塔和邵塔的阻挡关系
        if ((tower.type === 'ground' || tower.type === 'shao') && tower.blockedEnemies.includes(this)) { 
          const distance = tower.getDistanceToEnemy(this);
          if (distance < minDistance && distance <= 30) {
            minDistance = distance;
            closestBlockedTower = tower;
          }
        }
      }
      this.targetTower = closestBlockedTower;

    
      // 攻击目标塔（原有逻辑）
      if (this.targetTower) {
        if (!this.attackCooldown) {
          const finalDamage = this.physicalAttack(this.attackDamage, this.targetTower.defense);
          // 关键修复：限制塔生命值不低于0
          this.targetTower.health = Math.max(0, this.targetTower.health - finalDamage);
          // 若目标是邵塔，累计受击伤害并检查条件3（25%最大生命值）
          if (this.targetTower.type === 'shao') {
            this.targetTower.damageTakenCounter += finalDamage;
            // 当累计伤害达到最大生命值25%时触发


          }
          this.attackCooldown = true;
          this.lastAttackTime = gameTime;
        }
        if (gameTime - this.lastAttackTime >= this.attackInterval) {
          this.attackCooldown = false;
        }
      }
    }

    // 原有投掷手标记逻辑（未修改）
    if (this.throwerMark && !this.particleEffectAdded) {
      this.game.addParticleEffect(this);
      this.particleEffectAdded = true;
    }
  }

  draw(ctx) {
      // 绘制敌人（应用二维偏移）
      ctx.beginPath();
      if (this.flying) {
          // 飞行敌人（调整x和y坐标）
          ctx.ellipse(
            this.x + this.blockOffsetX, 
            this.y + this.blockOffsetY, 
            this.width / 1.5, 
            this.height, 
            0, 
            0, 
            Math.PI * 2
          );
          ctx.fillStyle = this.color;
          ctx.fill();
      
          // 绘制翅膀（调整x和y坐标）
          ctx.beginPath();
          ctx.ellipse(
            (this.x + this.blockOffsetX) - 10, 
            (this.y + this.blockOffsetY) - 10, 
            8, 
            4, 
            0, 
            0, 
            Math.PI * 2
          );
          ctx.ellipse(
            (this.x + this.blockOffsetX) + 10, 
            (this.y + this.blockOffsetY) - 10, 
            8, 
            4, 
            0, 
            0, 
            Math.PI * 2
          );
          ctx.fillStyle = '#ffffff';
          ctx.fill();
      } else {
          // 地面敌人（调整x和y坐标）
          ctx.rect(
            (this.x + this.blockOffsetX) - this.width / 2, 
            (this.y + this.blockOffsetY) - this.height / 2, 
            this.width, 
            this.height
          );
          ctx.fillStyle = this.color;
          ctx.fill();
      
          // 绘制腿（调整x和y坐标）
          ctx.beginPath();
          ctx.rect(
            (this.x + this.blockOffsetX) - 6, 
            (this.y + this.blockOffsetY) + 10, 
            4, 
            8
          );
          ctx.rect(
            (this.x + this.blockOffsetX) + 2, 
            (this.y + this.blockOffsetY) + 10, 
            4, 
            8
          );
          ctx.fillStyle = '#333';
          ctx.fill();
      }
  
      // 绘制生命值条（调整x和y坐标）
      const healthBarWidth = this.width;
      const healthBarHeight = 4;
      const healthPercentage = this.health / this.maxHealth;
  
      // 背景（调整x和y坐标）
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(
        (this.x + this.blockOffsetX) - healthBarWidth / 2, 
        (this.y + this.blockOffsetY) - this.height / 2 - 8, 
        healthBarWidth, 
        healthBarHeight
      );
  
      // 当前生命值（调整x和y坐标）
      ctx.fillStyle = '#00ff00';
      ctx.fillRect(
        (this.x + this.blockOffsetX) - healthBarWidth / 2, 
        (this.y + this.blockOffsetY) - this.height / 2 - 8, 
        healthBarWidth * healthPercentage, 
        healthBarHeight
      );
  
      // 新增：绘制烧伤即将损失的生命值（橙色，仅当处于燃烧状态时显示）
      if (this.isBurning && this.burnLayers > 0) {
        // 计算下一阶段的烧伤伤害（150 * 当前层数）
        const burnDamage = 250 * this.burnLayers;
        // 转换为血条宽度（不超过当前剩余生命值）
        const burnRatio = Math.min(burnDamage / this.maxHealth, healthPercentage);
        const burnWidth = healthBarWidth * burnRatio;
        
        // 橙色条叠加在当前生命值条右侧
        ctx.fillStyle = '#FFA500'; // 橙色
        ctx.fillRect(
          (this.x + this.blockOffsetX) - healthBarWidth / 2 + (healthBarWidth * healthPercentage - burnWidth), 
          (this.y + this.blockOffsetY) - this.height / 2 - 8, 
          burnWidth, 
          healthBarHeight
        );
      }
  
      // 绘制眩晕特效（调整x和y坐标）
      if (this.isStunned) {
          this.drawStunEffect(ctx, this.blockOffsetX, this.blockOffsetY);
      }
  
      // 新增：绘制星火状态视觉效果（红色闪烁光环）
      if (this.spark) {
          this.drawSparkEffect(ctx, this.blockOffsetX, this.blockOffsetY);
      }
      
      this.drawBurnDamageDisplay(ctx, this.blockOffsetX, this.blockOffsetY);
      }
  
  
    



  
  // 新增：星火状态绘制方法（接收二维偏移）
  drawSparkEffect(ctx, offsetX, offsetY) {
      ctx.save();
      // 动态透明度（使用游戏时间避免与Date.now()同步问题）
      const alpha = 0.3 + Math.sin(this.game.gameTime * 0.01) * 0.2;
      ctx.strokeStyle = `rgba(255, 0, 0, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      // 应用阻挡偏移量
      ctx.arc(
        this.x + offsetX,  // 水平偏移
        this.y + offsetY,  // 垂直偏移
        18,  // 光环半径
        0,
        Math.PI * 2
      );
      ctx.stroke();
      ctx.restore();
  }
  
  // 原有眩晕特效绘制方法（未修改）
  drawStunEffect(ctx, offsetX, offsetY) {
      const centerX = this.x + offsetX;
      const centerY = (this.y + offsetY) - this.height / 2 - 8;
      const radius = 6;// 眩晕效果半径
      const numPoints = 40;// 多边形顶点数
      const rotationSpeed = 0.01;// 旋转速度
      const currentTime = Date.now();// 当前时间
      const rotation = currentTime * rotationSpeed;// 计算当前旋转角度
  
      ctx.beginPath();// 开始绘制路径
      ctx.strokeStyle = 'white';// 设置线条颜色
      ctx.lineWidth = 2;// 设置线条宽度
  
      for (let i = 0; i < numPoints; i++) {// 绘制多边形
          const angle = (i / numPoints) * Math.PI * 2 + rotation;// 计算顶点角度
          const r = radius * (i / numPoints);// 计算顶点半径
          const x = centerX + r *2* Math.cos(angle);// 计算顶点x坐标
          const y = centerY + r * Math.sin(angle);// 计算顶点y坐标
  
          if (i === 0) {
              ctx.moveTo(x, y);
          } else {
              ctx.lineTo(x, y);
          }
      }
  
      ctx.stroke();

   
  }

  


  drawBurnDamageDisplay(ctx, offsetX, offsetY) {
    if (this.displayBurnDamage === null || this.displayBurnDamageTime <= 0) return;

    ctx.save();
    // 设置橙色字体样式
    ctx.font = 'bold 12px Arial';
    ctx.fillStyle = '#FFA500'; // 橙色
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    // 计算显示位置（敌人头顶上方，应用偏移量）
    const textX = this.x ;
    const textY = this.y - 20;

    // 绘制伤害数值（带负号）
    ctx.fillText(`${this.displayBurnDamage}`, textX, textY);
    ctx.restore();
  }

  //处理被邵的龙击中
  hitByShaoDragon(towers) {
    this.spark = true
    let shaoTower=towers.find(t => t.type === 'shao');
    const skillDamage = shaoTower ? shaoTower.damage * 5.8: 100;
    for (let i = 0; i < 5; i++) {

      setTimeout(() => {
        const burnLayers = this.burnLayers;
        // 计算 8 的整倍数
        const eightMultiple = Math.floor(burnLayers / 8);
        const bonusPercentage = Math.min(eightMultiple * 0.05, 0.5);
        let attackeddamage=this.physicalAttack(skillDamage, this.defense);
        let willdecreasehealth=attackeddamage* (1 + bonusPercentage);
    
        this.burnLayers += 26;
        this.health-=willdecreasehealth;
        if(i==4){
          this.attackedByFireDragon=false;
          this.isBeingHitByDragon = false; // 处理完成后解锁
        }
      }, 500*(i));
    }

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