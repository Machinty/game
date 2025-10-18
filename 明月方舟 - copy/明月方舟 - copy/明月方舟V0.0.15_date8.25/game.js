/**
 * 游戏主类，负责管理游戏状态、渲染和逻辑
 * @class
 */
class Game {
    /**
   * 初始化游戏实例
   * @constructor
   */
  /**
   * 初始化游戏实例
   * @constructor
   * @property {Array} effects - 存储特效对象的数组，默认为空数组
   * @property {number} gameTime - 全局游戏计时器(毫秒)，默认为0
   * @property {HTMLCanvasElement} canvas - 游戏画布元素
   * @property {CanvasRenderingContext2D} ctx - 画布2D渲染上下文
   * @property {number} width - 画布宽度(像素)
   * @property {number} height - 画布高度(像素)
   * @property {Array<HTMLElement>} buttons - 游戏控制按钮数组
   * @property {Array} towers - 已放置的防御塔数组，默认为空
   * @property {Array} enemies - 当前存在的敌人数组，默认为空
   * @property {Array} bullets - 当前存在的子弹数组，默认为空
   * @property {number} wave - 当前波次数，默认为1
   * @property {number} money - 玩家当前金钱，默认为10
   * @property {number} health - 玩家当前生命值，默认为10
   * @property {number|null} selectedTower - 当前选中的塔类型索引，未选择时为null
   * @property {boolean} isDragging - 是否正在拖拽塔，默认为false
   * @property {boolean} isPlacing - 是否处于放置塔状态，默认为false
   * @property {boolean} isDeploying - 是否处于部署塔方向状态，默认为false
   * @property {Object|null} draggedTower - 当前被拖拽的塔对象，未拖拽时为null
   * @property {Object} draggedPosition - 当前拖拽位置的坐标{x,y}
   * @property {boolean} normalSpeed - 游戏是否处于正常速度(非暂停)，默认为true
   * @property {number} gridSize - 网格大小(像素)，默认为50
   * @property {Array<Array<boolean>>} grid - 表示网格占用状态的二维数组
   * @property {Array<Object>} towerTypes - 塔类型配置数组
   * @property {Array<Object>} enemyTypes - 敌人类型配置数组
   * @property {Array<Object>} path - 敌人行进路径点数组
   * @property {Object} startPoint - 敌人出生点(路径第一个点)
   * @property {Object} endPoint - 敌人终点(路径最后一个点)
   * @property {number} lastEnemySpawn - 上次生成敌人的时间戳，默认为0
   * @property {number} enemySpawnInterval - 敌人生成间隔(毫秒)，默认为2000
   * @property {boolean} gameOver - 游戏是否结束，默认为false
   * @property {boolean} victory - 游戏是否胜利，默认为false
   * @property {number} lastTime - 上一帧的时间戳，用于计算时间增量
   */
  constructor() {
    this.effects = []; // 存储特效对象的数组
    this.gameTime = 0; // 全局游戏计时器(毫秒)
    this.canvas = document.getElementById('gameCanvas'); // 游戏画布元素
    this.ctx = this.canvas.getContext('2d'); // 画布2D渲染上下文
    this.width = this.canvas.width; // 画布宽度(像素)
    this.height = this.canvas.height; // 画布高度(像素)
    this.buttons = [
      document.getElementById('startWaveBtn'), // 开始波次按钮
      document.getElementById('groundTowerBtn'), // 地面塔按钮
      document.getElementById('highTowerBtn'), // 高空塔按钮
      document.getElementById('throwerTowerBtn'), // 投掷塔按钮
      document.getElementById('speedToggleBtn') // 速度切换按钮
    ];
    this.towers = []; // 已放置的防御塔数组
    this.enemies = []; // 当前存在的敌人数组
    this.bullets = []; // 当前存在的子弹数组
    this.wave = 1; // 当前波次数
    this.money = 100; // 玩家当前金钱
    this.health = 10; // 玩家当前生命值
    this.selectedTower = null; // 当前选中的塔类型索引
    this.isDragging = false; // 是否正在拖拽塔
    this.isPlacing = false; // 是否处于放置塔状态
    this.isDeploying = false; // 是否处于部署塔方向状态
    this.draggedTower = null; // 当前被拖拽的塔对象
    this.draggedPosition = { x: 0, y: 0 }; // 当前拖拽位置的坐标
    this.normalSpeed = true; // 游戏是否处于正常速度
    this.gridSize = 50; // 网格大小(像素)
    this.selectedShaoTower = null; // 新增：记录当前选中的Shao塔
    this.grid = Array(Math.floor(this.height/this.gridSize)).fill().map(
      () => Array(Math.floor(this.width/this.gridSize)).fill(false)
    ); // 表示网格占用状态的二维数组
    this.towerTypes = [
      { type: 'ground', cost: 10, damage: 700, range: 100, color: 'green', health: 2000, game: this },
      { type: 'high', cost: 12, damage: 200, range: 150, color: 'blue', health: 80, game: this },
      { type: 'thrower', cost: 15, damage: 809, range: 120, color: '#8B0000', health: 200, game: this }, // 投掷塔颜色改为暗红色
         // 新增邵塔配置（橙色，成本90，伤害30，范围120，生命值150）
     { type: 'shao', cost: 22, damage: 973, range: 120, color: '#FFA500', health: 2837, game: this },
     { type: 'sign', cost: 0, damage: 0, range: 0, color: 'red', health: 10, game: this }
    ];
    this.enemyTypes = [
      { health: 12000, speed: 0.3, type:'大盾', color: 'purple',attackInterval:1000,game: this,defense:500 }
      , // 敌人类型1配置
      { health: 5000, speed: 0.5, type:'犬', color: 'purple',attackInterval:1000,game: this,defense:100 }
      ,
      { health: 45000, speed: 0.1, type:'大爹', color: 'red',attackInterval:1000,game: this,defense:3000 }
      ,
      { health: 100000, speed: 0.05, type:'石像', color: 'red',attackInterval:1000,game: this,defense:700 }
    ];
    this.path = [
      { x: 25, y: 25 }, // 路径点1
      { x: 575, y: 25 }, // 路径点2
      { x: 575, y: 325 }, // 路径点3
      { x: 175, y: 325 }, // 路径点4
      { x: 175, y: 175 }, // 路径点5
      { x: 525, y: 175 }, // 路径点6
      { x: 525, y: 325 }, // 路径点7
      { x: 25, y: 325 }, // 路径点8
      { x: 25, y: 75 }, // 路径点9
      { x: 525, y: 75 },
      { x:525,y:275  }// 路径点10
    ];
    // 新增：左下方空出生点及新路径（终点与原路径相同）
    this.newPath = [
    { x: 25, y: 325 }, // 左下方网格中心（空出生点，暂不出敌人）
      { x: 25, y: 75 }, // 路径点1
      { x: 525, y: 75 }, // 路径点2
      { x: 525, y: 325 }, // 路径点3
      { x: 25, y: 325 }, // 路径点4
      { x: 25, y: 75 }, // 路径点5
      { x: 475, y: 75 }, // 路径点6
      { x: 475, y: 325 }, // 路径点7
      { x: 175, y: 325 }, // 路径点8
      { x: 175, y: 275 }, // 路径点9
      { x: 525, y: 275 } // 路径点10
    ];
    this.newStartPoint = this.newPath[0]; // 新空出生点
    this.startPoint = this.path[0]; // 敌人出生点(路径第一个点)
    this.endPoint = this.path[this.path.length - 1]; // 敌人终点(路径最后一个点)
    this.lastEnemySpawn = 0; // 上次生成敌人的时间戳
    this.enemySpawnInterval = 2000; // 敌人生成间隔(毫秒)
    this.gameOver = false; // 游戏是否结束
    this.victory = false; // 游戏是否胜利
    this.throwerSkillBtn = document.getElementById('throwerSkillBtn'); // 获取技能按钮元素
    this.shaoSkillBtn = document.getElementById('shaoSkillBtn'); // 新增：获取邵塔技能按钮
    this.retreatBtn = document.getElementById('retreatBtn'); // 新增：获取撤退按钮
    this.particles = []; // 存储粒子的数组
    this.setupEventListeners(); // 设置事件监听器
    this.lastTime = 0; // 上一帧的时间戳
    requestAnimationFrame(this.gameLoop.bind(this)); // 启动游戏循环
        // 新增：获取技能按钮并绑定点击事件
    this.pauseStartTime = null; // 新增：记录暂停开始时间

  }

