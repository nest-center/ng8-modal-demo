import { NgModule } from '@angular/core';
import { NumberDirective } from './number.directive';

@NgModule({
	declarations : [
		NumberDirective
	],
	exports : [
		NumberDirective
	]
})
export class NumberModule {}