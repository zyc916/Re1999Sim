// @ts-check
"use strict";

/**
 * J空间：存放了所有判定类型。
 */
namespace J {
    /**
     * J公用类，提供一些公用属性和帮助函数
     */
    export class J {
        /** 公用变量表 */
        static variables: Map<string, any> = new Map<string, any>();
        /**
         * 快速判定函数，能够一次性判定多个判定器
         * @param {Readonly<J.Judge>[]} judges 判定器 数组
         * @param {Character} source 判定来源
         * @param {Character} target 判定目标
         */
        static judgeS(judges: Readonly<J.Judge>[], source: Character, target: Character) {
            for (let judge of judges) {
                judge.judge_me(undefined, source, target);
            }
        }
    }

    /**
     * 判定器基础接口 Judge
     */
    export interface Judge {
        /** 触发器 */
        sign: Signal;

        /**
         * 自我判定
         * @param {*} arg 判定器参数，来源于上一判定器
         * @param {Character} sub 判定来源
         * @param {Character} obj 判定目标
         * @returns {*}
         */
        judge_me(arg: any, sub: Character, obj: Character): any;
    }
    /**
     * 判定器：计算
     * 用于进行二元四则运算
     * 返回结果
     */
    export class FMath implements Judge {
        sign: Signal = '';
        operator: string = "+";
        a: number = 0;
        b: number | Judge = 0;

        constructor({ sign = '', operator, a = 0, b }: { sign?: Signal, operator: string, a?: number, b: number | Judge; }) {
            this.sign = sign;
            this.operator = operator;
            this.a = a;
            this.b = b;
        }

        judge_me(arg: any, sub: Character, obj: Character) {
            let a = arg ? arg : this.a;
            let b = typeof this.b === 'number' ? this.b : this.b.judge_me(undefined, sub, obj);
            switch (this.operator) {
                case "+":
                    return a + b;
                case "-":
                    return a - b;
                case "*":
                    return a * b;
                case "/":
                    if (b === 0) throw new Error("divide by zero");
                    return a / b;
                case "%":
                    if (b === 0) throw new Error("modulo by zero");
                    return a % b;
                default:
                    throw new Error("invalid operator");
            }
        }
    }

    /**
     * 判定器：数学函数
     * 用于执行Math空间下的方法
     * 返回结果
     */
    export class FFunc implements Judge {

        sign: Signal = '';
        func: keyof Math = "floor";
        b: number | Judge = 0;

        constructor({ sign = '', func, b = 0 }: { sign?: Signal, func: keyof Math, b?: number | Judge; }) {
            this.sign = sign;
            this.func = func;
            this.b = b;
        }

        judge_me(arg: any, sub: Character, obj: Character) {
            let b = arg ? arg : this.b;
            b = typeof b === 'number' ? b : <number>b.judge_me(undefined, sub, obj);
            if (typeof Math[this.func] === "function") {
                return (<Function>Math[this.func])(b);
            } else {
                throw new Error("invalid function name");
            }
        }
    }
    /**
     * 判定器：变量读取
     * 返回读取的变量
     */
    export class FGet implements Judge {
        sign: string = '';
        variable: string = "";

        constructor({ sign = '', variable }: { sign?: Signal; variable: string; }) {
            this.sign = sign;
            this.variable = variable;
        }

        judge_me(arg: any, sub: Character, obj: Character) {
            return J.variables.get(this.variable);
        }
    }
    /**
     * 判定器：变量修改/定义
     */
    export class FSet implements Judge {
        sign: string = '';
        variable: string = "";

        constructor({ sign = '', variable }: { sign?: Signal; variable: string; }) {
            this.sign = sign;
            this.variable = variable;
        }

        judge_me(arg: any, sub: Character, obj: Character) {
            J.variables.set(this.variable, arg);
        }
    }
    /**
     * 判定器：读取属性（键可能不存在，建议谨慎使用，或使用Behavior.rely替代）
     * 返回读取的属性
     */
    export class FAccess implements Judge {
        sign: string = '';
        path: string = "";
        rely_r: "sub" | "obj" = "obj";

