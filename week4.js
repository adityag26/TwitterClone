const express = require('express')
const bodyParser = require('body-parser')
const translate = require('translate')

const languages = [
    "es","fr","ar","zh","de","it","pt","ru"
]


const app = express()
app.use(bodyParser.urlencoded({extended: true}))
app.use(bodyParser.json())
app.use(bodyParser.raw())



class UUID{
    constructor(){
        this.id = 0
        return () => this.increment()
    }

    increment(){
        return String(this.id++)
    }
}
const uuid = new UUID()
let tweets = []


app.post('/tweets', (req,res) => {
    const { message, handle, parentId } = req.body
    
    if([message, handle].includes(undefined)){
        res.status(400).send('Error: message and handle required .')
        return
    }
    
    if(message.length < 2 || message.length > 280){
        res.status(400).send('Error: tweet should be 2 to 280 characters.')
        return
    }

    const parent = tweets.find(t => t.id === parentId)
    if(parentId !== undefined && parent === undefined){
        res.status(404).send('Error: no parent tweet with that id.')
    }
    const tweet = { 
        message,
        handle,
        parentId,
        createdAt: new Date(),
        updatedAt: new Date(),
        id: uuid(),
        likes: 0,
        replies: 0
    }
    tweets.unshift(tweet)
    res.send('Created new tweet')
})


app.get('/tweets', async (req,res) => {
    const { language } = req.query
    const filteredTweets = tweets //.filter(t => t.parentId === undefined)

    if(language === undefined || language === 'en'){
        res.send(filteredTweets)
        return
    }
    if(!languages.includes(language)){
        res.status(400).send(`Error: can't use language ${language}`)
    }
    const translated = await Promise.all(
        filteredTweets.map(t => {
            return translate(t.message, {
                from: 'en',
                to: language,
                engine: 'libre'
            })
    
        })
    )
    
    const output = translated.map((msg,index) => {
        return {
            ...filteredTweets[index],
            message: msg,
        }
    })

    res.send(output)
})

app.get('/profile/:handle', (req,res) => {
    const { handle } = req.params
    res.send(tweets.filter(t => t.handle === handle))
})

app.delete('/tweets/:id', (req, res) => {
    const { id  } = req.params

    const tweet = tweets.find(t => t.id === id)
    if(tweet === undefined){
        res.status(404).send('Error: no tweet with that id')
        return
    }

    tweets = tweets.filter(t => t.id !== id)

    res.send(`Deleted tweet by ${tweet.handle}.`)
})


app.post('/tweets/:id', (req,res) => {
    const { id  } = req.params

    const tweet = tweets.find(t => t.id === id)
    if(tweet === undefined){
        res.status(404).send('Error: no tweet with that id')
        return
    }

    tweet.likes++


    res.send(`Liked tweet by ${tweet.handle}.`)
})

app.get('/tweets/:id/replies', (req,res) => {
    const { id } = req.params
    
    const tweet = tweets.find(t => t.id === id)

    if(tweet === undefined){
        res.status(404).send("Error no tweet with this id")
        return
    }
    res.send(`${tweet.likes}`)
})

app.get('/tweets/:id', (req,res) => {
    const { id } = req.params
    const arry1 = tweets.filter(t => t.id === undefined)
    const arry2 = tweets.filter(t => t.id === id)
    const out = arry1.concat(arry2)
    

    if(out === undefined){
        res.status(404).send("Error no tweets with this id")
        return
    }
    res.send(out)

})
app.listen(3000, () => {
console.log('Listening on http://localhost:3000')
})