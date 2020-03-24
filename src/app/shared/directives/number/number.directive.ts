import { ChangeDetectorRef, Directive, ElementRef, EventEmitter, HostListener, Input, OnDestroy, OnInit, Output, Renderer2 } from '@angular/core';
import { NgControl } from '@angular/forms';
import { FocusMonitor, FocusOrigin } from '@angular/cdk/a11y';
import { Common } from '@app/utils';

@Directive({
	selector : 'input[number]'
})
export class NumberDirective implements OnInit, OnDestroy {

	@Input() min : number;					// 最小值
	@Input() max : number;					// 最大值
	@Input() integer : boolean = true;		// 是否转换为number类型
	@Input() hasDecimal : boolean = false;	// 是否含有小数点
	@Input() maxLen : number = 20;			// 最大长度
	@Input() startWith : boolean = false;	// 开头是否含0 (0.1等)

	@Output() pBlur : EventEmitter<any> = new EventEmitter<any>();
	@Output() pChange : EventEmitter<any> = new EventEmitter<any>();
	@Output() pInput : EventEmitter<any> = new EventEmitter<any>();

	private _value : string | number;
	private isBackspace : boolean;

	get value () : string | number {
		return this._value;
	}

	set value (value : string | number) {
		this._value = Common.isEmpty(value) ? null : value;
		this.ele.nativeElement.value = this._value;
		if (this.ngControl && this.ngControl.control) {
			this.ngControl.control.setValue(this._value);
		}
	}

	@Input()
	set price (bool : boolean) {
		this.hasDecimal = bool;
		this.startWith = bool;
		this.maxLen = bool ? 6 : 20;
	}

	constructor (private ele : ElementRef,
				 private render : Renderer2,
				 private cdr : ChangeDetectorRef,
				 private focusMonitor : FocusMonitor,
				 private ngControl : NgControl) {
	}

	getEleValue () {
		return this.ele.nativeElement.value.toString();
	}

	@HostListener('input', ['$event'])
	inputChange (event : any) {
		this.isBackspace = event.inputType === 'deleteContentBackward';
		this.formatNumber();
		this.pInput.emit(this.value);
	}

	@HostListener('change')
	onChange () {
		this.handleValue();
		this.pChange.emit(this.value);
	}

	onBlur () {
		this.handleValue();
		this.pBlur.emit(this.value);
	}

	handleValue () {
		if (this.integer) {
			this.isBackspace = false;
			this.formatNumber();
			const value : any = this.getEleValue();
			if (value) this.value = parseFloat(value);
		}
	}

	ngOnInit () : void {
		this.render.setAttribute(this.ele.nativeElement, 'type', 'text');
		// 焦点 获取/离开 事件
		this.focusMonitor.monitor(this.ele, true).subscribe((focusOrigin : FocusOrigin) => {
			if (!focusOrigin) {
				this.onBlur();
			}
		});
	}

	formatNumber () {
		let value : any = this.getEleValue();
		const reg : RegExp = new RegExp(`^(\\d{${ this.maxLen }})\\d*`);
		if (this.hasDecimal) {
			value = value.replace(/[^\d.]/g, '');	// 清除"数字"和"."以外的字符
			value = value.replace(reg, '$1'); 		// 最多只能输入六位整数
			value = value.replace(/\.{2,}/g, '.');	// 只保留第一个".", 清除多余的
			value = value.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.'); // 解释地址 http://www.imooc.com/wenda/detail/421958
			value = value.replace(/^(-)*(\d+)\.(\d\d).*$/, '$1$2.$3');	// 只能输入两个小数
			if (!this.startWith && value.charAt(0) === '0') {			// number情况下，移除第一个字符是"0"的
				value = value.slice(1, value.length);
			}
		}
		if (this.integer) {
			if (!this.hasDecimal) {
				value = NumberDirective.handleValue(reg, value);
				value = value.replace(reg, '$1'); 		// 最多只能输入六位整数
			}
			// 字符串转number, value不能为空，且不能以 "." ".0" ".00" 结尾的数
			if (!this.isBackspace && !Common.isEmpty(value) && value.charAt(0) !== '0' && !value.startsWith('.') && !value.endsWith('.') && !value.endsWith('.0') && !value.endsWith('.00')) {
				value = +value;
			}
			if (!this.checkHasFocus() && !this.isBackspace && !isNaN(this.min) && !Common.isEmpty(value) && value < this.min) {
				value = this.min;
			}
			if (!this.checkHasFocus() && !this.isBackspace && !isNaN(this.max) && !Common.isEmpty(value) && value > this.max) {
				value = this.max;
			}
		} else {
			if (!this.hasDecimal) {
				value = NumberDirective.handleValue(reg, value);
			}
		}
		this.value = isNaN(value) ? null : value;
	}

	ngOnDestroy () : void {
		this.focusMonitor.stopMonitoring(this.ele);
	}

	private static handleValue (reg : RegExp, value : string) {
		value = value.replace(/[^\d]/g, '');	// 清除"数字"和"."以外的字符
		value = value.replace(/\./g, ''); 	// 清除所有"."
		value = value.replace(reg, '$1'); 				// 最多只能输入六位整数
		return value;
	}

	/**
	 * 判断当前元素是否获取到光标
	 */
	private checkHasFocus () {
		return this.ele.nativeElement === document.activeElement;
	}
}