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
  },
  {
    id: 'space-vision',
    name: '스페이스 비전',
    ticker: 'SPAC',
    price: 120000,
    prevPrice: 120000,
    history: Array.from({ length: 20 }, (_, i) => 110000 + Math.sin(i / 3) * 6000 + i * 600),
    volatility: 0.04, // 4% volatility
    drift: 0.0015, // Solid positive drift (space tech)
    minPrice: 5000,
    maxPrice: 1500000,
    description: '우주 발사체 회수 및 위성 인터넷 서비스를 주도하는 초고성능 우주 테크 기업입니다.',
    category: 'Tech'
  },
  {
    id: 'cyber-armor',
    name: '사이버 아머',
    ticker: 'ARMR',
    price: 55000,
    prevPrice: 55000,
    history: Array.from({ length: 20 }, (_, i) => 52000 + Math.cos(i / 2) * 2000 + i * 200),
    volatility: 0.02, // 2% volatility
    drift: 0.0012, // Cyber security growth
    minPrice: 3000,
    maxPrice: 800000,
    description: '차세대 양자 암호화 해독 방지 및 엔드포인트 통합 보안 솔루션 전문 기업입니다.',
    category: 'Tech'
  },
  {
    id: 'mirae-mobility',
    name: '미래 모빌리티',
    ticker: 'MOBI',
    price: 210000,
    prevPrice: 210000,
    history: Array.from({ length: 20 }, (_, i) => 190000 + Math.sin(i / 4) * 8000 + i * 1000),
    volatility: 0.025, // 2.5% volatility
    drift: 0.001, // UAM future tech
    minPrice: 10000,
    maxPrice: 3000000,
    description: '무인 자율주행 차세대 친환경 플라잉카(UAM) 플랫폼 개발 및 생산 전문 기업입니다.',
    category: 'Energy'
  },
  {
    id: 'enter-wave',
    name: '엔터 웨이브',
    ticker: 'WAVE',
    price: 28000,
    prevPrice: 28000,
    history: Array.from({ length: 20 }, (_, i) => 25000 + Math.sin(i / 1.5) * 1500 + i * 150),
    volatility: 0.035, // 3.5% volatility
    drift: 0.0008, // Media/K-content IP
    minPrice: 2000,
    maxPrice: 500000,
    description: 'K-웹툰 및 버추얼 아이돌 기반 글로벌 엔터테인먼트 및 미디어 IP 기업입니다.',
    category: 'Consumer'
  },
  {
    id: 'meta-gold',
    name: '메타 골드',
    ticker: 'GOLD',
    price: 72000,
    prevPrice: 72000,
    history: Array.from({ length: 20 }, (_, i) => 70000 + Math.cos(i / 5) * 1000 + i * 50),
    volatility: 0.012, // 1.2% volatility (stable commodity token)
    drift: 0.0006, // Hedge against inflation
    minPrice: 10000,
    maxPrice: 500000,
    description: '실물 자산인 금을 블록체인 스마트 컨트랙트 기반으로 연동하여 보관 및 토큰 거래를 지원하는 플랫폼입니다.',
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
  ],
  'space-vision': [
    {
      title: '스페이스 비전, 달 탐사선 궤도 진입 완벽 안착',
      content: '자체 개발 차세대 발사체의 달 궤도 진입 성공으로 심우주 탐사 인프라 선점 성과를 인정받았습니다.',
      impactPercentRange: [15, 30],
      type: 'positive'
    },
    {
      title: '스페이스 비전, 초고속 위성 인터넷 가입자 5천만 돌파',
      content: '오지 무선 통신 서비스의 유료 가입자 수가 급격히 성장하며 막강한 현금 흐름 창출력을 입증했습니다.',
      impactPercentRange: [8, 18],
      type: 'positive'
    },
    {
      title: '기상 악화로 핵심 발사체 회수 프로젝트 잠정 연기',
      content: '강풍 및 낙뢰 우려로 인해 태평양 바지선 회수 계획을 포함한 발사 일정이 2주 연기되었습니다.',
      impactPercentRange: [-10, -5],
      type: 'negative'
    },
    {
      title: '글로벌 우주 쓰레기 규제 강화안 통과 우려',
      content: 'UN 산하 우주 평화 협의회에서 저궤도 군집 위성 운영사에 폐기 부담금을 부과하는 방안이 거론되었습니다.',
      impactPercentRange: [-8, -3],
      type: 'negative'
    }
  ],
  'cyber-armor': [
    {
      title: '사이버 아머, 미 국방부 공급망 보안 솔루션 독점 계약',
      content: '양자 컴퓨터 시대에 대응하는 포스트-양자 암호 하드웨어 가속 솔루션이 연방 보안 표준을 획득했습니다.',
      impactPercentRange: [12, 25],
      type: 'positive'
    },
    {
      title: '랜섬웨어 대유행 소식에 사이버 보안 수요 급증',
      content: '글로벌 제조 및 인프라 연합체의 시스템 마비 소식이 보도되면서 통합 관제 플랫폼 신규 도입 문의가 폭주 중입니다.',
      impactPercentRange: [6, 15],
      type: 'positive'
    },
    {
      title: '사이버 아머 보안 엔진에서 제로데이 취약점 감지',
      content: '보안 블로그를 통해 특정 에이전트 버전의 취약점을 이용한 해킹 위협이 폭로되어 긴급 핫픽스가 배포되었습니다.',
      impactPercentRange: [-15, -8],
      type: 'negative'
    },
    {
      title: '경쟁 보안사 특허 분쟁 패소로 배상금 지불 리스크',
      content: '오픈소스 암호화 라이브러리의 독점 라이선스 주장 관련 판결에서 패소해 일시 손실 충당금이 부과될 수 있습니다.',
      impactPercentRange: [-7, -3],
      type: 'negative'
    }
  ],
  'mirae-mobility': [
    {
      title: '미래 모빌리티, 국토부 도심 항공 이동(UAM) 실증 사업 최종 승인',
      content: '한국형 도심 항공 실증 사업의 수도권 실증 노선 시범 운행 승인을 취득하여 상용화에 청신호가 켜졌습니다.',
      impactPercentRange: [15, 25],
      type: 'positive'
    },
    {
      title: '네옴시티 프로젝트 친환경 드론 택시 500대 공급 기본 합의',
      content: '대형 모빌리티 수출 계약의 기본 파트너십 계약을 수주하여 차세대 중동 매출 기반을 확보했습니다.',
      impactPercentRange: [10, 20],
      type: 'positive'
    },
    {
      title: '자율 비행 테스트 도중 제어 센서 일시 오류로 기체 추락',
      content: '무인 프로토타입 비행 중 난기류 감지 소프트웨어 에러로 테스트 기체가 유실되는 돌발 악재가 터졌습니다.',
      impactPercentRange: [-20, -12],
      type: 'negative'
    },
    {
      title: '핵심 모터용 희토류 원자재 공급망 병목 현상 발생',
      content: '전동 파워트레인 제조 핵심인 특수 자석 공급선 부품 인도가 지체되면서 연말 인도 목표량이 축소되었습니다.',
      impactPercentRange: [-8, -4],
      type: 'negative'
    }
  ],
  'enter-wave': [
    {
      title: '엔터 웨이브 버추얼 아티스트 데뷔곡 빌보드 차트 인',
      content: 'AI 엔진과 버추얼 렌더링을 융합한 신인 아티스트가 글로벌 유튜브, 틱톡 차트 상위권을 휩쓸고 있습니다.',
      impactPercentRange: [12, 28],
      type: 'positive'
    },
    {
      title: '자체 독점 IP 웹툰 원작 OTT 드라마 전 세계 1위 석권',
      content: '제작 자회사에서 방영한 드라마가 글로벌 넷플릭스 비영어 부문 최장기 시청 1위를 달성해 흥행 보장 IP로 등극했습니다.',
      impactPercentRange: [8, 18],
      type: 'positive'
    },
    {
      title: '스타 크리에이터 이적 관련 소송 제기로 제작 공백 발생',
      content: '메인 작가 그룹의 계약 해지 요구와 권리 주장에 대항해 법정 소송전이 시작되면서 단기 제작 공백이 발생했습니다.',
      impactPercentRange: [-14, -6],
      type: 'negative'
    },
    {
      title: '글로벌 유통 플랫폼 수수료 인상에 마진 악화 우려',
      content: '웹스토어 및 다운로드 수수료의 기준선 상승으로 하반기 정산 이익률이 하향 조정되었습니다.',
      impactPercentRange: [-8, -3],
      type: 'negative'
    }
  ],
  'meta-gold': [
    {
      title: '인플레이션 안도 자산 가치 부각, 일일 예치금 사상 최대',
      content: '실물 금의 투명한 보증 거래망 플랫폼 메타 골드 가입자 및 금 위탁 예치 금액이 사상 최대치를 돌파했습니다.',
      impactPercentRange: [5, 12],
      type: 'positive'
    },
    {
      title: '주요 중앙은행 금 보유 확대에 골드 토큰 동반 급등',
      content: '세계적 긴축 기조 및 통화 변동성 리스크 헤지 수요로 금 기반 토큰 자산의 동반 강세 흐름이 나타나고 있습니다.',
      impactPercentRange: [4, 9],
      type: 'positive'
    },
    {
      title: '보관 수수료 요율 인상 추진안 발표에 일부 고래 이탈',
      content: '수수료 체계가 플랫폼 이윤 증대 위주로 개편되자 초대형 고래 홀더들이 자금을 이체하며 시세가 출렁였습니다.',
      impactPercentRange: [-6, -2],
      type: 'negative'
    },
    {
      title: '실물 보관 금고 정기 실사 연기로 신뢰성 불확실성 노출',
      content: '공인 회계법인의 스위스 금고 물리적 감사가 세관 수속 문제로 1개월 연기되어 시장에 우려를 낳았습니다.',
      impactPercentRange: [-5, -1],
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
