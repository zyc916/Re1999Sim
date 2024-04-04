// @ts-check
"use strict";

// interface __D 
type __Object = { [key: string]: any; };
type __Display = { toString(): string; } & __Object;
type __Con<T = {}> = { new(__0: T): T, table: P<T>[], cls: string; };

type __Readable = { value: unknown; } & __Object;
type __Raw<T = {}> = { [K in keyof T]: T[K];}

interface P<T> {
    label: string;
    attr_name: keyof T;
    type: string; // 'string' | 'number' | 'select' | 'object' | 'list'
    required?: boolean;
    child_types?: __Con<any>[];
    selections?: [string, string][]; // [['default', '请选择']]
    default?: unknown;
    addType?: 'text' | 'number' | 'create' | 'select';
}

class TypeSelect {
    types: __Con[];
    values: string[];
    select: HTMLSelectElement;
    editor?: Editor<__Display>;
    constructor(parent: HTMLElement, types: __Con[],) {
        this.types = types;
        this.values = [];
        let div = document.createElement('div');
        let label = document.createElement('span');
        div.appendChild(label);
        this.select = document.createElement('select');
        for (let type of types) {
            let option = document.createElement('option');
            this.select.value = type.cls;
            this.select.textContent = type.cls;
            this.select.appendChild(option);
        }
        div.appendChild(this.select);
        let button = document.createElement('button');
        button.value = '+';
        button.onclick = this.call;
        parent.appendChild(div);
    }
    call = () => {
        let i = this.values.indexOf(this.select.value);
        if (i !== -1) {
            this.editor = new Editor(this.types[i]);
            this.editor.create();
        }
    };

    get value() {
        return this.editor?.value;
    }
}

class List<T extends __Display> {
    label: string;
    items: Array<T>;
    types: __Con[];
    t4add: __Readable;

    ul: HTMLUListElement;
    li_val: number = 0;
    cursor: number = -1;

    constructor(parent: HTMLElement, label = 'list', items: T[] = new Array<T>(), types: __Con[], addType: 'text' | 'number' | 'create' | 'select' = 'text') {
        this.ul = document.createElement('ul');
        this.types = types;
        this.label = label;
        this.items = items;
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
            case 'create': this.t4add = new TypeSelect(div, this.types);
            case 'select': // create_button.onclick = this.editor.
            default:
                let input = document.createElement('input');
                input.placeholder = '添加……';
                input.type = addType; create_button.onclick = this.easyAdd;
                div.appendChild(input);
                this.t4add = input; break;
        }
        div.appendChild(create_button);
        parent.appendChild(div);
    }

    easyAdd() {
        this.add(this.t4add.value as T);
    }

    add(item: T) {
        let li = document.createElement('li');
        li.className = 'list-item-9';
        li.setAttribute('data-value', this.li_val.toString());
        li.setAttribute('selected', '0');
        // @ts-ignore
        li.addEventListener('onclick', this.itemOnclick);
        this.items.push(item);
        li.textContent = item.toString();
        this.li_val += 1;
        this.ul.appendChild(li);
    }

    indexOf(li_v: HTMLLIElement | string) {
        let lis = this.ul.getElementsByTagName('li');
        let value = typeof li_v == 'string' ? li_v : li_v.getAttribute('data-value');
        for (let i = 0; i < lis.length; i++) {
            if (lis[i].getAttribute('data-value') == value) {
                return i;
            }
        }
        return -1;
    }

    itemOnclick(e: MouseEvent) {
        let li = <HTMLLIElement>e.target;
        let value = li.getAttribute('data-value')!;
        let index = this.indexOf(value);
        let lis = this.ul.getElementsByTagName('li');
        if (e.shiftKey) {
            if (!e.ctrlKey) { for (let i = 0; i < lis.length; i++)lis[i].setAttribute('selected', '0'); }

            let [min, max] = index < this.cursor ? [index, this.cursor] : [this.cursor, index];
            for (let i = min; i < max; i++) {
                lis[i].setAttribute('selected', '1');
            }
        } else if (e.ctrlKey) {
            this.cursor = index;
            li.setAttribute('selected', (1 - Number(lis[index].getAttribute('selected'))).toString());
        } else {
            for (let i = 0; i < lis.length; i++) lis[i].setAttribute('selected', '0');
            this.cursor = index;
            li.setAttribute('selected', '1');
        }
    }

    delete() {
        let lis = this.ul.getElementsByTagName('li');
        for (let i = lis.length; i > 0; i--) {
            if (lis[i].getAttribute('selected') === '1') {
                this.ul.removeChild(lis[i]);
                this.items.splice(i, 1);
            }
        }
    }

    choice() {
        return this.items[this.cursor];
    }

    get value() {
        return this.items;
    }
}

