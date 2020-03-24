/**
 * 下拉结构实体
 */
export interface ISelect {
    id? : number;	// option ID
    name? : string;	// option name
}

export interface IBlockTableUI {
    getBlockTableElement () : HTMLElement;
}

/**
 * table头列实体类
 */
export interface ITableColumn {
    field? : string;		// 后端返回数据字段名称
    header? : string;		// 页面table头显示名称
    hidden? : boolean;		// 字段是否隐藏
    merge? : boolean;		// 是否合并字段
    width? : string;		// 页面table列的宽度
    minWidth? : string;		// 页面table列的最小宽度
    enableSort? : boolean;	// 是否启用排序, 默认不开启
    render? : Function;		// 自定义处理函数
    isNumber? : boolean;	// 是否默认值显示0
    isIndex? : boolean;		// 是否序号
    showInput? : boolean;	// 是否显示input自定义输入
    isPrice? : boolean;		// 是否价格
    isAction? : boolean;	// 是否显示操作
    isCheckbox? : boolean;	// 是否复选框
    isToText? : boolean;	// 是否转换为文本显示
    mapList? : ISelect[];	// 转换为文本的map结构列表
    defaultText? : string | number;	// 默认文本
    isStatus? : boolean;	// 是否状态(有红绿点)

    [propName : string] : any;
}

export interface ISelectItem {
    label? : string;
    value : any;
    styleClass? : string;
    icon? : string;
    title? : string;
    disabled? : boolean;
}

export interface ISelectItemGroup {
    label : string;
    value? : any;
    items : ISelectItem[];
}

export interface ISortMeta {
    field : string;
    order : number;
}

export interface IFilterMetadata {
    value? : any;
    matchMode? : string;
}

export interface ITableState {
    first? : number;
    rows? : number;
    sortField? : string;
    sortOrder? : number;
    multiSortMeta? : ISortMeta[];
    filters? : { [s : string] : IFilterMetadata; };
    columnWidths? : string;
    tableWidth? : string;
    selection? : any;
    columnOrder? : string[];
    expandedRowKeys? : { [s : string] : boolean; };
}

export interface ISortEvent {
    data? : any[];
    mode? : string;
    field? : string;
    order? : number;
    multiSortMeta? : ISortMeta[];
}

export interface ILazyLoadEvent {
    first? : number;
    rows? : number;
    sortField? : string;
    sortOrder? : number;
    multiSortMeta? : ISortMeta[];
    filters? : { [s : string] : IFilterMetadata; };
    globalFilter? : any;
}
