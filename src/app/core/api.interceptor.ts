import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../environments/environment';

export const apiInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('API INTERCEPTOR RUNNING working');
  const cloned = req.clone({
    setHeaders: {
      'X-APP-KEY': environment.apiKey
    }
  });

  return next(cloned);
};
