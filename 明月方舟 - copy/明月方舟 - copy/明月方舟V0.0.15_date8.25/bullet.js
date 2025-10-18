class Bullet {
  // 构造函数新增towerType参数
  constructor(x, y, target, damage, angle, color, towerType) {
    this.x = x;
    this.y = y;
    this.target = target;
    this.damage = damage;
    this.speed = 0.3;
    this.angle = angle;
    this.radius = 5;
    this.color = color;
    this.towerType = towerType; // 记录发射塔的类型（如'high'）
    this.shouldRemove = false;
  }

  update(deltaTime) {
    if (!this.target || this.shouldRemove) return;
    
    // 计算移动距离（速度 * 时间增量，单位：像素/毫秒 * 毫秒）
    const moveDistance = this.speed * deltaTime;
    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance < moveDistance) {
      this.hitTarget(); // 到达目标
    } else {
      const ratio = moveDistance / distance;
      this.x += dx * ratio;
      this.y += dy * ratio;
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