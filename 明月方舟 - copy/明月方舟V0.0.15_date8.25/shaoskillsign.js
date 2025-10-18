class ShaoSign extends Tower {
      /**
   * 构造函数（新增邵参数）
   * @param {number} x - 塔的x坐标
   * @param {number} y - 塔的y坐标
   * @param {number} damage - 基础攻击伤害
   * @param {number} range - （不再使用）原攻击范围
   * @param {string} color - 塔的颜色
   * @param {number} health - 塔的生命值
   * @param {Game} game - 游戏实例引用
   * @param {ShaoTower} throwerTower - 关联的投掷手塔实例
   * */



    constructor(x, y, damage, range, health, game,ShaoTower) {
        super(x, y, 'sign', damage, range, '#FF0000', health, game);
        this.ShaoTower = ShaoTower; // 存储关联的投掷手塔实例
        this.deployTime = 0; // 记录部署时的游戏时间（毫秒）
        this.bulletSpawned = false; // 标记是否已生成子弹
        

    }
    
    update(deltaTime,enemies,bullets){
      super.update(deltaTime,enemies,bullets);
      const currentTime = this.game.gameTime;
      if(!this.bulletSpawned && currentTime){
      // 部署完成后，将关联邵塔的 specialCharge 设为 0
       if (this.ShaoTower) {
       this.ShaoTower.specialCharge = 0;
         }
        const { x, y } = this.calculateLocation();  // 从坐标集合中提取 x 和 y
        let angle = this.calculateAngle(x,y)
        let producetime = this.game.gameTime
        if (currentTime - this.deployTime >= 1000) {
        bullets.push(new FireDragon(
          x, 
          y, 
          angle, 
          0,
          '#FF0000',
          this.game,
          producetime
        ));
        this.bulletSpawned = true; // 防止重复生成
        }
      }

          // 检查是否已部署超过 2 秒（2000 毫秒）


    if (currentTime - this.deployTime >= 4000) {
      this.autoRetreat(); // 触发自动撤退
    }
  }

  // 自动撤退逻辑
  autoRetreat() {
    const game = this.game;
    const towerIndex = game.towers.indexOf(this);

    // 从塔数组中移除自身
    if (towerIndex !== -1) {
      game.towers.splice(towerIndex, 1);

      // 释放占用的网格（与游戏中其他塔的撤退逻辑一致）
      const gridX = Math.floor(this.x / game.gridSize);
      const gridY = Math.floor(this.y / game.gridSize);
      if (gridY >= 0 && gridY < game.grid.length && gridX >= 0 && gridX < game.grid[0].length) {
        game.grid[gridY][gridX] = false;
      }
    }
  }

  calculateAngle(x,y
    ) {

    const dx = this.x - x; // ShaoSign 相对于子弹起点的 x 偏移
    const dy = this.y - y; // ShaoSign 相对于子弹起点的 y 偏移
    return Math.atan2(dy, dx); // 计算指向 ShaoSign 的角度（弧度）

  }

  calculateX() {
      const tx = this.x; // ShaoSign 的 x 坐标
      const ty = this.y; // ShaoSign 的 y 坐标
      const theta = this.calculateAngle(); // 随机角度
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      const screenWidth = 600; // 屏幕宽度固定为600
      const screenHeight = 350; // 屏幕高度固定为350
      const tValues = []; // 存储有效交点的参数 t
  
      // 计算与左右边界（x=0/x=600）的交点
      if (cosTheta !== 0) {
          // 左边界 x=0 对应的 t 值
          const tLeft = (0 - tx) / cosTheta;
          const yLeft = ty + tLeft * sinTheta;
          if (yLeft >= 0 && yLeft <= screenHeight) {
              tValues.push(tLeft);
          }
  
          // 右边界 x=600 对应的 t 值
          const tRight = (screenWidth - tx) / cosTheta;
          const yRight = ty + tRight * sinTheta;
          if (yRight >= 0 && yRight <= screenHeight) {
              tValues.push(tRight);
          }
      }
  
      // 计算与上下边界（y=0/y=350）的交点
      if (sinTheta !== 0) {
          // 上边界 y=0 对应的 t 值
          const tTop = (0 - ty) / sinTheta;
          const xTop = tx + tTop * cosTheta;
          if (xTop >= 0 && xTop <= screenWidth) {
              tValues.push(tTop);
          }
  
          // 下边界 y=350 对应的 t 值
          const tBottom = (screenHeight - ty) / sinTheta;
          const xBottom = tx + tBottom * cosTheta;
          if (xBottom >= 0 && xBottom <= screenWidth) {
              tValues.push(tBottom);
          }
      }
  
      // 无有效交点时返回自身坐标（异常处理）
      if (tValues.length === 0) return tx;
  
      // 选择绝对值最大的 t（离 ShaoSign 最远的交点）
      const maxT = tValues.reduce((max, t) => Math.abs(t) > Math.abs(max) ? t : max, tValues[0]);
      return tx + maxT * cosTheta;
  }

  calculateY() {
      // 逻辑与 calculateX 一致，计算 y 坐标
      const tx = this.x;
      const ty = this.y;
      const theta = this.calculateAngle();
      const cosTheta = Math.cos(theta);
      const sinTheta = Math.sin(theta);
      const screenWidth = 600;
      const screenHeight = 350;
      const tValues = [];
  
      if (cosTheta !== 0) {
          const tLeft = (0 - tx) / cosTheta;
          const yLeft = ty + tLeft * sinTheta;
          if (yLeft >= 0 && yLeft <= screenHeight) {
              tValues.push(tLeft);
          }
  
          const tRight = (screenWidth - tx) / cosTheta;
          const yRight = ty + tRight * sinTheta;
          if (yRight >= 0 && yRight <= screenHeight) {
              tValues.push(tRight);
          }
      }
  
      if (sinTheta !== 0) {
          const tTop = (0 - ty) / sinTheta;
          const xTop = tx + tTop * cosTheta;
          if (xTop >= 0 && xTop <= screenWidth) {
              tValues.push(tTop);
          }
  
          const tBottom = (screenHeight - ty) / sinTheta;
          const xBottom = tx + tBottom * cosTheta;
          if (xBottom >= 0 && xBottom <= screenWidth) {
              tValues.push(tBottom);
          }
      }
  
      if (tValues.length === 0) return ty;
  
      const maxT = tValues.reduce((max, t) => Math.abs(t) > Math.abs(max) ? t : max, tValues[0]);
      return ty + maxT * sinTheta;
  }


  calculateLocation(){
        // 生成0-3的随机投点数值（包含0和3）
        const random = Math.floor(Math.random() * 4); 
        let x, y;
    
        // 根据投点数值分配坐标
        switch (random) {
          case 0: // 上边界（Y=0）
            y = 0;
            x = Math.random() * 600; // X在0~600之间随机
            break;
          case 1: // 下边界（Y=350）
            y = 350;
            x = Math.random() * 600; // X在0~600之间随机
            break;
          case 2: // 左边界（X=0）
            x = 0;
            y = Math.random() * 350; // Y在0~350之间随机
            break;
          case 3: // 右边界（X=600）
            x = 600;
            y = Math.random() * 350; // Y在0~350之间随机
            break;
          default: // 异常情况（理论上不会触发）
            x = this.x; // 回退到当前塔的X坐标
            y = this.y; // 回退到当前塔的Y坐标
        }
    


    return {x,y}
  }

}
    

    


