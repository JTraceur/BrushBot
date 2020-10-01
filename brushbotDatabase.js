//Imports:
const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

class userObj {
    constructor(id, points, level=0){
        this.id = id;
        this.points = points;
        this.level = level;
    }
}

class messageObj {
    constructor(messageID, authorID, points=0){
        this.messageID = messageID;
        this.authorID = authorID;
        this.points = points;
    }
}

//#region Database setup:
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const users = db.collection('users');
//#endregion

function trackMessage(message) {

    return new Promise(async (resolve) => {
        user = message.author;

        //Add weblistener to message in discord


        //Create message
        msg = JSON.parse(
            JSON.stringify(
                new messageObj(message.id, user.id, 0)));
    
        //Check if user id exists in database:
        userExists = await users.where('id', '==', user.id).get();
        //If doesn't exist:
        if (userExists.empty){
    
            //Create user in db and add msg to it:
            newUser = await users.add(
                JSON.parse(
                    JSON.stringify(
                        new userObj(user.id, 0))));
            await newUser.collection('messages').add(msg);
        }
        //If does exist:
        else{
    
            //Update user's messages:
            _user = userExists.docs[0].ref;
            await _user.collection('messages').add(msg);
        }
        resolve();
    })
}

function addPoints(message, points){

    return new Promise(async (resolve, reject) => {

        //Do a search in database for user:
        user = await users.where('id', '==', message.authorID).get();

        if (user.empty) reject("Could not find user, yet they should already exist.")
        else{
            user = user.docs[0].ref;
            await user.update({points: admin.firestore.FieldValue.increment(points)}) //Increment value by points;
            userData = await user.get();
            userData = await userData.data();
            resolve(userData); // Return the amount of points
        }
    });
}

function updateLevel(user, level){

    return new Promise(async (resolve, reject) => {

        //Search for user:
        userSearch = await users.where('id', '==', user.id).get();
        if (userSearch.empty) reject("Could not find user, yet they should already exist.")
        else{
            _user = userSearch.docs[0].ref;
            await _user.update({level: level}); // Update level
            resolve();
        }
    });
}

exports.userObj = userObj;
exports.messageObj = messageObj;
exports.trackMessage = trackMessage;
exports.addPoints = addPoints;
exports.updateLevel = updateLevel;