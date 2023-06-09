const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const firebaseAdmin = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');
const firebaseSecretConfig = require('./firebase-secret-config.json');

require('dotenv').config({ path: "./.env"});

const app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const { Activity } = require("./models/Activitity");
const { Goal } = require("./models/Goal");
const { User } = require("./models/User")

firebaseAdmin.initializeApp({
    credential: firebaseAdmin.cert(firebaseSecretConfig)
})

app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "POST, GET, PUT, DELETE");
    res.setHeader("Access-Control-Allow-Headers", "*");
    next();
})

// Verication Token.
const appCheckVerification = async (req, res, next) => {
    const appAccessToken = req.header('x-access-token');
    if (!appAccessToken) {
        res.status(401);
        return next('Unauthorized');
    }
    try {
        const decoded = await getAuth()
            .verifyIdToken(appAccessToken)
            .then((decodedToken) => {
                console.log('decodedToken', decodedToken)
                return decodedToken;
            });
        console.log('decoded', decoded)
        req.header['x-user-id'] = decoded.user_id
        req.header['x-user-email'] = decoded.email
        return next();
    } catch (err) {
        console.log('err', err)
        res.status(401);
        return next('Unauthorized..');
    }
}

// POST (Create) - Create a new activity.
app.post('/api/activity', [appCheckVerification], async (req, res) => {
    const userId = req.header['x-user-id']; 
    console.log('userId', userId);
    
    const { activityType, title, dateTime, duration, energyBurn, distance,description } = req.body;
    try {
        const newActivity = new Activity({
            activityType: activityType,
            title: title,
            dateTime: dateTime,
            duration: duration,
            energyBurn: energyBurn,
            distance: distance,
            description: description,
            userId:userId,
        });
        const savedActivity = await newActivity.save();
        console.log('savedActivity: ', savedActivity)
        return res.status(201).json(savedActivity);
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
});

// GET - Get all activity by id
app.get("/api/activity", [appCheckVerification], async (req, res) => {
    const userId = req.header['x-user-id']; 
    console.log('userId', userId);
    
    const data = await Activity.find({
        userId
    });
    return res.status(200).json({
        data
    });
});


// PUT (EDIT/UPDATE) - Activity by id
app.put("/api/activity/:id", [appCheckVerification], async (req, res) => {
    const userId = req.header['x-user-id']; 
    const activityId = req.params.id;

    console.log('userId', userId);
    
    const { activityType, title, dateTime, duration, energyBurn, distance,description } = req.body;
    try {
        const updatedActivity = await Activity.findOneAndUpdate(
            { _id: activityId, userId: userId },
            {
                activityType: activityType,
                title: title,
                dateTime: dateTime,
                duration: duration,
                energyBurn: energyBurn,
                distance: distance,
                description: description,
            },
            { new: true }
        );

        if (!updatedActivity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        console.log('updatedActivity: ', updatedActivity);
        return res.status(200).json(updatedActivity);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
});

// DELETE - Activity by id
app.delete('/api/activity/:id',[appCheckVerification], async (req, res) => {
    const userId = req.header['x-user-id']; 
    const activityId = req.params.id;

    console.log('userId', userId);
    
    const { activityType, title, dateTime, duration, energyBurn, distance,description } = req.body;
    try {
        const deleteActivity = await Activity.findOneAndDelete(
            { _id: activityId, userId: userId },
            {
                activityType: activityType,
                title: title,
                dateTime: dateTime,
                duration: duration,
                energyBurn: energyBurn,
                distance: distance,
                description: description,
            },
            { new: true }
        );

        if (!deleteActivity) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        console.log('deleteActivity: ', deleteActivity);
        return res.status(200).json(deleteActivity);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
})

// POST (Create) - Create a new goal.
app.post('/api/goal',[appCheckVerification], async (req, res) => {
    const userId = req.header['x-user-id']; 
    console.log('userId', userId);
    
    const { activityType, deadline, energyBurn, duration, distance, status } = req.body;
    try {
        const newGoal = new Goal({
            userId : userId,
            activityType: activityType,
            deadline: deadline,
            energyBurn: energyBurn,
            duration: duration,
            distance: distance,
            status: status,
        });
        const savedGoal = await newGoal.save();
        console.log('savedGoal: ', savedGoal)
        return res.status(201).json(savedGoal);
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
});


// GET - get all goal
app.get("/api/goal",[appCheckVerification], async (req, res) => {
    const userId = req.header['x-user-id']; 
    console.log('userId', userId);
    
    const data = await Goal.find({
        userId
    }); 
        return res.status(200).json({
        data
    });
});

app.put("/api/goal/:id",[appCheckVerification], async (req, res) => {
    const userId = req.header['x-user-id']; 
    const goalId = req.params.id;
    
    const { status } = req.body;
    try {
        const updateStatus = await Goal.findOneAndUpdate(
            { _id: goalId, userId: userId },
            {
                status: status
            },
            { new: true }
        );

        if (!updateStatus) {
            return res.status(404).json({ message: 'Activity not found' });
        }

        return res.status(200).json(updateStatus);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
})

app.delete("/api/goal/:id", [appCheckVerification], async (req, res) => {
    const userId = req.header['x-user-id']; 
    const goalId = req.params.id;

    console.log('userId', userId);
    
    const { activityType, deadline, duration, energyBurn, distance, status } = req.body;
    try {
        const deleteGoal = await Goal.findOneAndDelete(
            { _id: goalId, userId: userId },
            {
                userId : userId,
                activityType: activityType,
                deadline: deadline,
                energyBurn: energyBurn,
                duration: duration,
                distance: distance,
                status: status,
            },
            { new: true }
        );

        if (!deleteGoal) {
            return res.status(404).json({ message: 'Goal not found' });
        }

        console.log('deleteGoal: ', deleteGoal);
        return res.status(200).json(deleteGoal);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
})

app.get("/api/user", [appCheckVerification], async (req, res) => {
    const userId = req.header['x-user-id']

    const data = await User.find({
        userId
    });
    return res.status(200).json({
        data
    })
});

app.post("/api/user", [appCheckVerification], async (req, res) => {
    const userId = req.header['x-user-id']; 
    console.log('userId', userId);
    
    const { name, gender, age, height, weight } = req.body;
    try {
        const obj = {
            userId : userId,
            name: name,
            gender: gender,
            age: age,
            height: height,
            weight: weight,
        }
        // const newUser = new User({
        //     userId : userId,
        //     name: name,
        //     gender: gender,
        //     age: age,
        //     height: height,
        //     weight: weight,
        // });
        // const savedUser = await newUser.save();

        // await newUser.update({userId: userId}, obj, {upsert: true, setDefaultsOnInsert: true});
        const savedUser = await User.findOneAndUpdate(
            { userId: userId },
            obj,
            { new: true, upsert: true }
        );

        console.log('savedUser: ', savedUser)
        return res.status(201).json(savedUser);
    } catch (error) {
        return res.status(404).json({ message: error.message });
    }
})


// Express and MongoDB Connection.
const start = async () => {
    try {
        const { DB_HOST, DB_USERNAME, DB_PASSWORD } = process.env
        await mongoose.connect(`mongodb+srv://${DB_USERNAME}:${DB_PASSWORD}@${DB_HOST}/?retryWrites=true&w=majority`)
        const port = process.env.PORT || 8080;
        app.listen(port, () => {
            console.log(`Server is running on port ${port}.`);
        });
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
};
  
start();