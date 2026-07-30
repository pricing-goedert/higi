import type { NextFunction, Request, RequestHandler, Response } from 'express'

/**
 * Express 4 does not forward a rejected promise from an async handler to
 * error-handling middleware — it becomes an unhandled rejection, which
 * crashes the whole Node process (Node >=15 default), taking down the API
 * for every connected user over one bad request. Wrap every async handler
 * with this so failures become a normal 500 response instead.
 */
export function ah(handler: (req: Request, res: Response, next: NextFunction) => Promise<void>): RequestHandler {
  return (req, res, next) => {
    handler(req, res, next).catch(next)
  }
}
