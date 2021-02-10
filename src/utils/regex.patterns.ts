import { LogLevel } from 'src/config/configuration.interface';

export const commaDelimitedLogLevel = `^(${LogLevel.Log}|${LogLevel.Error}|${LogLevel.Warn}|${LogLevel.Debug}|${LogLevel.Verbose}){1}(,(${LogLevel.Log}|${LogLevel.Error}|${LogLevel.Warn}|${LogLevel.Debug}|${LogLevel.Verbose})){0,4}$`;
