const express = require("express");
const bodyParser = require('body-parser')
const morgan = require('morgan')
const cors = require('cors')
const app = express();

app.use(express.static("public"));
app.use(morgan('combined'));
app.use(bodyParser.raw({type:"*/*"}))
app.use(cors())

//OBJECTS/MAPS/ARRAYS START
//OBJECTS/MAPS/ARRAYS START
//OBJECTS/MAPS/ARRAYS START
let users = new Map() // set(username, password)
let userSession = new Map() //set(token, username)
let itemsListing = new Map() // set(token->itemId, item)
let userC = new Map() //set(token, [items])
let userPurchase = new Map() //set(token, [item]) array from userC
let userChat = new Map() //set(token, [{destination : username, [{ 'message object'}]}])
let sellerList = new Map() //set (token -> seller, [items->info])
let cart = [] //Array of objects -> itemsListing.get(itemid)
let arrList = [] //track logins, sell, checkout
//OBJECTS/MAPS/ARRAYS END
//OBJECTS/MAPS/ARRAYS END
//OBJECTS/MAPS/ARRAYS END

//FUNCTION START
//FUNCTION START
//FUNCTION START
let settingHeader = obj => obj.setHeader('Content-Type', 'application/json')
let setToken = () => (100000 + Math.floor(Math.random() * 900000)).toString() 
let idListing = () => Math.random().toString(36).slice(2)
let token = undefined

//FUNCTION END
//FUNCTION END
//FUNCTION END


app.get("/sourcecode", (req, res) => {
res.send(require('fs').readFileSync(__filename).toString())
})

app.get("/", (request, response) => {
    res.send('HELLO world')
//   response.sendFile(__dirname + "/views/index.html");
});

app.post('/signup', (req, res)=>{
  let bodyParse = JSON.parse(req.body), username = bodyParse.username, password = bodyParse.password
  if(username !== undefined && username !== ''){
    if(password !== undefined && password !== ''){
      if(!users.has(username)){
        users.set(username, password)
        res.send(JSON.stringify({'success': true}))
      } else res.send(JSON.stringify({'success':false, 'reason':'Username exists'}))
    } else res.send(JSON.stringify({'success':false, 'reason':'password field missing'}))
  } else res.send(JSON.stringify({'success': false, 'reason': 'username field missing'}))
})

app.post('/login', (req, res)=>{
  let bodyParse = JSON.parse(req.body), username = bodyParse.username, password = bodyParse.password
  token = setToken()
  if(users.has(username)){
    if(password !== users.get(username) && password !== undefined) res.send(JSON.stringify({'success': false, 'reason':'Invalid password'}))
    else if(password === undefined) res.send(JSON.stringify({'success':false,'reason':'password field missing'}))
    else{
      userSession.set(token, username)
      res.send(JSON.stringify({'success':true, 'token': token}))
    }
  } 
  else if(username === undefined) res.send(JSON.stringify({'success':false, 'reason':'username field missing'}))
  else res.send(JSON.stringify({'success':false, 'reason':'User does not exist'}))
})


app.post('/change-password',(req, res)=>{
  let bodyParse = JSON.parse(req.body), oldPwd = bodyParse.oldPassword, newPwd = bodyParse.newPassword
  let header = req.headers['token']
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let u = userSession.get(header)
      if(oldPwd === users.get(u)){
        users.set(u, newPwd)
        res.send(JSON.stringify({'success':true}))
      } else  res.send(JSON.stringify({'success':false, 'reason': 'Unable to authenticate'})) 
    } else res.send(JSON.stringify({'success':false, 'reason':'Invalid token'}))
  } else res.send(JSON.stringify({'success': false,'reason':'token field missing'}))
})



