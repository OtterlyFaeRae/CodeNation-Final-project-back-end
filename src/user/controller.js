const User = require('./model');
const jwt = require('jsonwebtoken');

exports.createUser = async(req, res) => {
    try {
        if(req.body.username && req.body.pass && req.body.email){
            const newUser = await User.create(req.body);
            const token = await jwt.sign({_id:newUser._id}, process.env.SECRET)
            res.status(200).send({
                msg: `new user created: ${newUser.username}.`, 
                user: {
                    username: newUser.username,
                    email: newUser.email,
                    cash: newUser.cash,
                    stocks: newUser.stocks,
                    history: newUser.history
                }, Token: token});
        } else {
            throw new Error('Missing information: Please include username, password & email address.')
        };
    } catch (error) {
        res.status(500).send({err: `Error at CreateUser: ${error}`})
    };
};

exports.login = async (req, res) => {
    try {
        const user = await User.findOne({username: req.user.username});
        const token = await jwt.sign({_id:user._id}, process.env.SECRET)
        res.status(200).send({
            msg: `You have logged in successfully. Welcome, ${user.username}.`, 
            user: {
                username: user.username,
                email: user.email,
                cash: user.cash,
                stocks: user.stocks,
                history: user.history
            }, Token: token});
    } catch (error) {
        res.status(500).send({err: `Error at login: ${error.message}`});
    };
};

exports.updateEmail = async (req, res) => {
    try {
        if(req.body.newEmail){
            await User.updateOne({username: req.user.username}, {email: req.body.newEmail} )
            res.status(200).send({msg: `User ${req.user.username} email updated.`, emailUpdated: true})
        } else {
            throw new Error('Missing New Email.')
        }
    } catch (error) {
        res.status(500).send({err: `Error at updateEmail: ${error.message}`});
    };
};

exports.updatePassword = async(req, res) => {
    try {
        if(req.body.newPass){
            await User.updateOne({username: req.user.username}, {pass: req.body.newPass});
            res.status(200).send({msg: `User ${req.user.username} password updated.`, passUpdated: true})
        } else {
            throw new Error('Missing New Password.')
        };
    } catch (error) {
        res.status(500).send({err: `Error at updatePass: ${error.message}`});
    };
};

exports.updateUsername = async(req, res) =>{
    try {
        if(req.body.newUsername){
            await User.updateOne({username: req.user.username}, {username: req.body.newUsername});
            res.status(200).send({msg: `User ${req.user.username} username updated.`, userUpdated: true})
        } else {
            throw new Error('Missing New Username')
        };
    } catch (error) {
        res.status(500).send({msg: `At updateUsername: ${error.message}`})
    };
};

exports.updateCash = async(req, res)=>{
    try {
        if(req.body.newCash){
            await User.updateOne({username: req.user.username}, {cash: req.body.newCash});
            res.status(200).send({msg: `User ${req.user.username} cash updated.`, cashUpdated: true, newCash: req.body.newCash});

        } else {
            throw new Error('Missing New Cash Value.')
        }
    } catch (error) {
        res.status(500).send({msg: `At updateCash: ${error.message}`})
    };
};

exports.deleteUser = async (req, res) => {
    try {
        await User.deleteOne({username: req.user.username})
        res.status(200).send({msg: `Delete successful: ${req.user.username}`, deleted: true})
    } catch (error) {
        res.status(500).send({err: `Error at deleteUser: ${error.message}`})
    };
};

exports.addStock = async (req, res) => {
    try {
        const user = req.user;
        if(req.body.addStock){
            if(req.body.addStock.name && req.body.addStock.symbol && req.body.addStock.number){
                if(typeof(req.body.addStock.number) != 'number'){
                    throw new Error('number value of addStock must be a Number.')
                }
                const stocks = req.user.stocks
                const newStock = req.body.addStock
                // 1. if the new stock is in stocks increase the quantity 
                if (stocks.some( x => x.name === req.body.addStock.name)) {
                    const userStocks = req.user.stocks
                    const userStock = userStocks.find( el => el.name === newStock.name )
                    userStock.number = userStock.number + newStock.number
                    let updatedStocks
                    if (userStock.number > 0) {
                        // a. if the quantity is greater than 0, update stocks                        
                        updatedStocks = userStocks.map( el => el.name === newStock.name ? userStock : el )
                    } else {
                        // b. otherwise remove the stock
                        updatedStocks = userStocks.filter( el => el !== userStock )
                    }                    
                    await User.updateOne({ username: req.user.username }, { stocks: updatedStocks })
                    user.stocks = updatedStocks;
                } else { 
                // 2. otherwise add the stock to stocks
                await User.updateOne({ username: req.user.username }, { $addToSet: { stocks : req.body.addStock } })
                user.stocks.push(req.body.addStock)
                }
                res.status(200).send({ 
                    msg: "Request processed.",
                    user: user
                });
            } else {
                throw new Error('Missing value/s: Need name, symbol & number.')
            }
        } else {
            throw new Error('Missing addStock value.')
        }
    } catch (error) {
        console.log(error);
        res.status(500).send({ err: `Error at AddStock: ${error.message}`});
    }
}

exports.addHistory = async(req, res)=> {
    try {
        if(req.body.entry){
            const entry = req.body.entry;
            if(!entry.symbol || !entry.number || !entry.value || !entry.buying){
                throw new Error('Missing Data.')
            }
            const history = req.user.history;
            console.log(history)
            const newEntry = {
                date: `${new Date().getDate()}/${new Date().getMonth()+1}`,
                stock: {
                    symbol: entry.symbol,
                    number: entry.number,
                    value: entry.value, // Price per unit
                    buying: entry.buying //If True: Buying. If False: selling.
                },
                totalCost: entry.value * entry.number
            }
            history.push(newEntry)
            await User.updateOne({username: req.user.username}, {$set: {history: history}})
            res.status(200).send({msg:`History entry successfully added.`, entry: newEntry })
        } else {
            throw new Error('Missing Entry.')
        }
    } catch (error) {
        res.status(500).send({err: `Error at addHistory: ${error.message}`})
        console.log(error)
    }
}