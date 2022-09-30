const express = require('express')
const app = express()
const port = 3000

if (process.env.NODE_ENV === "test") {
  const { OutDoc } = require('outdoc')
  OutDoc.init()
}

app.get('/projects', (req, res) => {
  res.json([{
    id: '1',
    name: 'dapi v1'
  }, {
    id: '2',
    name: 'cominsoon'
  }])
})

app.get('/projects/:id', (req, res) => {
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

app.patch('/projects/:id', (req, res) => {
  res.json([{
    id: '2',
    name: 'cominsoon'
  }])
})

app.post('/projects', (req, res) => {
  res.status(201).json([{
    id: '1',
    name: 'dapi v1'
  }])
})

app.delete('/projects/:id', (req, res) => {
  res.sendStatus(204)
})

app.get('/users/:id', (req, res) => {
  const { id } = req.params
  return res.json({
    id: '1',
    name: 'wayne user'
  })
})

app.post('/users', (req, res) => {
  res.status(201).json([{
    id: '1',
    name: 'user v1'
  }])
})

// app.listen(port, () => {
//   console.log(`Example app listening on port ${port}`)
// })

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => console.log(`Listening on port ${port}`))
}

module.exports = app;