        constructor({ sign = '', path, rely_r }: { sign?: Signal; path: string; rely_r: 'sub' | 'obj'; }) {
            this.sign = sign;
            this.path = path;
            this.rely_r = rely_r;
        }

        judge_me(arg: undefined | any, sub: Character, obj: Character) {
            let rely = this.rely_r === "obj" ? obj : sub;
            const parts = this.path.split(".");
            for (let i = 0; i < parts.length; i++) {
                // @ts-ignore
                if (rely) rely = rely[parts[i]];
                else return undefined;
            }
            return rely;
        }
    }
    /**
     * 判定器：查找buff
     * 返回查找值
     */
    export class FQuery implements Judge {
        sign: string = '';
        keyword: string = "";
        aim: Selector = "<self>";

        constructor({ sign = '', keyword, aim }: { sign: Signal; keyword: string; aim: Selector; }) {
            this.sign = sign;
            this.keyword = keyword;
            this.aim = aim;
        }

        judge_me(arg: any, sub: Character, obj: Character) {
            let count = 0;
            let chars = Stage.select(this.aim, sub, obj);
            for (const char of chars) {
                for (const buff of char.buffs.values()) {
                    if (buff.buff_cat === this.keyword || buff.name.includes(this.keyword)) {
                        count++;
                    }
                }
            }
            return count;
        }
    }
    /** 
     * 判定器：概率返回随机值
     */
    export class FRandom implements Judge {
        sign: string = '';
        private probability: number[] = new Array();
        private value: number[] = new Array();

        constructor({ sign, probability, value }: { sign: string; probability: number[]; value: number[]; }) {
            this.sign = sign;
            this.probability = probability;
            this.value = value;
        }

        judge_me(a: any, sub: Character, target: Character): number {
            if (this.probability.length !== this.value.length) throw new Error('概率和值数组的长度必须相同');

            const sumOfProbabilities = this.probability.reduce((sum, prob) => sum + prob, 0);
            if (sumOfProbabilities !== 1) throw new Error('概率数组中的值必须是非负的，并且总和必须为1');
            // 生成自文心一言
            const randomValue = Math.random();

            // 遍历概率数组，累加概率值，直到累加值超过随机生成的数
            let cumulate = 0;
            for (let i = 0; i < this.probability.length; i++) {
                cumulate += this.probability[i];
                if (randomValue < cumulate) {
                    // 返回与当前概率相对应的值
                    return this.value[i];
                }
            }

            // 如果由于浮点数加法错误没有返回任何值，则抛出一个错误
            throw new EvalError('FRandom出错了');
        }
    }
    /**
     * 执行器：概率执行判定
     * 级联传入
     * 返回执行判定器的结果
     */
    export class JProbable implements Judge {
        sign: string;
        private probability: number[] = new Array();
        private exec: Judge[] = new Array();

        constructor({ sign, probability, exec }: { sign: string; probability: number[]; exec: Judge[]; }) {
            this.sign = sign;
            this.probability = probability;
            this.exec = exec;
        }

        judge_me(arg0: any, sub: Character, obj: Character): any {
            if (this.probability.length !== this.exec.length) throw new Error('概率和值数组的长度必须相同');

            const sumOfProbabilities = this.probability.reduce((sum, prob) => sum + prob, 0);
            if (sumOfProbabilities !== 1) throw new Error('概率数组中的值必须是非负的，并且总和必须为1');
            // 生成自文心一言
            const randomValue = Math.random();

            // 遍历概率数组，累加概率值，直到累加值超过随机生成的数
            let cumulate = 0;
            for (let i = 0; i < this.probability.length; i++) {
                cumulate += this.probability[i];
                if (randomValue < cumulate) {
                    // 返回与当前概率相对应的值
                    return this.exec[i].judge_me(arg0, sub, obj);
                }
            }

            // 如果由于浮点数加法错误没有返回任何值，则抛出一个错误
            throw new EvalError('JProbable出错了');
        }
    }
    /**
     * 执行器：拥有特定buff一定数值则执行
     * （相当于FQuery和JCompare的结合）
     * 传入的是buff的总值
     * 执行成功：返回执行器的结果
     * 执行失败，返回 -1
     */
    export class JWith implements Judge {
        sign: string;
        aim: Selector = '<us>';
        keyword: string = '';
        op: string = '>=';
        b: number = 1;
        exec: Executable;

