import { useEffect } from 'react';

interface AdSenseProps {
  adSlot: string;
  adFormat?: 'auto' | 'fluid' | 'rectangle' | 'vertical' | 'horizontal';
  fullWidthResponsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdSenseDisplay({ 
  adSlot, 
  adFormat = 'auto', 
  fullWidthResponsive = true,
  className = '',
  style = {}
}: AdSenseProps) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        // AdSense 스크립트 로드 (아직 로드되지 않은 경우)
        if (!document.querySelector('script[src*="adsbygoogle"]')) {
          const script = document.createElement('script');
          script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3331440442821633';
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }

        // 광고 푸시
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', ...style }}
      data-ad-client="ca-pub-3331440442821633"
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive ? 'true' : 'false'}
    />
  );
}

export function AdSenseSidebar({ 
  adSlot,
  className = ''
}: { adSlot: string; className?: string }) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        if (!document.querySelector('script[src*="adsbygoogle"]')) {
          const script = document.createElement('script');
          script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3331440442821633';
          script.async = true;
          script.crossOrigin = 'anonymous';
          document.head.appendChild(script);
        }
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.error('AdSense error:', err);
    }
  }, []);

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block' }}
      data-ad-client="ca-pub-3331440442821633"
      data-ad-slot={adSlot}
      data-ad-format="vertical"
    />
  );
}
