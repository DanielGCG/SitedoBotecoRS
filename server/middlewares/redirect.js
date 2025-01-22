module.exports = (req, res, next) => {
    if (req.headers.host === 'boteco.live') {
      return res.redirect(301, `https://www.boteco.live${req.url}`);
    }
    next();
  };  