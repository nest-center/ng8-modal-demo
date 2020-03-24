# Angular Table Component

table component made with  


## Minimal Setup Example

First thing you need to do is to import the table directives into your component.

```

import { TableModule } from 'src/app/components/table';

```

Then register it by adding to the list of directives of your module:

table.module.ts

```
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { TableComponent } from './table.component';
import { TableModule } from '../../components/table';

@NgModule({
	declarations : [
		TableComponent
	],
	imports : [
		CommonModule,
		TableModule,
		RouterModule.forChild([
			{
				path : '',
				component : TableComponent
			}
		])
	]
})
export class ExampleTableModule {}
```

Now, we need to configure the table and add it into the template. The only <strong>required</strong> setting for the component to start working is a columns configuration.
Let's register <i>settings</i> property inside of the component where we want to have the table and configure some columns [Settings documentation](https://github.com/cjking-wang/fe-smart-table/#/documentation):

table.component.ts

```
import { Component, OnInit } from '@angular/core';

export interface Car {
	vin? : any;
	year? : any;
	brand? : any;
	color? : any;
	price? : any;
	saleDate? : any;
}

@Component({
	selector : 'app-table',
	templateUrl : './table.component.html',
	styleUrls : ['./table.component.less']
})
export class TableComponent implements OnInit {

	cars1 : Car[];

	cars2 : Car[];

	cols : any[];

	selectedCar1 : Car;

	constructor () {}

	async ngOnInit () {
		this.cars1 = (await import('./cars-medium.json') as any).default.data;
		this.cars2 = (await import('./cars-medium.json') as any).default.data;

		this.cols = [
			{ field : 'vin', header : 'Vin' },
			{ field : 'year', header : 'Year' },
			{ field : 'brand', header : 'Brand' },
			{ field : 'color', header : 'Color' }
		];
	}
}
```

Finally let's put the table component inside of the template:

table.component.html

```
<p-table #dt1 [columns]="cols" [value]="cars1" [paginator]="true" [rows]="10" dataKey="vin" [resizableColumns]="true" [reorderableColumns]="true"
         selectionMode="single" [(selection)]="selectedCar1" stateStorage="session" stateKey="statedemo-session">
	<ng-template pTemplate="header" let-columns>
		<tr>
			<th *ngFor="let col of columns" [pSortableColumn]="col.field" pResizableColumn pReorderableColumn>
				{{col.header}}
				<p-sortIcon [field]="col.field"></p-sortIcon>
			</th>
		</tr>
		<tr>
			<th *ngFor="let col of columns" [ngSwitch]="col.field" class="ui-fluid">
				<input pInputText type="text" (input)="dt1.filter($event.target.value, col.field, col.filterMatchMode)" [value]="dt1.filters[col.field]?.value">
			</th>
		</tr>
	</ng-template>
	<ng-template pTemplate="body" let-rowData let-columns="columns">
		<tr [pSelectableRow]="rowData">
			<td *ngFor="let col of columns">
				{{rowData[col.field]}}
			</td>
		</tr>
	</ng-template>
</p-table>
```

