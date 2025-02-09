const authenticate = (req, res, next) => {
    const secret_key =  req.headers['secret-key'];

    if(secret_key !== process.env.MY_SECRET_KEY){
        return res.status(401).json({error : ' Unauthorized'});
    }

    next();
}

module.exports = authenticate;
