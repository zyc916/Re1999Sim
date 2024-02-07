// @ts-check
"use strict";

function deepCopy<T>(obj: T, hash = new WeakMap()): T {
    if (typeof obj !== "object" || obj === null) {
        return obj;
    }
    if (hash.has(obj)) {
        return hash.get(obj);
    }
    // @ts-ignore
    let copy: any = new obj.constructor();
    hash.set(obj, copy);
    for (let key in obj) {
        if (obj.hasOwnProperty(key) && !(obj[key] instanceof Character)) {
            // 递归复制每个属性
            copy[key] = deepCopy(obj[key], hash);
        } else if (obj[key] instanceof Character) {
            copy[key] = obj[key];
        }
    }
    hash.delete(obj);
    if (obj.hasOwnProperty("id")) {
        // @ts-ignore
        copy.id = obj.constructor.count;
        // @ts-ignore
        obj.constructor.count += 1;
    }
    // 返回复制后的新对象
    return copy;
}

namespace J {
    export abstract class Judge {
        static variables: Record<string, any> = new Map<string, any>();
        abstract judge_me(arg?: any, sub?: Character, obj?: Character): any;
    }
    export class FMath extends Judge {
        operator: string = "+";
        a: number = 0;
        b: number | Judge = 0;
        judge_me(arg?: any, sub?: Character, obj?: Character) {
            let a = arg ? arg : this.a;
            let b = this.b instanceof Judge ? this.b.judge_me() : this.b;
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
    export class FFunc extends Judge {
        func: keyof Math = "floor";
        b: number | Judge = 0;
        judge_me(arg?: any, sub?: Character, obj?: Character) {
            let b = arg ? arg : this.b;
            b = b instanceof Judge ? <number>b.judge_me() : b;
            if (typeof Math[this.func] === "function") {
                return (<Function>Math[this.func])(b);
            } else {
                throw new Error("invalid function name");
            }
        }
    }
    export class FGet extends Judge {
        variable: string = "";
        judge_me(arg?: any, sub?: Character, obj?: Character) {
            return Judge.variables.get(this.variable);
        }
    }
    export class FSet extends Judge {
        variable: string = "";
        judge_me(arg?: any, sub?: Character, obj?: Character) {
            Judge.variables.set(this.variable, arg);
        }
    }
    export class FAccess extends Judge {
        path: string = "";
        aim: "sub" | "obj" = "obj";
        judge_me(arg?: any, sub?: Character, obj?: Character) {
            let rely = this.aim === "obj" ? obj : sub;
            const parts = this.path.split(".");
            for (let i = 0; i < parts.length; i++) {
                if (rely) rely = rely[parts[i]];
                else return undefined;
            }
            return rely;
        }
    }
    export class FQuery extends Judge {
        keyword: string = "";
        aim: "sub" | "obj" = "obj";
        judge_me(arg?: any, sub?: Character, obj?: Character) {
            let rely = this.aim === "obj" ? obj : sub;
        }
    }
}

class Stat {
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
    value: number = 1;
    limit: number = Infinity;

    level: number = 1;
    merge: 'add' | 'individually' | 'no' = 'no';

    stat_inc: StatInc = {};
    decrease: J.Judge[] = new Array<J.Judge>();
    host_character: Character = stage.Background;
    // TODO
}
class Item {
    stat_inc: StatInc = {};
    attach: J.Judge[] = new Array<J.Judge>();
}
class Behavior {
    selector: Selector = "<aim>";
    type: "damage" | "heal" | "shield" | "buff";
    damage_type?: "real" | "mental" | "genesis";
    rely_obj: "self" | "aim" = "self";
    rely_name: keyof Stat = "attack";
    ratio: number = 2.0;
    no_crit: boolean = false;
    buff?: Buff;
    static behave(behaves: Behavior[], origin: Character, aim: Character, spell?: Spell) {
        for (let b of behaves) {
            for (let target of Stage.select(b.selector, origin, aim)) {
                let statC = origin.stat;
                let statT = target.stat;
                let rely_value =
                    b.rely_obj === "self" ? statC[b.rely_name] : statT[b.rely_name];
                switch (b.type) {
                    case "damage":
                        let damage = 0;
                        let crit_part = 1.0;
                        if (!b.no_crit) {
                        }
                        switch (b.damage_type) {
                            case "genesis":
                                let damage = b.ratio * rely_value * statC.genesis_increase * crit_part;
                                break;
                            default:
                                let conquer = 1.00; // 克制伤害
                                if (origin.check_conquer(target)) conquer = 1.30;
                                let power = 1.00; // 威力
                                if (spell) power = (1 + statC[<keyof Stat>('might_' + spell.energy)]);
                                damage = b.ratio * (statC.attack - statT[<keyof Stat>(b.damage_type + '_def')] * (1 - statC.penetrate)) * (1 + statC.dmg_d_increase - statT.dmg_t_reduce) * power * crit_part * conquer;

                        }
                        target.damage_me(damage);

                }
            }
        }
    }
}

class Spell {
    energy: "incant" | "ultimate" = "incant";
    category: "buff" | "debuff" | "attack" | "heal" | "shield" | "versatile";
    behaviors: Behavior[] = new Array<Behavior>();
    cast(origin: Character, aim: Character) {
        // TODO
        Behavior.behave(this.behaviors, origin, aim);
    }
}

class Arcanal {
    energy: "incant" | "ultimate" = "incant";
    category: "buff" | "debuff" | "attack" | "heal" | "shield" | "versatile";
    spells: Spell[] = new Array();

