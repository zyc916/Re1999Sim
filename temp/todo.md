# 灵感 Afflatus

Star -> Mineral -> Beast -> Plant

Intellect <-> Spirit

# DMG 伤害

Taken 受到的

Dealt 造成的

Genesis DMG 本源创伤

"crit_resist_rate": 0.0, // 抗暴率

Incantations 术法

1-target attack 单体攻击

Mass attack 群体攻击

# Buff

Stats Up/Down 属性提升/削弱

Pos/Neg Status 状态增益/异常

[ ] TODO: 行动点+1

# Trigger 触发器

可能的触发器：

round_begin 回合开始
round_end 回合结束
on_incant 释放普通咒语时
on_ultimate 释放至终的仪式时
on_attack 攻击时
on_dealt_<> 释放类别为<>的咒语
on_taken_buff 被施加buff时
on_taken_damage 受击时
on_shield_broken 护盾破碎时

# 注意

return 反伤选择器

# 思路整理

先将神秘术，对应判定，buff全部复制一次