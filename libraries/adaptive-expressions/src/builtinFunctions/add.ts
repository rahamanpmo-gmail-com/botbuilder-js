/**
 * @module adaptive-expressions
 */
/**
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { Expression } from '../expression';
import { EvaluateExpressionDelegate, ExpressionEvaluator } from '../expressionEvaluator';
import { ExpressionType } from '../expressionType';
import { FunctionUtils } from '../functionUtils';
import { ReturnType } from '../returnType';

/**
 * Return the result from adding two or more numbers (pure number case) or concatting two or more strings (other case).
 */
export class Add extends ExpressionEvaluator {
    /**
     * Initializes a new instance of the [Add](xref:adaptive-expressions.Add) class.
     */
    public constructor() {
        super(ExpressionType.Add, Add.evaluator(), ReturnType.String | ReturnType.Number, Add.validator);
    }

    /**
     * @private
     */
    private static evaluator(): EvaluateExpressionDelegate {
        return FunctionUtils.applySequenceWithError((args: unknown[]): { value: unknown; error: string } => {
            let value: unknown;
            let error: string;
            const stringConcat = !FunctionUtils.isNumber(args[0]) || !FunctionUtils.isNumber(args[1]);
            if (
                ((args[0] === null || args[0] === undefined) && FunctionUtils.isNumber(args[1])) ||
                ((args[1] === null || args[1] === undefined) && FunctionUtils.isNumber(args[0]))
            ) {
                error = "Operator '+' or add cannot be applied to operands of type 'number' and null object.";
            } else if (stringConcat) {
                if ((args[0] === null || args[0] === undefined) && (args[1] === null || args[1] === undefined)) {
                    value = '';
                } else if (args[0] === null || args[0] === undefined) {
                    value = args[1].toString();
                } else if (args[1] === null || args[1] === undefined) {
                    value = args[0].toString();
                } else {
                    value = args[0].toString() + args[1].toString();
                }
            } else if (FunctionUtils.isNumber(args[0]) && FunctionUtils.isNumber(args[1])) {
                value = (args[0] as number) + (args[1] as number);
            }

            return { value, error };
        }, FunctionUtils.verifyNumberOrStringOrNull);
    }

    /**
     * @private
     */
    private static validator(expression: Expression): void {
        FunctionUtils.validateArityAndAnyType(
            expression,
            2,
            Number.MAX_SAFE_INTEGER,
            ReturnType.String | ReturnType.Number
        );
    }
}
