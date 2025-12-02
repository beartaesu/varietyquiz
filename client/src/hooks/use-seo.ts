import { useEffect } from 'react';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogUrl?: string;
  canonical?: string;
  jsonLd?: object;
}

export const useSEO = (seoData: SEOData) => {
  useEffect(() => {
    // Title 업데이트
    document.title = seoData.title;

    // Meta 태그들을 업데이트하는 함수
    const updateMetaTag = (name: string, content: string, isProperty = false) => {
      const attribute = isProperty ? 'property' : 'name';
      let tag = document.querySelector(`meta[${attribute}="${name}"]`) as HTMLMetaElement;
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attribute, name);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    // Link 태그 업데이트하는 함수
    const updateLinkTag = (rel: string, href: string) => {
      let link = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', rel);
        document.head.appendChild(link);
      }
      link.setAttribute('href', href);
    };

    // 기본 메타 태그 업데이트
    updateMetaTag('description', seoData.description);
    
    if (seoData.keywords) {
      updateMetaTag('keywords', seoData.keywords);
    }

    // Open Graph 태그 업데이트
    updateMetaTag('og:title', seoData.ogTitle || seoData.title, true);
    updateMetaTag('og:description', seoData.ogDescription || seoData.description, true);
    
    if (seoData.ogImage) {
      updateMetaTag('og:image', seoData.ogImage, true);
    }
    
    if (seoData.ogUrl) {
      updateMetaTag('og:url', seoData.ogUrl, true);
    }

    // Twitter Card 태그 업데이트
    updateMetaTag('twitter:title', seoData.ogTitle || seoData.title);
    updateMetaTag('twitter:description', seoData.ogDescription || seoData.description);

    // Canonical URL 업데이트
    if (seoData.canonical) {
      updateLinkTag('canonical', seoData.canonical);
    }

    // JSON-LD 구조화된 데이터 추가
    if (seoData.jsonLd) {
      // 기존 JSON-LD 태그 제거
      const existingJsonLd = document.querySelector('script[type="application/ld+json"]');
      if (existingJsonLd) {
        existingJsonLd.remove();
      }

      // 새 JSON-LD 태그 추가
      const jsonLdScript = document.createElement('script');
      jsonLdScript.type = 'application/ld+json';
      jsonLdScript.textContent = JSON.stringify(seoData.jsonLd);
      document.head.appendChild(jsonLdScript);
    }
  }, [seoData]);
};

// 카테고리별 JSON-LD 데이터 생성
const getCategoryJsonLd = (category: string, categoryName: string, description: string) => ({
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": `${categoryName} | 예능 퀴즈`,
  "description": description,
  "provider": {
    "@type": "Organization",
    "name": "예능 퀴즈",
    "url": "https://varietyquizquiz.com"
  },
  "url": `https://varietyquizquiz.com/quiz?category=${category}`,
  "inLanguage": "ko-KR",
  "educationalLevel": "beginner",
  "learningResourceType": "quiz",
  "teaches": categoryName,
  "isPartOf": {
    "@type": "WebSite",
    "name": "예능 퀴즈",
    "url": "https://varietyquizquiz.com"
  },
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "KRW",
    "availability": "https://schema.org/OnlineOnly"
  }
});

