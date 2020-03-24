import { Component, Input, Output, EventEmitter, Renderer2, ViewChild, ElementRef, forwardRef, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

export interface PageChangedEvent {
    pageSize : number;
    pageIndex : number;
}

const PAGER_CONTROL_VALUE_ACCESSOR : any = {
    multi : true,
    provide : NG_VALUE_ACCESSOR,
    useExisting : forwardRef(() => PagerComponent)
};

@Component({
    selector : 'app-pager',
    templateUrl : './pager.component.html',
    styleUrls : ['./pager.component.less'],
    providers : [PAGER_CONTROL_VALUE_ACCESSOR]
})
export class PagerComponent implements ControlValueAccessor, OnChanges, OnDestroy {

    @Input() showPagesCount : number = 5;	// 显示页码数量
    @Input() pageSize : number = 10;		// 每页行数
    @Input() totals : number = 0;			// 总条数

    @Input() alwaysShow : boolean = true;	// 总是显示
    @Input() showFirst : boolean = true;	// 是否显示跳转首页
    @Input() showLast : boolean = true;		// 是否显示跳转末页
    @Input() isShowTotals : boolean = true;	// 是否显示总页数
    @Input() isShowJump : boolean = true;	// 是否显示自定义跳转
    @Input() showTotalPage : boolean = false;	// 是否显总页数

    @Input() firstText : string;			// 跳转首页标签文本
    @Input() prevText : string;				// 跳转上一页标签文本
    @Input() nextText : string;				// 跳转下一页标签文本
    @Input() lastText : string;				// 跳转最后一页标签文本
    @Input() className : string;			// 样式名称

    @Output() pageChanged = new EventEmitter<PageChangedEvent>();

    @ViewChild('gotoRef', { static : false }) gotoRef : ElementRef;

    gotoIndex : number = 1;

    protected pages : number[] = [];
    protected showPages : number;
    protected curPageIndex : number = 1;
    protected onChange : Function = () => {};	// 双向绑定值更新
    protected documentListen : () => void;

    // 当前页码
    get pageIndex () : number {
        return this.curPageIndex;
    }

    set pageIndex (index : number) {
        this.curPageIndex = index || 1;
    }

    constructor (private render : Renderer2) {
        this.documentListen = this.render.listen('document', 'keydown', (event : any) => {
            if (event.keyCode === 13 && this.gotoRef) { // Enter 回车键
                if (this.gotoRef.nativeElement.id === document.activeElement.id) {
                    this.gotoRef.nativeElement.focus();
                    this.toSpecified();
                }
            }
        });
    }

    ngOnChanges (changes : SimpleChanges) : void {
        if ('totals' in changes) {
            this.initPages();
        }
    }

    writeValue (value : number) : void {
        if (value) {
            this.pageIndex = value;
            this.initPages();
        }
    }

    registerOnChange (fn : any) { this.onChange = fn; }

    registerOnTouched (fn : any) : void {}

    setDisabledState (isDisabled : boolean) : void {}

    shouldShow () : boolean {
        return this.alwaysShow ? true : this.totals > this.pageSize;
    }

    paginate (index : number) : boolean {
        this.pageIndex = index || 1;
        this.gotoIndex = this.pageIndex;
        this.initPages();
        this.onChange(this.pageIndex);
        this.pageChanged.emit({ pageIndex : this.curPageIndex, pageSize : this.pageSize });
        return false;
    }

    next () : boolean {
        return this.paginate(this.pageIndex + 1);
    }

    prev () : boolean {
        return this.paginate(this.pageIndex - 1);
    }

    getPages () : Array<any> {
        return this.pages;
    }

    getLast () : number {
        return Math.ceil(this.totals / this.pageSize) || 1;
    }

    initPages () {
        const pagesCount = this.getLast(); // 总页数
        this.showPages = pagesCount < this.showPagesCount ? pagesCount : this.showPagesCount;
        this.pages = [];
        if (this.shouldShow()) {
            let middleOne = Math.ceil(this.showPages / 2);
            middleOne = this.pageIndex >= middleOne ? this.pageIndex : middleOne;

            let lastOne = middleOne + Math.floor(this.showPages / 2);
            lastOne = lastOne >= pagesCount ? pagesCount : lastOne;

            const firstOne = lastOne - this.showPages + 1;

            for (let i = firstOne; i <= lastOne; i++) {
                this.pages.push(i);
            }
        }
    }

    /**
     * 跳转到首页
     */
    toFirst () {
        return this.pageIndex === 1 ? false : this.paginate(1);
    }

    /**
     * 上一页
     */
    toPrev () {
        return this.pageIndex === 1 ? false : this.prev();
    }

    /**
     * 下一页
     */
    toNext () {
        return this.pageIndex === this.getLast() ? false : this.next();
    }

    /**
     * 跳转到末页
     */
    toLast () {
        return this.pageIndex === this.getLast() ? false : this.paginate(this.getLast());
    }

    /**
     * 跳转到指定页
     */
    toSpecified () {
        if (!this.gotoIndex) return;
        const pagesCount = this.getLast(); // 总页数
        if (this.gotoIndex > pagesCount) {
            this.gotoIndex = pagesCount;
        }
        this.paginate(this.gotoIndex);
    }

    ngOnDestroy () : void {
        if (this.documentListen) this.documentListen();
    }
}