class Editor<T extends __Display> {
    cls: __Con<T>;
    edit_obj: __Display;
    widgets: [keyof T, __Readable][] = [];
    constructor(cls: __Con<T>, edit_obj: __Display = {}) {
        this.cls = cls;
        this.edit_obj = edit_obj;
    }

    addItem(param: P<unknown>, parent: HTMLElement) {
        if (param.type === 'list') {
            // 创建一个子列表
            let list;
            if (this.edit_obj) {
                // WARN
                list = new List(parent, param.label, this.edit_obj[param.attr_name], param.child_types!, param.addType!);
            }
            else {
                list = new List(parent, param.label, [], param.child_types!, param.addType!);
            }
            this.widgets.push([param.attr_name, list]);
        }
        else if (param.type === 'object') {
            /* if (param.child_types?.length === 1){
                // TODO
            } else if (param.child_types!.length > 1){ */
            this.widgets.push([param.attr_name, new TypeSelect(parent, param.child_types!)]);
            // }
        }
        else {
            let div = document.createElement('div');
            let label = document.createElement('span');
            label.innerText = param.label;
            div.appendChild(label);
            if (param.type === 'select') {
                let select = document.createElement('select');
                select.name = param.attr_name;
                for (let [text, value] of param.selections!) {
                    let option = document.createElement('option');
                    option.value = value;
                    option.textContent = text;
                    select.appendChild(option);
                }
                div.appendChild(select);
                this.widgets.push([param.attr_name, select]);
            }
            else {
                let input = document.createElement('input');
                input.type = param.type;
                input.value = param.default as string;
                input.placeholder = param.label;
                div.appendChild(input);
                this.widgets.push([param.attr_name, input]);
            }
            parent.appendChild(div);
        }
    }

    create() {
        let mask = document.getElementById('menu-mask-9');
        if (!mask) {
            throw new Error('can not find menu mask');
        }
        let container = document.createElement('div');
        container.className = 'editor-container-9';
        let p = document.createElement('p');
        p.textContent = `创建/编辑${this.cls.cls}`;
        let form = document.createElement('form');
        for (let name in this.cls.table) {
            this.addItem(this.cls.table[name] as any, form);
        }
        let submit = document.createElement('button');
        submit.type = 'submit';
        submit.textContent = '保存';
        submit.onclick = this.on_submit;
        form.appendChild(submit);
        container.appendChild(form);
        mask.appendChild(container);
    }

    on_submit = (e: Event) => {
        e.preventDefault();
        let obj: __Raw<T> = {} as any;
        for (let [attr, wid] of this.widgets) {
            obj[attr] = wid.value as T[keyof T];
        }
        this.edit_obj = new this.cls(obj);
    };

    get value() {
        return this.edit_obj;
    }
}

/**
 * J空间：存放了所有判定类型。
 */
namespace J {
    export const select_describe: [string, string][] = [['自身', '<self>'], ['目标', '<aim>'], ['对方全体', '<opposite>'], ['己方全体', '<us>'], ['玩家全体', '<player>'], ['敌人全体', '<enemy>']];
    const math_description: [string, string][] = [['+', '+'], ['-', '-'], ['*', '*'], ['/', '/'], ['%', '%']];
    const compare_operator: [string, string][] = [['==', '=='], ['!=', '!='], ['>', '>'], ['<', '<'], ['>=', '>='], ['<=', '<=']];
    export let AllJudge: any[] = [];

    /**
     * J公用类，提供一些公用属性和帮助函数
     */
    export class J {
        /** 公用变量表 */
        static variables: Map<string, number> = new Map<string, number>();
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
        judge_me(arg: number | undefined, sub: Character, obj: Character): number | void;
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
        static readonly cls = '计算判定器';
        static table: P<FMath>[] =
            [{ label: '运算符', attr_name: 'operator', type: 'select', selections: math_description, },
            { label: '操作数1', attr_name: 'a', type: 'number' },
            { label: '操作数2', attr_name: 'b', type: 'number' }
            ];

