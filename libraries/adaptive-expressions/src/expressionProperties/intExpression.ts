/**
 * @module adaptive-expressions
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
import { ExpressionProperty } from './expressionProperty';
import { Expression } from '../expression';

/**
 * Represents a property which is either a int or a string expression which resolves to a int.
 * @remarks
 * String values are always interpreted as an expression, whether it has '=' prefix or not.
 */
export class IntExpression extends ExpressionProperty<number> {
    /**
     * Initializes a new instance of the [IntExpression](xref:adaptive-expressions.IntExpression) class.
     * @param value An int `number` or `string` expression which resolves to an int `number`.
     */
    public constructor(value?: number | string | Expression) {
        super(value, 0);
    }

    /**
     * Try to get the value.
     * @param data Data to use for expression binding.
     * @returns Value of int number
     */
    public tryGetValue(data: object): { value: number; error: Error } {
        const result = super.tryGetValue(data);
        if (typeof result.value == 'number') {
            // Ensure returned value is an int.
            result.value = Math.trunc(result.value);
        }

        return result;
    }

    /**
     * Set an integer value.
     * @param value Value to set.
     */
    public setValue(value: number | string | Expression): void {
        if (
            value !== undefined &&
            value !== null &&
            typeof value !== 'number' &&
            typeof value !== 'string' &&
            !(value instanceof Expression)
        ) {
            throw new Error('IntExpression accepts string, number or Expression as the value.');
        }

        super.setValue(value);
    }
}
