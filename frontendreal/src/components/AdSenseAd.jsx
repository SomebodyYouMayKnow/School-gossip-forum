import React, { useEffect } from 'react';

const AdSenseAd = ({ adSlot, format = 'auto', layout = '', style = { display: 'block' } }) => {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (err) {
      console.error('Failed to load ad:', err);
    }
  }, []);

  return (
    <div className="ad-container" style={{ ...style, margin: '20px 0' }}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client="ca-pub-YOUR_PUBLISHER_ID"
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdSenseAd;
