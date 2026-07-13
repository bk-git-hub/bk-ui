export interface CardsStackSliderCard {
  readonly id: string;
  readonly city: string;
  readonly cityCode: string;
  readonly country: string;
  readonly edition: string;
  readonly route: string;
  readonly balance: string;
  readonly cardNumber: string;
  readonly cardholder: string;
  readonly validThrough: string;
  readonly securityCode: string;
  readonly supportLine: string;
  readonly gradientClassName: string;
  readonly glowClassName: string;
}

export const CARDS_STACK_SLIDER_DATA = [
  {
    id: "seoul-after-dark",
    city: "Seoul",
    cityCode: "SEL",
    country: "South Korea",
    edition: "After dark",
    route: "ICN · GMP · SEL",
    balance: "₩4,820,000",
    cardNumber: "4830 1128 7904 2241",
    cardholder: "BK TRAVELER",
    validThrough: "09/29",
    securityCode: "718",
    supportLine: "+82 2 120",
    gradientClassName:
      "bg-gradient-to-br from-slate-950 via-indigo-950 to-violet-700",
    glowClassName: "bg-fuchsia-400/40",
  },
  {
    id: "lisbon-sunline",
    city: "Lisbon",
    cityCode: "LIS",
    country: "Portugal",
    edition: "Sunline",
    route: "LIS · CAS · SIN",
    balance: "€12,480.20",
    cardNumber: "5192 3077 4126 8830",
    cardholder: "BK TRAVELER",
    validThrough: "04/30",
    securityCode: "245",
    supportLine: "+351 210 000 000",
    gradientClassName:
      "bg-gradient-to-br from-orange-500 via-rose-500 to-fuchsia-800",
    glowClassName: "bg-amber-200/50",
  },
  {
    id: "reykjavik-north",
    city: "Reykjavík",
    cityCode: "REK",
    country: "Iceland",
    edition: "Northern light",
    route: "KEF · REK · VIK",
    balance: "kr 1,904,200",
    cardNumber: "4471 9068 3520 6714",
    cardholder: "BK TRAVELER",
    validThrough: "12/28",
    securityCode: "609",
    supportLine: "+354 411 6000",
    gradientClassName:
      "bg-gradient-to-br from-slate-950 via-teal-950 to-emerald-600",
    glowClassName: "bg-cyan-300/45",
  },
  {
    id: "kyoto-vermilion",
    city: "Kyoto",
    cityCode: "KYO",
    country: "Japan",
    edition: "Vermilion",
    route: "KIX · KYO · UKY",
    balance: "¥2,650,800",
    cardNumber: "5524 8041 1936 5270",
    cardholder: "BK TRAVELER",
    validThrough: "07/31",
    securityCode: "438",
    supportLine: "+81 75 222 3111",
    gradientClassName:
      "bg-gradient-to-br from-red-950 via-rose-800 to-orange-500",
    glowClassName: "bg-amber-200/45",
  },
  {
    id: "marrakech-atlas",
    city: "Marrakech",
    cityCode: "RAK",
    country: "Morocco",
    edition: "Atlas reserve",
    route: "RAK · MED · ATLAS",
    balance: "د.م. 84,100",
    cardNumber: "4768 2930 6154 8092",
    cardholder: "BK TRAVELER",
    validThrough: "03/30",
    securityCode: "821",
    supportLine: "+212 524 433 407",
    gradientClassName:
      "bg-gradient-to-br from-stone-950 via-amber-950 to-yellow-700",
    glowClassName: "bg-orange-300/45",
  },
] as const satisfies readonly CardsStackSliderCard[];
