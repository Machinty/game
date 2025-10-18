// 假设 Bullet 类已经在 bullet.js 中定义，根据实际情况引入
// 浏览器环境通过 script 标签引入后可直接使用
// Node.js 环境使用以下方式引入
// const Bullet = require('./bullet.js');

class FireDragon extends Bullet {
    constructor(x, y, angle, damage, color, game,producetime) {
        // 由于不需要跟踪特定目标，target 参数设为 null
        super(x, y, null, damage, angle,'#FF0000', 'high');
        this.game = game;
        this.sideLength = 40; // 方形子弹的边长
        this.speed = 0.3; // 子弹移动速度
        this.time=this.game.gameTime;
        this.produceTime=producetime;
    }

    // 重写 update 方法，实现持续向前移动和碰撞检测
    update(deltaTime) {
        if (!this.target || this.shouldRemove) return;
        
        // 计算移动距离（修复：添加 deltaTime 依赖）
        const moveDistance = this.speed * deltaTime;
        const dx = Math.cos(this.angle) * moveDistance;
        const dy = Math.sin(this.angle) * moveDistance;
        this.x += dx;
        this.y += dy;
        
        // 屏幕边界检查（保持不变）
        const currentTime = this.game.gameTime;
        if (currentTime - this.produceTime >= 1000) {
            if (this.isOffScreen(this.game.width, this.game.height)) {
                this.shouldRemove = true;
                return;
            }
        }
        
        // 碰撞检测（保持不变）
        const bulletHalfDiagonal = (this.sideLength * Math.sqrt(2)) / 2;
        this.game.enemies.forEach(enemy => {
            const distance = Math.hypot(enemy.x - this.x, enemy.y - this.y);
            if (distance > bulletHalfDiagonal + enemy.radius) return;
            if (this.isCollidingWithEnemy(enemy)) {
                this.applyEffectToEnemy(enemy);
            }
        });
    }

    // 检测子弹与敌人是否碰撞，考虑旋转
    isCollidingWithEnemy(enemy) {
            // 确保敌人有radius属性（避免undefined导致的计算错误）
    if (typeof enemy.radius !== 'number' || enemy.radius <= 0) {
        console.error(`Enemy缺少有效radius属性,当前值:${enemy.radius}`);
        return false;
      }
  


        // 计算旋转后的子弹顶点
        const halfSide = this.sideLength / 2;
        const cos = Math.cos(this.angle);
        const sin = Math.sin(this.angle);

    // 计算旋转矩形的四个顶点（世界坐标）
    const vertices = [
        { x: this.x + (-halfSide * cos + halfSide * sin), y: this.y + (-halfSide * sin - halfSide * cos) }, // 左上（修正 halfS → halfSide）
        { x: this.x + (halfSide * cos + halfSide * sin), y: this.y + (halfSide * sin - halfSide * cos) },  // 右上（修正 halfS → halfSide）
        { x: this.x + (halfSide * cos - halfSide * sin), y: this.y + (halfSide * sin + halfSide * cos) },  // 右下（修正 halfS → halfSide）
        { x: this.x + (-halfSide * cos - halfSide * sin), y: this.y + (-halfSide * sin + halfSide * cos) }  // 左下（修正 halfS → halfSide）  // 左下
        ];
        const axes = [];
        // 检查敌人圆心是否在旋转后的子弹内
        for (let i = 0; i < 4; i++) {
            const j = (i + 1) % 4;
            const edgeX = vertices[j].x - vertices[i].x;
            const edgeY = vertices[j].y - vertices[i].y;
            axes.push({ x: -edgeY, y: edgeX }); // 边的法线向量
        }

       // 检查每个分离轴的投影是否重叠
       for (const axis of axes) {
        // 计算矩形在轴上的投影范围
        let rectMin = Infinity, rectMax = -Infinity;
        for (const v of vertices) {
            const proj = v.x * axis.x + v.y * axis.y;
            rectMin = Math.min(rectMin, proj);
            rectMax = Math.max(rectMax, proj);
        }

        // 计算圆形在轴上的投影范围（圆心投影 ± 半径）
        const circleProj = enemy.x * axis.x + enemy.y * axis.y;
        const circleMin = circleProj - enemy.radius;
        const circleMax = circleProj + enemy.radius;

        // 若投影不重叠，则无碰撞
        if (rectMax < circleMin || circleMax < rectMin) {
            return false;
        }
    }

    return true; // 所有轴投影重叠，碰撞发生
}

// 应用效果到敌人
applyEffectToEnemy(enemy) {
    enemy.attackedByFireDragon = true 
}

// 绘制旋转后的方形子弹
draw(ctx) {
    ctx.save();
    ctx.translate(this.x, this.y); // 画布原点移至子弹中心
    ctx.rotate(this.angle); // 根据发射角度旋转
    ctx.fillStyle = this.color;
    // 以中心为原点绘制正方形（边长与sideLength一致）
    ctx.fillRect(
        -this.sideLength / 2,
        -this.sideLength / 2,
        this.sideLength,
        this.sideLength
    )
    ctx.restore();
}

// 检查是否超出屏幕
isOffScreen(width, height) {
    return (
        this.x < 0 - this.sideLength / 2 ||
        this.x > width + this.sideLength / 2 ||
        this.y < 0 - this.sideLength / 2 ||
        this.y > height + this.sideLength / 2
    );
}
}