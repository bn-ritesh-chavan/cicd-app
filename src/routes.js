const express = require('express')

const router = express.Router()

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
})

router.get('/hello', (req,res) =>{
    res.json({message: "This app is for cicd purpose"})
})

router.get('/error', (req, res) => {
    res.json({message: "This is an error endpoint"})
})

module.exports = router
