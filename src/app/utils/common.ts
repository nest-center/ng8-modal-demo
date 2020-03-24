import * as qs from 'querystring';
import { ChangeDetectorRef, isDevMode } from '@angular/core';
import { Router } from '@angular/router';
import { _isNumberValue, coerceBooleanProperty, coerceCssPixelValue } from '@angular/cdk/coercion';
import { environment } from '@env/environment';

declare const window : any;

interface IDate {
    firstDayOfMonth? : boolean;
    firstDayOfSeason? : boolean;
    firstDayOfYear? : boolean;
    fillStartHMS? : boolean;
    fillEndHMS? : boolean;
    defaultValue? : any;
}

const record : Record<string, boolean> = {};

export function toBoolean (value : boolean | string) : boolean {
    return coerceBooleanProperty(value);
}

export function toNumber (value : number | string) : number;
export function toNumber<D> (value : number | string, fallback : D) : number | D;
export function toNumber (value : number | string, fallbackValue : number = 0) : number {
    return _isNumberValue(value) ? Number(value) : fallbackValue;
}

export function toCssPixel (value : number | string) : string {
    return coerceCssPixelValue(value);
}

export function pxToNumber (value : string | null) : number {
    if (!value) {
        return 0;
    }

    const match = value.match(/^\d*(\.\d*)?/);

    return match ? Number(match[0]) : 0;
}

export const log = (...args : any[]) => environment.production && console.log(...args); 		// tslint:disable-line:no-console
export const warn = (...args : any[]) => environment.production && console.warn(...args); 	// tslint:disable-line:no-console

function notRecorded (...args : any[]) : boolean {
    const asRecord = args.reduce((acc, c) => acc + c.toString(), '');

    if (record[asRecord]) {
        return false;
    } else {
        record[asRecord] = true;
        return true;
    }
}

function consoleCommonBehavior (consoleFunc : (...args : any) => void, ...args : any[]) : void {
    if (environment.production || (isDevMode() && notRecorded(...args))) {
        consoleFunc(...args);
    }
}

export const warnDeprecation = (...args : any[]) => consoleCommonBehavior((...arg : any[]) => console.error('deprecated:', ...arg), ...args); // tslint:disable-line:no-console

function propDecoratorFactory<T, D> (name : string, fallback : (v : T) => D) : (target : any, propName : string) => void {
    function propDecorator (target : any, propName : string) : void {
        const privatePropName = `$$__${ propName }`;

        if (Object.prototype.hasOwnProperty.call(target, privatePropName)) {
            warn(`The prop "${ privatePropName }" is already exist, it will be overrided by ${ name } decorator.`);
        }

        Object.defineProperty(target, privatePropName, {
            configurable : true,
            writable : true
        });

        Object.defineProperty(target, propName, {
            get () : string {
                return this[privatePropName]; // tslint:disable-line:no-invalid-this
            },
            set (value : T) : void {
                this[privatePropName] = fallback(value); // tslint:disable-line:no-invalid-this
            }
        });
    }

    return propDecorator;
}

const toString : Function = Object.prototype.toString;
export const isFunction = obj => toString.call(obj) === '[object Function]';

// Shortcut function for checking if an object has a given property directly
// on itself (in other words, not on a prototype).
export const has = (obj, key) => obj !== null && Object.prototype.hasOwnProperty.call(obj, key);

const eq = (a : any, b : any, aStack? : any[], bStack? : any[]) => {
    // === 结果为 true 的区别出 +0 和 -0
    if (a === b) return a !== 0 || 1 / a === 1 / b;
    // typeof null 的结果为 object ，这里做判断，是为了让有 null 的情况尽早退出函数
    if (a === null || b === null) return a === b;

    // 判断 NaN
    if (a !== a) return b !== b;

    // 判断参数 a 类型，如果是基本类型，在这里可以直接返回 false
    const type = typeof a;
    if (type !== 'function' && type !== 'object' && typeof b !== 'object') return false;

    // a 和 b 的内部属性 [[class]] 相同时 返回 true
    const className = toString.call(a);
    if (className !== toString.call(b)) return false;
    switch (className) {
        // 字符串、数字、正则表达式、日期和布尔值进行比较
        case '[object RegExp]':
        // RegExps 被强制转换为字符串以便进行比较 (注意: '' + /a/i === '/a/i')
        case '[object String]':
            // Primitives and their corresponding object wrappers are equivalent; thus, `"5"` is
            // equivalent to `new String("5")`.
            return '' + a === '' + b;
        case '[object Number]':
            // `NaN`s are equivalent, but non-reflexive.
            // Object(NaN) is equivalent to NaN
            if (+a !== +a) return +b !== +b;
            // An `egal` comparison is performed for other numeric values.
            return +a === 0 ? 1 / +a === 1 / b : +a === +b;
        case '[object Date]':
        case '[object Boolean]':
            // Coerce dates and booleans to numeric primitive values. Dates are compared by their
            // millisecond representations. Note that invalid dates with millisecond representations
            // of `NaN` are not equivalent.
            return +a === +b;
    }

    const areArrays = className === '[object Array]';
    // 不是数组
    if (!areArrays) {
        // 过滤掉两个函数的情况
        if (typeof a !== 'object' || typeof b !== 'object') return false;

        // aCtor 和 bCtor 必须都存在并且都不是 Object 构造函数的情况下，aCtor 不等于 bCtor，那这两个对象就真的不相等
        const aCtor = a.constructor, bCtor = b.constructor;
        if (aCtor !== bCtor && !(isFunction(aCtor) && aCtor instanceof aCtor && isFunction(bCtor) && bCtor instanceof bCtor) && ('constructor' in a && 'constructor' in b)) {
            return false;
        }
    }
    // Assume equality for cyclic structures. The algorithm for detecting cyclic
    // structures is adapted from ES 5.1 section 15.12.3, abstract operation `JO`.

    // Initializing stack of traversed objects.
    // It's done here since we only need them for objects and arrays comparison.
    aStack = aStack || [];
    bStack = bStack || [];
    let length = aStack.length;

    // 检查是否有循环引用的部分
    while (length--) {
        // Linear search. Performance is inversely proportional to the number of
        // unique nested structures.
        if (aStack[length] === a) return bStack[length] === b;
    }

    // Add the first object to the stack of traversed objects.
    aStack.push(a);
    bStack.push(b);

    // 数组判断
    if (areArrays) {
        // Compare array lengths to determine if a deep comparison is necessary.
        length = a.length;
        if (length !== b.length) return false;
        // Deep compare the contents, ignoring non-numeric properties.
        while (length--) {
            if (!eq(a[length], b[length], aStack, bStack)) return false;
        }
    } else {
        // Deep compare objects.
        const keys = Object.keys(a);
        let key;
        length = keys.length;
        // Ensure that both objects contain the same number of properties before comparing deep equality.
        if (Object.keys(b).length !== length) return false;
        while (length--) {
            // Deep compare each member
            key = keys[length];
            if (!(has(b, key) && eq(a[key], b[key], aStack, bStack))) return false;
        }
    }
    // Remove the first object from the stack of traversed objects.
    aStack.pop();
    bStack.pop();
    return true;
};

/**
 * 进行深度比较，检查两个对象是否相等
 * @param a
 * @param b
 */
export const isEqual = (a : any, b : any) : boolean => eq(a, b);

