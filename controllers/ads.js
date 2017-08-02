const xyfirAds = require('xyfir-ads');

/*
  GET api/ad
  RETURN
    https://github.com/Xyfir/Ads/blob/master/ads.json
    XyfirAds[i].ad
*/
module.exports = async function(req, res) {

  const ads = await xyfirAds({ blacklist: ['xyButtons'] });

  if (!ads.length)
    res.json({});
  else
    res.json(ads[0].ad);

}