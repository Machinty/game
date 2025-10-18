import math

def calculate_single_burn(initial_layers):
    """处理单次施加烧伤的计算逻辑(原calculate_sum优化版)"""
    total_sum = 0
    total_time = 0  # 总时间（毫秒）
    current = initial_layers
    min_layers = 5
    max_layers = 200
    min_interval = 1000  # 1秒（毫秒）
    max_interval = 3000  # 3秒（毫秒）

    while current > 0:
        # 动态计算结算间隔（同步enemy.js逻辑）
        if current <= min_layers:
            interval = max_interval
        elif current >= max_layers:
            interval = min_interval
        else:
            layer_diff = current - min_layers
            interval = max_interval - (layer_diff * (max_interval - min_interval)) / (max_layers - min_layers)

        total_sum += current
        total_time += interval
        current = current // 2 if current % 2 == 0 else (current - 1) // 2  # 同步enemy.js的层数减半逻辑

    total_damage = total_sum * 250
    total_time_seconds = total_time / 1000
    dps = total_damage / total_time_seconds if total_time_seconds > 0 else 0
    return {
        'total_damage': total_damage,
        'total_time': total_time_seconds,
        'dps': dps
    }

def calculate_continuous_burn(apply_interval, add_layers_per_apply):
    """处理持续施加烧伤的计算逻辑（修复时间线同步问题）"""
    current_layers = 0
    total_elapsed = 0  # 总流逝时间（毫秒）
    min_layers = 5
    max_layers = 200
    min_interval = 1000
    max_interval = 3000
    
    process_log = []
    apply_count = 0    
    settle_count = 0   
    pre_stable_damage = 0
    pre_stable_time = 0
    stable_damage = 0
    stable_time = 0
    stable_layers = None
    layer_history = []
    STABLE_THRESHOLD = 3
    STABLE_WINDOW = 5

    # 关键修改：使用绝对时间点控制施加（原apply_timer替换为next_apply_time）
    next_apply_time = apply_interval * 1000  # 首次施加时间点（毫秒）

    while True:
        # 1. 处理施加时间线（基于总时间的绝对判断）
        if total_elapsed >= next_apply_time:
            apply_count += 1
            current_layers += add_layers_per_apply
            process_log.append(f"第{apply_count}次施加：层数{add_layers_per_apply}，当前层数{current_layers}")
            next_apply_time += apply_interval * 1000  # 下次施加时间点 = 当前时间 + 施加间隔

        # 2. 处理结算时间线（根据当前层数计算本次结算间隔）
        if current_layers <= min_layers:
            settle_interval = max_interval
        elif current_layers >= max_layers:
            settle_interval = min_interval
        else:
            layer_diff = current_layers - min_layers
            settle_interval = max_interval - (layer_diff * (max_interval - min_interval)) / (max_layers - min_layers)

        # 3. 推进时间线（严格按结算间隔推进）
        total_elapsed += settle_interval  # 总时间增加本次结算间隔
        settle_count += 1
        damage = current_layers * 250
        process_log.append(f"第{settle_count}次结算，层数{current_layers}，造成伤害{damage}，间隔时间{settle_interval/1000:.2f}秒")

        # 4. 统计与稳定判断（未修改）
        if stable_layers is None:
            pre_stable_damage += damage
            pre_stable_time += settle_interval / 1000
            layer_history.append(current_layers)
            if len(layer_history) > STABLE_WINDOW:
                layer_history.pop(0)
                max_l = max(layer_history)
                min_l = min(layer_history)
                if max_l - min_l <= STABLE_THRESHOLD:
                    stable_layers = sum(layer_history) / len(layer_history)
        else:
            stable_damage += damage
            stable_time += settle_interval / 1000

        # 5. 执行层数减半（同步enemy.js逻辑）
        current_layers = current_layers // 2 if current_layers % 2 == 0 else (current_layers - 1) // 2

        # 终止条件（调整为总时间超过稳定后2个结算周期）
        if stable_layers is not None and stable_time > 10 * (settle_interval / 1000):
            break

    return {
        'stable_layers': round(stable_layers, 2),
        'time_to_stable': (total_elapsed - stable_time * 1000) / 1000,
        'pre_stable_dps': pre_stable_damage / pre_stable_time if pre_stable_time > 0 else 0,
        'stable_dps': stable_damage / stable_time if stable_time > 0 else 0,
        'process_log': process_log
    }

if __name__ == "__main__":
    while True:
        try:
            mode = input("请选择施加方式(持续施加c/单次施加d): ").strip()
            if mode == "d":
                # 单次施加逻辑（未修改）
                n = int(input("请输入初始烧伤层数: "))
                result = calculate_single_burn(n)
                print(f"单次施加结果：")
                print(f"总伤害: {result['total_damage']}")
                print(f"总时间: {result['total_time']:.2f}秒")
                print(f"DPS: {result['dps']:.2f}")
            elif mode == "c":
                interval = float(input("请输入施加时间间隔（秒）: "))
                layers = int(input("请输入每次施加层数: "))
                result = calculate_continuous_burn(interval, layers)
                print(f"持续施加结果：")
                print(f"稳定层数: {result['stable_layers']}层")
                print(f"达到稳定时间: {result['time_to_stable']:.2f}秒")
                print(f"稳定前平均DPS: {result['pre_stable_dps']:.2f}")
                print(f"稳定后平均DPS: {result['stable_dps']:.2f}")
                # 新增：输出全过程日志
                print("\n运算全过程:")
                for step in result['process_log']:
                    print(step)
            else:
                print("输入无效，请输入'持续施加'或'单次施加'")
        except ValueError:
            print("输入无效，请输入正确格式的数字")
