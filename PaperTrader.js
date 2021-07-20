const express = require("express")
const bodyParser = require("body-parser")
const bcrypt = require("bcrypt")
const { v4 : uuid} = require("uuid")


const SALT_ROUNDS = 10
const JWT_SECRET = 'shhhhhh'


const users = []


const app = express()
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(bodyParser.raw())


/**
 * Remove sensitive user info
 */
function redactUserInfo(user) {
    user = {...user}
    delete user.hashedPassword
    delete user.passwordUpdatedAt
    return user
}

/**
 * Authenticate user using username and password or token. Returns boolean or new auth token.
 *
 * Returns: user+newToken, user, false (auth failed)
 */
async function authUser({username, password, token }) {
    // token auth
  if(token){
    try{
      const {id: userId , passwordUpdatedAt} = jwt.verify(token, JWT_SECRET)
      const user = users.find(u=> {
        return u.id === userId && u.passwordUpdatedAt === passwordUpdatedAt
      })
      if(!user){
        return false
      }
      return redactUserInfo(user)
    } catch(e) {
      console.log(e)
      return false
    }
  
  }
      
  
    // check that password hasn't changed since token was created
  
    // password auth
    const user = users.find(u => u.username === username)
      if(!user){
          return false
      }
    
  
      const passwordMatches = await bcrypt.compare(password, user.hashedPassword)
      if(!passwordMatches){
          
          return false
      }
  }

/**
 * Signup using username and password
 */
app.post('/signup', async (req,res) => {
    // get username and password from body
      const { username, password } = req.body
  
    // check if user exsists
  const userConflict = users.find(u => u.username === username)
  if(userConflict !== undefined){
    res.status(400).send({
      error: `Username "${username}" is taken`
    })
    return
  }
    // create and save user
  const user = {
    id: uuid(),
    username
  }
  await updateUserPassword(user,password)
  users.push(user)
    // return auth token
    res.send(redactUserInfo(user))
  })
  
  /**
   * Authenticate using username and password then return auth token
   */
  app.post('/login', authMiddleware,  (req, res) => {
     
      res.send({
          user: req.user
      })
    
    
      // return auth token
  })
  
  /**
   * Example authenticated endpoint
   */
  app.get('/auth', authMiddleware, (req,res) => {
    // return user used for auth
    res.send({
        test: 'test'
    })
  })
  
  /**
   * Change user password. 
   */
  app.post('/change-password', authMiddleware, async (req,res) => {
    const {newPassword } = req.body
    const user = users.find(u => u.id === req.user.id)
  
    
  
    // update password
    await updateUserPassword(user, newPassword)
    const newToken = getAuthToken(user)
  
    
  })
  
  /**
   * Dump all users in the database 
   */
  app.get('/dump', (req,res) => {
    res.send({
      users
    })
  })
  
  
  
  
  app.listen(3000, () => {
    console.log('App listening at http://localhost:3000')
  })