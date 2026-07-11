import { Stock, NewsItem } from '../types';

export const INITIAL_STOCKS: Stock[] = [
  {
    id: 'titan-tech',
    name: '타이탄 테크',
    ticker: 'TITE',
    price: 150000,
    prevPrice: 150000,
    history: Array.from({ length: 20 }, (_, i) => 140000 + Math.sin(i / 2) * 5000 + i * 500),
    volatility: 0.015, // 1.5% max random change per tick
    drift: 0.001, // Slightly positive long term drift
    minPrice: 5000,
    maxPrice: 2000000,
    description: '클라우드 연산과 AI 반도체 선두 주자이자 안전한 기술 대형주입니다.',
    category: 'Tech'
  },
  {
    id: 'bio-genesis',
    name: '바이오 제네시스',
    ticker: 'BIOG',
    price: 45000,
    prevPrice: 45000,
    history: Array.from({ length: 20 }, (_, i) => 50000 - Math.cos(i) * 3000 - i * 200),
    volatility: 0.06, // 6% max random change (high risk)
    drift: -0.002, // Negative drift without news, needs news to spike
    minPrice: 1000,
    maxPrice: 1500000,
    description: '치매 치료제 3상 승인을 대기 중인 고위험 고수익 바이오 벤처입니다.',
    category: 'Bio'
  },
  {
    id: 'neo-battery',
    name: '네오 배터리',
    ticker: 'NEOB',
    price: 82000,
    prevPrice: 82000,
    history: Array.from({ length: 20 }, (_, i) => 70000 + Math.sin(i / 1.5) * 4000 + i * 700),
    volatility: 0.03, // 3% volatility
    drift: 0.002, // Stronger positive drift (growth stock)
    minPrice: 3000,
    maxPrice: 1000000,
    description: '차세대 전고체 배터리를 개발하는 신에너지 대장주입니다.',
    category: 'Energy'
  },
  {
    id: 'hanbit-food',
    name: '한빛 푸드',
    ticker: 'FOOD',
    price: 32000,
    prevPrice: 32000,
    history: Array.from({ length: 20 }, (_, i) => 31000 + Math.sin(i / 4) * 800),
    volatility: 0.008, // 0.8% volatility (very stable)
    drift: 0.0005, // Safe slow drift
    minPrice: 5000,
    maxPrice: 200000,
    description: '불황에도 흔들리지 않는 전통의 라면 및 냉동식품 전문 가공업체입니다.',
    category: 'Consumer'
  },
  {
    id: 'dog-coin',
    name: '독 코인',
    ticker: 'DOGC',
    price: 500,
    prevPrice: 500,
    history: Array.from({ length: 20 }, (_, i) => 400 + Math.random() * 200),
    volatility: 0.12, // 12% volatility (extreme gamble)
    drift: -0.005, // Sinks rapidly over time, punctuated by massive random jumps
    minPrice: 1,
    maxPrice: 100000,
    description: '인터넷 밈에서 탄생한 가상자산입니다. 종잡을 수 없는 급등락을 보입니다.',
    category: 'Crypto'
  }
];

export interface NewsTemplate {
  title: string;
  content: string;
  impactPercentRange: [number, number]; // [min, max]
  type: 'positive' | 'negative' | 'neutral';
}

