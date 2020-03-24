import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// directives
import { NumberModule } from './directives/number';

// pipes
const PIPES_MODULE = [];

const DIRECTIVE_MODULE = [
    NumberModule
];

@NgModule({
    imports : [
        CommonModule
    ],
    exports : [
        CommonModule,
        ...PIPES_MODULE,
        ...DIRECTIVE_MODULE
    ]
})
export class SharedModule {}