// 카테고리별 SEO 데이터 매핑
export const getCategorySEO = (category: string): SEOData => {
  const baseUrl = 'https://varietyquizquiz.com';
  const baseImage = `${baseUrl}/attached_assets/generated_images/Quiz_show_board_game_227373d9.png`;

  const seoMapping: Record<string, SEOData> = {
    person: {
      title: '인물퀴즈 - 한국 연예인 맞히기 | 예능 퀴즈',
      description: '256명의 한국 연예인 사진을 보고 이름을 맞혀보세요! K-POP 아이돌, 배우, 가수들의 퀴즈로 실력을 테스트해보세요.',
      keywords: 'K-POP퀴즈, 한국연예인퀴즈, 아이돌퀴즈, 배우퀴즈, 가수퀴즈, 연예인맞히기',
      ogTitle: '인물퀴즈 - 한국 연예인 맞히기',
      ogDescription: '256명의 한국 연예인 사진을 보고 이름을 맞혀보세요! K-POP 아이돌, 배우, 가수들의 퀴즈로 실력을 테스트해보세요.',
      ogImage: baseImage,
      ogUrl: `${baseUrl}/quiz?category=person`,
      canonical: `${baseUrl}/quiz?category=person`,
      jsonLd: getCategoryJsonLd('person', '인물퀴즈', '256명의 한국 연예인 사진을 보고 이름을 맞혀보세요! K-POP 아이돌, 배우, 가수들의 퀴즈로 실력을 테스트해보세요.')
    },
    capital: {
      title: '수도퀴즈 - 세계 각국의 수도 맞히기 | 예능 퀴즈',
      description: '세계 195개국의 수도를 맞혀보세요! 지리 지식을 테스트하고 전 세계 국가들의 수도를 학습할 수 있습니다.',
      keywords: '수도퀴즈, 지리퀴즈, 세계수도, 국가수도, 지리지식테스트',
      ogTitle: '수도퀴즈 - 세계 각국의 수도 맞히기',
      ogDescription: '세계 195개국의 수도를 맞혀보세요! 지리 지식을 테스트하고 전 세계 국가들의 수도를 학습할 수 있습니다.',
      ogImage: baseImage,
      ogUrl: `${baseUrl}/quiz?category=capital`,
      canonical: `${baseUrl}/quiz?category=capital`,
      jsonLd: getCategoryJsonLd('capital', '수도퀴즈', '세계 195개국의 수도를 맞혀보세요! 지리 지식을 테스트하고 전 세계 국가들의 수도를 학습할 수 있습니다.')
    },
    landmark: {
      title: '랜드마크퀴즈 - 유명한 랜드마크 맞히기 | 예능 퀴즈',
      description: '전 세계 유명한 랜드마크와 건축물을 맞혀보세요! 에펠탑, 타지마할, 만리장성 등 세계적인 명소들을 퀴즈로 만나보세요.',
      keywords: '랜드마크퀴즈, 세계명소, 유명건축물, 관광지퀴즈, 문화유산퀴즈',
      ogTitle: '랜드마크퀴즈 - 유명한 랜드마크 맞히기',
      ogDescription: '전 세계 유명한 랜드마크와 건축물을 맞혀보세요! 에펠탑, 타지마할, 만리장성 등 세계적인 명소들을 퀴즈로 만나보세요.',
      ogImage: baseImage,
      ogUrl: `${baseUrl}/quiz?category=landmark`,
      canonical: `${baseUrl}/quiz?category=landmark`,
      jsonLd: getCategoryJsonLd('landmark', '랜드마크퀴즈', '전 세계 유명한 랜드마크와 건축물을 맞혀보세요! 에펠탑, 타지마할, 만리장성 등 세계적인 명소들을 퀴즈로 만나보세요.')
    },
    idiom: {
      title: '사자성어 퀴즈 - 한국 전통 사자성어 | 예능 퀴즈',
      description: '한국의 전통 사자성어와 그 뜻을 맞혀보세요! 국어 실력 향상과 한자 학습에 도움이 되는 교육적인 퀴즈입니다.',
      keywords: '사자성어퀴즈, 한자퀴즈, 국어퀴즈, 사자성어공부, 한국전통문화',
      ogTitle: '사자성어 퀴즈 - 한국 전통 사자성어',
      ogDescription: '한국의 전통 사자성어와 그 뜻을 맞혀보세요! 국어 실력 향상과 한자 학습에 도움이 되는 교육적인 퀴즈입니다.',
      ogImage: baseImage,
      ogUrl: `${baseUrl}/quiz?category=idiom`,
      canonical: `${baseUrl}/quiz?category=idiom`,
      jsonLd: getCategoryJsonLd('idiom', '사자성어', '한국의 전통 사자성어와 그 뜻을 맞혀보세요! 국어 실력 향상과 한자 학습에 도움이 되는 교육적인 퀴즈입니다.')
    },
    proverb: {
      title: '속담 퀴즈 - 한국 전통 속담 | 예능 퀴즈',
      description: '한국의 전통 속담과 그 의미를 배워보세요! 우리나라 문화와 조상들의 지혜를 담은 속담 퀴즈로 국어 실력을 기를 수 있습니다.',
      keywords: '속담퀴즈, 한국속담, 전통문화퀴즈, 국어공부, 우리말퀴즈',
      ogTitle: '속담 퀴즈 - 한국 전통 속담',
      ogDescription: '한국의 전통 속담과 그 의미를 배워보세요! 우리나라 문화와 조상들의 지혜를 담은 속담 퀴즈로 국어 실력을 기를 수 있습니다.',
      ogImage: baseImage,
      ogUrl: `${baseUrl}/quiz?category=proverb`,
      canonical: `${baseUrl}/quiz?category=proverb`,
      jsonLd: getCategoryJsonLd('proverb', '속담', '한국의 전통 속담과 그 의미를 배워보세요! 우리나라 문화와 조상들의 지혜를 담은 속담 퀴즈로 국어 실력을 기를 수 있습니다.')
    }
  };

  return seoMapping[category] || {
    title: '예능 퀴즈 - 한국 연예인, 수도, 랜드마크 퀴즈 게임',
    description: '한국 연예인, 세계 수도, 유명 랜드마크, 사자성어, 속담 등 다양한 분야의 퀴즈 게임! 5-20문제까지 선택 가능하며 타이머 기능으로 실력을 테스트해보세요.',
    keywords: '퀴즈게임, 한국연예인퀴즈, 수도퀴즈, 랜드마크퀴즈, 사자성어, 속담, K-POP, 지식테스트, 온라인퀴즈',
    ogImage: baseImage,
    ogUrl: baseUrl,
    canonical: baseUrl
  };
};

