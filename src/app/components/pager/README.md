# Angular Smart Paging utility class

## Dependencies

+ Angular >=4.0.0 


## Usage

pager-example.module.ts:

```
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { PagerExampleComponent } from './pager-example.component';
import { SharedModule } from '../../shared.module';
import { FePagerModule } from '../pager.module';

@NgModule({
	declarations : [
		PagerExampleComponent
	],
	imports : [
		CommonModule,
		SharedModule,
		FePagerModule,
		RouterModule.forChild([
			{
				path : '',
				component : PagerExampleComponent
			}
		])
	]
})
export class PagerExampleModule {}
```

You need either set  
demo.html:  

```
<app-pager
	class="pagination"
	*ngIf="totals > params.pageSize"
	[pageSize]="params.pageSize"
	[totals]="totals"
	[(ngModel)]="params.pageNum"
	firstText="首页"
	nextText="下一页"
	prevText="上一页"
	lastText="最后一页"
	(pageChanged)="getList()">
</app-pager>
```
