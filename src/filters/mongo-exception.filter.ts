import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { HttpArgumentsHost } from '@nestjs/common/interfaces';
import { Request, Response } from 'express';
import { MongoError } from 'mongodb';

@Catch(MongoError)
export class MongoExceptionFilter implements ExceptionFilter {
  catch(exception: MongoError, host: ArgumentsHost) {
    const ctx: HttpArgumentsHost = host.switchToHttp();
    const request: Request = ctx.getRequest<Request>();
    const response: Response = ctx.getResponse<Response>();

    /**
     * Constructs the error response
     * @param message the error message
     */
    const responseMessage = (message: string): void => {
      response.status(400).json({
        statusCode: 400,
        message,
        error: 'Bad Request',
      });
    };

    switch (exception.code) {
      // Duplicate Exception
      case 11000 || '11000':
        responseMessage(`Email ${request.body.email} is in use`);
        break;
      default:
        responseMessage(exception.message);
    }
  }
}