    cast(level: number, origin: Character, aim: Character) {
        deepCopy(this.spells[level - 1]).cast(origin, aim);
    }
}

class Card {
    image: string = "";
    energy: "incant" | "ultimate" = "incant";
    category: "buff" | "debuff" | "attack" | "heal" | "shield" | "versatile";
    level: number = 3;
    arcanal_index: number = -1;
}

type Selector =
    | "<aim>"
    | "<self>"
    | "<opposite>"
    | "<us>"
    | "<player>"
    | "<enemy>"
    | "<random_us>"
    | "<random_opp>";
type Afflatus =
    | "star"
    | "mineral"
    | "beast"
    | "plant"
    | "intellect"
    | "spirit"
    | "null";

class Character {
    static afflatus4: Afflatus[] = ["star", "mineral", "beast", "plant"];
    static afflatus2: Afflatus[] = ["intellect", "spirit"];
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

    judges: J.Judge[] = new Array();
    ability: Map<string, Arcanal> = new Map();
    /** 角色归属，玩家方为0 */
    side: number = 0;

    constructor() {
        Character.count += 1;
        this.id = Character.count;
    }

    [Symbol.toPrimitive](hint) {
        if (hint === "string") {
            return `${this.name} #${this.id}`;
        }
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
                this.stat_now[k.slice(10)] =
                    this.stat_now[k.slice(10)] * (1 + this.stat_now[k]);
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
        this.ability.get(name)?.cast(level, this, aim);
    }

    damage_me(dmg: number) {
        if (this.stat.shield > dmg) this.stat.shield -= dmg;
        else if (this.stat.shield) {
            dmg -= this.stat.shield;
            this.stat.shield = 0;
            this.stat.health_now -= dmg;
            triggers('on_shield_broke', this, '<me>'); // FIXME
        } else {
            dmg -= this.stat.shield;
        }
        repl(`${this.name}${this.id}受到了${dmg}伤害`);
        if (this.stat.health_now < 0) { this.stat.health_now = 0; triggers('on_death', this, '<me>'); }
    }

    heal_me(heal: number) {
        this.stat.health_now += heal;
        if (this.stat.health_now > this.stat.health_limit) { this.stat.health_now = this.stat.health_limit; }
        if (heal > 0) {
            repl(`${this.name}${this.id}受到了${heal}治疗`);
        }
    }

    add_shield(shield: number) {
        if (shield > this.stat.shield) {
            this.stat.shield = shield;
        }
    }

    add_buff(new_buff: Buff) {
        // TODO
        // throw new Error("Method not implemented.");
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
                    // [ ] Buff.attach 交给buff的方法自己处理
                    flag = true;
                } else {
                    if (new_buff.level > buff.level) {
                        this.buffs.delete(buff.id)
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
            repl(`${this.name}${this.id}被成功施加了${new_buff.name}`);
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
        repl(`${this.name}${this.id}激情增加！现在有${this.stat.moxie_now}`);
    }
}

class Stage {
    round = 1;
    player_incants: Arcanal[] = [];
    player_cards: Card[] = [];
    card_pool: number[] = [];
    Background = new Character();
    card_limit = 0;
    player_limit = 0;
    /** 双方场上角色，stage[0]为玩家方 */
    stage: Character[][] = [[], []];
    static readonly player_to_card = { 1: 4, 2: 5, 3: 7, 4: 8 };

    static shuffle(array: any[]) {
        for (let i = array.length - 1; i > 0; i--) {
            // Knuth's Shuffle Algorithm
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    refreshCard() {
        let arcanal_indexes: number[] = Array.from(
            { length: this.player_incants.length },
            (_, i) => i + 1
        );
        Stage.shuffle(arcanal_indexes);

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
        for (let i = 0; i < this.player_incants.length; i++) {
            let card = new Card();
            for (let j = 0; j < 8; j++) this.card_pool.push(i);
            this.player_cards.push(card);
        }
        this.refreshCard();
        Stage.shuffle(this.card_pool);
    }

    static select(
        selector: Selector,
        origin: Character,
        aim: Character
    ): Character[] {
        switch (selector) {
            case "<self>":
                return [origin];
            case "<us>":
                return stage.stage[origin.side];
            case "<aim>":
                return [aim];
            case "<opposite>":
                return stage.stage[aim.side];
            case "<player>":
                return stage.stage[0];
            case "<enemy>":
                return stage.stage[1];
            case "<random_us>":
                return [
                    stage.stage[origin.side][
                    Math.random() * stage.stage[origin.side].length
                    ],
                ];
            case "<random_opp>":
                return [
                    stage.stage[origin.side][
                    Math.random() * stage.stage[origin.side].length
                    ],
                ];
        }
    }
}

var stage = new Stage();
var repl = console.log;

function test() {
    let s1 = new Spell();
    let c1 = new Character();
}

(function main() { })();