        constructor({ sign, aim, keyword, op, b, exec }: { sign: string; aim: Selector; keyword: string; op: string; b: number; exec: Executable; }) {
            this.sign = sign;
            this.aim = aim;
            this.keyword = keyword;
            this.b = b;
            this.exec = exec;
        }

        judge_me(arg: any, sub: Character, obj: Character): any {
            let count = 0;
            let chars = Stage.select(this.aim, sub, obj);
            for (const char of chars) {
                for (const buff of Object.values(char.buffs)) {
                    if (buff.buff_cat === this.keyword || buff.name === this.keyword) {
                        count++;
                    }
                }
            }
            let flag = false;
            switch (this.op) {
                case '>=': flag = count >= this.b; break;
                case '>': flag = count > this.b; break;
                case '==': flag = count == this.b; break;
                case '<=': flag = count <= this.b; break;
                case '<': flag = count < this.b; break;
                case '!=': flag = count != this.b; break;
                default: throw new EvalError('无效运算符');
            }
            if (flag) {
                return this.exec.judge_me(count, sub, obj);
            } else {
                return -1;
            }
        }
    }
    /**
     * 执行器：比较arg0和b，符合比较运算符则执行
     * 执行成功：返回执行的结果
     * 执行失败：返回-1
     */
    export class JCompare implements Judge {
        sign: string;
        private a?: number;
        private b: number | Evaluate = 0;
        private op: string = '>';
        private exec: Executable;

        constructor({ sign, a = 0, b, op, exec }: { sign: string; a?: number; b: number | Evaluate; op: string; exec: Executable; }) {
            this.sign = sign;
            this.a = a;
            this.b = b;
            this.op = op;
            this.exec = exec;
        }

        judge_me(v: number, sub: Character, obj: Character): any {
            if (this.a === undefined && v === undefined) {
                throw new EvalError('JCompare when <a> was undefined'); // a v至少存在一个
            }
            const a = this.a !== undefined ? this.a : v!; // 使用非空断言操作符，因为我们已经检查了v
            const b = typeof this.b === 'number' ? this.b : this.b.judge_me(undefined, sub, obj);
            let flag = false;
            switch (this.op) {
                case '>=': flag = a >= b; break;
                case '>': flag = a > b; break;
                case '==': flag = a == b; break;
                case '<=': flag = a <= b; break;
                case '<': flag = a < b; break;
                case '!=': flag = a != b; break;
                default: throw new EvalError('无效运算符');
            }
            if (flag) { return this.exec.judge_me(<any>undefined, sub, obj); }
            else { return -1; }
        }
    }
    /**
     * 执行器：直接执行单条behavior
     * 如果有arg0，则覆盖behavior的倍率
     */
    export class JBehave implements Judge {
        sign: string;
        behave: Behavior;

        constructor({ sign, behave }: { sign: string; behave: Behavior; }) {
            this.sign = sign;
            this.behave = behave;
        }

        judge_me(arg0: any, sub: Character, obj: Character) {
            Behavior.behave(this.behave, sub, obj, arg0);
        }
    }
    /**
     * 执行器：串联
     * 上一个判定器的返回值不为空则将传给下一个
     * 返回值为判定器组的最后一个有效返回值
     */
    export class JSeries implements Judge {
        sign: string;
        judges: Judge[] = [];

        constructor({ sign, judge }: { sign: string; judge: Judge[]; }) {
            this.sign = sign;
            this.judges = judge;
        }

