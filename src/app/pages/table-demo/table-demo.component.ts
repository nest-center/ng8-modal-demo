import { Component, OnInit } from '@angular/core';
import { ITableColumn } from '@app/components/components.interface';
import { ModalService } from '@app/components/modal';

@Component({
    selector : 'app-table-demo',
    templateUrl : './table-demo.component.html',
    styleUrls : ['./table-demo.component.less']
})
export class TableDemoComponent implements OnInit {

    tableColumns : ITableColumn[] = [			// table title
        {
            header : '编号',
            field : 'id',
            width : '70px'
        },
        {
            header : '名称',
            field : 'name',
            width : '70px'
        },
        {
            header : '操作',
            field : 'operate',
            width : '50px'
        }
    ];

    dataList : any[] = [];  // 列表信息

    pager : any = {
        totals : 30,
        firstText : '<<',
        prevText : '<',
        nextText : '>',
        lastText : '>>'
    };

    constructor (private modal : ModalService) { }

    ngOnInit () {
        for (let i = 0; i < 30; i++) {
            this.dataList.push({
                id : i + 1,
                name : 'test' + i
            });
        }
    }

    getList () {

    }

    removeItem (id : any) {
        this.modal.confirm({
            template : '是否确认删除？',
            confirmCallback : () => {
                this.dataList = this.dataList.filter(data => data.id !== id);
            }
        });
    }
}
