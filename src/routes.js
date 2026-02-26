const express = require('express')

const router = express.Router()

router.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK' });
})

router.get('/hello', (req,res) =>{
    res.json({message: "This app is for cicd purpose"})
})

module.exports = router