        judge_me(arg0: any, sub: Character, obj: Character) {
            for (let judge of this.judges) {
                let rv = judge.judge_me(arg0, sub, obj);
                if (rv) arg0 = rv;
            }
            return arg0;
        }
    }

    type Evaluate = FRandom | FMath | FFunc | FQuery | FGet;
    type Executable = JBehave | JSeries | JCompare | JProbable | JWith;
} 


class Stat {
    static instances: Stat[] = [];
    attack: number = 100;
    health_limit: number = 10000;
    health_now: number = 10000;
    shield: number = 0;
    real_def: number = 0;
    mental_def: number = 0;
    crit_rate: number = 0.0;
    crit_anti_rate: number = 0.0;
    crit_dmg: number = 0.0;
    crit_def: number = 0.0;
    dmg_d_increase: number = 0.0;
    dmg_t_reduce: number = 0.0;
    might_incant: number = 0.0;
    might_ultimate: number = 0.0;
    dmg_heal: number = 0.0;
    leech_rate: number = 0.0;
    heal_rate: number = 0.0;
    heal_taken_rate: number = 0.0;
    penetrate: number = 0.0;
    moxie_now: number = 0;
    moxie_limit: number = 5;
    ultimate_cost: number = 5;
    action_point: number = 1;
    genesis_increase: number = 0.0;
    power_increase: number = 0.0;
    get health_loss() {
        return this.health_limit - this.health_now;
    }
    /**
     * sum_obj: 对象加法，将两个同键的值相加
     */
    static sum_stat(o1: Partial<Stat>, o2: Partial<Stat>) {
        let keys = Object.getOwnPropertyNames(o1).concat(
            Object.getOwnPropertyNames(o2)
        );
        let o = new Stat();
        for (let k of keys) {
            // @ts-ignore
            o[k] = (o1[k] || 0) + (o2[k] || 0);
        }
        return o;
    }
}
type StatInc = Partial<Stat>;

class Buff {
    static count = 0;
    id: number = 1;
    name: string = '';
    buff_cat: 'pos_status' | 'neg_status' | 'stats_up' | 'stats_down' | 'counter' | 'shield' | 'special' = 'special';

    value: number = 1;
    limit: number = Infinity;

    level: number = 1;
    merge: 'add' | 'individually' | 'no' = 'no';

    stat_inc: StatInc = {};
    judge: Readonly<J.Judge>[] = new Array<J.Judge>();
    decrease: Readonly<J.Judge>[] = new Array<J.Judge>();
    host_character: Character = stage.Background;

    signal(sign: string, source: Character, target: Character) {
        for (let judge of this.judge) {
            if (judge.sign === sign) {
                console.log(sign, '由buff触发器触发');
                judge.judge_me(undefined, source, target);
            }
        }
    }
}
class Item {
    stat_inc: StatInc = {};
    attach: Readonly<J.Judge>[] = new Array<J.Judge>();
}

