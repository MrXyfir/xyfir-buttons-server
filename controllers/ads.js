const request = require('superagent');

const config = require('config');

/*
  GET api/ads
  OPTIONAL
    keywords: string
  RETURN
    { type: number, link: string, title: string, description: string }
*/
module.exports = async function(req, res) {

  try {
    const response = await request
      .get(config.addresses.xads)
      .query({
        pubid: 6, types: '1,2', count: 1, ip: req.ip,
        keywords: (req.body.keywords || '')
      });
    
    res.json(response.body.ads[0]);
  }
  catch (e) {
    console.log('e', e);
    res.json({});
  }

}