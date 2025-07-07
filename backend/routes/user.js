const express = require('express')
const router = express.Router()
const mysql = require('mysql2')

const db = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'plivanje',
})

/**
 * @swagger
 * components:
 *   schemas:
 *     Proizvod:
 *       type: object
 *       properties:
 *         id:
 *           type: integer
 *           description: ID proizvoda
 *         naziv:
 *           type: string
 *         opis:
 *           type: string
 *         cijena:
 *           type: number
 *         kategorija_id:
 *           type: integer
 *         velicina:
 *           type: string
 *         spol:
 *           type: string
 *         boja:
 *           type: string
 *         brend:
 *           type: string
 *         dostupnost:
 *           type: boolean
 *         slikaUrl:
 *           type: string
 */

/**
 * @swagger
 * /api/proizvodi:
 *   get:
 *     summary: Dohvati sve proizvode (s filtrima i pretragom)
 *     parameters:
 *       - in: query
 *         name: kategorija
 *         schema:
 *           type: string
 *         description: Filtriraj po kategoriji
 *       - in: query
 *         name: pretraga
 *         schema:
 *           type: string
 *         description: Traži po nazivu ili opisu
 *       - in: query
 *         name: dostupnost
 *         schema:
 *           type: boolean
 *         description: Filtriraj po dostupnosti (true/false)
 *     responses:
 *       200:
 *         description: Lista proizvoda
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Proizvod'
 */
router.get('/', (req, res) => {
  console.log('GET /api/proizvodi pozvan')

  const { kategorija, brend, spol, boja, velicina, pretraga, dostupnost, page, limit } = req.query

  let sql = `
    SELECT p.*, k.naziv AS kategorija_naziv
    FROM proizvodi p
    LEFT JOIN kategorije k ON p.kategorija_id = k.id
    WHERE 1=1
  `
  const params = []

  if (kategorija) {
    if (!isNaN(kategorija)) {
      sql += ' AND p.kategorija_id = ?'
      params.push(parseInt(kategorija))
    } else {
      sql += ' AND LOWER(k.naziv) = ?'
      params.push(kategorija.toLowerCase())
    }
  }

  if (brend) {
    sql += ' AND LOWER(p.brend) = ?'
    params.push(brend.toLowerCase())
  }
  if (spol) {
    sql += ' AND LOWER(p.spol) = ?'
    params.push(spol.toLowerCase())
  }
  if (boja) {
    sql += ' AND LOWER(p.boja) = ?'
    params.push(boja.toLowerCase())
  }
  if (velicina) {
    sql += ' AND LOWER(p.velicina) = ?'
    params.push(velicina.toLowerCase())
  }
  if (dostupnost !== undefined) {
    sql += ' AND p.dostupnost = ?'
    params.push(dostupnost === 'true' ? 1 : 0)
  }

  if (pretraga && pretraga.trim() !== '') {
    sql += ' AND (LOWER(p.naziv) LIKE ? OR LOWER(p.opis) LIKE ?)'
    const searchTerm = `%${pretraga.toLowerCase()}%`
    params.push(searchTerm, searchTerm)
  }

  const pageInt = parseInt(page)
  const limitInt = parseInt(limit)
  if (!isNaN(pageInt) && !isNaN(limitInt) && pageInt > 0 && limitInt > 0) {
    const offset = (pageInt - 1) * limitInt
    sql += ' LIMIT ? OFFSET ?'
    params.push(limitInt, offset)
  }

  console.log('SQL upit:', sql)
  console.log('Parametri:', params)

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error('Greška u SQL upitu:', err)
      return res.status(500).json({ error: 'Greška prilikom dohvaćanja proizvoda' })
    }
    res.json(results)
  })
})

/**
 * @swagger
 * /api/proizvodi/{id}:
 *   get:
 *     summary: Dohvati proizvod po ID-u
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID proizvoda
 *     responses:
 *       200:
 *         description: Detalji proizvoda
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Proizvod'
 *       404:
 *         description: Proizvod nije pronađen
 */
rrouter.get('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Neispravan ID proizvoda' })
  }

  const sql = `
    SELECT p.*, k.naziv AS kategorija_naziv
    FROM proizvodi p
    LEFT JOIN kategorije k ON p.kategorija_id = k.id
    WHERE p.id = ?
  `

  db.query(sql, [id], (err, results) => {
    if (err) {
      console.error('Greška u SQL upitu:', err)
      return res.status(500).json({ error: 'Greška prilikom dohvaćanja proizvoda' })
    }
    if (results.length === 0) {
      return res.status(404).json({ message: 'Proizvod nije pronađen' })
    }
    res.json(results[0])
  })
})

/**
 * @swagger
 * /api/proizvodi:
 *   post:
 *     summary: Dodaj novi proizvod
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Proizvod'
 *     responses:
 *       201:
 *         description: Proizvod uspješno dodan
 */
router.post('/', (req, res) => {
  const {
    naziv,
    opis,
    cijena,
    kategorija_id,
    velicina,
    spol,
    boja,
    brend,
    dostupnost,
    slikaUrl,
  } = req.body

  if (!naziv || !opis || !cijena || !kategorija_id) {
    return res.status(400).json({ error: 'Naziv, opis, cijena i kategorija su obavezni.' })
  }

  const sql = `
    INSERT INTO proizvodi 
    (naziv, opis, cijena, kategorija_id, velicina, spol, boja, brend, dostupnost, slikaUrl)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `
  const params = [
    naziv,
    opis,
    cijena,
    kategorija_id,
    velicina || null,
    spol || null,
    boja || null,
    brend || null,
    dostupnost ? 1 : 0,
    slikaUrl || null,
  ]

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Greška kod dodavanja proizvoda:', err)
      return res.status(500).json({ error: 'Greška prilikom dodavanja proizvoda.' })
    }

    console.log('Dodani proizvod ID:', result.insertId)
    res.status(201).json({ message: 'Proizvod uspješno dodan.', id: result.insertId, slikaUrl })
  })
})

/**
 * @swagger
 * /api/proizvodi/{id}:
 *   delete:
 *     summary: Obriši proizvod po ID-u
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID proizvoda za brisanje
 *     responses:
 *       200:
 *         description: Proizvod obrisan
 *       404:
 *         description: Proizvod nije pronađen
 */
router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id)
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Neispravan ID proizvoda' })
  }

  const sql = 'DELETE FROM proizvodi WHERE id = ?'

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Greška kod brisanja proizvoda:', err)
      return res.status(500).json({ error: 'Greška prilikom brisanja proizvoda' })
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Proizvod nije pronađen' })
    }

    res.json({ message: 'Proizvod je obrisan' })
  })
})

module.exports = router