export const NEWS_TEMPLATES_BY_STOCK: Record<string, NewsTemplate[]> = {
  'titan-tech': [
    {
      title: '타이탄 테크, 차세대 AI 가속기 가속 기능 공식 출시',
      content: '기존 칩셋 성능 대비 4배 향상된 칩셋을 독점 발표하며 글로벌 빅테크 주문이 폭주하고 있습니다.',
      impactPercentRange: [8, 15],
      type: 'positive'
    },
    {
      title: '미국 빅테크 연합, 타이탄 반도체 대량 수주 계약 체결',
      content: '글로벌 유수 데이터센터들이 타이탄 테크와의 5개년 파트너십을 체결했습니다.',
      impactPercentRange: [5, 12],
      type: 'positive'
    },
    {
      title: '타이탄 테크, 미세 공정 수율 저하 논란',
      content: '대만 파운드리 위탁 공정에서 일부 수율 오류가 감지되어 출하 시점이 1분기 지연될 수 있다는 루머가 돕니다.',
      impactPercentRange: [-10, -5],
      type: 'negative'
    },
    {
      title: '정부, 국산 AI 반도체 독과점 여부 조사 착수',
      content: '공정거래위원회가 타이탄 테크의 클라우드 인프라 시장 지배력 남용 여부를 전면 조사 중입니다.',
      impactPercentRange: [-7, -3],
      type: 'negative'
    }
  ],
  'bio-genesis': [
    {
      title: '바이오 제네시스, 치매 신약 3상 임상 성공',
      content: '식약처의 최종 승인이 임박하였으며 환자군 대조 시험에서 탁월한 인지 개선율이 입증되었습니다.',
      impactPercentRange: [40, 80],
      type: 'positive'
    },
    {
      title: '외국계 거대 제약사, 바이오 제네시스 지분 투자 타진',
      content: '글로벌 5대 제약사 중 한 곳이 라이선스 아웃 및 대규모 지분 인수 계약을 협의 중이라고 전했습니다.',
      impactPercentRange: [15, 35],
      type: 'positive'
    },
    {
      title: '바이오 제네시스 임상 데이터 조작 루머 발생',
      content: '익명의 내부 고발자가 임상 데이터의 부분 누락 의혹을 제기해 주주들이 혼란에 빠졌습니다.',
      impactPercentRange: [-35, -20],
      type: 'negative'
    },
    {
      title: '바이오 제네시스 신약 승인 보류 통보',
      content: '임상 3상 데이터에 보완 의견이 제시되어 승인이 수개월 뒤로 미뤄졌습니다.',
      impactPercentRange: [-45, -25],
      type: 'negative'
    }
  ],
  'neo-battery': [
    {
      title: '네오 배터리, 전기차 1위 업체와 전고체 배터리 공급 체결',
      content: '기존 주행거리를 80% 늘려주는 전고체 배터리 상용화 샘플을 글로벌 메이커에 독점 납품하기로 했습니다.',
      impactPercentRange: [12, 25],
      type: 'positive'
    },
    {
      title: '리튬 가격 폭락, 네오 배터리 원자재 마진율 급상승',
      content: '핵심 광물 가격 안정이 배터리 셀 제조 마진율 개선으로 직결되어 역대 최대 실적이 예고됩니다.',
      impactPercentRange: [6, 14],
      type: 'positive'
    },
    {
      title: '네오 배터리 공장 화재로 생산 라인 가동 중단',
      content: '충남 아산 공장 2라인에서 누전으로 추정되는 화재가 발생해 안전 점검을 위한 생산 중단이 명령되었습니다.',
      impactPercentRange: [-18, -10],
      type: 'negative'
    },
    {
      title: '핵심 연구원들의 연쇄 이탈 소문 확산',
      content: '배터리 특허를 보유한 핵심 설계 연구진이 경쟁사로 이직했다는 설이 나오며 주가 발목을 잡고 있습니다.',
      impactPercentRange: [-12, -5],
      type: 'negative'
    }
  ],
  'hanbit-food': [
    {
      title: '한빛 푸드, K-라면 수출 급증에 미국 2공장 조기 완공',
      content: '유튜브와 틱톡에서 매운맛 챌린지가 대유행하면서 미주 전역 대형마트 물량이 동나 증설을 서두르고 있습니다.',
      impactPercentRange: [5, 10],
      type: 'positive'
    },
    {
      title: '대형 밀가루 수입 가격 인하, 원가 절감 성공',
      content: '곡물 수입 단가 하락으로 마진이 극대화되며 안정적 영업이익 상승세가 기대됩니다.',
      impactPercentRange: [3, 7],
      type: 'positive'
    },
    {
      title: '한빛 푸드 만두 제품 이물질 혼입 의혹',
      content: '소비자 단체가 특정 로트 만두에서 포장용 비닐이 나왔다며 보상을 청구하고 불매 여론을 모으고 있습니다.',
      impactPercentRange: [-8, -4],
      type: 'negative'
    },
    {
      title: '라면 스프 내 방부제 미량 검출 루머에 곤욕',
      content: '안전 기준치 이하의 자연 유래 성분이나 커뮤니티 가짜 뉴스로 인해 초기 충격이 발생했습니다.',
      impactPercentRange: [-5, -2],
      type: 'negative'
    }
  ],
  'dog-coin': [
    {
      title: '글로벌 엔터테인먼트 거물, 독 코인을 결제 수단으로 수용',
      content: '우주 탐사 프로젝트 결제에 독 코인을 전면 도입한다는 트윗이 올라와 전 세계 투자자들이 흥분하고 있습니다.',
      impactPercentRange: [50, 120],
      type: 'positive'
    },
    {
      title: '유튜브 유명 크리에이터, "독 코인은 화성 갈 것"',
      content: '구독자 1억 명 유튜버의 단독 밈 코인 추천 영상 업로드로 자금이 미친 듯이 몰리고 있습니다.',
      impactPercentRange: [30, 80],
      type: 'positive'
    },
    {
      title: '해외 주요 가상자산 거래소, 독 코인 투자 경보 발령',
      content: '단기 과열 양상과 특정 지갑의 물량 집중 독점으로 인해 유의 종목 지정 우려가 커졌습니다.',
      impactPercentRange: [-30, -15],
      type: 'negative'
    },
    {
      title: '해커 침입으로 독 코인 창시자의 SNS 계정 털려',
      content: '가짜 에어드랍 링크와 "프로젝트 중단" 허위 글이 게재되어 실시간 투매 물량이 쏟아졌습니다.',
      impactPercentRange: [-50, -25],
      type: 'negative'
    }
  ]
};

