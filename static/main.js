"use strict";
class MultiType {
    constructor(parent, selection, type = 'create') {
        this.values = [];
        this.editors = [];
        this.type = 'create';
        this.type = type;
        let div = document.createElement('div');
        let label = document.createElement('span');
        div.appendChild(label);
        let select = document.createElement('select');
        for (let [text, value, editor] of selection) {
            let option = document.createElement('option');
            select.value = value;
            select.textContent = text;
            this.values.push(value);
            this.editors.push(editor);
            select.appendChild(option);
        }
        div.appendChild(select);
        this.select = select;
        let button = document.createElement('button');
        button.value = '+';
        button.onclick = this.call;
        parent.appendChild(div);
    }
    call() {
        let i = this.values.indexOf(this.select.value);
        if (i !== -1) {
            // @ts-ignore
            this.type === 'create' ? this.editors[i].create_new() : this.editors[i].ask_select(); // TODO: 回传选中的对象？
        }
    }
}
class List {
    constructor(label = 'list', items = new Array(), types) {
        this.li_val = 0;
        this.cursor = -1;
        this.ul = document.createElement('ul');
        this.add_input = document.createElement('input');
        this.add_input.placeholder = '输入添加的内容……';
        this.types = types;
        this.label = label;
        this.items = new Map();
    }
    easyAdd() {
        // this.add(document)
    }
    appendTag(parent, items, addType = 'select') {
        let div = document.createElement('div');
        let p = document.createElement('p');
        p.textContent = this.label;
        div.appendChild(p);
        for (let item of items) {
            this.add(item);
        }
        div.appendChild(this.ul);
        let create_button = document.createElement('button');
        create_button.textContent = '+';
        switch (addType) {
            case 'ask':
                this.add_input.type = 'text';
                create_button.onclick = this.easyAdd;
                div.appendChild(this.add_input);
                break;
            case 'select': // create_button.onclick = this.editor.
        }
        div.appendChild(create_button);
        parent.appendChild(div);
    }
    add(item) {
        let li = document.createElement('li');
        li.setAttribute('data-value', this.li_val.toString());
        li.setAttribute('selected', '0');
        // @ts-ignore
        li.addEventListener('onclick', this.itemOnclick);
        this.items.set(this.li_val.toString(), item);
        li.textContent = item.toString();
        this.li_val += 1;
        this.ul.appendChild(li);
    }
    indexOf(li_v) {
        let lis = this.ul.getElementsByTagName('li');
        let value = typeof li_v == 'string' ? li_v : li_v.getAttribute('data-value');
        for (let i = 0; i < lis.length; i++) {
            if (lis[i].getAttribute('data-value') == value) {
                return i;
            }
        }
        return -1;
    }
    /* itemOnclick(e: MouseEvent) {
        let li = <HTMLLIElement>e.target;
        let value = li.getAttribute('data-value')!;
        let index = this.indexOf(value);
        let lis = this.ul.getElementsByTagName('li');
        lis[this.cursor].setAttribute('selected', '0');
        this.cursor = index;
        li.setAttribute('selected', '1');
    } */
    itemOnclick(e) {
        let li = e.target;
        let value = li.getAttribute('data-value');
        let index = this.indexOf(value);
        let lis = this.ul.getElementsByTagName('li');
        if (e.shiftKey) {
            if (!e.ctrlKey) {
                for (let i = 0; i < lis.length; i++)
                    lis[i].setAttribute('selected', '0');
            }
            let [min, max] = index < this.cursor ? [index, this.cursor] : [this.cursor, index];
            for (let i = min; i < max; i++) {
                lis[i].setAttribute('selected', '1');
            }
        }
        else if (e.ctrlKey) {
            this.cursor = index;
            li.setAttribute('selected', (1 - Number(lis[index].getAttribute('selected'))).toString());
        }
        else {
            for (let i = 0; i < lis.length; i++)
                lis[i].setAttribute('selected', '0');
            this.cursor = index;
            li.setAttribute('selected', '1');
        }
    }
    delete() {
        let lis = this.ul.getElementsByTagName('li');
        for (let i = lis.length; i > 0; i--) {
            if (lis[i].getAttribute('selected') === '1') {
                this.ul.removeChild(lis[i]);
                this.items.delete(lis[i].getAttribute('data-value'));
            }
        }
    }
    result() {
        let lis = this.ul.getElementsByTagName('li');
        return this.items.get(lis[this.cursor].getAttribute('data-value'));
    }
}
class Parameter {
    constructor() {
        this.label = 'Parameter';
        this.attr_name = 'a';
        this.type = 'string'; // list, select, string, number, object
        this.selections = [['default', '请选择']];
    }
}
class Editor {
    constructor(cls, name, table, edit_obj, init_from) {
        this.name = '对象';
        this.table = {};
        this.children = [];
        Editor.count += 1;
        this.id = Editor.count;
        this.cls = cls;
        this.name = name;
        this.table = table;
        this.edit_obj = edit_obj;
        this.init_from = init_from;
    }
    addItem(param, parent) {
        if (param.type === 'list') {
            // 创建一个子列表
            let list;
            // @ts-ignore
            if (this.edit_obj) {
                list = new List(param.label, this.edit_obj[param.attr_name], param.child_types);
            }
            else {
                list = new List(param.label, [], param.child_types);
            }
            this.children.push([param.attr_name, list]);
        }
        else if (param.type === 'object') {
            // TODO: 创建一个列表和按钮并打开子editor
        }
        else {
            let div = document.createElement('div');
            let label = document.createElement('span');
            label.innerText = param.label;
            div.appendChild(label);
            if (param.type === 'select') {
                let select = document.createElement('select');
                select.name = param.attr_name;
                for (let [text, value] of param.selections) {
                    let option = document.createElement('option');
                    option.value = value;
                    option.textContent = text;
                    select.appendChild(option);
                }
                div.appendChild(select);
                this.children.push([param.attr_name, select]);
            }
            else {
                let input = document.createElement('input');
                input.type = param.type;
                input.value = param.default;
                input.placeholder = param.label;
                div.appendChild(input);
                this.children.push([param.attr_name, input]);
            }
            parent.appendChild(div);
        }
    }
    make_editor() {
        let mask = document.getElementById('menu-mask-9');
        if (!mask) {
            throw new Error('can not find menu mask');
        }
        let container = document.createElement('div');
        container.className = 'editor-container-9';
        let p = document.createElement('p');
        p.textContent = `创建/编辑${this.name}`;
        let form = document.createElement('form');
        for (let name in this.table) {
            this.addItem(this.table[name], form);
        }
        let submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = '保存';
        submit.onclick = this.on_submit(this);
        form.appendChild(submit);
        container.appendChild(form);
        mask.appendChild(container);
    }
    // popup_select() {
    //     let mask = document.getElementById('menu-mask-9');
    //     if (!mask) { throw new Error('can not find menu mask'); }
    //     let container = document.createElement('div');
    //     container.className = 'editor-container-9';
    //     let form = document.createElement('form');
    //     let div1 = document.createElement('div');
    //     let label = document.createElement('p');
    //     label.innerText = '选择一个' + this.name;
    //     let list = document.createElement('select');
    //     list.id = 'instance_id';
    //     for (let instance of this.instances) {
    //         let option = document.createElement('option');
    //         option.value = instance.id.toString();
    //         option.innerText = instance.toText();
    //         list.appendChild(option);
    //     }
    //     div1.appendChild(label);
    //     div1.appendChild(list);
    //     form.appendChild(div1);
    //     container.appendChild(form);
    //     mask.appendChild(container);
    // }
    on_submit(editor) {
        function on(e) {
            e.preventDefault();
            let obj = Object();
            for (let [attr, elem] of editor.children) {
                if (elem instanceof HTMLElement) {
                    // @ts-ignore
                    obj[attr] = elem.value;
                }
                else {
                    obj[attr] = elem.result();
                }
            }
            repl(editor.cls.constructor(obj));
        }
        return on;
    }
    result() {
    }
}
Editor.count = 0;
/**
 * J空间：存放了所有判定类型。
 */
