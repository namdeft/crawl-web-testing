const express = require('express')
const cors = require('cors')
const dotenv = require('dotenv')
const bodyParser = require('body-parser')
const axios = require('axios')
const cheerio = require('cheerio')

const url = 'https://myheroacademia.fandom.com/wiki/My_Hero_Academia_Wiki'
const characterUrl = 'https://myheroacademia.fandom.com/wiki/'

// Setup
const app = express()

app.use(cors())
app.use(bodyParser.json({ limit: '50mb' }))
app.use(
    bodyParser.urlencoded({
        limit: '50mb',
        extended: true,
        parameterLimit: 50000,
    })
)
dotenv.config()
const port = process.env.PORT

// Routes

// Get all character
app.get('/v1', (req, resp) => {
    const thumbnails = []
    const limit = Number(req.query.limit)

    try {
        axios(url).then((res) => {
            const html = res.data
            const $ = cheerio.load(html)
            $('.portal', html).each(function () {
                const name = $(this).find('a').attr('title')
                const url = $(this).find('a').attr('href')
                const img = $(this).find('a > img').attr('data-src')

                thumbnails.push({
                    name: name,
                    url: `http://localhost:${port}/v1` + url.split('/wiki')[1],
                    img: img,
                })
            })

            if (limit && limit > 0) {
                resp.status(200).json(thumbnails.slice(0, limit))
            } else {
                resp.status(200).json(thumbnails)
            }
        })
    } catch (err) {
        resp.status(500).json(err)
    }
})

// Get a character
app.get('/v1/:character', (req, resp) => {
    const url = characterUrl + req.params.character
    const titles = []
    const details = []
    const characterObj = {}
    const characters = []

    const galleries = []

    try {
        axios(url).then((res) => {
            const html = res.data
            const $ = cheerio.load(html)

            $('.wikia-gallery-item', html).each(function () {
                const gallery = $(this).find('a > img').attr('data-src')
                galleries.push(gallery)
            })

            $('aside', html).each(function () {
                const img = $(this).find('a > img').attr('src')

                $(this)
                    .find('section > div > h3')
                    .each(function () {
                        titles.push($(this).text())
                    })

                $(this)
                    .find('section > div > div')
                    .each(function () {
                        details.push($(this).text())
                    })

                if (img !== undefined) {
                    for (let i = 0; i < titles.length; i++) {
                        characterObj[titles[i].toLowerCase()] = details[i]
                    }

                    characters.push({
                        name: req.params.character.replace('_', ' '),
                        gallery: galleries,
                        image: img,
                        ...characterObj,
                    })
                }
            })
            resp.status(200).json(characters)
        })
    } catch (err) {
        resp.status(500).json(err)
    }
})

// Run port
app.listen(port, () => {
    console.log(`App is running on port: ${port}`)
})
