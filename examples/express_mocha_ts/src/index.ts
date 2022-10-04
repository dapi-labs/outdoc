import express, { Express, Request, Response } from 'express';

const app: Express = express();
const port = 3000;

app.get('/api/projects', (req: Request, res: Response) => {
  res.json([{
    id: '1',
    name: 'dapi v1'
  }, {
    id: '2',
    name: 'cominsoon'
  }])
})

app.get('/api/projects/:id', (req: Request, res: Response) => {
  const { id } = req.params
  if (id === "404") {
    return res.sendStatus(404)
  }
  if (id === "401") {
    return res.status(401).json({
      error: {
        code: '123',
        message: '401 unauth'
      }
    })
  }
  return res.json({
    id: '2',
    name: 'cominsoon'
  })
})

app.patch('/api/projects/:id', (req: Request, res: Response) => {
  res.json([{
    id: '2',
    name: 'cominsoon'
  }])
})

app.post('/api/projects', (req: Request, res: Response) => {
  res.status(201).json([{
    id: '1',
    name: 'dapi v1'
  }])
})

app.delete('/api/projects/:id', (req: Request, res: Response) => {
  res.sendStatus(204)
})

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at https://localhost:${port}`);
  });
}

export default app