app.post('/create-listing',(req,res)=>{
  const bodyParse = JSON.parse(req.body), price = bodyParse.price, desc=bodyParse.description
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let header = req.headers['token']
      if(price !== undefined){
        if(desc !== undefined) {
          let itemList = idListing()
          let item  = { "price": price, "description": desc, "itemId": itemList,  'sellerUsername': userSession.get(header)}
          itemsListing.set(itemList, item)
          res.send(JSON.stringify({'success': true, 'listingId': itemList }))
        } else res.send(JSON.stringify({'success': false,'reason':'description field missing'}))
      } else res.send(JSON.stringify({'success': false, 'reason':'price field missing'}))
    } else res.send(JSON.stringify({'success': false,'reason': 'Invalid token'}))
  } else res.send(JSON.stringify({'success': false,'reason':'token field missing'}))

})

app.get('/listing',(req, res)=>{
  const getItemId = req.query.listingId
  if(itemsListing.has(getItemId)) res.send(JSON.stringify({'success':true,'listing': itemsListing.get(getItemId)}))
  else res.send(JSON.stringify({'success':false, 'reason':'Invalid listing id'}))
})

app.post('/modify-listing',(req,res)=>{
  let bodyParse = JSON.parse(req.body), itemId = bodyParse.itemid, desc = bodyParse.description, price = bodyParse.price
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let header = req.headers['token']
      if(itemId !== undefined){
        let item = itemsListing.get(itemId)
        item.description = desc !== undefined ? desc : item.description
        item.price = price !== undefined ? price : item.price
        itemsListing.set(itemId, item)
        res.send(JSON.stringify({'success':true}))
      } else res.send(JSON.stringify({'success':false, 'reason': 'itemid field missing'}))
    } else res.send(JSON.stringify({'success': false,'reason': 'Invalid token'}))
  } else res.send(JSON.stringify({'success': false,'reason':'token field missing'}))
  
})


app.post('/add-to-cart',(req, res)=>{
  let bodyParse = JSON.parse(req.body), itemId = bodyParse.itemid
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let header = req.headers['token']
      if(itemId !== undefined){
        if(itemsListing.has(itemId)){
          let item = itemsListing.get(itemId)
          if(userC.get(userSession.get(req.headers['token'])) === undefined) {
            userC.set(userSession.get(req.headers['token']), [])
            userC.get(userSession.get(req.headers['token'])).push(item)
            res.send(JSON.stringify({'success':true}))
          }
          else {
              let cart2 = userC.get(userSession.get(header))
              cart2.push(item)
              userC.set(userSession.get(header), cart2)
            res.send(JSON.stringify({'success':true}))
          }
          
        } else res.send(JSON.stringify({'success': false, 'reason':'Item not found'}))
      } else res.send(JSON.stringify({'success':false, 'reason':'itemid field missing'}))
    } else res.send(JSON.stringify({'success': false,'reason':'Invalid token'}))
  } else res.send(JSON.stringify({'success': false, 'reason':'token field missing'}))
  
})

app.get('/cart',(req, res)=>{
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let header = req.headers['token']
      res.send(JSON.stringify({'success':true, 'cart': userC.get(userSession.get(header))}))
    } else res.send(JSON.stringify({'success': false,'reason': 'Invalid token'}))
  } else res.send(JSON.stringify({'success': false,'reason':'token field missing'}))
  
})

app.post('/checkout',(req, res)=>{
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let header = req.headers['token']
      if(userC.get(userSession.get(header)) !== undefined){
        let thiscart = userC.get(userSession.get(header)) //array of objects
        let arrbuyer = []
        for(const index of thiscart){
          if(sellerList.get(index.sellerUsername) === undefined){
            sellerList.set(index.sellerUsername, [])
          } else continue
        }
        for(const i of thiscart){
          const {itemId, price, description: desc, } = i
          let buyer = {buyer : userSession.get(header), item: itemId, price, description: desc, shipped:false}
          sellerList.get(i.sellerUsername).push(buyer)
        }
        

        userPurchase.set(userSession.get(header), [])
        for(let i =0;i<thiscart.length;i++){
          let currentItem = thiscart[i]
          let itemId = currentItem.itemId
          if(itemsListing.has(itemId)){
            currentItem.ship = false            
            userPurchase.get(userSession.get(header)).push(currentItem)
            itemsListing.delete(itemId)
            // break;
          } else  res.send(JSON.stringify({'success': false, 'reason':'Item in cart no longer available'}))
        } 
        res.send(JSON.stringify({'success':true}))
      } else res.send(JSON.stringify({'success':false,'reason':'Empty cart'}))
    } else res.send(JSON.stringify({'success': false, 'reason':'Invalid token'}))
  } else res.send(JSON.stringify({'success': false, 'reason':'token field missing'}))
  
})