export const GLOBAL_NEWS_TEMPLATES: NewsTemplate[] = [
  {
    title: '한국은행, 기준 금리 동결 발표',
    content: '금통위가 고물가 우려 속 시장 안정을 위해 만장일치로 금리를 현 3.50%로 유지하기로 결정했습니다. 주식 시장은 안도감을 느끼고 있습니다.',
    impactPercentRange: [1, 3],
    type: 'neutral'
  },
  {
    title: '미국 연준, 금리 인하 깜짝 단행!',
    content: '글로벌 경기 둔화 우려를 선제 차단하기 위해 연준이 0.50%p 빅컷을 발표하며 위험 자산 전반이 랠리 중입니다.',
    impactPercentRange: [3, 8],
    type: 'positive'
  },
  {
    title: '국제 유가 불안에 원자재 급등세',
    content: '중동 긴장 고조로 서부 텍사스산 원유(WTI)가 폭등하며 물가 불안 심리가 커져 기술주 중심의 이탈이 거셉니다.',
    impactPercentRange: [-5, -2],
    type: 'negative'
  },
  {
    title: '외국인 대규모 매수세 유입, 코스피 활기',
    content: '저평가된 국내 혁신 기업들을 타겟으로 유럽계 헤지펀드의 대량 매집세가 3일 연속 이어지고 있습니다.',
    impactPercentRange: [2, 5],
    type: 'positive'
  }
];

export function generateRandomNews(stocks: Stock[]): NewsItem {
  const roll = Math.random();
  const id = Math.random().toString(36).substring(2, 9);
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

  if (roll < 0.65) {
    // Stock-specific news
    const randomStock = stocks[Math.floor(Math.random() * stocks.length)];
    const templates = NEWS_TEMPLATES_BY_STOCK[randomStock.id];
    const template = templates[Math.floor(Math.random() * templates.length)];
    const [min, max] = template.impactPercentRange;
    const impactPercent = Math.random() * (max - min) + min;

    return {
      id,
      title: template.title,
      content: template.content,
      time,
      impactStockId: randomStock.id,
      impactPercent: parseFloat(impactPercent.toFixed(2)),
      type: template.type,
      read: false
    };
  } else {
    // Global news
    const template = GLOBAL_NEWS_TEMPLATES[Math.floor(Math.random() * GLOBAL_NEWS_TEMPLATES.length)];
    const [min, max] = template.impactPercentRange;
    const impactPercent = Math.random() * (max - min) + min;

    return {
      id,
      title: template.title,
      content: template.content,
      time,
      impactStockId: null, // impacts all stocks
      impactPercent: parseFloat(impactPercent.toFixed(2)),
      type: template.type,
      read: false
    };
  }
}

/**
 * Calculates stock price fluctuation.
 * S(t+1) = S(t) * (1 + drift + volatility * Z)
 * where Z is standard normal or random in [-1, 1]
 */
export function calculateNextPrice(stock: Stock, marketSentiment: number = 0): number {
  // Simple random walk with trend and noise
  const randomFactor = (Math.random() * 2 - 1); // Random float in [-1, 1]
  // Slightly adjust random walks using individual volatility and drift
  // marketSentiment can push prices up/down globally
  const multiplier = 1 + stock.drift + (stock.volatility * randomFactor) + marketSentiment;
  let nextPrice = Math.round(stock.price * multiplier);

  // Bounds checking
  if (nextPrice < stock.minPrice) nextPrice = stock.minPrice;
  if (nextPrice > stock.maxPrice) nextPrice = stock.maxPrice;

  return nextPrice;
}