class Behavior {
    selector: Selector = "<aim>";
    type: "damage" | "heal" | "shield" | "buff" = 'buff';
    damage_type?: "real" | "mental" | "genesis";
    rely_obj: "self" | "aim" = "self";
    rely_name: keyof Stat = "attack";
    ratio: number = 2.00;
    no_crit: boolean = false;
    buff?: Buff;
    static behave(behave: Behavior, origin: Character, aim: Character, spell?: Spell, ratio?: number) {
        let real_ratio = ratio !== undefined ? ratio : behave.ratio;
        for (let target of Stage.select(behave.selector, origin, aim)) {
            let statC = origin.stat;
            let statT = target.stat;
            let rely_value = behave.rely_obj === "self" ? statC[behave.rely_name] : statT[behave.rely_name];
            if (spell && spell.judge_before) { J.J.judgeS(spell.judge_before, origin, aim); }
            if (behave.type == "damage") {
                signal2('before_damage', origin, target);
                let damage = 0;
                let crit_part = 1.0;
                let conquer = 1.00; // 克制伤害

                if (origin.check_conquer(target)) {
                    conquer = 1.30;
                    signal2('before_conquer_damage', origin, target);
                }
                if (!behave.no_crit) {
                    if (Math.random() < (statC.crit_rate - statT.crit_anti_rate)) {
                        signal2('before_crit_damage', origin, target);
                        signal2('before_' + behave.damage_type + '_crit_damage', origin, target);
                        crit_part = statC.crit_dmg - statT.crit_def;
                    }
                }
                signal2('before_' + behave.damage_type + '_damage', origin, target);
                origin.initStat();
                target.initStat();
                statC = origin.stat_now;
                statT = target.stat_now;
                rely_value = behave.rely_obj === "self" ? statC[behave.rely_name] : statT[behave.rely_name];
                if (behave.damage_type == "genesis") {
                    damage = real_ratio * rely_value * statC.genesis_increase * crit_part;
                }
                else {
                    let power = 1.00; // 威力
                    if (spell) power = (1 + statC[<keyof Stat>('might_' + spell.energy)]);
                    damage = real_ratio * (statC.attack - statT[<keyof Stat>(behave.damage_type + '_def')] * (1 - statC.penetrate)) * (1 + statC.dmg_d_increase - statT.dmg_t_reduce) * power * crit_part * conquer;
                };
                target.damage_me(damage);
                origin.heal_me(damage * statC.leech_rate);
                signal2('after_' + behave.damage_type + '_damage', origin, target);
            } else if (behave.type === "heal") {
                signal2('before_heal', origin, target);
                let crit_part = 1.0;
                if (!behave.no_crit) {
                    if (Math.random() < statC.crit_rate) {
                        crit_part = statC.crit_dmg;
                        signal2('before_crit_heal', origin, target);
                    }

                }
                let heal = behave.ratio * rely_value * (1 + statC.heal_rate) * (1 + statT.heal_taken_rate) * crit_part;
                target.heal_me(heal);
                signal2('after_heal', origin, target);
            } else if (behave.type == "shield") {
                signal2('before_shield', origin, target);
                let shield = real_ratio * rely_value;
                target.add_shield(shield);
                signal2('after_shield', origin, target);
            }
            if (behave.buff) {
                signal2('before_buff', origin, target);
                target.add_buff(behave.buff);
                signal2('after_buff', origin, target);
            }
            if (spell && spell.judge_after) { J.J.judgeS(spell.judge_after, origin, aim); }
        }
    }

    static behaveS(behaves: Behavior[], origin: Character, aim: Character, spell?: Spell) {
        for (let b of behaves) {
            this.behave(b, origin, aim, spell = spell);
        }
    }
}

class Spell {
    energy: "incant" | "ultimate" = "incant";
    category: "buff" | "debuff" | "attack" | "heal" | "shield" | "versatile" = 'attack';
    judge_before: Readonly<J.Judge>[] = [];
    judge_after: Readonly<J.Judge>[] = [];
    behaviors: Behavior[] = new Array<Behavior>();
    cast(origin: Character, aim: Character) {
        signal('on_' + this.energy, origin, aim);
        Behavior.behaveS(this.behaviors, origin, aim);
    }
}

class Arcanal {
    energy: "incant" | "ultimate" = "incant";
    category: "buff" | "debuff" | "attack" | "heal" | "shield" | "versatile" = 'attack';
    spells: Spell[] = new Array();

    cast(level: number, origin: Character, aim: Character) {
        this.spells[level - 1].cast(origin, aim);
    }
}

class Card {
    temp: boolean = false;
    image: string = "";
    // energy: "incant" | "ultimate" = "incant";
    // category: "buff" | "debuff" | "attack" | "heal" | "shield" | "versatile" = 'attack';
    level: number = 1;
    arcanal_index: number = -1;
}