export const Common = {

    /**
     * 冻结一个对象
     * 冻结指的是不能向这个对象添加新的属性，不能修改其已有属性的值，不能删除已有属性，以及不能修改该对象已有属性的可枚举性、可配置性、可写性
     * @param obj 返回被冻结的对象
     */
    toReadonly (obj : object) {
        return Object.freeze(obj);
    },

    /**
     * 随机获取list下标
     * @param list
     * @returns {number}
     */
    getRandomId (list : any[]) {
        return Math.floor(Math.random() * list.length);
    },

    /**
     * 获取url参数
     * @param key 可选
     * @param url 可选
     */
    getUrlParams (key? : string, url? : string) {
        url = url || window.location.href;
        const params = {};
        url.replace(/([^?&]+)=([^?&]+)/g, (s, v, k) => {
            params[decodeURIComponent(v)] = decodeURIComponent(k);
            return k + '=' + v;
        });
        return (key ? params[key] : params) || '';
    },

    /**
     * 获取范围内随机数
     *  Min ≤ r ≤ Max
     * @param Min
     * @param Max
     * @returns {any}
     */
    randomNumBoth (Min : number, Max : number) {
        const numTransition = (num) => {
            if (/^[0-9]*$/.test(num)) {
                num = Number(num);
            }
            return num;
        };
        Min = numTransition(Min);
        Max = numTransition(Max);
        const Range = Max - Min;
        const Rand = Math.random();
        return Min + Math.round(Rand * Range);
    },

    /**
     * 获取随机长度字符串
     * @param count
     * @returns {*|string}
     */
    getRandomStr (count : number = 6) {
        let str = Math.random().toString(36).substring(2);
        while (str.length < count) {
            str += Math.random().toString(36).substring(2);
        }
        return str.substring(0, count);
    },

    /**
     * 获取窗口高度
     * @returns {any}
     */
    getWinHeight () {
        let winHeight;
        if (window.innerHeight) {
            winHeight = window.innerHeight;
        } else if ((document.body) && (document.body.clientHeight)) {
            winHeight = document.body.clientHeight;
        }
        // 通过深入 Document 内部对 body 进行检测，获取窗口大小
        if (document.documentElement && document.documentElement.clientHeight) {
            winHeight = document.documentElement.clientHeight;
        }
        return winHeight;
    },

    /**
     * 获取窗口宽度
     * @returns {any}
     */
    getWinWidth () {
        let winWidth;
        if (window.innerWidth) {
            winWidth = window.innerWidth;
        } else if ((document.body) && (document.body.clientWidth)) {
            winWidth = document.body.clientWidth;
        }
        // 通过深入 Document 内部对 body 进行检测，获取窗口大小
        if (document.documentElement && document.documentElement.clientWidth) {
            winWidth = document.documentElement.clientWidth;
        }
        return winWidth;
    },

    /**
     * 验证是否pc平台
     * @returns {boolean}
     */
    platform () {
        const userAgentInfo = navigator.userAgent;
        const Agents = ['Android', 'iPhone', 'SymbianOS', 'Windows Phone', 'iPad', 'iPod'];
        return !Agents.includes(userAgentInfo);
    },

    /**
     * 空对象验证
     * @param obj
     * @returns {boolean}
     */
    isEmptyObject (obj) {
        if (!obj) return true;
        return Object.keys(obj).length === 0;
    },

    /**
     * 判断是否为对象
     */
    isObject (args : any) {
        const type = typeof args;
        return args !== null && (type === 'object' || type === 'function');
    },

    /**
     * 判断是否function
     */
    isFunction (args : any) {
        return typeof args === 'function';
    },

    /**
     * 判断是否数组
     */
    isArray (args : any) {
        return Object.prototype.toString.call(args) === '[object Array]';
    },

    /**
     * 判断是否数字
     */
    isNumber (args : any) {
        return /^[0-9]*$/.test(Common.trim(args));
    },

    /**
     * 判断是否为移动端
     */
    isMobile () {
        return /Android|webOS|iPhone|iPad|iPod|SymbianOS|Windows Phone|BlackBerry/i.test(navigator.userAgent);
    },

    /**
     * 转换为number
     */
    toNumber (num : number | string) {
        if (typeof num === 'number') return num;
        if (!Common.isEmpty(num) && /^[0-9.]*$/.test(num)) {
            return Number(num);
        }
        return null;
    },

    /**
     * 合并对象
     * 深度匹配
     */
    extend (userOption : object, defaultOption : object) {
        if (!userOption) return defaultOption;
        for (const key in defaultOption) {
            if (defaultOption.hasOwnProperty(key)) {
                if (typeof defaultOption[key] === 'object') {
                    Common.extend(userOption[key], defaultOption[key]); // 深度匹配
                } else if (!userOption.hasOwnProperty(key)) {
                    userOption[key] = defaultOption[key];
                }
            }
        }
        return userOption;
    },

    /**
     * 对象深拷贝
     * Note: 仅适用于Object、Array
     */
    deepCopy (obj : object) {
        if (obj === null) return null;
        let result;
        // 判断是否是简单数据类型
        if (typeof obj === 'object') {
            // 复杂数据类型
            result = Array.isArray(obj) ? [] : {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    result[key] = typeof obj[key] === 'object' ? Common.deepCopy(obj[key]) : obj[key];
                }
            }
        } else {
            // 简单数据类型,直接赋值
            result = obj;
        }
        return result;
    },

    /**
     * 获取自定义id
     * @param count
     * @returns {string}
     */
    getCustomId (count? : number) {
        count = count || 6;
        let _id = '';
        for (let i = 0; i < count; i++) {
            _id += (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        }
        return _id;
    },

    /**
     * 去除左右空格
     */
    trim (str : string) {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/^\s+|\s+$/g, '');
    },

    /**
     * 去除所有空格
     */
    trimAll (str : string) {
        if (!str || typeof str !== 'string') return str;
        return str.replace(/\s*/g, '');
    },

    /**
     * 删除对象中值为空字符串的属性
     * @param obj    参数对象
     * @returns {object}
     * @deprecated    此方法已弃用，请使用新方法 Common.deleteNullAttr(obj)
     */
    deleteNullParams (obj : object) {
        for (const propName in obj) {
            if (obj.hasOwnProperty(propName)) {
                if (obj[propName] && obj[propName] instanceof Object) {
                    const values : any[] = Object.values(obj[propName]);
                    const results : any[] = values.filter(value => !!value || value === 0);
                    if (!results.length) {
                        delete obj[propName];
                    } else {
                        Common.deleteNullParams(obj[propName]);
                    }
                } else if (Common.isEmpty(obj[propName])) {
                    delete obj[propName];
                }
            }
        }
        return obj;
    },

    /**
     * 删除对象中值为空的属性（null、undefined、''）
     * @param obj       参数对象
     * @param includes  包含值属性，一并删除
     * @returns {object}
     */
    deleteNullAttr (obj : object, includes : any[] = []) {
        const newObj = Common.deepCopy(obj);
        for (const propName in newObj) {
            if (newObj.hasOwnProperty(propName)) {
                if (newObj[propName] && newObj[propName] instanceof Object) {
                    const values : any[] = Object.values(newObj[propName]);
                    const results : any[] = values.filter(value => Common.isEmpty(value) || includes.includes(value));
                    if (!results.length && includes.length) {
                        delete newObj[propName];
                    } else {
                        Common.deleteNullAttr(newObj[propName], includes);
                    }
                } else if (Common.isEmpty(newObj[propName])) {
                    delete newObj[propName];
                }
            }
        }
        return newObj;
    },

    /**
     * 首字母大写
     * @param str    待转换字符串
     */
    toStrCase (str : string) {
        return str.replace(/([\w&`'‘’"“.@:\/\\{\\(\[<>_]+-? *)/g, (match, p1, index, title) => {
            if (index > 0 && title.charAt(index - 2) !== ':' && match.search(/^(a(nd?|s|t)?|b(ut|y)|en|for|i[fn]|o[fnr]|t(he|o)|vs?\.?|via)[ \-]/i) > -1)
                return match.toLowerCase();
            if (title.substring(index - 1, index + 1).search(/['"_{(\[]/) > -1)
                return match.charAt(0) + match.charAt(1).toUpperCase() + match.substr(2);
            if (match.substr(1).search(/[A-Z]+|&|[\w]+[._][\w]+/) > -1 || title.substring(index - 1, index + 1).search(/[\])}]/) > -1)
                return match;
            return match.charAt(0).toUpperCase() + match.substr(1);
        });
    },

    /**
     * 设置时分秒
     */
    setHMS (date : Date, h : number, min : number, sec : number) {
        date.setHours(h);		// 0~23
        date.setMinutes(min);	// 0~59
        date.setSeconds(sec);	// 0~59
    },

    /**
     * 将当前时间换成时间格式字符串
     * @param time      时间戳
     * @param format    格式
     * @param options   可选项
     * @param options.firstDayOfMonth   获取当月第一天
     * @param options.firstDayOfSeason  获取当季第一天
     * @param options.firstDayOfYear    获取当年第一天
     * @param options.fillStartHMS        补全开始时间格式(填充时分秒)
     * @param options.fillEndHMS        补全结束时间格式(填充时分秒)
     * @returns {string}
     *
     * 将 Date 转化为指定格式的String * 月(M)、日(d)、12小时(h)、24小时(H)、分(m)、秒(s)、周(E)、季度(q)
     * 可以用 1-2 个占位符 * 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字)
     * eg:
     *    (Common.formatDate(new Date(), "yyyy-MM-dd hh:mm:ss.S") ==> 2018-07-02 08:09:04.423
     *    (Common.formatDate(new Date(), "yyyy-MM-dd E HH:mm:ss") ==> 2018-03-10 二 20:09:04
     *    (Common.formatDate(new Date(), "yyyy-MM-dd EE hh:mm:ss") ==> 2018-03-10 周二 08:09:04
     *    (Common.formatDate(new Date(), "yyyy-MM-dd EEE hh:mm:ss") ==> 2018-03-10 星期二 08:09:04
     *    (Common.formatDate(new Date(), "yyyy-M-d h:m:s.S") ==> 2018-7-2 8:9:4.18
     */
    formatDate (time : any, format : string = 'yyyy-MM-dd HH:mm:ss', options? : IDate) {
        if (!time && options && options.hasOwnProperty('defaultValue')) {
            return options.defaultValue;
        }
        time = time || new Date();
        let date;
        if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(time)) {
            date = new Date(time);
        } else if (/^[0-9]*$/.test(time)) {
            date = new Date(Number(time));
        } else if (typeof time === 'string' && time.includes(' ') && time.includes('-')) {
            date = new Date(time.replace(/-/g, '/'));
        } else if (typeof time === 'string' && (time.includes('年') || time.includes('月') || time.includes('日'))) {
            date = new Date(time.replace(/[年月日]/g, '/'));
        } else if (typeof time === 'string' && time.length === 10 && (time.includes('-') || time.includes('/')) || (options && (options.fillStartHMS || options.fillEndHMS))) {
            date = new Date(time);
            Common.setHMS(date, 0, 0, 0);
            if (options && options.fillEndHMS) {
                Common.setHMS(date, 23, 59, 59);
            }
        } else {
            date = new Date(time);
        }
        if (options) {
            // 获取当月第一天
            if (options.firstDayOfMonth) {
                return date.setDate(1) && Common.formatDate(date, format);
            }
            // 获取当季第一天
            if (options.firstDayOfSeason) {
                const month : number = date.getMonth();
                if (month < 3) {
                    date.setMonth(0);
                } else if (2 < month && month < 6) {
                    date.setMonth(3);
                } else if (5 < month && month < 9) {
                    date.setMonth(6);
                } else if (8 < month && month < 11) {
                    date.setMonth(9);
                }
                date.setDate(1);
                return Common.formatDate(date, format);
            }
            // 获取当年第一天
            if (options.firstDayOfYear) {
                return date.setDate(1) && date.setMonth(0) && Common.formatDate(date, format);
            }
        }
        const dateObj = {
            'M+' : date.getMonth() + 1, // 月份
            'd+' : date.getDate(), 		// 日
            'h+' : date.getHours() % 12 === 0 ? 12 : date.getHours() % 12, // 小时
            'H+' : date.getHours(), 	// 小时
            'm+' : date.getMinutes(), 	// 分
            's+' : date.getSeconds(), 	// 秒
            'q+' : Math.floor((date.getMonth() + 3) / 3), // 季度
            'S+' : date.getMilliseconds() // 毫秒
        };
        const week = {
            0 : '\u65e5',
            1 : '\u4e00',
            2 : '\u4e8c',
            3 : '\u4e09',
            4 : '\u56db',
            5 : '\u4e94',
            6 : '\u516d'
        };
        if (/(y+)/i.test(format)) {
            format = format.replace(RegExp.$1, (date.getFullYear() + '').substr(4 - RegExp.$1.length));
        }
        if (/(E+)/.test(format)) {
            format = format.replace(RegExp.$1, ((RegExp.$1.length > 1) ? (RegExp.$1.length > 2 ? '\u661f\u671f' : '\u5468') : '') + week[date.getDay() + '']);
        }
        for (const k in dateObj) {
            if (dateObj.hasOwnProperty(k) && new RegExp('(' + k + ')').test(format)) {
                format = format.replace(RegExp.$1, RegExp.$1.length === 1 ? dateObj[k] : ('00' + dateObj[k]).substr(('' + dateObj[k]).length));
            }
        }
        return format;
    },

    /**
     * 格式化手机号或银行卡号或身份证号码
     * @param input                   待转换手机号或字符串
     * @param cleaveType              格式化类型
     * @param blocks                  格式化样式
     * @param creditCardStrictMode    是否开启银行卡19位验证
     * @returns {string}
     */
    formatWithSpace (input : string | number, cleaveType : 'phone' | 'bankCard' | 'idCard' = 'phone', blocks : number[] = [3, 4, 4], creditCardStrictMode : boolean = true) {
        if (cleaveType === 'bankCard') {
            blocks = creditCardStrictMode ? [4, 4, 4, 7] : [4, 4, 4, 4];
        }
        if (cleaveType === 'idCard') {
            blocks = [3, 3, 4, 4, 4];
        }
        input = (input || 0).toString();
        input = input.replace(/\s*/g, '');
        let result = '';
        const len = input.length + blocks.length - 1;
        let i = 0;
        while (result.length <= len) {
            result = result + input.slice(0, blocks[i]) + ' ';
            input = input.slice(blocks[i], input.length);
            i++;
        }
        if (result) {
            result = result.replace(/^\s+|\s+$/g, '');
        }
        return result;
    },

    /**
     * 将number数值转化成为货币格式
     * @param input
     * @param places    保留小数位数
     * @param symbol    货币符号 ($、￥、€、￡、₣、¥、₩)
     * @param thousand  整数部分千位分隔符
     * @param decimal   小数分隔符
     */
    formatMoney (input : any, places? : number, symbol? : string, thousand? : string, decimal? : string) {
        input = input || 0;
        places = !isNaN(places = Math.abs(places)) ? places : 2;
        symbol = symbol !== undefined ? symbol : '';
        thousand = thousand || ',';
        decimal = decimal || '.';
        let negative, i, j;
        negative = input < 0 ? '-' : '';
        i = parseInt(input = Math.abs(+input || 0).toFixed(places), 10) + '';
        j = (j = i.length) > 3 ? j % 3 : 0;
        return symbol + negative + (j ? i.substr(0, j) + thousand : '') + i.substr(j).replace(/(\d{3})(?=\d)/g, '$1' + thousand) + (places ? decimal + Math.abs(input - i).toFixed(places).slice(2) : '');
    },

    /**
     * 增加元素到列表
     * @param list       原数组
     * @param target     目标元素 可以是单个元素，也可以是一组元素
     * @param position   插入位置 可以是开头(start), 可以是末尾(end), 可以指定位置(index下标); 默认插入末尾
     * @param isReverse  是否反向插入元素(针对插入元素为数组的情况) 默认false
     *
     * eg:
     *    const list = ['a', 'b', 'c', 'd'];
     *    console.log(addItemToList(list, 1));                        => [ 'a', 'b', 'c', 'd', 1 ]
     *    console.log(addItemToList(list, 1, 'start'));               => [ 1, 'a', 'b', 'c', 'd' ]
     *    console.log(addItemToList(list, 1, 'end'));                 => [ 'a', 'b', 'c', 'd', 1 ]
     *    console.log(addItemToList(list, 1, 2));                     => [ 'a', 'b', 1, 'c', 'd' ]
     *    console.log(addItemToList(list, [1, 2, 3], 'start'));       => [ 1, 2, 3, 'a', 'b', 'c', 'd' ]
     *    console.log(addItemToList(list, [1, 2, 3], 'start', true)); => [ 3, 2, 1, 'a', 'b', 'c', 'd' ]
     */
    addItemToList (list : any[], target : any | any[], position : 'start' | 'end' | number = 'end', isReverse : boolean = false) {
        const copyTarget : any[] = Array.isArray(target) ? [...target] : [];
        if (position === 'end') {
            if (Array.isArray(target)) {
                list = list.concat(target);
            } else {
                list.push(target);
            }
        } else if (position === 'start') {
            if (Array.isArray(target)) {
                if (isReverse) {
                    // Inserts new elements at the start of an array.
                    list.unshift(...copyTarget.reverse());
                } else {
                    list.unshift(...target);
                }
            } else {
                list.unshift(target);
            }
        } else if (typeof position === 'number') {
            if (Array.isArray(target)) {
                if (isReverse) {
                    // 拼接函数(索引位置, 要删除元素的数量, 元素)
                    list.splice(position, 0, ...copyTarget.reverse());
                } else {
                    list.splice(position, 0, ...target);
                }
            } else {
                list.splice(position, 0, target);
            }
        }
        return list;
    },

    /**
     * 删除列表指定元素
     * @param list       原数组
     * @param target     目标元素 可以是单个元素，也可以是一组元素
     * @param matchAll   是否所有匹配都删除。默认只删除匹配到的第一个元素
     *
     * eg:
     *    console.log(removeListItem([1, 2, 3], 3));                                                        => [ 1, 2 ]
     *    console.log(removeListItem([1, 'a', 3], 'a'));                                                    => [ 1, 3 ]
     *    console.log(removeListItem([1, 2, 3, { name: 1 }], 3));                                           => [ 1, 2, { name: 1 } ]
     *    console.log(removeListItem([1, 2, 3, { name: 1 }], { name: 1 }));                                 => [ 1, 2, 3 ]
     *    console.log(removeListItem([1, 2, 3, { name: 1 }], { name: 2 }));                                 => [ 1, 2, 3, { name: 1 } ]
     *    console.log(removeListItem([1, 2, 3, { name: 2 }, { name: 1 }, { name: 2 }], { name: 2 }));       => [ 1, 2, 3, { name: 1 }, { name: 2 } ]
     *    console.log(removeListItem([1, 2, 3, { name: 2 }, { name: 1 }, { name: 2 }], { name: 2 }, true)); => [ 1, 2, 3, { name: 1 } ]
     */
    removeListItem (list : any[], target : any | any[], matchAll : boolean = false) {
        const remove = item => {
            if (['string', 'number', 'boolean'].includes(typeof item)) {
                const index = list.indexOf(item);
                list.splice(index, 1);
                if (matchAll) {
                    list.forEach((val, index) => val === item && list.splice(index, 1));
                }
            } else if (item instanceof Object) {
                // 递归删除
                const recursiveRemove = list => {
                    for (const [index, value] of Object.entries(list)) {
                        if (value instanceof Object && isEqual(value, item)) {
                            list.splice(index, 1);
                            if (matchAll) recursiveRemove(list);
                            else break;
                        }
                    }
                };
                recursiveRemove(list);
            }
        };
        const itemList : any[] = Common.isArray(target) ? [...target] : [target];
        itemList.forEach(item => remove(item));
        return list;
    },

    /**
     * 计算文件大小
     * @param bytes
     */
    fileSize (bytes : number) {
        const unit = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
        let extension = unit[0];
        const max = unit.length;
        for (let i = 1; ((i < max) && (bytes >= 1000)); i++) {
            bytes = bytes / 1000;
            extension = unit[i];
        }
        return Number(bytes).toFixed(1).replace(/\.00/, '') + extension;
    },

    /**
     * 二进制文件转base64
     * @param blob    二进制文件
     */
    blobToBase64 (blob : any) : Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e : any) => {
                return resolve(e.target.result);
            };
            reader.onerror = (e : any) => {
                return reject(e.target.result);
            };
            reader.readAsDataURL(blob);
        });
    },

    /**
     * 将base64转换为文件
     * @param base64     base64字符串
     * @param type       mime类型
     */
    base64ToBlob (base64 : string, type? : string) {
        const arr = base64.split(',');
        const mime = arr[0].match(/:(.*?);/)[1] || type;
        // 去掉url的头，并转化为byte
        const bytes = window.atob(arr[1]);
        // 处理异常,将ascii码小于0的转换为大于0
        const ab = new ArrayBuffer(bytes.length);
        // 生成视图（直接针对内存）：8位无符号整数，长度1个字节
        const ia = new Uint8Array(ab);
        for (let i = 0; i < bytes.length; i++) {
            ia[i] = bytes.charCodeAt(i);
        }
        return new Blob([ab], { type : mime });
    },

    /**
     * base64转换为文件
     * @param base64
     * @param filename
     */
    base64ToFile (base64 : string, filename : string) {
        const array = base64.split(',');
        const mime = array[0].match(/:(.*?);/)[1];
        const str = window.atob(array[1]);
        let length = str.length;
        const uint8Array = new Uint8Array(length);
        while (length--) {
            uint8Array[length] = str.charCodeAt(length);
        }
        return new File([uint8Array], filename, { type : mime });
    },

    /**
     * 循环封装
     * example
     *  Common.each(3, null, (i) => {
     *		// 输出 0,1,2
     *	}, () => {
     *		console.log('complete');
     *	});
     *
     *  Common.each(3, { start : 1 }, (i) => {
     *		// 输出 1,2
     *	}, () => {
     *		console.log('complete');
     *	});
     *
     *  Common.each(3, { contain: true, orderBy: 'asc' }, (i) => {
     *		// 输出 0,1,2,3
     *	}, () => {
     *		console.log('complete');
     *	});
     *
     *  Common.each(3, { contain: true, orderBy: 'desc' }, (i) => {
     *		// 输出 3,2,1,0
     *	}, () => {
     *		console.log('complete');
     *	});
     *
     *  Common.each([{ name: 'test1' }, { name: 'test2' }], { start : 0 }, (item, i) => {
     *		console.log('item: ', item);
     *		// item:  { name: 'test1' } 0
     *		// item:  { name: 'test2' } 1
     *	}, () => {
     *		console.log('complete');
     *	});
     * @param {Any[] | Number} iterator 迭代数据
     * @param {{ start: Number, contain: Boolean, orderBy : 'asc' | 'desc' } | null} options 选项参数 必须, 不设置任意参数时需传null占位
     *    options.orderBy: asc 正序，desc 倒叙, default: asc
     *    options.matchOne: 匹配到的第一个值后，跳出循环, default: 执行所有循环，不进行匹配
     * @param {Function} handler 单步处理函数     必须
     * @param {Function} completeCallback 循环完毕后回调 可选
     */
    each (iterator : any[] | number, options : { start? : number, contain? : boolean, orderBy? : 'asc' | 'desc', matchOne? : boolean } | null = {}, handler : Function = () => {}, completeCallback : Function = () => {}) {
        let start = 0;
        let len = typeof iterator === 'number' ? iterator : iterator.length;
        const isDesc = (options && options.orderBy === 'desc');
        if (options) {
            if (options.start) start = options.start;
            if (options.contain) {
                len += 1;
            } else if (isDesc) {
                len += 1;
                start += 1;
            }
        }
        const handlerIterate = (hasItem : boolean = false) => {
            if (isDesc) {
                for (let i = len; i > start; i--) {
                    const index = i - 1;
                    hasItem ? handler(iterator[index], index) : handler(index);
                    if (options && typeof options.matchOne === 'boolean' && (options.matchOne === !!iterator[index])) {
                        break;
                    }
                }
            } else {
                for (let i = start; i < len; i++) {
                    hasItem ? handler(iterator[i], i) : handler(i);
                    if (options && typeof options.matchOne === 'boolean' && (options.matchOne === !!iterator[i])) {
                        break;
                    }
                }
            }
        };
        if (typeof iterator === 'number') {
            handlerIterate();
        } else {
            handlerIterate(true);
        }
        completeCallback();
    },

    /**
     * 获取指定名称的cookie的值
     * @param {string} name
     * @returns {string}
     */
    getCookie (name : string) {
        const reg : RegExp = new RegExp('(^| )' + name + '=([^;]*)(;|$)');
        const arr : any[] = document.cookie.match(reg);
        if (arr) {
            return unescape(arr[2]);
        } else {
            return null;
        }
    },

    /**
     * 添加cookie
     * @param name
     * @param value
     * @param time  过期时间 20s代表20秒, h指小时，如12小时则是：12h, d是天数，30天则：30d。默认：半小时(1800s)
     */
    setCookie (name : string, value : string, time : string = '1800s') {
        const strSec = Common.strToMillisecond(time);
        const date : any = new Date();
        date.setTime(date.getTime() + strSec);
        document.cookie = name + '=' + escape(value) + ';expires=' + date.toGMTString();
    },

    /**
     * 删除cookies
     * @param name
     */
    deleteCookie (name : string) {
        const date : any = new Date();
        date.setTime(date.getTime() - 1);
        const cookie = Common.getCookie(name);
        if (cookie !== null) {
            document.cookie = name + '=' + cookie + ';expires=' + date.toGMTString();
        }
    },

    /**
     * 字符串转化为毫秒数
     * example
     *    20s代表20秒
     *    h指小时，如12小时则是：12h
     *    d指天数，30天则：30d
     * @param str
     * @returns {number}
     */
    strToMillisecond (str : string) {
        if (/^[0-9]*$/.test(str)) {
            return Number(str);
        }
        const unit : string = str.substr(str.length - 1, 1).toLowerCase();
        const time : number = Number(str.substring(0, str.length - 1));
        if (unit === 's') {
            return time * 1000;
        } else if (unit === 'h') {
            return time * 60 * 60 * 1000;
        } else if (unit === 'd') {
            return time * 24 * 60 * 60 * 1000;
        } else {
            return Number(time);
        }
    },

    /**
     * 数组排序(支持多条件)
     * example
     *    list.sort(
     *        firstBy(function (v1, v2) { return v1.name.length - v2.name.length; })
     *        .thenBy(function (v1, v2) { return v1.population - v2.population; })
     *        .thenBy(function (v1, v2) { return v1.id - v2.id; })
     *    );
     *
     *    list.sort(
     *        firstBy(function (v) { return v.name.length; })
     *        .thenBy("population") // 按ASCII字符代码从小到大排序
     *        .thenBy("id") // 按ASCII字符代码从小到大排序
     *    );
     */
    firstBy : (() => {
        const identity = v => v;
        const ignoreCase = v => typeof (v) === 'string' ? v.toLowerCase() : v;
        const makeCompareFunction = (f, opt) => {
            opt = typeof (opt) === 'number' ? { direction : opt } : opt || {};
            if (typeof (f) !== 'function') {
                const prop = f;
                f = (v1) => !!v1[prop] ? v1[prop] : '';
            }
            if (f.length === 1) {
                const uf = f;
                const preProcess = opt.ignoreCase ? ignoreCase : identity;
                f = (v1, v2) => preProcess(uf(v1)) < preProcess(uf(v2)) ? -1 : preProcess(uf(v1)) > preProcess(uf(v2)) ? 1 : 0;
            }
            if (opt.direction === -1) return (v1, v2) => -f(v1, v2);
            return f;
        };

        function tb (func : any, opt? : any) {
            const x = typeof (this) === 'function' ? this : false;
            const y = makeCompareFunction(func, opt);
            const f = x ? (a, b) => (x(a, b) || y(a, b)) : y;
            f.thenBy = tb;
            return f;
        }

        return tb;
    })(),

    /**
     * 四舍六入五成双
     * @param num 需转化的数字
     * @param digit 保留小数位数, 默认保留2位小数
     *
     * example
     *    const a = 0.2;
     *    const b = 0.1;
     *    round(a.add(b)); // 勿用 a + b,会存在精度问题
     * @returns {number}
     */
    round (num : number, digit : number = 2) {
        const ratio   = Math.pow(10, digit),
              _num    = num * ratio,
              mod     = _num % 1,
              integer = Math.floor(_num);
        if (mod > 0.5) {
            return (integer + 1) / ratio;
        } else if (mod < 0.5) {
            return integer / ratio;
        } else {
            return (integer % 2 === 0 ? integer : integer + 1) / ratio;
        }
    },

    /**
     * uuid(生成的id是唯一的)
     */
    getUUID () {
        const S4 = () => (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
        return (S4() + S4() + '-' + S4() + '-' + S4() + '-' + S4() + '-' + S4() + S4() + S4());
    },

    /**
     * 监听返回事件
     * @param returnUrl    返回地址
     * @param currentUrl   当前页面地址
     * @param currentTitle 当前页面title
     * @param router       当前页面注入的route，如果是返回微信，则此参数不传; 如果是阻止页面回退，则此参数必须传入。默认返回微信
     * @param callback     成功后回调
     */
    listenBack (returnUrl : string, currentUrl : string, currentTitle : string, router? : Router, callback : Function = () => {}) {
        if (window.history && window.history.pushState) {
            window.ngReturnUrl = returnUrl;
            window.ngRouter = router;
            window.ngCallback = callback;
            window.addEventListener('popstate', Common.backCallback, {
                once : false,    // 是否设置单次监听
                passive : false  // 是否让 阻止默认行为(preventDefault()) 失效
            });
            const state = {
                title : currentTitle,
                url : currentUrl
            };
            window.history.pushState(state, currentTitle, currentUrl);
        }
    },

    /**
     * 返回事件回调函数
     * @param e
     */
    backCallback (e : Event) {
        e.preventDefault();
        // if (!window.ngRouter && wx) return wx.closeWindow();
        if (window.ngRouter) return window.ngRouter.navigateByUrl(window.ngReturnUrl);
        // if (window.ngRouter) return window.location.assign(window.ngReturnUrl);
        if (Common.isFunction(window.ngCallback)) window.ngCallback();
    },

    /**
     * 移除监听返回事件
     */
    removePopstateEvent () {
        window.removeEventListener('popstate', Common.backCallback);
    },

    /**
     * 图片按宽高比例进行自动缩放
     * @param ImgObj 缩放图片源对象
     * @param maxWidth 允许缩放的最大宽度
     * @param maxHeight 允许缩放的最大高度
     * @usage 调用：<img src="图片" onload="drawImage(this,100,100)">
     */
    drawImage (ImgObj : any, maxWidth : number, maxHeight : number) {
        const image = new Image();
        // 原图片原始地址（用于获取原图片的真实宽高，当<img>标签指定了宽、高时不受影响）
        image.src = ImgObj.src;
        // 用于设定图片的宽度和高度
        let tempWidth;
        let tempHeight;

        if (image.width > 0 && image.height > 0) {
            // 原图片宽高比例 大于 指定的宽高比例，这就说明了原图片的宽度必然 > 高度
            if (image.width / image.height >= maxWidth / maxHeight) {
                if (image.width > maxWidth) {
                    tempWidth = maxWidth;
                    // 按原图片的比例进行缩放
                    tempHeight = (image.height * maxWidth) / image.width;
                } else {
                    // 按原图片的大小进行缩放
                    tempWidth = image.width;
                    tempHeight = image.height;
                }
            } else {// 原图片的高度必然 > 宽度
                if (image.height > maxHeight) {
                    tempHeight = maxHeight;
                    // 按原图片的比例进行缩放
                    tempWidth = (image.width * maxHeight) / image.height;
                } else {
                    // 按原图片的大小进行缩放
                    tempWidth = image.width;
                    tempHeight = image.height;
                }
            }
            // 设置页面图片的宽和高
            ImgObj.height = tempHeight;
            ImgObj.width = tempWidth;
            // 提示图片的原来大小
            ImgObj.alt = image.width + '×' + image.height;
        }
    },

    /**
     * 手动更新页面视图
     * @param cdr
     */
    updateView (cdr : ChangeDetectorRef) {
        if (cdr) {
            cdr.markForCheck();		// 标记更改
            cdr.detectChanges();	// 立即检测更改
        }
    },

    /**
     * 空判断
     * @param value    需判断值
     */
    isEmpty (value : any) {
        return value === null || typeof value === 'undefined' || value === '';
    },

    /**
     * 回退上一页
     */
    goBack (modal, msg : string = '参数错误,请返回上一页重试') {
        if (!modal) return;
        setTimeout(() => {
            modal.alert({
                template : msg,
                close : false,
                confirmCallback : () => window.history.back()
            });
        });
    },

    /**
     * 获取当前平台
     * @returns {number}
     */
    getPlatform () {
        const u = navigator.userAgent;
        const isAndroid = u.indexOf('Android') > -1 || u.indexOf('Adr') > -1; // android终端
        const isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);		// ios终端
        const isMiniProgram = (window.__wxjs_environment === 'miniprogram');
        const isMicroMessenger = (String(u.match(/MicroMessenger/i)) === 'micromessenger');

        let platform = 0;

        // android
        if (isAndroid) {
            platform = 5;
        }

        // ios
        if (isiOS) {
            platform = 4;
        }

        // 小程序
        if (isMiniProgram) {
            platform = 7;
        }

        // 公众号
        if (isMicroMessenger) {
            platform = 8;
        }
        return String(platform);
    },

    /**
     * 下载文件
     * @param fileName  文件名
     * @param type      文件类型 类型为null时，表示自动识别文件类型
     * @param content   文件数据
     */
    downloadFile (fileName : string, type : string | null, content : string) : void {
        let dataUrl : string = '';
        if (/^data:/.test(content) && content.includes(';base64,')) { // base64 链接
            dataUrl = content;
        } else {
            // Blob转化为链接
            let blobData : any = null;
            if (type) {
                blobData = new Blob([content], { type : type || 'application/json;charset=utf-8' });
            } else {
                blobData = new Blob([content]);
            }
            dataUrl = window.URL.createObjectURL(blobData);
        }

        if (Common.browserIsIe()) { // 是IE浏览器
            // 判断是否是base64
            if (this.isBase64(content) && window.navigator && window.navigator.msSaveOrOpenBlob) { // 如果浏览器支持msSaveOrOpenBlob方法（也就是使用IE浏览器的时候），那么调用该方法去下载图片/文件
                const bStr : string = atob(content.split(',')[1]);
                let n = bStr.length;
                const u8arr = new Uint8Array(n);
                while (n--) {
                    u8arr[n] = bStr.charCodeAt(n);
                }
                const blob = new Blob([u8arr]);
                window.navigator.msSaveOrOpenBlob(blob, fileName);
            } else {
                // 调用创建iframe的函数
                this.createIframe(content);
            }
        } else {
            // 这里就按照chrome等新版浏览器来处理,支持download,添加属性.
            const aDom : HTMLElement = document.createElement('a');
            aDom.setAttribute('href', dataUrl);
            aDom.setAttribute('download', fileName);
            aDom.setAttribute('display', 'none');
            document.body.appendChild(aDom);
            aDom.click();
            window.URL.revokeObjectURL(dataUrl);
        }
    },

    /**
     * 判断是否为base64字符串
     * @param str
     */
    isBase64 (str : string) : boolean {
        const base64Pattern = '^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$';
        if (str.startsWith('data:image')) return true;
        return !!str.match(base64Pattern);
    },

    /**
     * 判断是否为Trident内核浏览器(IE等)函数
     */
    browserIsIe () {
        return !!window.ActiveXObject || 'ActiveXObject' in window;
    },

    /**
     * 下载图片/文件的函数
     */
    openDownload () {
        // iframe的src属性不为空,调用execCommand(),保存图片/文件
        const iframeEle : HTMLElement = window.document.body.querySelector('#iframeEle');
        if (iframeEle.getAttribute('src') !== 'about:blank') {
            window.frames['iframeEle'].document.execCommand('SaveAs'); // 浏览器是不允许JS跨域操作。在两个页面中加上 document.domain="xxx.com"; 把它指向同一域，就可以操作了。
        }
    },

    /**
     * 创建iframe并赋值的函数,传入参数为图片/文件的src属性值
     * @param data
     */
    createIframe (data : string) {
        // 如果隐藏的iframe不存在则创建
        let iframeEle : HTMLElement = window.document.body.querySelector('#iframeEle');
        if (!iframeEle) {
            iframeEle = window.document.createElement('iframe');
            iframeEle.setAttribute('id', 'iframeEle');
            iframeEle.setAttribute('name', 'iframeEle');
            iframeEle.setAttribute('width', '0');
            iframeEle.setAttribute('height', '0');
            iframeEle.setAttribute('src', 'about:blank');
            iframeEle.addEventListener('load', () => this.openDownload(), false);
            window.document.body.appendChild(iframeEle);
        }
        // iframe的src属性如不指向图片/文件地址,则手动修改,加载图片/文件
        if (iframeEle.getAttribute('src') !== data) {
            iframeEle.setAttribute('src', data);
        } else {
            // 如指向图片/文件地址,直接调用下载方法
            this.openDownload();
        }
    },

    /**
     * 导出JSON
     */
    exportJson (fileName : string, data : object | string) {
        if (typeof data === 'object') {
            data = JSON.stringify(data, null, 4);
        }
        this.downloadFile(fileName + '.json', 'text/plain;charset=utf-8', data);
    },

    /**
     * 导出Markdown
     */
    exportMarkdown (fileName : string, markdownStr : string) {
        this.downloadFile(fileName + '.md', 'text/plain;charset=utf-8', markdownStr);
    },

    /**
     * 导出Html
     */
    exportHtml (fileName : string, html : string) {
        this.downloadFile(fileName + '.html', 'text/html;charset=utf-8', html);
    },

    /**
     * 导出Excel
     */
    exportExcel (url : string, data? : any) {
        if (data) url = url + '?' + qs.stringify(data);
        window.location = url;
    },

    /**
     * 移除标签
     */
    removeNgTag (nativeElement : HTMLElement) : void {
        const parentElement = nativeElement.parentElement;
        if (!parentElement || !parentElement.insertBefore) return;
        while (nativeElement.firstChild) {
            parentElement.insertBefore(nativeElement.firstChild, nativeElement);
        }
        parentElement.removeChild(nativeElement);
    },

    /**
     * 判断是不是父级标签
     */
    isParentTag (nativeElement : HTMLElement, parentTag : string) : boolean {
        let parentIsTag = false;
        let parent = nativeElement.parentElement;
        let findLen = 3, lowerName = '';
        while (findLen) {
            lowerName = parent.localName.toLowerCase();
            if (lowerName.indexOf('p-') > -1) {
                parentIsTag = lowerName === parentTag;
                findLen = 0;
            } else {
                parent = parent.parentElement;
                findLen--;
            }
        }

        return parentIsTag;
    },

    /**
     *获取当前日期前N天或后N日期(N = day)type:1：前；2：后
     */
    getDate (day : number, type : number) {
        const date = new Date();
        let resultDate;
        if (type === 1) {
            resultDate = new Date(date.getTime() - (day * 24 * 60 * 60 * 1000));
        } else {
            resultDate = new Date(date.getTime() + (day * 24 * 60 * 60 * 1000));
        }
        return resultDate;
    },

    /**
     * 今日
     */
    getToday (format : string = 'yyyy-MM-dd') {
        const date = new Date();
        const formatDate = this.formatDate(date, format);
        return [formatDate, formatDate];
    },

    /**
     * 昨日
     */
    getYesterday (format : string = 'yyyy-MM-dd') {
        const date = this.getDate(1, 1);
        const formatDate = this.formatDate(date, format);
        return [formatDate, formatDate];
    },

    /**
     * 本周
     */
    getThisWeek (format : string = 'yyyy-MM-dd') {
        const date = new Date();
        const week = date.getDay(); // 获取周几
        // const nowDay = date.getDate(); // 当前日
        const arr = [7, 1, 2, 3, 4, 5, 6];
        const monday = this.getDate(arr[week] - 1, 1);  // 周一
        // const sunday = this.getDate(7 - week, 2); // 周天
        return [this.formatDate(monday, format), this.formatDate(date, format)];
    },

    /**
     * 上周
     */
    getLastWeek (format : string = 'yyyy-MM-dd') {
        const date = new Date();
        const week = date.getDay(); // 获取周几
        const arr = [7, 1, 2, 3, 4, 5, 6];
        const monday = this.getDate(arr[week] + 6, 1);  // 上周一
        const sunday = this.getDate(arr[week], 1); // 上周天
        return [this.formatDate(monday, format), this.formatDate(sunday, format)];
    },

    /**
     * 本月
     */
    getThisMonth (format : string = 'yyyy-MM-dd') {
        const date = new Date();
        const year = date.getFullYear();
        const month = date.getMonth();
        const min = new Date(year, month, 1); // 本月月初
        // const max = new Date(year, month + 1, 0); // 本月月底
        return [this.formatDate(min, format), this.formatDate(date, format)];
    },

    /**
     * 本年
     */
    getThisYear (format : string = 'yyyy-MM-dd') {
        const date = new Date();
        const year = date.getFullYear();
        const min = new Date(year, 0, 1); // 本月月初
        // const max = new Date(year, month + 1, 0); // 本月月底
        return [this.formatDate(min, format), this.formatDate(date, format)];
    },

    /**
     * 合并对象
     */
    assign (source : object, target : object, exclude : string[] = []) {
        for (const prop in source) {
            if (source.hasOwnProperty(prop) && target.hasOwnProperty(prop) && !exclude.includes(prop)) {
                source[prop] = target[prop];
            }
        }
        return source;
    },

    /**
     * 数组去重
     */
    unique (list : any[] = [], valueKey? : string) {
        const formatObj = (obj : object) => {
            const keys = Object.keys(obj).sort();
            const tmpObj = {};
            keys.forEach(key => tmpObj[key] = obj[key]);
            return tmpObj;
        };
        const map = {};
        const uniqueList = [];
        for (const item of list) {
            if (item && typeof item === 'object') {
                if (Array.isArray(item)) {
                    Common.unique(item);
                } else if (!valueKey) {
                    const key = Object.keys(item)[0];
                    if (!map[key]) {
                        map[key] = formatObj(item);
                    } else {
                        if (JSON.stringify(formatObj(item)) === JSON.stringify(map[key])) {
                            map[key] = formatObj(item);
                        } else {
                            uniqueList.push(item);
                        }
                    }
                } else {
                    map[item[valueKey]] = item;
                }
            } else {
                map[item] = item;
            }
        }
        for (const prop in map) {
            if (map.hasOwnProperty(prop)) {
                uniqueList.push(map[prop]);
            }
        }
        return uniqueList;
    }
};

/**
 * 格式化价格，保留2位小数
 * @param amount
 * @param fixed
 */
export const formatRmb = (amount : any, fixed : number = 2) => parseFloat((amount || 0).toFixed(fixed));

/**
 * 人民币转换(分转元)
 * @param amount
 */
export const RmbFToY = amount => formatRmb((amount || 0) / 100);

/**
 * 人民币转换(元转分)
 * @param amount
 */
export const RmbYToF = amount => formatRmb((amount || 0) * 100);

/**
 * 防抖函数 (如果一个函数持续地触发，那么只在它结束后过一段时间只执行一次)
 * @param func 传入函数
 * @param wait 表示时间窗口的间隔
 * @param immediate 是否立即触发
 * @return {Function}
 */
// export const debounce = (func, wait : number = 300, immediate : boolean = false) => {
// 	let timeout;
// 	return function () {
// 		/*tslint no-invalid-this: "off"*/
// 		const self = this;
// 		// 参数转为数组
// 		const args = Array.prototype.slice.call(arguments);
// 		return new Promise((resolve) => { // 返回一个promise对象
// 			if (timeout) {
// 				clearTimeout(timeout);
// 			}
// 			if (immediate) {
// 				const callNow = !timeout;
// 				timeout = setTimeout(() => {
// 					timeout = null;
// 				}, wait);
// 				if (callNow) {
// 					resolve(func.apply(self, args)); // 值操作
// 				}
// 			} else {
// 				timeout = setTimeout(() => {
// 					resolve(func.apply(self, args));
// 				}, wait);
// 			}
// 		});
// 	};
// };

/**
 * 节流函数 (如果一个函数持续的，频繁地触发，那么让它在一定的时间间隔后再触发)
 * @param func 传入函数
 * @param wait 表示时间窗口的间隔
 * @return {Function}
 */
export const throttle = (func, wait) => {
    let timeout;
    return function () {
        const context = this;
        // 参数转为数组
        const args = Array.prototype.slice.call(arguments);
        if (!timeout) {
            timeout = setTimeout(() => {
                func.apply(context, args);
                timeout = null;
            }, wait);
        }
    };
};

/**
 * 防抖方法装饰器
 * @param delay     延迟时间
 * @return {Function}
 */
export function Debounce (delay : number = 300) : MethodDecorator {
    return (target : any, propertyKey : string, descriptor : PropertyDescriptor) => {
        let timeout = null;

        const original = descriptor.value;

        descriptor.value = function (...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => original.apply(this, args), delay);
        };

        return descriptor;
    };
}

/**
 * keyCode兼容
 * @param event
 */
export const dispatchForCode = (event : any) => {
    let code;
    if (event.key !== undefined) {
        code = event.key;
    } else if (event.keyIdentifier !== undefined) {
        code = event.keyIdentifier;
    } else if (event.keyCode !== undefined) {
        code = event.keyCode;
    }
    return code;
};

/**
 * boolean 转 number
 * @param bool
 * @param sort asc是指按升序排列, desc则是指按降序排列; 默认升序
 */
export const boolToNumber = (bool : boolean, sort : 'desc' | 'asc' = 'asc') => {
    if (sort === 'asc') return bool === false ? 0 : 1;
    return bool === false ? 1 : 0;
};

/**
 * number 转 boolean
 * @param num
 * @param sort asc是指按升序排列, desc则是指按降序排列; 默认升序
 */
export const numberToBool = (num : number, sort : 'desc' | 'asc' = 'asc') => {
    if (sort === 'asc') return num !== 0;
    return num === 0;
};

/**
 * 首字母大写
 */
export const FirstUpperCase = (str : string) => str ? str.charAt(0).toUpperCase() + str.slice(1) : '';

/**
 * 新窗口打开
 */
export const NewWindowOpen = (url : string, queryParams? : any) : void => {
    queryParams = Object.assign({}, queryParams);
    const paramsStr : string = qs.stringify(queryParams);
    if (paramsStr) {
        if (url.includes('?')) {
            url = url + '&' + paramsStr;
        } else {
            url = url + '?' + paramsStr;
        }
    }
    window.open(url, '_blank');
};

/**
 * 前端数据分页
 * @param dataList    总数据列表
 * @param pager
 *    pager.pageIndex 当前页标
 *    pager.pageSize  每页显示条数
 */
export const CustomPager = (dataList : any[] = [], pager : { pageIndex : number; pageSize : number; }) => {
    pager = Object.assign({ pageIndex : 1, pageSize : 10 }, pager);
    const start : number = (pager.pageIndex - 1) * pager.pageSize;
    const end : number = pager.pageIndex * pager.pageSize;
    return dataList.slice(start, end);
};

/**
 * 延迟执行，取代setTimeout方式
 * @param executeFun
 */
export const delayExecute = (executeFun : Function) => {
    Promise.resolve().then(() => executeFun());
};

export function InputBoolean () : any {
    return propDecoratorFactory('InputBoolean', toBoolean);
}

export function InputCssPixel () : any {
    return propDecoratorFactory('InputCssPixel', toCssPixel);
}

export function InputNumber () : any {
    return propDecoratorFactory('InputNumber', toNumber);
}

export function isNotNil (value : any) : boolean {
    return typeof value !== 'undefined' && value !== null;
}

/**
 * 判断元素是否在可视区域
 */
export const isInViewPort = (el : Element) => {
    return new Promise(resolve => {
        // 定义一个交叉观察器
        const observer : IntersectionObserver = new IntersectionObserver((entries : IntersectionObserverEntry[]) => {
            entries.forEach(ioe => {
                const el : HTMLElement = ioe.target as HTMLElement;
                const intersectionRatio = ioe.intersectionRatio;
                if (intersectionRatio > 0 && intersectionRatio <= 1) {
                    resolve(ioe);
                    // 停止关注某个元素
                    // observer.unobserve(el);
                    // 禁用整个 IntersectionObserver
                    observer.disconnect();
                }
                el.onload = el.onerror = () => observer.disconnect();
            });
        });
        // 开始观测某个元素
        observer.observe(el);
    });
};

/**
 * 删除含Yuan的废弃字段
 * @param items
 */
export const removeYuanField = (items : object) => {
    const executeRemoveField = (item) => {
        for (const key in item) {
            if (item.hasOwnProperty(key) && key.endsWith('Yuan')) {
                delete item[key];
            }
        }
    };
    if (Array.isArray(items)) {
        for (const item of items) {
            if (item && item instanceof Object) {
                executeRemoveField(item);
            }
        }
    } else if (items && items instanceof Object) {
        executeRemoveField(items);
    }
};

/**
 * 时间格式填充
 * @param time
 * @param position
 *    start    开始时间填充
 *    end    结束时间填充
 * @param format
 */
export const formatDateFill = (time : any, position : 'start' | 'end', format? : string) : string => {
    const options : IDate = { defaultValue : '' };
    if (position === 'start') options.fillStartHMS = true;
    if (position === 'end') options.fillEndHMS = true;
    return Common.formatDate(time, format, options);
};

/**
 * 获取参数值（number类型）
 * @param key           参数key
 * @param defaultValue  默认值
 * @return number
 */
export const getUrlNumberParams = (key : string, defaultValue? : string | number) => {
    const value : number = Common.toNumber(Common.getUrlParams(key));
    return value === 0 || value ? value : (Common.isEmpty(defaultValue) ? null : Number(defaultValue));
};

/**
 * 删除数组元素
 * @param list  原数组
 * @param index 删除元素下标
 * @param isUpdateSource    是否更新原数组
 */
export const removeItem = (list : any[] = [], index : number, isUpdateSource : boolean = true) => {
    if (index >= list.length) return list;
    let tmpList : any[] = list;
    if (!isUpdateSource) {
        tmpList = Common.deepCopy(list);
    }
    for (let i = 0; i < tmpList.length; i++) {
        if (i === index) {
            tmpList.splice(i, 1);
        }
    }
    return tmpList;
};
