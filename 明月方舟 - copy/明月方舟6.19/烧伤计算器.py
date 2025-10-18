import math  # 保留原有导入（若其他部分需要）

def calculate_sum(X):
    """计算按照特定运算规则处理数据后的总和（同步enemy.js动态间隔逻辑）"""
    total_sum = 0
    time = 0  # 触发次数
    total_time = 0  # 总时间（毫秒）
    current = X
    # 同步enemy.js的动态间隔参数
    min_layers = 5
    max_layers = 200
    min_interval = 1000  # 2秒（毫秒）
    max_interval = 3000  # 4秒（毫秒）

    while current > 0:
        # 计算当前层数对应的触发间隔（同步enemy.js逻辑）
        if current <= min_layers:
            interval = max_interval  # 层数≤5时保持4秒间隔
        elif current >= max_layers:
            interval = min_interval  # 层数≥200时保持2秒间隔
        else:
            # 线性插值计算中间层数的间隔
            layer_diff = current - min_layers
            total_layer_range = max_layers - min_layers
            time_diff = max_interval - min_interval
            interval = max_interval - (layer_diff * time_diff) / total_layer_range

        total_sum += current
        total_time += interval  # 累加本次触发间隔
        time += 1  # 记录触发次数

        # 关键回退：恢复原始current计算逻辑（偶数除二，奇数减一再除二）
        if current % 2 == 0:
            current = current // 2
        else:
            current = (current - 1) // 2

    # 计算总伤害（每层150点）
    total_damage = total_sum * 250
    # 总时间转换为秒（用于DPS计算）
    total_time_seconds = total_time / 1000
    # DPS = 总伤害 / 总时间（秒）
    dps = total_damage / total_time_seconds if total_time_seconds > 0 else 0

    return {
        'total_damage': total_damage,  # 总伤害
        'trigger_times': time,         # 触发次数
        'total_time_seconds': total_time_seconds,  # 总时间（秒）
        'dps': dps                     # 每秒伤害
    }

# 主程序（未修改）
if __name__ == "__main__":
    while True:
        try:
            n = int(input("请输入烧伤初始层数: "))
            result = calculate_sum(n)
            print(f"烧伤总伤: {result['total_damage']}")
            print(f"触发次数: {result['trigger_times']}次")
            print(f"总时间: {result['total_time_seconds']:.2f}秒")
            print(f"DPS: {result['dps']:.2f}")
        except ValueError:
            print("输入无效，请输入一个正整数。")    