type Selector = "<aim2>" | "<aim>" | "<self>" | "<opposite>" | "<us>" | "<player>" | "<enemy>" | "<random_us>" | "<random_opp>";
type Afflatus = "star" | "mineral" | "beast" | "plant" | "intellect" | "spirit" | "null";

class Character {
    static afflatus4: Afflatus[] = ["star", "mineral", "beast", "plant"];
    static afflatus2: Afflatus[] = ["intellect", "spirit"];
    static instances: Character[] = [];
    /** 双方所有角色，0为玩家方 */
    static all_char: Character[][] = [[], []];
    static count = 0;

    id: number = 0;
    name: string = "";
    afflatus: Afflatus = "null";
    damage_type: "real" | "mental" | "genesis" = "genesis";

    stat: Stat = new Stat();
    stat_now: Stat = new Stat();

    items: Item[] = [];
    buffs: Map<number, Buff> = new Map<number, Buff>();

    judges: Readonly<J.Judge>[] = new Array();
    ability: Map<string, Arcanal> = new Map();
    ultimate?: Arcanal = new Arcanal();

    /** 角色归属，玩家方为0 */
    side: number = 0;

    constructor() {
        Character.count += 1;
        this.id = Character.count;
        Character.instances.push(this);
    }

    [Symbol.toPrimitive](hint: 'string') {
        if (hint === "string") {
            return `${this.name} #${this.id}`;
        }
    }

    toString() {
        return `${this.name} #${this.id}`;
    }

    initStat() {
        Object.assign(this.stat_now, this.stat);
        for (const item of this.items) {
            if (item.stat_inc != undefined) {
                Object.assign(
                    this.stat_now,
                    Stat.sum_stat(this.stat_now, item.stat_inc)
                );
            }
        }
        for (const [_, buff] of this.buffs) {
            if (buff.stat_inc != undefined) {
                Object.assign(
                    this.stat_now,
                    Stat.sum_stat(this.stat_now, buff.stat_inc)
                );
            }
        }
        this.process_modifier();
    }
    /**
     * 处理修饰符，关于对attack, (health), real_def和mental_def的比例修饰
     */
    process_modifier() {
        for (const k in this.stat_now) {
            if (k.startsWith("<increase>")) {
                // @ts-ignore
                this.stat_now[k.slice(10)] = this.stat_now[k.slice(10)] * (1 + this.stat_now[k]);
            }
        }
    }

    check_conquer(enemy: Character) {
        if (
            this.afflatus in Character.afflatus2 &&
            enemy.afflatus in Character.afflatus2 &&
            this.afflatus != enemy.afflatus
        ) {
            return true;
        } else if (
            this.afflatus in Character.afflatus4 &&
            enemy.afflatus in Character.afflatus4
        ) {
            if (
                (Character.afflatus4.indexOf(this.afflatus) -
                    Character.afflatus4.indexOf(enemy.afflatus)) %
                4 ==
                -1
            ) {
                return true;
            }
        } else {
            return false;
        }
    }

    cast(name: string, level: number = 1, aim: Character) {
        let arcanal = this.ability.get(name);
        if (arcanal) {
            if (arcanal.energy === 'ultimate') this.stat.moxie_now -= this.stat.ultimate_cost;
            arcanal.cast(level, this, aim);
        }
    }

    signal(sign: string, target: Character) {
        console.log(sign, target.toString());
        for (let judge of this.judges) {
            if (judge.sign === sign) {
                judge.judge_me(undefined, this, target);
            }
        }
        for (let [_, buff] of this.buffs) {
            buff.signal(sign, this, target);
        }
    }

    damage_me(dmg: number) {
        if (this.stat.shield > dmg) this.stat.shield -= dmg;
        else if (this.stat.shield) {
            dmg -= this.stat.shield;
            this.stat.shield = 0;
            this.stat.health_now -= dmg;
            signal('on_shield_broke', this, this); /// XXX
        } else {
            dmg -= this.stat.shield;
        }
        repl(this.toString() + `受到了${dmg}伤害`);
        if (this.stat.health_now < 0) {
            this.stat.health_now = 0;
            signal('on_death', this, this);
            // signalS('on_friend_death', this, this.);
        }
    }