        constructor({ sign = '', operator, a = 0, b }: { sign?: Signal, operator: string, a?: number, b: number | Judge; }) {
            this.sign = sign;
            this.operator = operator;
            this.a = a;
            this.b = b;
        }

        toString() {
            return `=>${this.a ? this.a : ''}${this.operator}${this.b}`;
        }

        judge_me(arg: number | undefined, sub: Character, obj: Character) {
            let a = arg ? arg : this.a;
            let b = typeof this.b === 'number' ? this.b : this.b.judge_me(undefined, sub, obj);
            b = b ? b : 1;
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
     * 判定器：限制
     * 如果a op b成立，返回a，否则返回b
     */
    export class FLimit implements Judge {
        sign: Signal = '';
        operator: string = "+";
        a: number = 0;
        b: number | Judge = 0;
        static readonly cls = '范围限制判定器';
        static readonly table: P<FLimit>[] =
            [{ label: '运算符', attr_name: 'operator', type: 'select', selections: compare_operator, },
            { label: '操作数1', attr_name: 'a', type: 'number' },
            { label: '操作数2', attr_name: 'b', type: 'number' }
            ];

        constructor({ sign = '', operator, a = 0, b }: { sign?: Signal, operator: string, a?: number, b: number | Judge; }) {
            this.sign = sign;
            this.operator = operator;
            this.a = a;
            this.b = b;
        }

        toString() {
            return `范围限制：${this.a}${this.operator}${this.b}`;
        }

        judge_me(arg: number | undefined, sub: Character, obj: Character) {
            let a = arg ? arg : this.a;
            let b = typeof this.b === 'number' ? this.b : this.b.judge_me(undefined, sub, obj) || 1;
            let flag = false;
            switch (this.operator) {
                case '>=': flag = a >= b; break;
                case '>': flag = a > b; break;
                case '==': flag = a == b; break;
                case '<=': flag = a <= b; break;
                case '<': flag = a < b; break;
                case '!=': flag = a != b; break;
                default: throw new EvalError('无效运算符');
            }
            return flag ? a : b;
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
        static readonly cls = '数学函数判定器';
        static readonly table: P<FFunc>[] =
            [{ label: '数学函数', attr_name: 'func', type: 'select', selections: [['向下取整', 'floor'], ['向上取整', 'ceil']] },
            ];

        constructor({ sign = '', func, b = 0 }: { sign?: Signal, func: keyof Math, b?: number | Judge; }) {
            this.sign = sign;
            this.func = func;
            this.b = b;
        }

        toString() {
            return `数学函数${String(this.func)}()`;
        }

        judge_me(arg: number | undefined, sub: Character, obj: Character) {
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
        static readonly cls = '变量读取判定器';
        static readonly table: P<FGet>[] = [{ label: '变量名', attr_name: 'variable', type: 'text' }];

        constructor({ sign = '', variable }: { sign?: Signal; variable: string; }) {
            this.sign = sign;
            this.variable = variable;
        }

        toString() {
            return `读取变量 ${this.variable}`;
        }

        judge_me(arg: number | undefined, sub: Character, obj: Character) {
            return J.variables.get(this.variable);
        }
    }
    /**
     * 判定器：变量修改/定义
     */
    export class FSet implements Judge {
        sign: string = '';
        variable: string = "";
        static readonly cls = '变量修改判定器';
        static readonly table: P<FSet>[] = [{ label: '变量名', attr_name: 'variable', type: 'text' }];


        constructor({ sign = '', variable }: { sign?: Signal; variable: string; }) {
            this.sign = sign;
            this.variable = variable;
        }

        toString() {
            return `写入变量 ${this.variable}`;
        }

        judge_me(arg: number | undefined, sub: Character, obj: Character) {
            if (arg) J.variables.set(this.variable, arg);
        }
    }
    /**
     * 判定器：读取属性（键可能不存在，建议谨慎使用，或使用Behavior.rely替代）
     * 返回读取的属性
     */
    export class FAccess implements Judge {
        sign: string = '';
        path: string = "";
        rely_type: "sub" | "obj" = "obj";
        static readonly cls = '变量修改判定器';
        static readonly table: P<FAccess>[] =
            [{ label: '源', attr_name: 'rely_type', type: 'select', selections: [['主对象', 'sub'], ['副对象', 'sub']] },
            { label: '属性路径', attr_name: 'path', type: 'text' }];


        constructor({ sign = '', path, rely_r }: { sign?: Signal; path: string; rely_r: 'sub' | 'obj'; }) {
            this.sign = sign;
            this.path = path;
            this.rely_type = rely_r;
        }

        judge_me(arg: undefined | number, sub: Character, obj: Character): number | void {
            let rely;
            rely = this.rely_type === "obj" ? obj : sub;
            const parts = this.path.split(".");
            for (let i = 0; i < parts.length; i++) {
                // @ts-ignore
                if (rely) rely = rely[parts[i]];
                else { rely = undefined; break; }
            }
            if (rely && typeof rely === 'number') return rely;
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
        static readonly cls = '状态查找判定器';
        static readonly table: P<FQuery>[] =
            [{ label: '查找目标', attr_name: 'aim', type: 'select', selections: select_describe },
            { label: '关键词', attr_name: 'keyword', type: 'text' }];

        constructor({ sign = '', keyword, aim }: { sign: Signal; keyword: string; aim: Selector; }) {
            this.sign = sign;
            this.keyword = keyword;
            this.aim = aim;
        }

        judge_me(arg: number | undefined, sub: Character, obj: Character) {
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
     * 判定器：按概率随机取值
     * probability是分布列，value是对应的值。
     */
    export class FRandom implements Judge {
        sign: string = '';
        probability: number[] = new Array();
        value: number[] = new Array();
        static readonly cls = '随机取值判定器';
        static readonly table: P<FRandom>[] =
            [{ label: '概率表', attr_name: 'probability', type: 'list', addType: 'number' },
            { label: '值表', attr_name: 'value', type: 'list', addType: 'number' }];

        constructor({ sign, probability, value }: { sign: string; probability: number[]; value: number[]; }) {
            this.sign = sign;
            this.probability = probability;
            this.value = value;
        }

        judge_me(a: number | undefined, sub: Character, target: Character): number {
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
     * 传入值将被向下传入
     * 返回执行判定器的结果
     */
    export class JProbable implements Judge {
        sign: string;
        probability: number[] = new Array();
        exec: Judge[] = new Array();
        static readonly cls = '概率执行器';
        static readonly table: P<JProbable>[] =
            [{ label: '概率表', attr_name: 'probability', type: 'list', addType: 'number' },
            { label: '判定表', attr_name: 'exec', type: 'list', addType: 'create', child_types: AllJudge }];


        constructor({ sign, probability, exec }: { sign: string; probability: number[]; exec: Judge[]; }) {
            this.sign = sign;
            this.probability = probability;
            this.exec = exec;
        }

        judge_me(arg0: number | undefined, sub: Character, obj: Character): number | void {
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
        static readonly cls = 'buff检查执行器';
        static readonly table: P<JWith>[] =
            [{ label: '查找目标', attr_name: 'aim', type: 'select', selections: select_describe },
            { label: '关键词', attr_name: 'keyword', type: 'text' },
            { label: '判定表', attr_name: 'exec', type: 'list', addType: 'create', child_types: AllJudge }];


        constructor({ sign, aim, keyword, op, b, exec }: { sign: string; aim: Selector; keyword: string; op: string; b: number; exec: Executable; }) {
            this.sign = sign;
            this.aim = aim;
            this.keyword = keyword;
            this.b = b;
            this.exec = exec;
        }

        judge_me(arg: number | undefined, sub: Character, obj: Character): number | void {
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
        a?: number;
        b: number | Evaluate = 0;
        op: string = '>';
        exec: Executable;
        static readonly cls = '比较执行器';
        static readonly table: P<JCompare>[] =
            [{ label: '运算符', attr_name: 'op', type: 'select', selections: compare_operator, },
            { label: '操作数1', attr_name: 'a', type: 'number' },
            { label: '操作数2', attr_name: 'b', type: 'number' },
            { label: '判定', attr_name: 'exec', type: 'object', child_types: AllJudge }];


        constructor({ sign, a = 0, b, op, exec }: { sign: string; a?: number; b: number | Evaluate; op: string; exec: Executable; }) {
            this.sign = sign;
            this.a = a;
            this.b = b;
            this.op = op;
            this.exec = exec;
        }

        judge_me(v: number | undefined, sub: Character, obj: Character): number | void {
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
            if (flag) { return this.exec.judge_me(undefined, sub, obj); }
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
        static readonly cls = '行为执行器';
        static readonly table: P<JBehave>[] =
            [{ label: '行为', attr_name: 'behave', type: 'object', child_types: [] },];


        constructor({ sign, behave }: { sign: string; behave: Behavior; }) {
            this.sign = sign;
            this.behave = behave;
        }

        judge_me(arg0: number | undefined, sub: Character, obj: Character) {
            Behavior.behave(this.behave, sub, obj, undefined, arg0);
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
        static readonly cls = '连续执行器';
        static readonly table: P<JSeries>[] =
            [{ label: '判定表', attr_name: 'judges', type: 'list', addType: 'create', child_types: AllJudge },];


        constructor({ sign, judge }: { sign: string; judge: Judge[]; }) {
            this.sign = sign;
            this.judges = judge;
        }

        judge_me(arg0: number | undefined, sub: Character, obj: Character) {
            for (let judge of this.judges) {
                let rv = judge.judge_me(arg0, sub, obj);
                if (rv) arg0 = rv;
            }
            return arg0;
        }
    }

    AllJudge.concat([FMath, FFunc, FQuery, FAccess, FGet, FSet, FRandom, JProbable, JCompare, JBehave, JSeries, JWith]);

    type Evaluate = FRandom | FMath | FFunc | FQuery | FGet;
    type Executable = JBehave | JSeries | JCompare | JProbable | JWith;
}


class Stat {
    static readonly cls = '状态表';
    static readonly props: [string, string][] = [['攻击', 'attack'], ['生命上限', 'health_limit'], ['现实防御', 'real_def'], ['精神防御', 'mental_def'], ['暴击率', 'crit_rate'], ['抗暴率', 'crit_anti_rate'], ['暴击伤害', 'crit_dmg'], ['暴击防御', 'crit_def'], ['创伤加成', 'dmg_d_inc'], ['受创减免', 'dmg_t_red'], ['术法威力', 'might_incant'], ['仪式威力', 'might_ultimate'], ['吸血率', 'leech_rate'], ['治疗率', 'heal_rate'], ['被治疗率', 'heal_taken_rate'], ['穿透率', 'penetrate'], ['激情上限', 'moxie_limit'], ['至终消耗', 'ultimate_cost'], ['本源提升', 'genesis_increase'], ['倍率提升', 'power_increase'],];
    static readonly table: P<Stat>[] =
        [
            { label: '攻击', attr_name: 'attack', type: 'number' },
            { label: '生命上限', attr_name: 'health_limit', type: 'number' },
            { label: '现实防御', attr_name: 'real_def', type: 'number' },
            { label: '精神防御', attr_name: 'mental_def', type: 'number' },
            { label: '暴击率', attr_name: 'crit_rate', type: 'number' },
            { label: '抗暴率', attr_name: 'crit_anti_rate', type: 'number' },
            { label: '暴击伤害', attr_name: 'crit_dmg', type: 'number' },
            { label: '暴击防御', attr_name: 'crit_def', type: 'number' },
            { label: '创伤加成', attr_name: 'dmg_d_inc', type: 'number' },
            { label: '受创减免', attr_name: 'dmg_t_red', type: 'number' },
            { label: '术法威力', attr_name: 'might_incant', type: 'number' },
            { label: '仪式威力', attr_name: 'might_ultimate', type: 'number' },
            { label: '吸血率', attr_name: 'leech_rate', type: 'number' },
            { label: '治疗率', attr_name: 'heal_rate', type: 'number' },
            { label: '被治疗率', attr_name: 'heal_taken_rate', type: 'number' },
            { label: '穿透率', attr_name: 'penetrate', type: 'number' },
            { label: '激情上限', attr_name: 'moxie_limit', type: 'number' },
            { label: '至终消耗', attr_name: 'ultimate_cost', type: 'number' },
            { label: '本源提升', attr_name: 'genesis_increase', type: 'number' },
            { label: '倍率提升', attr_name: 'power_increase', type: 'number' },
        ];
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
    dmg_d_inc: number = 0.0;
    dmg_t_red: number = 0.0;
    might_incant: number = 0.0;
    might_ultimate: number = 0.0;
    // dmg_heal: number = 0.0;
    leech_rate: number = 0.0;
    heal_rate: number = 0.0;
    heal_taken_rate: number = 1.0;
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

    constructor(obj: object = {}) {
        Object.assign(this, obj);
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
    static cat_select: [string, string][] = [['属性提升', 'stats_up'], ['属性削弱', 'stats_down'], ['状态增益', 'pos_status'], ['状态异常', 'neg_status'], ['反制', 'counter'], ['护盾', 'shield'], ['特殊', 'special']];

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

    static readonly cls: string = 'Buff';
    static readonly table: P<Buff>[] = [
        { label: '名称', attr_name: 'name', type: 'string' },
        { label: '类型', attr_name: 'buff_cat', type: 'select', selections: Buff.cat_select },
        { label: '值', attr_name: 'value', type: 'number' },
        { label: '上限', attr_name: 'limit', type: 'number' },
        { label: '等级', attr_name: 'level', type: 'number' },
        { label: '附加判定表', attr_name: 'judge', type: 'list', addType: 'create', child_types: J.AllJudge },
        { label: '减少判定表', attr_name: 'decrease', type: 'list', addType: 'create', child_types: J.AllJudge },
    ];

    constructor(obj: Partial<Buff>) {
        Object.assign(this, obj);
    }

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
    static readonly behavior_select: [string, string][] = [['伤害', 'damage'], ['治疗', 'heal'], ['护盾', 'shield'],
    ['状态', 'buff']];
    static readonly damage_select: [string, string][] = [['现实', 'real'], ['精神', 'mental'], ['本源', 'genesis']];
    selector: Selector = "<aim>";
    type: "damage" | "heal" | "shield" | "buff" = 'buff';
    damage_type?: "real" | "mental" | "genesis";
    rely_obj: "self" | "aim" = "self";
    rely_name: keyof Stat = "attack";
    ratio: number = 2.00;
    no_crit: boolean = false;
    buff?: Buff;

    static readonly cls: string = '行为';
    static readonly table: P<Behavior>[] = [
        { label: '选择器', attr_name: 'selector', type: 'select', selections: J.select_describe },
        { label: '类型', attr_name: 'type', type: 'select', selections: Behavior.behavior_select },
        { label: '伤害类型（可选）', attr_name: 'damage_type', type: 'select', selections: Behavior.damage_select },
        { label: '倍率', attr_name: 'ratio', type: 'number', default: 2.00 },
        { label: '依赖属性', attr_name: 'rely_name', type: 'select', selections: Stat.props },
        { label: '依赖目标', attr_name: 'rely_obj', type: 'select', selections: [['来源', 'self'], ['目标', 'aim']] },
        { label: '添加buff', attr_name: 'buff', type: 'object', child_types: [Buff] }
    ];


    static behave(behave: Behavior, origin: Character, aim: Character, spell?: Spell, ratio?: number) {
        repl(ratio);
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
                    let def_p = (1 - statC.penetrate);
                    def_p = def_p < 0 ? 0 : def_p;
                    if (spell !== undefined) power = (1 + statC[<keyof Stat>('might_' + spell.energy)]);
                    damage = real_ratio * (statC.attack - statT[<keyof Stat>(behave.damage_type + '_def')] * def_p) * (1 + statC.dmg_d_inc - statT.dmg_t_red) * power * crit_part * conquer;
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
        Behavior.behaveS(this.behaviors, origin, aim, this);
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
                (Character.afflatus4.indexOf(this.afflatus) - Character.afflatus4.indexOf(enemy.afflatus)) % 4 == -1
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

    static shuffle<T>(array: T[]) {
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
    let b1 = new Buff({});
    b1.stat_inc.dmg_d_inc = 0.15;
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

J.JBehave.table[0].child_types = [Behavior];

function main() {
    let FMathE = new Editor(J.FMath);
    FMathE.create();
}
main();


/* document.addEventListener("DOMContentLoaded", function () {

}); */
