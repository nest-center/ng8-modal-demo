import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { ModalModule } from './components/modal';
import { TableDemoComponent } from './pages/table-demo/table-demo.component';
import { TableModule } from '@app/components/table';
import { PagerModule } from '@app/components/pager/pager.module';
import { ScrollingModule } from '@angular/cdk/scrolling';

@NgModule({
    declarations : [
        AppComponent,
        TableDemoComponent
    ],
    imports : [
        BrowserModule,
        ModalModule.forRoot(),
        RouterModule.forRoot([]),
        TableModule,
        PagerModule,
        ScrollingModule
    ],
    entryComponents : [TableDemoComponent],
    exports : [RouterModule],
    bootstrap : [AppComponent]
})
export class AppModule {}