    heal_me(heal: number) {
        this.stat.health_now += heal;
        if (this.stat.health_now > this.stat.health_limit) { this.stat.health_now = this.stat.health_limit; }
        if (heal > 0) {
            repl(this.toString() + `受到了${heal}治疗`);
        }
    }

    add_shield(shield: number) {
        if (shield > this.stat.shield) {
            this.stat.shield = shield;
        }
    }

    add_buff(new_buff: Buff) {
        let flag: boolean | undefined = undefined;
        new_buff.host_character = this;
        for (let [_, buff] of this.buffs) {
            if (buff.name == new_buff.name) {
                if (buff.merge == 'add') {
                    buff.value += new_buff.value;
                    flag = true;
                    if (buff.value > buff.limit) {
                        buff.value = buff.limit;
                    }
                } else if (buff.merge == 'individually') {
                    this.buffs.set(new_buff.id, new_buff);
                    flag = true;
                } else {
                    if (new_buff.level > buff.level) {
                        this.buffs.delete(buff.id);
                        this.buffs.set(new_buff.id, new_buff);
                        flag = true;
                    } else if (new_buff.level == buff.level) {
                        buff.value = new_buff.value > buff.value ? new_buff.value : buff.value;
                        flag = true;
                    } else {
                        flag = false;
                    }
                }
            }
        }
        if (flag === undefined) {
            this.buffs.set(new_buff.id, new_buff);
            flag = true;
        }
        if (flag) {
            repl(this.toString() + `被成功施加了${new_buff.name}`);
        }
        return flag;
    }

    add_moxie(moxie: number) {
        // 'disconcert' 心神不宁，无法增加激情
        for (let [_, buff] of this.buffs) {
            if (buff.name == 'disconcert') {
                return false;
            }
        }
        this.stat.moxie_now += moxie;
        if (this.stat.moxie_now > this.stat.moxie_limit) { this.stat.moxie_now = this.stat.moxie_limit; }
        repl(this.toString() + `激情增加！现在有${this.stat.moxie_now}`);
    }

    check_ultimate(): boolean {
        for (let [_, buff] of this.buffs) {
            if (buff.name == 'seal') { // 封印
                return false;
            }
        }
        if (this.stat.moxie_now > this.stat.ultimate_cost) {
            return true;
        }
        return false;
    }
}

class Stage {
    round = 0;
    player_incants: Arcanal[] = [];
    player_cards: Card[] = [];
    card_pool: number[] = [];
    Background = new Character();
    card_limit = 0;
    player_limit = 0;
    /** 双方场上角色，stage[0]为玩家方 */
    stage: Character[][] = [[], []];
    static readonly player_to_card: Record<number, number> = { 1: 4, 2: 5, 3: 7, 4: 8 };