// 홈페이지 JSON-LD 데이터
const getHomeJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "예능 퀴즈",
  "description": "한국 연예인, 세계 수도, 유명 랜드마크, 사자성어, 속담 등 다양한 분야의 퀴즈 게임! 5-20문제까지 선택 가능하며 타이머 기능으로 실력을 테스트해보세요.",
  "url": "https://varietyquizquiz.com",
  "inLanguage": "ko-KR",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://varietyquizquiz.com/quiz?category={search_term_string}",
    "query-input": "required name=search_term_string"
  },
  "publisher": {
    "@type": "Organization",
    "name": "예능 퀴즈",
    "url": "https://varietyquizquiz.com",
    "logo": {
      "@type": "ImageObject",
      "url": "https://varietyquizquiz.com/attached_assets/generated_images/Quiz_show_board_game_227373d9.png"
    }
  },
  "mainEntity": {
    "@type": "Game",
    "name": "예능 퀴즈 게임",
    "description": "다양한 분야의 온라인 퀴즈 게임",
    "genre": ["Educational", "Quiz", "Entertainment"],
    "gameItem": [
      {
        "@type": "Quiz",
        "name": "인물퀴즈",
        "url": "https://varietyquizquiz.com/quiz?category=person"
      },
      {
        "@type": "Quiz", 
        "name": "수도퀴즈",
        "url": "https://varietyquizquiz.com/quiz?category=capital"
      },
      {
        "@type": "Quiz",
        "name": "랜드마크퀴즈", 
        "url": "https://varietyquizquiz.com/quiz?category=landmark"
      },
      {
        "@type": "Quiz",
        "name": "사자성어",
        "url": "https://varietyquizquiz.com/quiz?category=idiom"
      },
      {
        "@type": "Quiz",
        "name": "속담",
        "url": "https://varietyquizquiz.com/quiz?category=proverb"
      }
    ]
  }
});

// 홈페이지 SEO 데이터
export const getHomeSEO = (): SEOData => ({
  title: '예능 퀴즈 - 한국 연예인, 수도, 랜드마크 퀴즈 게임',
  description: '한국 연예인, 세계 수도, 유명 랜드마크, 사자성어, 속담 등 다양한 분야의 퀴즈 게임! 5-20문제까지 선택 가능하며 타이머 기능으로 실력을 테스트해보세요.',
  keywords: '퀴즈게임, 한국연예인퀴즈, 수도퀴즈, 랜드마크퀴즈, 사자성어, 속담, K-POP, 지식테스트, 온라인퀴즈',
  ogTitle: '예능 퀴즈 - 한국 연예인, 수도, 랜드마크 퀴즈 게임',
  ogDescription: '한국 연예인, 세계 수도, 유명 랜드마크, 사자성어, 속담 등 다양한 분야의 퀴즈 게임! 5-20문제까지 선택 가능하며 타이머 기능으로 실력을 테스트해보세요.',
  ogImage: 'https://varietyquizquiz.com/attached_assets/generated_images/Quiz_show_board_game_227373d9.png',
  ogUrl: 'https://varietyquizquiz.com/',
  canonical: 'https://varietyquizquiz.com/',
  jsonLd: getHomeJsonLd()
});