// @ts-check
'use strict';

function deepCopy<T>(obj: T, hash = new WeakMap()): T {
    if (typeof obj !== 'object' || obj === null) {
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
    if (obj.hasOwnProperty('id')) {
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
        operator: string = '+';
        a: number = 0;
        b: number | Judge = 0;
        judge_me(arg?: any, sub?: Character, obj?: Character) {
            let a = arg ? arg : this.a;
            let b = this.b instanceof Judge ? this.b.judge_me() : this.b;
            switch (this.operator) {
                case '+': return a + b;
                case '-': return a - b;
                case '*': return a * b;
                case '/': if (b === 0) throw new Error('divide by zero');
                    return a / b;
                case '%': if (b === 0) throw new Error('modulo by zero');
                    return a % b;
                default:
                    throw new Error('invalid operator');
            }
        }
    }
    export class FFunc extends Judge {
        func: keyof Math = 'floor';
        b: number | Judge = 0;
        judge_me(arg?: any, sub?: Character, obj?: Character) {
            let b = arg ? arg : this.b;
            b = b instanceof Judge ? <number>b.judge_me() : b;
            if (typeof Math[this.func] === 'function') {
                return (<Function>Math[this.func])(b);
            } else {
                throw new Error('invalid function name');
            }
        }
    }
    export class FGet extends Judge {
        variable: string = '';
        judge_me(arg?: any, sub?: Character, obj?: Character) { return Judge.variables.get(this.variable); }
    }
    export class FSet extends Judge {
        variable: string = '';
        judge_me(arg?: any, sub?: Character, obj?: Character) { Judge.variables.set(this.variable, arg); }
    }
    export class FAccess extends Judge {
        path: string = '';
        target: 'sub' | 'obj' = 'obj';
        judge_me(arg?: any, sub?: Character, obj?: Character) {
            let rely = this.target === 'obj' ? obj : sub;
            const parts = this.path.split('.');
            for (let i = 0; i < parts.length; i++) {
                if (rely) rely = rely[parts[i]];
                else return undefined;
            }
            return rely;
        }
    };
    export class FQuery extends Judge {
        keyword: string = '';
        target: 'sub' | 'obj' = 'obj';
        judge_me(arg?: any, sub?: Character, obj?: Character) {
            let rely = this.target === 'obj' ? obj : sub;
        }
    }
}

class Stat {
    attack: number = 100; health_limit: number = 10000; health_now: number = 10000; shield: number = 0;
    real_def: number = 0; mental_def: number = 0;
    crit_rate: number = 0.0; crit_anti_rate: number = 0.0; crit_dmg: number = 0.0; crit_def: number = 0.0;
    dmg_d_increase: number = 0.0; dmg_t_reduce: number = 0.0; might_incant: number = 0.0; might_ultimate: number = 0.0; dmg_heal: number = 0.0; leech_rate: number = 0.0; heal_rate: number = 0.0; heal_taken_rate: number = 0.0; penetrate: number = 0.0;
    moxie_now: number = 0; moxie_limit: number = 5; ultimate_cost: number = 5; action_point: number = 1;
    genesis_increase: number = 0.0; power_increase: number = 0.0;
    get health_loss() { return this.health_limit - this.health_now; }
}
type StatInc = Partial<Stat>;

class Buff {
    stat_inc: StatInc = {};
    decrease: J.Judge[] = new Array<J.Judge>();
    host_character: Character = stage.Background;
    // TODO
}

class Behavior {
    target: Selector = '<target>';
    type: 'damage' | 'heal' | 'shield' | 'buff';
    damage_type?: 'real' | 'mental' | 'genesis';
    rely_obj: 'self' | 'target' = 'self';
    rely_attr?: keyof Stat;
    ratio?: number = 2.00;
    buff?: Buff;
    static behave(behaves: Behavior[], source?: Character, target?: Character) {

        for (let b of behaves) {

            {
                switch (b.type) {

                }
            }
        }

    }
}

class Spell {
    energy: 'incant' | 'ultimate' = 'incant';
    category: 'buff' | 'debuff' | 'attack' | 'heal' | 'shield' | 'versatile';
    behaviors: Behavior[] = new Array<Behavior>();
    cast(source: Character, target: Character) {
        // TODO
        Behavior.behave(this.behaviors, source, target);
    }
}

class Arcanal {
    energy: 'incant' | 'ultimate' = 'incant';
    category: 'buff' | 'debuff' | 'attack' | 'heal' | 'shield' | 'versatile';
    spells: Spell[] = new Array();


    cast(level: number, source: Character, target: Character) {
        deepCopy(this.spells[level - 1]).cast(source, target);
    }
}

class Card {
    image: string = '';
    energy: 'incant' | 'ultimate' = 'incant';
    category: 'buff' | 'debuff' | 'attack' | 'heal' | 'shield' | 'versatile';
    level: number = 3;
    arcanal_index: number = -1;
}

type Selector = '<target>' | '<self>' | '<opposite>' | '<us>' | '<player>' | '<enemy>' | '<random_us>' | '<random_opp>';
type Afflatus = 'star' | 'mineral' | 'beast' | 'plant' | 'intellect' | 'spirit' | 'null';

class Character {
    static afflatus4: Afflatus[] = ['star', 'mineral', 'beast', 'plant'];
    static afflatus2: Afflatus[] = ['intellect', 'spirit'];
    /** 双方所有角色，0为玩家方 */
    static all_char: Character[][] = [[], []];
    static count = 0;

    id: number = 0;
    name: string = '';
    afflatus: Afflatus = 'null';
    damage_type: 'real' | 'mental' | 'genesis' = 'genesis';


    judges: J.Judge[] = new Array();
    ability: Map<string, Arcanal> = new Map();
    /** 角色归属，玩家方为0 */
    side: number = 0;

    constructor() {
        Character.count += 1;
        this.id = Character.count;
    }

    check_conquer(enemy: Character) {
        if (this.afflatus in Character.afflatus2 && enemy.afflatus in Character.afflatus2 && this.afflatus != enemy.afflatus) {
            return true;
        } else if (this.afflatus in Character.afflatus4 && enemy.afflatus in Character.afflatus4) {
            if ((Character.afflatus4.indexOf(this.afflatus) - Character.afflatus4.indexOf(enemy.afflatus)) % 4 == -1) {
                return true;
            }
        } else {
            return false;
        }
    }

    cast(name: string, level: number = 1, target: Character) {
        this.ability.get(name)?.cast(level, this, target);
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
        let arcanal_indexes: number[] = Array.from({ length: this.player_incants.length }, (_, i) => i + 1);
        Stage.shuffle(arcanal_indexes);

        for (let i = 0; i < this.player_incants.length; i++) {
            this.player_cards[i].arcanal_index = arcanal_indexes[i];
        }
    }

    initCards() {
        this.card_limit = Stage.player_to_card[this.player_limit];
        for (let char of this.stage[1]) {
            for (let [_, arc] of char.ability) {
                if (arc.energy === 'incant') {
                    this.player_incants.push(arc);
                }
            }
        }
        for (let i = 0; i < this.player_incants.length; i++) {
            let card = new Card();
            for (let j = 0; j < 8; j++)  this.card_pool.push(i);
            this.player_cards.push(card);
        }
        this.refreshCard();
        Stage.shuffle(this.card_pool);
    }

    select(selector: Selector, source: Character, target: Character): Character[] {
        switch (selector) {
            case '<self>': return [source];
            case '<us>': return stage.stage[source.side];
            case '<target>': return [target];
            case '<opposite>': return stage.stage[target.side];
            case '<player>': return stage.stage[0];
            case '<enemy>': return stage.stage[1];
            case '<random_us>': return [stage.stage[source.side][Math.random() * stage.stage[source.side].length]]
            case '<random_opp>': return [stage.stage[source.side][Math.random() * stage.stage[source.side].length]]
        }
    }

}

var stage = new Stage();


function test() {
    let s1 = new Spell();
    let c1 = new Character();

}

(function main() {

})();