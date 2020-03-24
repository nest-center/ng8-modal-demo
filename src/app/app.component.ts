import { Component } from '@angular/core';
import { ModalService } from '@app/components/modal';
import { TableDemoComponent } from '@app/pages/table-demo/table-demo.component';

@Component({
    selector : 'app-root',
    templateUrl : './app.component.html',
    styleUrls : ['./app.component.less']
})
export class AppComponent {

    constructor (private modal : ModalService) {}

    showModal () {
        this.modal.dialog({
            template : TableDemoComponent,
            width : 600
        });
    }
}