app.get('/purchase-history',(req, res)=>{
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let header = req.headers['token'], arrP = []
      let arr= userPurchase.get(userSession.get(header))
      for(const i of arr){
        let {price, description: description, itemId: itemId, sellerUsername: sellerUsername} = i
        let p = {price, description, itemId, sellerUsername}
        arrP.push(p)
      }   
      res.send(JSON.stringify({'success':true,'purchased': arrP}))
    } else res.send(JSON.stringify({'success': false,'reason': 'Invalid token'}))
  } else res.send(JSON.stringify({'success': false,'reason':'token field missing'}))
  
})

app.post('/chat',(req, res)=>{
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let destination = JSON.parse(req.body).destination, content = JSON.parse(req.body).contents
      let header = req.headers['token']
      if(destination !== undefined){
        let sentToArr = users.keys()
        if(content !== undefined){
          let u = userSession.get(header), msgTo = {from:u,destination: destination, contents : content},chat = undefined
          if(!users.has(destination)){
            res.send(JSON.stringify({'success': false, 'reason':'Destination user does not exist'}))
          } else{
            if(userChat.get(u) === undefined){
              chat = {destination : destination, chat : [msgTo]}
              userChat.set(u, [])
              userChat.get(u).push(chat)
              res.send(JSON.stringify({'success': true}))
            }
            else{
              let ch = userChat.get(u)
              ch.forEach((i)=>{
                const des = i.destination
                if(des === destination){
                  i.chat.push(msgTo)
                  res.send(JSON.stringify({'success': true}))
                }
              })
            }
          }          
        } else res.send(JSON.stringify({'success':false, 'reason': 'contents field missing'}))
      } else res.send(JSON.stringify({'success': false, 'reason': 'destination field missing'}))
    } else res.send(JSON.stringify({'success': false, 'reason': 'Invalid token'}))
  } else res.send(JSON.stringify({'success': false,'reason':'token field missing'}))
})


app.post('/chat-messages',(req, res)=>{
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let bodyParse = JSON.parse(req.body), destination = bodyParse.destination
      let header = req.headers['token']
      if(destination !== undefined){
        let sendToArr = users.keys(), sendTo = undefined, u = userSession.get(header)
        if(!users.has(destination)) res.send(JSON.stringify({'success': false, 'reason':'Destination user not found'}))
        else{
          let chats = userChat.get(u), arr= undefined, chats2 = userChat.get(destination), arr3 = undefined
          for(const i of chats2){
            let from = i.destination
            if(from === u){
              arr3 = i.chat
              break;
            }
          }
          for(const index of chats){
            let i = index.destination
            if(i === destination){
              arr = index.chat
              break;
            }
          }
          let arr2 = []
          for(let i =0;i< arr.length;i++){
            let reform = {from : arr[i].from, contents: arr[i].contents}
            let reform2 = {from : arr3[i].from, contents: arr3[i].contents}
            arr2.push(reform, reform2)
          }
          res.send(JSON.stringify({'success':true, 'messages': arr2}))
        }
        
      } else res.send(JSON.stringify({'success': false, 'reason':'destination field missing'}))
    } else res.send(JSON.stringify({'success': false,'reason': 'Invalid token'}))
  } else res.send(JSON.stringify({'success': false,'reason':'token field missing'}))
  
})

