import express from 'express';
const router = express.Router();

// Health check / root route
router.get('/', (req, res) =>{

    res.json({ message: 'API is running on Render.com for the second time' });

    

});



export default router;