var J;
(function (J_1) {
    /**
     * J公用类，提供一些公用属性和帮助函数
     */
    class J {
        /**
         * 快速判定函数，能够一次性判定多个判定器
         * @param {Readonly<J.Judge>[]} judges 判定器 数组
         * @param {Character} source 判定来源
         * @param {Character} target 判定目标
         */
        static judgeS(judges, source, target) {
            for (let judge of judges) {
                judge.judge_me(undefined, source, target);
            }
        }
    }
    /** 公用变量表 */
    J.variables = new Map();
    J_1.J = J;
    /**
     * 判定器：计算
     * 用于进行二元四则运算
     * 返回结果
     */
    class FMath {
        constructor({ sign = '', operator, a = 0, b }) {
            this.sign = '';
            this.operator = "+";
            this.a = 0;
            this.b = 0;
            this.sign = sign;
            this.operator = operator;
            this.a = a;
            this.b = b;
        }
        toString() {
            return `数学：${this.a}${this.operator}${this.b}`;
        }
        judge_me(arg, sub, obj) {
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
                    if (b === 0)
                        throw new Error("divide by zero");
                    return a / b;
                case "%":
                    if (b === 0)
                        throw new Error("modulo by zero");
                    return a % b;
                default:
                    throw new Error("invalid operator");
            }
        }
    }
    FMath.editor = new Editor(FMath, '数学判定器', {
        operator: { label: '运算符', attr_name: 'operator', type: 'select', selections: [['+', '+'], ['-', '-'], ['*', '*'], ['/', '/'], ['%', '%']], },
        a: { label: '操作数1', attr_name: 'a', type: 'number' },
        b: { label: '操作数2', attr_name: 'b', type: 'number' }
    });
    J_1.FMath = FMath;
    /**
     * 判定器：数学函数
     * 用于执行Math空间下的方法
     * 返回结果
     */
    class FFunc {
        constructor({ sign = '', func, b = 0 }) {
            this.sign = '';
            this.func = "floor";
            this.b = 0;
            this.sign = sign;
            this.func = func;
            this.b = b;
        }
        judge_me(arg, sub, obj) {
            let b = arg ? arg : this.b;
            b = typeof b === 'number' ? b : b.judge_me(undefined, sub, obj);
            if (typeof Math[this.func] === "function") {
                return Math[this.func](b);
            }
            else {
                throw new Error("invalid function name");
            }
        }
    }
    J_1.FFunc = FFunc;
    /**
     * 判定器：变量读取
     * 返回读取的变量
     */
    class FGet {
        constructor({ sign = '', variable }) {
            this.sign = '';
            this.variable = "";
            this.sign = sign;
            this.variable = variable;
        }
        judge_me(arg, sub, obj) {
            return J.variables.get(this.variable);
        }
    }
    J_1.FGet = FGet;
    /**
     * 判定器：变量修改/定义
     */
    class FSet {
        constructor({ sign = '', variable }) {
            this.sign = '';
            this.variable = "";
            this.sign = sign;
            this.variable = variable;
        }
        judge_me(arg, sub, obj) {
            J.variables.set(this.variable, arg);
        }
    }
    J_1.FSet = FSet;
    /**
     * 判定器：读取属性（键可能不存在，建议谨慎使用，或使用Behavior.rely替代）
     * 返回读取的属性
     */
    class FAccess {
        constructor({ sign = '', path, rely_r }) {
            this.sign = '';
            this.path = "";
            this.rely_r = "obj";
            this.sign = sign;
            this.path = path;
            this.rely_r = rely_r;
        }
        judge_me(arg, sub, obj) {
            let rely = this.rely_r === "obj" ? obj : sub;
            const parts = this.path.split(".");
            for (let i = 0; i < parts.length; i++) {
                // @ts-ignore
                if (rely)
                    rely = rely[parts[i]];
                else
                    return undefined;
            }
            return rely;
        }
    }
    J_1.FAccess = FAccess;
    /**
     * 判定器：查找buff
     * 返回查找值
     */
    class FQuery {
        constructor({ sign = '', keyword, aim }) {
            this.sign = '';
            this.keyword = "";
            this.aim = "<self>";
            this.sign = sign;
            this.keyword = keyword;
            this.aim = aim;
        }
        judge_me(arg, sub, obj) {
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
    J_1.FQuery = FQuery;
    /**
     * 判定器：概率返回随机值
     */
    class FRandom {
        constructor({ sign, probability, value }) {
            this.sign = '';
            this.probability = new Array();
            this.value = new Array();
            this.sign = sign;
            this.probability = probability;
            this.value = value;
        }
        judge_me(a, sub, target) {
            if (this.probability.length !== this.value.length)
                throw new Error('概率和值数组的长度必须相同');
            const sumOfProbabilities = this.probability.reduce((sum, prob) => sum + prob, 0);
            if (sumOfProbabilities !== 1)
                throw new Error('概率数组中的值必须是非负的，并且总和必须为1');
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
    J_1.FRandom = FRandom;
    /**
     * 执行器：概率执行判定
     * 级联传入
     * 返回执行判定器的结果
     */
    class JProbable {
        constructor({ sign, probability, exec }) {
            this.probability = new Array();
            this.exec = new Array();
            this.sign = sign;
            this.probability = probability;
            this.exec = exec;
        }
        judge_me(arg0, sub, obj) {
            if (this.probability.length !== this.exec.length)
                throw new Error('概率和值数组的长度必须相同');
            const sumOfProbabilities = this.probability.reduce((sum, prob) => sum + prob, 0);
            if (sumOfProbabilities !== 1)
                throw new Error('概率数组中的值必须是非负的，并且总和必须为1');
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
    J_1.JProbable = JProbable;
    /**
     * 执行器：拥有特定buff一定数值则执行
     * （相当于FQuery和JCompare的结合）
     * 传入的是buff的总值
     * 执行成功：返回执行器的结果
     * 执行失败，返回 -1
     */
    class JWith {
        constructor({ sign, aim, keyword, op, b, exec }) {
            this.aim = '<us>';
            this.keyword = '';
            this.op = '>=';
            this.b = 1;
            this.sign = sign;
            this.aim = aim;
            this.keyword = keyword;
            this.b = b;
            this.exec = exec;
        }
        judge_me(arg, sub, obj) {
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
                case '>=':
                    flag = count >= this.b;
                    break;
                case '>':
                    flag = count > this.b;
                    break;
                case '==':
                    flag = count == this.b;
                    break;
                case '<=':
                    flag = count <= this.b;
                    break;
                case '<':
                    flag = count < this.b;
                    break;
                case '!=':
                    flag = count != this.b;
                    break;
                default: throw new EvalError('无效运算符');
            }
            if (flag) {
                return this.exec.judge_me(count, sub, obj);
            }
            else {
                return -1;
            }
        }
    }
    J_1.JWith = JWith;
    /**
     * 执行器：比较arg0和b，符合比较运算符则执行
     * 执行成功：返回执行的结果
     * 执行失败：返回-1
     */
    class JCompare {
        constructor({ sign, a = 0, b, op, exec }) {
            this.b = 0;
            this.op = '>';
            this.sign = sign;
            this.a = a;
            this.b = b;
            this.op = op;
            this.exec = exec;
        }
        judge_me(v, sub, obj) {
            if (this.a === undefined && v === undefined) {
                throw new EvalError('JCompare when <a> was undefined'); // a v至少存在一个
            }
            const a = this.a !== undefined ? this.a : v; // 使用非空断言操作符，因为我们已经检查了v
            const b = typeof this.b === 'number' ? this.b : this.b.judge_me(undefined, sub, obj);
            let flag = false;
            switch (this.op) {
                case '>=':
                    flag = a >= b;
                    break;
                case '>':
                    flag = a > b;
                    break;
                case '==':
                    flag = a == b;
                    break;
                case '<=':
                    flag = a <= b;
                    break;
                case '<':
                    flag = a < b;
                    break;
                case '!=':
                    flag = a != b;
                    break;
                default: throw new EvalError('无效运算符');
            }
            if (flag) {
                return this.exec.judge_me(undefined, sub, obj);
            }
            else {
                return -1;
            }
        }
    }
    J_1.JCompare = JCompare;
    /**
     * 执行器：直接执行单条behavior
     * 如果有arg0，则覆盖behavior的倍率
     */
    class JBehave {
        constructor({ sign, behave }) {
            this.sign = sign;
            this.behave = behave;
        }
        judge_me(arg0, sub, obj) {
            Behavior.behave(this.behave, sub, obj, undefined, arg0);
        }
    }
    J_1.JBehave = JBehave;
    /**
     * 执行器：串联
     * 上一个判定器的返回值不为空则将传给下一个
     * 返回值为判定器组的最后一个有效返回值
     */
    class JSeries {
        constructor({ sign, judge }) {
            this.judges = [];
            this.sign = sign;
            this.judges = judge;
        }
        judge_me(arg0, sub, obj) {
            for (let judge of this.judges) {
                let rv = judge.judge_me(arg0, sub, obj);
                if (rv)
                    arg0 = rv;
            }
            return arg0;
        }
    }
    J_1.JSeries = JSeries;
})(J || (J = {}));
class Stat {
    constructor() {
        this.attack = 100;
        this.health_limit = 10000;
        this.health_now = 10000;
        this.shield = 0;
        this.real_def = 0;
        this.mental_def = 0;
        this.crit_rate = 0.0;
        this.crit_anti_rate = 0.0;
        this.crit_dmg = 0.0;
        this.crit_def = 0.0;
        this.dmg_d_increase = 0.0;
        this.dmg_t_reduce = 0.0;
        this.might_incant = 0.0;
        this.might_ultimate = 0.0;
        this.dmg_heal = 0.0;
        this.leech_rate = 0.0;
        this.heal_rate = 0.0;
        this.heal_taken_rate = 0.0;
        this.penetrate = 0.0;
        this.moxie_now = 0;
        this.moxie_limit = 5;
        this.ultimate_cost = 5;
        this.action_point = 1;
        this.genesis_increase = 0.0;
        this.power_increase = 0.0;
    }
    get health_loss() {
        return this.health_limit - this.health_now;
    }
    /**
     * sum_obj: 对象加法，将两个同键的值相加
     */
    static sum_stat(o1, o2) {
        let keys = Object.getOwnPropertyNames(o1).concat(Object.getOwnPropertyNames(o2));
        let o = new Stat();
        for (let k of keys) {
            // @ts-ignore
            o[k] = (o1[k] || 0) + (o2[k] || 0);
        }
        return o;
    }
}
Stat.instances = [];
class Buff {
    constructor() {
        this.id = 1;
        this.name = '';
        this.buff_cat = 'special';
        this.value = 1;
        this.limit = Infinity;
        this.level = 1;
        this.merge = 'no';
        this.stat_inc = {};
        this.judge = new Array();
        this.decrease = new Array();
        this.host_character = stage.Background;
    }
    signal(sign, source, target) {
        for (let judge of this.judge) {
            if (judge.sign === sign) {
                console.log(sign, '由buff触发器触发');
                judge.judge_me(undefined, source, target);
            }
        }
    }
}
Buff.count = 0;
class Item {
    constructor() {
        this.stat_inc = {};
        this.attach = new Array();
    }
}
class Behavior {
    constructor() {
        this.selector = "<aim>";
        this.type = 'buff';
        this.rely_obj = "self";
        this.rely_name = "attack";
        this.ratio = 2.00;
        this.no_crit = false;
    }
    static behave(behave, origin, aim, spell, ratio) {
        repl(ratio);
        let real_ratio = ratio !== undefined ? ratio : behave.ratio;
        for (let target of Stage.select(behave.selector, origin, aim)) {
            let statC = origin.stat;
            let statT = target.stat;
            let rely_value = behave.rely_obj === "self" ? statC[behave.rely_name] : statT[behave.rely_name];
            if (spell && spell.judge_before) {
                J.J.judgeS(spell.judge_before, origin, aim);
            }
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
                    if (spell !== undefined)
                        power = (1 + statC[('might_' + spell.energy)]);
                    damage = real_ratio * (statC.attack - statT[(behave.damage_type + '_def')] * (1 - statC.penetrate)) * (1 + statC.dmg_d_increase - statT.dmg_t_reduce) * power * crit_part * conquer;
                }
                ;
                target.damage_me(damage);
                origin.heal_me(damage * statC.leech_rate);
                signal2('after_' + behave.damage_type + '_damage', origin, target);
            }
            else if (behave.type === "heal") {
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
            }
            else if (behave.type == "shield") {
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
            if (spell && spell.judge_after) {
                J.J.judgeS(spell.judge_after, origin, aim);
            }
        }
    }
    static behaveS(behaves, origin, aim, spell) {
        for (let b of behaves) {
            this.behave(b, origin, aim, spell = spell);
        }
    }
}
class Spell {
    constructor() {
        this.energy = "incant";
        this.category = 'attack';
        this.judge_before = [];
        this.judge_after = [];
        this.behaviors = new Array();
    }
    cast(origin, aim) {
        signal('on_' + this.energy, origin, aim);
        Behavior.behaveS(this.behaviors, origin, aim, this);
    }
}
class Arcanal {
    constructor() {
        this.energy = "incant";
        this.category = 'attack';
        this.spells = new Array();
    }
    cast(level, origin, aim) {
        this.spells[level - 1].cast(origin, aim);
    }
}
class Card {
    constructor() {
        this.temp = false;
        this.image = "";
        // energy: "incant" | "ultimate" = "incant";
        // category: "buff" | "debuff" | "attack" | "heal" | "shield" | "versatile" = 'attack';
        this.level = 1;
        this.arcanal_index = -1;
    }
}
class Character {
    constructor() {
        this.id = 0;
        this.name = "";
        this.afflatus = "null";
        this.damage_type = "genesis";
        this.stat = new Stat();
        this.stat_now = new Stat();
        this.items = [];
        this.buffs = new Map();
        this.judges = new Array();
        this.ability = new Map();
        this.ultimate = new Arcanal();
        /** 角色归属，玩家方为0 */
        this.side = 0;
        Character.count += 1;
        this.id = Character.count;
        Character.instances.push(this);
    }
    [Symbol.toPrimitive](hint) {
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
                Object.assign(this.stat_now, Stat.sum_stat(this.stat_now, item.stat_inc));
            }
        }
        for (const [_, buff] of this.buffs) {
            if (buff.stat_inc != undefined) {
                Object.assign(this.stat_now, Stat.sum_stat(this.stat_now, buff.stat_inc));
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
    check_conquer(enemy) {
        if (this.afflatus in Character.afflatus2 &&
            enemy.afflatus in Character.afflatus2 &&
            this.afflatus != enemy.afflatus) {
            return true;
        }
        else if (this.afflatus in Character.afflatus4 &&
            enemy.afflatus in Character.afflatus4) {
            if ((Character.afflatus4.indexOf(this.afflatus) - Character.afflatus4.indexOf(enemy.afflatus)) % 4 == -1) {
                return true;
            }
        }
        else {
            return false;
        }
    }
    cast(name, level = 1, aim) {
        let arcanal = this.ability.get(name);
        if (arcanal) {
            if (arcanal.energy === 'ultimate')
                this.stat.moxie_now -= this.stat.ultimate_cost;
            arcanal.cast(level, this, aim);
        }
    }
    signal(sign, target) {
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
    damage_me(dmg) {
        if (this.stat.shield > dmg)
            this.stat.shield -= dmg;
        else if (this.stat.shield) {
            dmg -= this.stat.shield;
            this.stat.shield = 0;
            this.stat.health_now -= dmg;
            signal('on_shield_broke', this, this); /// XXX
        }
        else {
            dmg -= this.stat.shield;
        }
        repl(this.toString() + `受到了${dmg}伤害`);
        if (this.stat.health_now < 0) {
            this.stat.health_now = 0;
            signal('on_death', this, this);
            // signalS('on_friend_death', this, this.);
        }
    }
    heal_me(heal) {
        this.stat.health_now += heal;
        if (this.stat.health_now > this.stat.health_limit) {
            this.stat.health_now = this.stat.health_limit;
        }
        if (heal > 0) {
            repl(this.toString() + `受到了${heal}治疗`);
        }
    }
    add_shield(shield) {
        if (shield > this.stat.shield) {
            this.stat.shield = shield;
        }
    }
    add_buff(new_buff) {
        let flag = undefined;
        new_buff.host_character = this;
        for (let [_, buff] of this.buffs) {
            if (buff.name == new_buff.name) {
                if (buff.merge == 'add') {
                    buff.value += new_buff.value;
                    flag = true;
                    if (buff.value > buff.limit) {
                        buff.value = buff.limit;
                    }
                }
                else if (buff.merge == 'individually') {
                    this.buffs.set(new_buff.id, new_buff);
                    flag = true;
                }
                else {
                    if (new_buff.level > buff.level) {
                        this.buffs.delete(buff.id);
                        this.buffs.set(new_buff.id, new_buff);
                        flag = true;
                    }
                    else if (new_buff.level == buff.level) {
                        buff.value = new_buff.value > buff.value ? new_buff.value : buff.value;
                        flag = true;
                    }
                    else {
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
    add_moxie(moxie) {
        // 'disconcert' 心神不宁，无法增加激情
        for (let [_, buff] of this.buffs) {
            if (buff.name == 'disconcert') {
                return false;
            }
        }
        this.stat.moxie_now += moxie;
        if (this.stat.moxie_now > this.stat.moxie_limit) {
            this.stat.moxie_now = this.stat.moxie_limit;
        }
        repl(this.toString() + `激情增加！现在有${this.stat.moxie_now}`);
    }
    check_ultimate() {
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
Character.afflatus4 = ["star", "mineral", "beast", "plant"];
Character.afflatus2 = ["intellect", "spirit"];
Character.instances = [];
/** 双方所有角色，0为玩家方 */
Character.all_char = [[], []];
Character.count = 0;
class Stage {
    constructor() {
        this.round = 0;
        this.player_incants = [];
        this.player_cards = [];
        this.card_pool = [];
        this.Background = new Character();
        this.card_limit = 0;
        this.player_limit = 0;
        /** 双方场上角色，stage[0]为玩家方 */
        this.stage = [[], []];
    }
    static shuffle(array) {
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
            for (let j = 0; j < 8; j++)
                this.card_pool.push(i);
            this.player_cards.push(card);
        }
        Stage.shuffle(this.card_pool);
    }
    refreshCard() {
        let arcanal_indexes = Array.from({ length: this.player_incants.length }, (_, i) => i + 1);
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
            while (this.scanCard()) { }
            ;
        }
    }
    aRound() {
        // TODO
    }
    static choose(side, avoid) {
        let choice;
        do {
            choice = stage.stage[side][Math.random() * stage.stage[side].length];
        } while (choice == avoid);
        return choice;
    }
    static select(selector, origin, aim) {
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
Stage.player_to_card = { 1: 4, 2: 5, 3: 7, 4: 8 };
function signal(sign, source, target) {
    source.signal(sign, target);
}
function signal2(damage_sign, source, target) {
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
function signalAll(sign, sources, target) {
    for (let source of sources) {
        signal(sign, source, target ? target : source);
    }
}
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
    let damager = new Behavior();
    damager.type = 'damage';
    damager.selector = '<aim>';
    damager.damage_type = 'real';
    let ran = new J.FRandom({ sign: '', probability: [0.2, 0.4, 0.4], value: [1, 2, 3] });
    let mul_09 = new J.FMath({ sign: '', b: 0.9, operator: '*' });
    let jdr = new J.JBehave({ sign: '', behave: damager });
    let s9 = new J.JSeries({ sign: '', judge: [ran, mul_09, jdr] });
    let s1 = new Spell();
    s1.energy = 'incant';
    s1.behaviors.push(damage160);
    s1.judge_after = [s9];
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
    J.FMath.editor.make_editor();
}
main();