    /**
   * 设置所有事件监听器
   * @method
   */
  setupEventListeners() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this)); // 监听鼠标按下事件，用于开始拖拽塔或选择放置位置
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this)); // 监听鼠标移动事件，用于更新拖拽塔的位置
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this)); // 监听鼠标释放事件，用于完成塔的放置
    document.addEventListener('keydown', this.handleKeyDown.bind(this)); // 监听键盘事件，用于设置塔的攻击方向
    document.getElementById('startWaveBtn').addEventListener('click', this.startWave.bind(this)); // 监听开始波次按钮点击，触发敌人波次生成
    
    const groundBtn = document.getElementById('groundTowerBtn');
    const highBtn = document.getElementById('highTowerBtn');
    const throwerBth = document.getElementById('throwerTowerBtn');
    const shaoBtn = document.getElementById('shaoTowerBtn');
    groundBtn.textContent = `地面塔 (${this.towerTypes[0].cost})`;
    highBtn.textContent = `高空塔 (${this.towerTypes[1].cost})`;
    throwerBth.textContent = `投掷塔 (${this.towerTypes[2].cost})`;
    shaoBtn.textContent = `邵塔 (${this.towerTypes[3].cost})`; // 同步显示成本
    
    let placingTower = null;
    groundBtn.addEventListener('click', () => { // 监听地面塔按钮点击，选择地面塔类型
      placingTower = 'ground';
      this.selectTower(0);
    });
    highBtn.addEventListener('click', () => { // 监听高空塔按钮点击，选择高空塔类型
      placingTower = 'high';
      this.selectTower(1);

    });
    throwerBth.addEventListener('click', () => { // 监听投掷塔按钮点击，选择投掷塔类型
      placingTower = 'thrower';
      this.selectTower(2);
    
    
    });
    shaoBtn.addEventListener('click', () => {
      placingTower = 'shao'; // 选择邵塔类型
      this.selectTower(3); // 索引3对应towerTypes中的邵塔
    });


    document.getElementById('speedToggleBtn').addEventListener('click', this.toggleSpeed.bind(this)); // 监听速度切换按钮点击，控制敌人移动速度
    this.throwerSkillBtn.addEventListener('click', () => {
      const throwerTower = this.towers.find(tower => tower.type === 'thrower');
      if (throwerTower) {
        throwerTower.activateSkill()
      }

    
    });

    this.shaoSkillBtn.addEventListener('click', () => {
      const shaoTower = this.towers.find(tower => tower.type === 'shao');
      if (shaoTower) {
        shaoTower.activateSkill(); // 调用邵塔的技能激活方法
      }
    });


    // 新增：撤退按钮点击事件
    // 修改撤退按钮的点击事件处理逻辑
    this.retreatBtn.addEventListener('click', () => {
      const targetTower = this.currentRetreatTower;
      if (targetTower) {
        // 从塔数组中移除实例
        const index = this.towers.indexOf(targetTower);
        if (index !== -1) {
          // 新增：如果是Shao塔，调用destroy清理定时器
          if (targetTower.type === 'shao') {
            targetTower.destroy(); // 清除EGO状态的定时器
          }
          this.towers.splice(index, 1);
          
          // 释放网格（增加边界检查避免数组越界）
          const gridX = Math.floor(targetTower.x / this.gridSize);
          const gridY = Math.floor(targetTower.y / this.gridSize);
          if (gridY >= 0 && gridY < this.grid.length && gridX >= 0 && gridX < this.grid[0].length) {
            this.grid[gridY][gridX] = false;
          }

          // 新增：如果是投掷手塔，移除其所有召唤物
          if (targetTower.type === 'thrower') {
            // 筛选出所有属于该投掷手塔的召唤物
            const summonersToRemove = this.towers.filter(tower => 
              tower.type === 'summoner' && 
              tower.throwerTower === targetTower
            );
            
            // 移除召唤物并释放网格
            summonersToRemove.forEach(summoner => {
              const summonerIndex = this.towers.indexOf(summoner);
              if (summonerIndex !== -1) {
                this.towers.splice(summonerIndex, 1);
                
                // 释放召唤物占用的网格
                const sGridX = Math.floor(summoner.x / this.gridSize);
                const sGridY = Math.floor(summoner.y / this.gridSize);
                if (sGridY >= 0 && sGridY < this.grid.length && sGridX >= 0 && sGridX < this.grid[0].length) {
                  this.grid[sGridY][sGridX] = false;
                }
              }
            });
          }
        }
        // 隐藏按钮并清除记录
        this.retreatBtn.style.display = 'none';
        this.currentRetreatTower = null;
      }
    });
    this.shaoSkillBtn = document.getElementById('shaoSkillBtn'); // 新增：获取邵塔技能按钮
  }



    /**
   * 处理键盘输入事件
   * @method
   * @param {KeyboardEvent} e - 键盘事件对象
   * @param {number} gametime - 当前游戏时间
   */
  handleKeyDown(e) {
    if (!this.isDeploying || !this.draggedTower) return;
    const trueGameTime = this.gameTime;
    switch(e.key) {
      case 'ArrowUp':
        this.draggedTower.direction = -Math.PI / 2; // 上
        break;
      case 'ArrowDown':
        this.draggedTower.direction = Math.PI / 2; // 下
        break;
      case 'ArrowLeft':
        this.draggedTower.direction = Math.PI; // 左
        break;
      case 'ArrowRight':
        this.draggedTower.direction = 0; // 右
        break;
      case 'Enter':
        // 完成部署，将塔加入游戏
        this.towers.push(this.draggedTower);
        
        // 新增：如果是投掷手塔，触发召唤逻辑
        if (this.draggedTower.type === 'thrower') {
          this.draggedTower.deploySummoner();
        }

        // 新增：如果是邵塔，绑定情感硬币主逻辑
        if (this.draggedTower.type === 'shao') {
          this.draggedTower. moodcoinmain(trueGameTime)
        }

           // 关键修改：为 ShaoSign 类型塔设置部署时间
          if (this.draggedTower.type === 'sign') {
          this.draggedTower.deployTime = this.gameTime; // 使用当前游戏时间
                  }


        this.isDeploying = false;
        this.draggedTower = null;
        this.selectedTower = null;
        this.toggleButtons(true);
        break;




    }
  }


  /**
   * 绘制燃烧状态的薄雾特效
   * @param {Enemy} enemy - 处于燃烧状态的敌人实例
   */
   drawBurningEffect(enemy) {
    const ctx = this.ctx;
    const radius = 20; // 薄雾半径（可根据需求调整）
    const timeFactor = Math.sin(this.gameTime / 500); // 用于动态调整透明度的时间因子（增加动画感）

    // 创建径向渐变（红色 → 橙色 → 透明）
    const gradient = ctx.createRadialGradient(
      enemy.x, 
      enemy.y, 
      0, 
      enemy.x, 
      enemy.y, 
      radius
    );
    gradient.addColorStop(0, `rgba(255, 0, 0, ${0.2 + 0.1 * timeFactor})`); // 中心红色（动态透明度）
    gradient.addColorStop(0.6, `rgba(255, 165, 0, ${0.15 + 0.08 * timeFactor})`); // 中间橙色（动态透明度）
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)'); // 边缘透明

    // 绘制薄雾圆形
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }


    /**
   * 选择塔类型
   * @method
   * @param {number} index - 塔类型索引
   */
  selectTower(index) {
  // 检查是否已存在投掷手塔
  if (index === 2) { // 投掷塔索引为2
    const throwerCount = this.towers.filter(tower => tower.type === 'thrower').length;
    if (throwerCount >= 1) {
      alert('场上只能同时存在一个投掷手塔！');
      this.selectedTower = null;
      return;
    }
  }

  if(index===3){// 邵塔索引为3
    const shaoCount = this.towers.filter(tower => tower.type === 'shao').length;
    if (shaoCount >= 1) {
      alert('场上只能同时存在一个邵塔！');
      this.selectedTower = null;
      return; 
    }

  }

  this.selectedTower = index;
  this.isDragging = false; // 是否正在拖拽塔
  this.draggedTower = null; // 当前被拖拽的塔对象
}

    /**
   * 切换游戏速度
   * @method
   */
  toggleSpeed() {
    if (this.isDragging) return;
    this.normalSpeed = !this.normalSpeed;
    document.getElementById('speedToggleBtn').textContent = 
      this.normalSpeed ? '暂停敌人' : '恢复敌人';

    
  // 新增：暂停时记录开始时间，恢复时校准特效时间
  if (!this.normalSpeed) {
    // 进入暂停状态，记录当前时间
    this.pauseStartTime = performance.now();
  } else if (this.pauseStartTime) {
    // 恢复运行，计算暂停时长
    const pauseDuration = performance.now() - this.pauseStartTime;
    this.pauseStartTime = null;

    // 校准所有特效的起始时间（补偿暂停时长）
    this.effects.forEach(effect => {
      effect.startTime += pauseDuration;
    });
  }
  }
  
    /**
   * 切换按钮状态
   * @method
   * @param {boolean} enabled - 是否启用按钮
   */
  toggleButtons(enabled) {
    const color = enabled ? '' : '#999';
    this.buttons.forEach(btn => {
      btn.disabled = !enabled;
      btn.style.color = color;
    });
  }

    /**
   * 开始一波敌人
   * @method
   */
  startWave() {
    if (this.enemies.length > 0 || this.gameOver || this.victory) return;
    this.lastEnemySpawn = performance.now();
    this.spawnEnemyWave(this.wave);
  }

    /**
   * 生成一波敌人（修改后）
   * @method
   * @param {number} wave - 波次数
   */
  spawnEnemyWave(wave) {
    // 上方出生点生成5个大盾敌人（使用原路径）
    const shieldEnemyType = this.enemyTypes[0]; // 大盾类型配置
    const supershieldEnemyType = this.enemyTypes[2]; // 超盾类型配置
    const superEnemyType = this.enemyTypes[3]; // 石像类型配置
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        if (!this.gameOver && !this.victory) {
          this.enemies.push(new Enemy(
            this.startPoint.x, 
            this.startPoint.y, 
            shieldEnemyType.health * (1 + (wave - 1) * 0.2), // 血量随波次增长
            shieldEnemyType.speed,
            shieldEnemyType.type, // 敌人类型名称（'大盾'）
            shieldEnemyType.color,
            [...this.path], // 使用原路径
            this,
            shieldEnemyType.defense // 传递防御力
          ));
        }
      }, i * this.enemySpawnInterval / 3);}

      if (!this.gameOver && !this.victory) {
        this.enemies.push(new Enemy(
          this.startPoint.x, 
          this.startPoint.y, 
          supershieldEnemyType.health * (1 + (wave - 1) * 0.2), // 血量随波次增长
          supershieldEnemyType.speed,
          supershieldEnemyType.type, // 敌人类型名称（'大爹'）
          supershieldEnemyType.color,
          [...this.path], // 使用原路径
          this,
          supershieldEnemyType.defense // 传递防御力
        ));
      }

      if (!this.gameOver && !this.victory) {
        this.enemies.push(new Enemy(
          this.startPoint.x, 
          this.startPoint.y, 
          superEnemyType.health * (1 + (wave - 1) * 0.2), // 血量随波次增长
          superEnemyType.speed,
          superEnemyType.type, // 敌人类型名称（'石像'）
          superEnemyType.color,
          [...this.path], // 使用原路径
          this,
          superEnemyType.defense // 传递防御力
        ));
      }
 
    
  
    // 下方出生点生成10个犬类敌人（使用新路径）
    const dogEnemyType = this.enemyTypes[1]; // 犬类类型配置
    for (let i = 0; i < 10; i++) {
      setTimeout(() => {
        if (!this.gameOver && !this.victory) {
          this.enemies.push(new Enemy(
            this.newStartPoint.x, 
            this.newStartPoint.y, 
            dogEnemyType.health * (1 + (wave - 1) * 0.2), // 血量随波次增长
            dogEnemyType.speed,
            dogEnemyType.type, // 敌人类型名称（'犬'）
            dogEnemyType.color,
            [...this.newPath], // 使用新路径
            this,
            dogEnemyType.defense // 传递防御力
          ));
        }
      }, i * this.enemySpawnInterval / 3);
    }
  }

    /**
   * 处理鼠标按下事件
   * @method
   * @param {MouseEvent} e - 鼠标事件对象
   */
  handleMouseDown(e) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 检查是否点击投掷手塔
    let clickedThrower = null;
    let clickedShao = null;
    for (const tower of this.towers) {
      if (tower.isClicked(mouseX, mouseY) && tower.type === 'thrower') {
        clickedThrower = tower;
        break;
      }

      if (tower.isClicked(mouseX, mouseY) && tower.type === 'shao') {
        clickedShao = tower;
        break;
      }


    }
    // 控制技能按钮显示
    this.throwerSkillBtn.style.display = clickedThrower ? 'block' : 'none';
    if (clickedThrower) {
      clickedThrower.isSelected = true;
      
      // 定位按钮到塔的位置附近
      this.throwerSkillBtn.style.left = `${clickedThrower.x + rect.left + 20}px`;
      this.throwerSkillBtn.style.top = `${clickedThrower.y + rect.top - 30}px`;
    }


    // 处理Shao塔点击逻辑（新增选中状态控制）



    // 重置所有Shao塔的选中状态
    this.towers.forEach(tower => {
      if (tower.type === 'shao') tower.isSelected = false;
    });

    // 选中点击的Shao塔（触发范围显示）
    if (clickedShao) {
      clickedShao.isSelected = true;
      if(!clickedShao.isEgoActive){
      this.shaoSkillBtn.style.display = 'block';
      // 定位技能按钮（保持原有逻辑）
      this.shaoSkillBtn.style.left = `${clickedShao.x + rect.left + 20}px`;
      this.shaoSkillBtn.style.top = `${clickedShao.y + rect.top - 30}px`;
    } }
    else {
      this.shaoSkillBtn.style.display = 'none';
    }

    const shao = this.towers.find(tower => tower.type === 'shao');
          // 新增：底部特殊按钮区域检测
  const bottomButtonYStart = 350;  // 底部区域起始y坐标（与遮盖层一致）
  const bottomButtonYEnd = 450;    // 底部区域结束y坐标（与遮盖层一致）
  const bottomButtonWidth = 35;  // 按钮宽度（与白色边框一致）
  
  // 检测点击是否在白色边框区域内
  if (mouseY >= bottomButtonYStart && mouseY <= bottomButtonYEnd &&
      mouseX >= 0 && mouseX <= bottomButtonWidth&& shao&& shao.specialCharge === 1) {
    this.handleBottomButton_1_Click(e);  // 触发按钮处理函数
  }



    if (this.selectedTower !== null && !this.isDeploying) {
      const towerType = this.towerTypes[this.selectedTower];
      if (this.money >= towerType.cost) {
        this.isDragging = true;
        this.isPlacing = true; // 进入放置状态
        if (towerType.type === 'thrower') {
          this.draggedTower = new Thrower(
            mouseX, 
            mouseY, 
            towerType.damage,
            towerType.range,
            towerType.color,
            towerType.health,
            this // 已正确传递 game 实例
          );
        } 
        else if (towerType.type === 'shao') {
          this.draggedTower = new ShaoTower(
            mouseX, 
            mouseY, 
            towerType.damage,
            towerType.range,
            towerType.health,
            this // 已正确传递 game 实例
          );
        } 
        else if(towerType.type === 'sign'){
        this.draggedTower = new ShaoSign(
          mouseX, 
          mouseY, 
          towerType.damage,
          towerType.range,
          towerType.health,
          this, // 已正确传递 game 实例
          this.towers.find(tower => tower.type === 'shao'),
        );
        }
    


        else {
          this.draggedTower = new Tower(
            mouseX, 
            mouseY, 
            towerType.type,
            towerType.damage,
            towerType.range,
            towerType.color,
            towerType.health,
            this // 新增：传递 game 实例
          );

        }
    
        // 开始拖拽时禁用所有按钮
        this.toggleButtons(false);
      }
    } else if (this.isDeploying && this.draggedTower) {
      // 部署阶段只允许调整方向
      this.draggedTower.startDrag();
    }
  }

    /**
   * 处理鼠标移动事件
   * @method
   * @param {MouseEvent} e - 鼠标事件对象
   */
  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    this.draggedPosition.x = e.clientX - rect.left;
    this.draggedPosition.y = e.clientY - rect.top;

    if (this.isDragging && this.draggedTower) {
      this.draggedTower.x = this.draggedPosition.x;
      this.draggedTower.y = this.draggedPosition.y;
      this.draggedTower.updateDirection(this.draggedPosition.x, this.draggedPosition.y);
    }
  }

    /**
   * 处理鼠标释放事件
   * @method
   * @param {MouseEvent} e - 鼠标事件对象
   */
  handleMouseUp(e) {
    if (!this.isDragging || !this.draggedTower) return;

    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // 检查是否点击投掷手塔（原有逻辑）
    let clickedThrower = null;
    for (const tower of this.towers) {
      if (tower.isClicked(mouseX, mouseY) && tower.type === 'thrower') {
        clickedThrower = tower;
        break;
      }
    }
    this.throwerSkillBtn.style.display = clickedThrower ? 'block' : 'none';
    if (clickedThrower) {
      this.throwerSkillBtn.style.left = `${clickedThrower.x + rect.left + 20}px`;
      this.throwerSkillBtn.style.top = `${clickedThrower.y + rect.top - 30}px`;
    }

    // 新增：检查是否点击邵塔
    let clickedShao = null;
    for (const tower of this.towers) {
      if (tower.isClicked(mouseX, mouseY) && tower.type === 'shao') {
        clickedShao = tower;
        break;
      }
    }
    this.shaoSkillBtn.style.display = clickedShao ? 'block' : 'none';
    if (clickedShao) {
      // 定位按钮到邵塔的位置附近（与投掷手塔逻辑一致）
      this.shaoSkillBtn.style.left = `${clickedShao.x + rect.left + 20}px`;
      this.shaoSkillBtn.style.top = `${clickedShao.y + rect.top - 30}px`;
    }



    if (this.isPlacing && this.canPlaceTower(mouseX, mouseY)) {
      const towerType = this.towerTypes[this.selectedTower];
      this.money -= towerType.cost;
      
      // 将塔位置对齐到网格中心
      const gridX = Math.floor(mouseX/this.gridSize);
      const gridY = Math.floor(mouseY/this.gridSize);
      this.draggedTower.x = gridX * this.gridSize + this.gridSize/2;
      this.draggedTower.y = gridY * this.gridSize + this.gridSize/2;
      
      // 标记网格为已占用
      this.grid[gridY][gridX] = true;
      
      // 完成放置，进入部署阶段（新增：关闭拖拽状态）
      this.isPlacing = false; 
      this.isDeploying = true;
      this.draggedTower.startDrag();
      this.isDragging = false; // 关键修改：放置完成后关闭拖拽状态，塔不再跟随鼠标
    } 
 
  }


    /**
   * 检查是否可以放置塔
   * @method
   * @param {number} x - X坐标
   * @param {number} y - Y坐标
   * @return {boolean} 是否可以放置
   */
  canPlaceTower(x, y) {
  // 检查是否在路径上（仅对高空塔限制）
  if (this.selectedTower === 1) { // 1是高空塔的索引
    for (let i = 0; i < this.path.length - 1; i++) {
      const p1 = this.path[i];
      const p2 = this.path[i + 1];
      if (this.pointNearLine(x, y, p1.x, p1.y, p2.x, p2.y, 30)) {
        return false;
      }
    }
  }

  // 检查投掷手塔数量限制


  // 检查网格是否已被占用
  const gridX = Math.floor(x/this.gridSize);
  const gridY = Math.floor(y/this.gridSize);
  // 边界检查，避免数组越界
  if (gridY < 0 || gridY >= this.grid.length || gridX < 0 || gridX >= this.grid[0].length) {
    return false;
  }
  if (this.grid[gridY][gridX]) {
    return false;
  }

  // 检查是否在画布内
  return x > 20 && x < this.width - 20 && y > 20 && y < this.height - 20;
}


  handleBottomButton_1_Click(e){
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const towerType = 'sign';

    this.isDragging = true;
    this.isPlacing = true; // 进入放置状态
    this.index = 4
    this.selectedTower = 4

  }


    /**
   * 检查点是否靠近线段
   * @method
   * @param {number} px - 点X坐标
   * @param {number} py - 点Y坐标
   * @param {number} x1 - 线段起点X
   * @param {number} y1 - 线段起点Y
   * @param {number} x2 - 线段终点X
   * @param {number} y2 - 线段终点Y
   * @param {number} distance - 允许的距离
   * @return {boolean} 是否靠近
   */
  pointNearLine(px, py, x1, y1, x2, y2, distance) {
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) param = dot / lenSq;

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;

    return Math.sqrt(dx * dx + dy * dy) < distance;
  }



    /**
   * 切换游戏速度
   * @method
   */
  toggleSpeed() {
    if (this.isDragging) return;
    this.normalSpeed = !this.normalSpeed;
    document.getElementById('speedToggleBtn').textContent = 
      this.normalSpeed ? '暂停敌人' : '恢复敌人';
  
    if (!this.normalSpeed) { // 当前状态：暂停
      this.pauseStartTime = performance.now();
      
      // 暂停所有Shao塔的EGO烧伤定时器
      this.towers.forEach(tower => {
        if (tower.type === 'shao' && tower.isEgoActive) {
          tower.stopEgoBurnTimer();
        }
      });
    } else if (this.pauseStartTime) { // 当前状态：恢复
      const pauseDuration = performance.now() - this.pauseStartTime;
      this.pauseStartTime = null;
      
      // 恢复所有Shao塔的EGO烧伤定时器
      this.towers.forEach(tower => {
        if (tower.type === 'shao' && tower.isEgoActive) {
          tower.startEgoBurnTimer();
        }
      });
      
      // 调整特效起始时间补偿暂停时长
      this.effects.forEach(effect => {
        effect.startTime += pauseDuration;
      });
    }
  }

    /**
   * 更新游戏状态
   * @method
   * @param {number} deltaTime - 时间增量(毫秒)
   */
  update(deltaTime) {
    if (!this.normalSpeed) return; 
    // 暂停时直接退出更新流程
    // 更新游戏计时器
    this.gameTime += deltaTime;
    
    // 金钱自动增长 (每秒1点)
    this.money += deltaTime / 1000;
    
    // 更新塔
    for (const tower of this.towers) {
      tower.update(deltaTime, this.enemies, this.bullets);
    }


    for (let i = this.towers.length - 1; i >= 0; i--) {
      const tower = this.towers[i];
      if (tower.health <= 0) {
        // 严格边界检查后释放网格
        const gridX = Math.floor(tower.x / this.gridSize);
        const gridY = Math.floor(tower.y / this.gridSize);
        if (gridY >= 0 && gridY < this.grid.length && gridX >= 0 && gridX < this.grid[0].length) {
          this.grid[gridY][gridX] = false;
        }
        this.towers.splice(i, 1); // 从塔数组中移除
      }
    }

    // 更新子弹
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i];
      bullet.update(deltaTime);
      if (bullet.isOffScreen(this.width, this.height) || bullet.shouldRemove) {
        this.bullets.splice(i, 1);
      }
    }

    // 更新敌人
    for (let i = this.enemies.length - 1; i >= 0; i--) {
      const enemy = this.enemies[i];
      enemy.update(this.normalSpeed ? deltaTime : 0, this.towers, this.gameTime);
      
      // 敌人攻击塔
      if (enemy.isBlocked && enemy.targetTower) {

        if (enemy.targetTower.health <= 0) {
          const towerIndex = this.towers.indexOf(enemy.targetTower);
          if (towerIndex !== -1) {
            this.towers.splice(towerIndex, 1);
            // 释放网格位置
            const gridX = Math.floor(enemy.targetTower.x/this.gridSize);
            const gridY = Math.floor(enemy.targetTower.y/this.gridSize);
            this.grid[gridY][gridX] = false;
          }
        }
      }
      
      if (enemy.health <= 0) {
        this.enemies.splice(i, 1);
        continue;
      }

      // 检查是否到达终点
      if (enemy.x > this.endPoint.x - 10 && 
          enemy.x < this.endPoint.x + 10 && 
          enemy.y > this.endPoint.y - 10 && 
          enemy.y < this.endPoint.y + 10) {
        this.health--;
        this.enemies.splice(i, 1);
        if (this.health <= 0) {
          this.gameOver = true;
        }
      }
    }
            // 更新粒子状态
    this.particles.forEach((particle, index) => {
      particle.update(deltaTime);
      if (particle.isDead()) {
        this.particles.splice(index, 1);
              }
      });

    // 检查胜利条件
    if (this.wave === 5 && this.enemies.length === 0 && this.bullets.length === 0) {
      this.victory = true;
    }


  }

    /**
   * 绘制游戏画面
   * @method
   */
  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    
    // 绘制背景
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(0, 0, this.width, this.height);


    


    // 绘制路径
    this.ctx.beginPath();
    this.ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i < this.path.length; i++) {
      this.ctx.lineTo(this.path[i].x, this.path[i].y);
    }
    this.ctx.lineWidth = 60;
    this.ctx.strokeStyle = '#aa8866';
    this.ctx.stroke();
    
    // 绘制路径边缘
    this.ctx.beginPath();
    this.ctx.moveTo(this.path[0].x, this.path[0].y);
    for (let i = 1; i < this.path.length; i++) {
      this.ctx.lineTo(this.path[i].x, this.path[i].y);
    }
    this.ctx.lineWidth = 2;
    this.ctx.strokeStyle = '#664422';
    this.ctx.stroke();

    // 绘制起点和终点
    this.ctx.beginPath();
    this.ctx.arc(this.startPoint.x, this.startPoint.y, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = '#33cc33'; // 原出生点颜色（绿色）
    this.ctx.fill();

    // 新增：绘制新出生点（与原出生点样式一致）
    this.ctx.beginPath();
    this.ctx.arc(this.newStartPoint.x, this.newStartPoint.y, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = '#33cc33'; // 保持与原出生点相同的绿色
    this.ctx.fill();

    // 绘制终点（原有逻辑）
    this.ctx.beginPath();
    this.ctx.arc(this.endPoint.x, this.endPoint.y, 20, 0, Math.PI * 2);
    this.ctx.fillStyle = '#cc3333'; // 终点颜色（红色）
    this.ctx.fill();



        // 绘制网格（置顶）
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
        this.ctx.lineWidth = 1;
        
        //
        for (let x = 0; x <= this.width; x += this.gridSize) {
          this.ctx.beginPath();
          this.ctx.moveTo(x, 0);
          this.ctx.lineTo(x, this.height);
          this.ctx.stroke();
        }
        
        // 绘制水平线
        for (let y = 0; y <= this.height; y += this.gridSize) {
          this.ctx.beginPath();
          this.ctx.moveTo(0, y);
          this.ctx.lineTo(this.width, y);
          this.ctx.stroke();
        }


        // 绘制灰色半透明遮盖层（y=350到y=450）
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'; // 灰色半透明（RGBA格式）
        this.ctx.fillRect(0, 350, this.width, 100); // x=0到画布宽度，y=350到450（高度100）



    // 绘制塔
    for (const tower of this.towers) {
      tower.draw(this.ctx);
    }

    // 绘制拖拽中的塔
    if ((this.isDragging || this.isDeploying) && this.draggedTower) {
      this.ctx.globalAlpha = 0.7;
      this.draggedTower.draw(this.ctx);
      this.ctx.globalAlpha = 1;
    }

    // 绘制子弹
    for (const bullet of this.bullets) {
      bullet.draw(this.ctx);
    }

    // 绘制敌人
    for (const enemy of this.enemies) {
      // 先绘制敌人本身
      enemy.draw(this.ctx); // 原有敌人绘制逻辑
      
      // 仅当敌人处于燃烧状态时，在敌人上方绘制薄雾特效
      if (enemy.isBurning) {
        this.drawBurningEffect(enemy);
      }
    }
    // 绘制粒子
    for (const particle of this.particles) {
      particle.draw(this.ctx);
    }



    // 绘制UI
    this.drawUI();



        // 新增：绘制分割线和第一个块的边框（在遮盖层之上）

    // 绘制游戏结束/胜利画面
    if (this.gameOver) {
      this.drawGameOver();
    } else if (this.victory) {
      this.drawVictory();
    }


    

    this.addParticleEffect(this.enemies)
    
  }



    /**
   * 绘制下方区域的12等分分割线及第一个块的白色边框
   * @method
   */
     drawSegmentBorders() {
      const yStart = 350; // 下方区域起始y坐标
      const yEnd = 450;   // 下方区域结束y坐标
      const totalSegments = 12; // 横向分割为12份
      const segmentWidth = this.width / totalSegments; // 每份宽度
  
      // 绘制所有分割线（可选，用于可视化）
      this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'; // 浅白色分割线
      this.ctx.lineWidth = 1;
      for (let i = 0; i <= totalSegments; i++) {
        const x = i * segmentWidth;
        this.ctx.beginPath();
        this.ctx.moveTo(x, yStart);
        this.ctx.lineTo(x, yEnd);
        this.ctx.stroke();
      }
    }
  
    /**
     * 绘制第一个分割块的白色边框
     * @method
     */
    drawFirstSegmentBorder() {
      const yStart = 350;
      const yEnd = 450;
      const segmentWidth = this.width / 12; // 每份宽度
      const borderX = 0; // 第一个块从x=0开始
      const borderY = yStart;
      const borderWidth = segmentWidth;
      const borderHeight = yEnd - yStart;
  
      this.ctx.strokeStyle = 'white'; // 白色边框
      this.ctx.lineWidth = 2; // 边框线宽
      this.ctx.strokeRect(borderX, borderY, borderWidth, borderHeight);
    }
  



    /**
   * 绘制用户界面
   * @method
   */
  drawUI() {
    // 绘制金钱
    this.ctx.fillStyle = '#000';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`金钱: ${Math.floor(this.money)}`, 20, 30);
    
    // 绘制生命值
    this.ctx.fillText(`生命值: ${this.health}`, 120, 30);
    
    // 绘制波次
    this.ctx.fillText(`波次: ${this.wave}/5`, 220, 30);
    
    // 绘制选中的塔
    if (this.selectedTower !== null) {
      const towerType = this.towerTypes[this.selectedTower];
      this.ctx.fillText(`选中: ${towerType.type}塔 (成本: ${towerType.cost})`, 320, 30);
    }
  }

    /**
   * 绘制游戏结束画面
   * @method
   */
  drawGameOver() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 20);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText('点击刷新页面重新开始', this.width / 2, this.height / 2 + 20);
    this.ctx.textAlign = 'left';
  }

    /**
   * 绘制胜利画面
   * @method
   */
  drawVictory() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.width, this.height);
    
    this.ctx.fillStyle = '#fff';
    this.ctx.font = '40px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('胜利!', this.width / 2, this.height / 2 - 20);
    
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`最终分数: ${this.money + this.health * 100}`, this.width / 2, this.height / 2 + 20);
    this.ctx.fillText('点击刷新页面重新开始', this.width / 2, this.height / 2 + 50);
    this.ctx.textAlign = 'left';
  }

    /**
   * 游戏主循环
   * @method
   * @param {number} timestamp - 时间戳
   */
  /**
   * 游戏主循环
   * @method
   * @param {number} timestamp - 当前时间戳(毫秒)
   * @description 游戏核心循环，负责:
   * 1. 计算时间增量(deltaTime)
   * 2. 更新游戏状态(如果游戏未结束)
   * 3. 绘制游戏画面
   * 4. 更新特效
   * 5. 请求下一帧动画
   * 每帧调用一次，由requestAnimationFrame驱动
   */
  gameLoop(timestamp) {
    const deltaTime = timestamp - this.lastTime;
    this.lastTime = timestamp;
    
    if (!this.gameOver && !this.victory) {
      this.update(deltaTime);
    }
    this.draw();
    
    // 更新所有特效
    this.updateEffects();
    
    requestAnimationFrame(this.gameLoop.bind(this)); // 启动游戏循环
  }
  
    /**
   * 添加特效
   * @method
   * @param {Object} effect - 特效对象
   */
  /**
   * 添加特效到游戏场景
   * @method
   * @param {Object} effect - 特效对象
   * @property {string} effect.type - 特效类型(目前仅支持'aoe')
   * @property {number} effect.x - 特效中心x坐标
   * @property {number} effect.y - 特效中心y坐标
   * @property {number} effect.radius - 特效最大半径
   * @property {string} effect.color - 特效颜色
   * @property {number} effect.duration - 特效持续时间(毫秒)
   * @description 添加的特效会自动记录开始时间，并在updateEffects方法中更新和绘制
   */
  addEffect(effect) {
    effect.startTime = performance.now();
    this.effects.push(effect);
  }
  
    /**
   * 更新所有特效
   * @method
   */
  /**
   * 更新所有特效
   * @method
   * @description 遍历所有特效，更新其状态并绘制。
   * 目前仅支持'aoe'类型特效，表现为随时间扩大的圆形效果。
   * 超过持续时间的特效会被自动移除。
   */
  updateEffects() {
      // 暂停时使用暂停开始时间计算进度，保持当前状态
  const now = this.normalSpeed ? performance.now() : this.pauseStartTime;
    this.effects = this.effects.filter(effect => {
      // 绘制特效
      if (effect.type === 'aoe') {
        const progress = now ? Math.min((now - effect.startTime) / effect.duration, 1) : 0;
        if (progress >=1) return false;
        
        this.ctx.beginPath();
        this.ctx.arc(
          effect.x, 
          effect.y, 
          effect.radius * progress, 
          0, 
          Math.PI * 2
        );
        this.ctx.fillStyle = effect.color;
        this.ctx.fill();
        return true;
      }
      return false;
    });
  }
          // 添加围绕敌人的粒子特效
  addParticleEffect(enemy) {
     const numParticles = 5; // 粒子数量从1增加到5
     const radius = 15; // 调整为15（原10），确保粒子在敌人外部环绕
     const speed = 0.001; // 粒子速度
            
    for (let i = 0; i < numParticles; i++) {
         const angle = (i / numParticles) * Math.PI * 2;
         const x = enemy.x + radius * Math.cos(angle);
         const y = enemy.y + radius * Math.sin(angle);
         const particle = new Particle(x, y, enemy, radius, speed);
         this.particles.push(particle);
                }
            }
}

