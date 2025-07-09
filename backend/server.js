const express = require('express')
const cors = require('cors')
const path = require('path')
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');

const app = express()
const port = 5000

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))

const proizvodiRoutes = require('./routes/proizvodi')

app.use(cors())
app.use(express.json())

app.use('/api/proizvodi', proizvodiRoutes)

app.listen(port, () => {
  console.log(`Server radi na http://localhost:${port}`)
  console.log(`Swagger dokumentacija dostupna na http://localhost:${port}/api-docs`)
})
