import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { PagerComponent } from './pager.component';
import { NumberModule } from '@app/shared/directives/number';

@NgModule({
	imports : [
		CommonModule,
		FormsModule,
		NumberModule
	],
	declarations : [
		PagerComponent
	],
	exports : [
		PagerComponent
	]
})
export class PagerModule {}
