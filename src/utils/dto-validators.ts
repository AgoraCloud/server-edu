import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

/**
 * Checks if the given array has the specified length
 */
@ValidatorConstraint({ name: 'isArrayLength', async: false })
export class IsArrayLength implements ValidatorConstraintInterface {
  validate(arr: any[], args: ValidationArguments) {
    const requiredLength: number = args.constraints[0];
    return arr && arr.length === requiredLength;
  }

  defaultMessage(args: ValidationArguments) {
    const requiredLength: number = args.constraints[0];
    return `array must be of length ${requiredLength}`;
  }
}

/**
 * Checks if the given field is defined
 * @param field the field to check
 */
export const isDefined = (field: any): boolean => {
  return field !== undefined && field !== null;
};
