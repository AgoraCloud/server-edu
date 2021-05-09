import { UseInterceptors } from '@nestjs/common';
import { TransformInterceptor } from '../interceptors/transform.interceptor';

interface ClassType<T> {
  new (): T;
}

/**
 * A decorator that applies the transform interceptor to classes
 * and methods
 * @param classType the DTO class to use during transformation
 * @returns a fully configured transform decorator
 */
export function Transform<T>(classType: ClassType<T>) {
  return UseInterceptors(new TransformInterceptor(classType));
}
