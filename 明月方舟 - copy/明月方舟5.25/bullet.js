class Bullet {
  // 构造函数新增towerType参数
  constructor(x, y, target, damage, angle, color, towerType) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = 5;
    this.angle = angle;
    this.radius = 5;
    this.color = color;
    this.towerType = towerType; // 记录发射塔的类型（如'high'）
    this.shouldRemove = false;
  }

  update(deltaTime) {
    if (!this.target || this.shouldRemove) return;
    
    // 计算朝向目标的方向
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    // 移动子弹
    this.x += (dx / distance) * this.speed;
    this.y += (dy / distance) * this.speed;
    
    // 检查是否击中目标
    if (distance < this.speed) {
      this.hitTarget();
    }
  }

  hitTarget() {
    if (!this.target) return;
    
    this.target.health -= this.damage;
    
    // 新增：如果是高空塔发射的子弹，添加1层烧伤
    if (this.towerType === 'high') {
      this.target.burnLayers += 1;
    }
    
    this.shouldRemove = true;
  }

  isOffScreen(width, height) {
    return (
      this.x < 0 || 
      this.x > width || 
      this.y < 0 || 
      this.y > height
    );
  }

  draw(ctx) {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = this.color;
    ctx.fill();
    
    // 绘制子弹轨迹
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(
      this.x - Math.cos(this.angle) * 10,
      this.y - Math.sin(this.angle) * 10
    );
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
}  