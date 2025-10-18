class ShaoTower extends Tower {
  /**
   * 构造函数（参考投掷手塔结构）
   * @param {number} x - 塔的x坐标
   * @param {number} y - 塔的y坐标
   * @param {number} damage - 基础攻击伤害
   * @param {number} range - 攻击范围
   * @param {number} health - 生命值
   * @param {Game} game - 游戏实例
   */
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
  activateSkill() {
    if (this.currentMana >= this.maxMana && !this.isSkillActive) {
      this.isSkillActive = true;
      this.currentMana = 0; // 消耗技力
      // 后续添加技能具体逻辑（如增强攻击、召唤等）
    }
  }

  // 预留技能关闭方法（空框架）
  deactivateSkill() {
    this.isSkillActive = false;
    // 后续添加技能结束后的恢复逻辑
  }
}