    static shuffle(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            // Knuth's Shuffle Algorithm
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    popCard() {
        for (let char of this.stage[0]) {
            if (char.check_ultimate()) {
                return char.ultimate;
            }
        }
        return this.card_pool.pop();
    }

    scanCard() {
        for (let i = 0; i < this.player_cards.length; i++) {
            if (this.player_cards[i].arcanal_index === this.player_cards[i + 1].arcanal_index && this.player_cards[i].level === this.player_cards[i + 1].level && this.player_cards[i].level < 3) {
                this.player_cards.splice(i + 1, 1);
                this.player_cards[i].level += 1;
                return true;
            }
        }
        return false;
    }

    refreshPool() {
        for (let i = 0; i < this.player_incants.length; i++) {
            let card = new Card();
            for (let j = 0; j < 8; j++) this.card_pool.push(i);
            this.player_cards.push(card);
        }
        Stage.shuffle(this.card_pool);
    }

    refreshCard() {
        let arcanal_indexes: number[] = Array.from(
            { length: this.player_incants.length },
            (_, i) => i + 1
        );
        Stage.shuffle(arcanal_indexes);
        if (this.card_limit > this.player_incants.length) {
            let n = this.card_limit - this.player_incants.length;
            for (let i = 0; i < n; i++) {
                arcanal_indexes.push(arcanal_indexes[i]);
            }
        }

        for (let i = 0; i < this.player_incants.length; i++) {
            this.player_cards[i].arcanal_index = arcanal_indexes[i];
        }
    }

    initCards() {
        this.card_limit = Stage.player_to_card[this.player_limit];
        for (let char of this.stage[1]) {
            for (let [_, arc] of char.ability) {
                if (arc.energy === "incant") {
                    this.player_incants.push(arc);
                }
            }
        }
        this.refreshPool();
        this.refreshCard();

    }

    beforeRound() {
        if (this.round === 0) {
            signalAll('on_entry', this.stage[0]);
            this.initCards();
            this.round = 1;
        }
        signalAll('before_round', this.stage[0]);
        if (this.player_cards.length < this.player_incants.length) {
            this.popCard();
            while (this.scanCard()) { };
        }
    }

    aRound() {
        // TODO
    }

    static choose(side: number, avoid?: Character): Character {
        let choice: Character;
        do {
            choice = stage.stage[side][Math.random() * stage.stage[side].length];
        } while (choice == avoid);
        return choice;
    }

    static select(selector: Selector, origin: Character, aim: Character): Character[] {
        switch (selector) {
            case "<self>":
                return [origin];
            case "<us>":
                return stage.stage[origin.side];
            case "<aim>":
                return [aim];
            case "<aim2>":
                return [aim, this.choose(aim.side, aim)];
            case "<opposite>":
                return stage.stage[1 - origin.side];
            case "<player>":
                return stage.stage[0];
            case "<enemy>":
                return stage.stage[1];
            case "<random_us>":
                return [this.choose(origin.side)];
            case "<random_opp>":
                return [this.choose(1 - origin.side)];
        }
    }
}

function signal(sign: Signal, source: Character, target: Character) {
    source.signal(sign, target);
}

function signal2(damage_sign: Signal, source: Character, target: Character) {

    signal(damage_sign + '_dealt', source, target);
    signal(damage_sign + '_taken', target, source);
}

/**
 * 通知列表中的角色。如果target未定义，它们收到的target是自己
 * @date 2024/2/8 - 13:41:54
 *
 * @param {Character} sources 被通知主体列表
 * @param {Character} target? 目标对象
 */
function signalAll(sign: Signal, sources: Character[], target?: Character) {
    for (let source of sources) {
        signal(sign, source, target ? target : source);
    }
}



type Signal = string;

var stage = new Stage();
var repl = console.log;

function temporarily() {
    let b1 = new Buff();
    b1.stat_inc.dmg_d_increase = 0.15;
    b1.name = "创伤加成+15%";
    let i1 = new Behavior();
    i1.type = 'buff';
    i1.buff = b1;
    i1.selector = '<us>';
    let s2 = new Spell();
    s2.behaviors.push(i1);
    let a2 = new Arcanal();
    a2.spells.push(s2);
}

function test() {
    let damage160 = new Behavior();
    damage160.ratio = 1.60;
    damage160.type = 'damage';
    damage160.damage_type = 'real';

    let ran = new J.FRandom({ sign: '', probability: [0.2, 0.4, 0.4], value: [1, 2, 3] });

    let s1 = new Spell();
    s1.behaviors.push(damage160);
    let a1 = new Arcanal();
    a1.spells.push(s1);



    let c1 = new Character();
    c1.name = "曲娘";
    c1.stat.attack = 1500;

    c1.ability.set("1", a1);

    let c2 = new Character();
    c2.name = "重塑之手";

    stage.stage[0].push(c1);
    stage.stage[1].push(c2);

    c1.cast('1', 1, c2);
}

function main() {
    test();
}
main();


/* document.addEventListener("DOMContentLoaded", function () {

}); */