app.post('/ship', (req, res)=>{
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let itemid = JSON.parse(req.body).itemid, header = req.headers['token'], u = userSession.get(header)
      let items = userPurchase.get(u) //array of objects
      let c = [...userPurchase.values()], item //array of objects

      let i = sellerList.get(u)
      if(!itemsListing.has(itemid)){
        for(const index of i){
          if(index.item === itemid){
            if(index.shipped !== true) {
              index.shipped = true
              res.send(JSON.stringify({'success': true})) 
            }
            else res.send(JSON.stringify({'success': false, 'reason':'Item has already shipped'}))
            // break;
          } else res.send(JSON.stringify({'success': false, 'reason': 'User is not selling that item'}))
        }
        // res.send(JSON.stringify({'success': true}))
      } else res.send(JSON.stringify({'success': false, 'reason':'Item was not sold'}))
      
    } else res.send(JSON.stringify({'success': false, 'reason': 'Invalid token'}))
  } else res.send(JSON.stringify({'success': false,'reason': 'token field missing'}))
})


app.get('/status', (req, res)=>{
  let itemid = req.query.itemid, c = [...sellerList.values()] //array of arrays of objects
  let arr = [], r = false
  for(let index of c){
    for(let i of index)
      arr.push(i) 
  }
  
  if(!itemsListing.has(itemid)){
    for(const val of arr){
      if(val.item === itemid && val.shipped === true){
        r = true
        break
      }
    }
    if(r) res.send(JSON.stringify({'success': true, 'status': 'shipped'}))
    else res.send(JSON.stringify({'success': true, 'status': 'not-shipped'}))
  } else res.send(JSON.stringify({'success': false, 'reason':'Item not sold'}))
})

app.post('/review-seller',(req, res)=>{
  if(req.headers['token'] !== undefined){
    if(userSession.has(req.headers['token'])){
      let bodyParse = JSON.parse(req.body), numStars = bodyParse.numStars, comment = bodyParse.contents, itemid = bodyParse.itemid
      let header = req.headers['token'],  u = userSession.get(header)
      let c = [...sellerList.values()], arr =[], check = false, item
      for(let index of c){
        for(let i of index)
          arr.push(i) 
      }
      if(!itemsListing.has(itemid)){
        for(const val of arr){
          if(val.item === itemid) {
            item = val
            break;
          }
        }
        // console.log(item)
        // console.log('review' in item)
        // console.log(item.hasOwnProperty('review'))
        if(item.review === undefined){
          item.review = {from: u, numStars: numStars, contents : comment }
          res.send(JSON.stringify({'success':true}))
        } else res.send(JSON.stringify({'success':false, 'reason':'This transaction was already reviewed'}))
      } else res.send(JSON.stringify({'success': false, 'reason': 'User has not purchased this item'}))
    } else res.send(JSON.stringify({'success': false, 'reason': 'Invalid token'}))
  } else res.send(JSON.stringify({'success': false,'reason': 'token field missing'}))
})

app.get('/reviews', (req, res)=>{
  let user = req.query.sellerUsername, list = sellerList.get(user), arr = []
  list.forEach((i)=>{
    if(i.hasOwnProperty('review')){
      arr.push(i.review)
    }
  })
  res.send(JSON.stringify({'success': true,'reviews': arr}))
})


app.get('/selling', (req, res)=>{
  let seller = req.query.sellerUsername
  
  if(seller !== undefined){
    let arr = [], sellList =  [...itemsListing.values()]
    for(const items of sellList){
      if(items.sellerUsername === seller)  arr.push(items)
    }
    res.send(JSON.stringify({'success':true,'selling': arr}))
  } else res.send(JSON.stringify({'success':false, 'reason': 'sellerUsername field missing'}))
})



const listener = app.listen(process.env.PORT, () => {
  console.log("Your app is listening on port " + listener.address().port);
});