class Particle {
  constructor(x, y, target, radius, speed) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.radius = radius;
    this.speed = speed;
    this.angle = Math.atan2(y - target.y, x - target.x);
    this.color = '#8B0000';  // 暗红色
    this.size = 3;
    this.ellipseXRadius = radius * 1.5; // 椭圆X轴半径
  }

  update(deltaTime) {
    this.angle += this.speed * deltaTime;
    this.x = this.target.x + this.ellipseXRadius * Math.cos(this.angle);
    this.y = this.target.y + this.radius * Math.sin(this.angle);
  }

  draw(ctx) {
    // 计算粒子相对于敌人的垂直位置（以敌人中心为基准）
    const enemyCenterY = this.target.y;
    const isTopHalf = this.y < enemyCenterY; // 粒子在上半圈
    
    // 调整绘制层级：上半圈粒子在敌人下方（被遮挡），下半圈在敌人上方（遮挡敌人）
    if (isTopHalf) {
      ctx.globalCompositeOperation = 'destination-over'; // 绘制在已存在内容下方
    } else {
      ctx.globalCompositeOperation = 'source-over'; // 默认模式，绘制在上方
    }

    // 绘制粒子
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();

    // 恢复默认绘制模式
    ctx.globalCompositeOperation = 'source-over';
  }

  isDead() {
    return !this.target || this.target.health <= 0;
  }
}


// 初始化游戏
window.onload = function() {
  const game = new Game();
};


class SparkParticle {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.life = 1;
    this.size = Math.random() * 2 + 1;
    this.color = `hsl(30, 100%, ${50 + Math.random() * 30}%)`; // 橙色系
  }

  update(deltaTime) {
    this.life -= deltaTime * 0.002;
    this.y -= deltaTime * 0.1;
    this.x += (Math.random() - 0.5) * deltaTime * 0.05;
  }

  draw(ctx) {
    if (this.life <= 0) return;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * this.life, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 在Enemy类的draw方法中添加粒子生成逻辑（需要在game中维护粒子数组）
// 当enemy.spark为true时，每帧生成少量粒子
if (this.spark) {
  for (let i = 0; i < 2; i++) {
    this.game.sparkParticles.push(new SparkParticle(
      this.x + this.blockOffsetX + (Math.random() - 0.5) * 10,
      this.y + this.blockOffsetY + (Math.random() - 0.5) * 10
    ));
  }
}
