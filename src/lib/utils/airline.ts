/**
 * IATA 2-letter airline code → airline name mapping.
 * Covers major airlines operating flights to/from Japan.
 */
const AIRLINE_NAMES: Record<string, string> = {
	// Japanese airlines
	NH: 'ANA',
	JL: 'JAL',
	MM: 'Peach',
	GK: 'Jetstar Japan',
	BC: 'スカイマーク',
	HD: 'AIR DO',
	FW: 'IBEX',
	'7G': 'StarFlyer',
	'6J': 'ソラシドエア',
	IJ: 'Spring Japan',
	NU: 'JTA',
	// East Asia
	KE: 'Korean Air',
	OZ: 'アシアナ航空',
	'7C': 'チェジュ航空',
	TW: "t'way air",
	LJ: 'Jin Air',
	BX: 'Air Busan',
	ZE: 'Eastar Jet',
	CI: 'チャイナエアライン',
	BR: 'EVA Air',
	IT: 'タイガーエア台湾',
	CA: 'Air China',
	MU: '中国東方航空',
	CZ: '中国南方航空',
	HO: '吉祥航空',
	SC: '山東航空',
	'3U': '四川航空',
	HX: '香港航空',
	UO: '香港エクスプレス',
	CX: 'Cathay Pacific',
	// Southeast Asia
	SQ: 'Singapore Airlines',
	TR: 'Scoot',
	'3K': 'Jetstar Asia',
	TG: 'Thai Airways',
	FD: 'Thai AirAsia',
	VN: 'Vietnam Airlines',
	VJ: 'VietJet Air',
	PR: 'Philippine Airlines',
	'5J': 'Cebu Pacific',
	GA: 'ガルーダ・インドネシア',
	MH: 'Malaysia Airlines',
	AK: 'AirAsia',
	// North America
	UA: 'United Airlines',
	AA: 'American Airlines',
	DL: 'Delta Air Lines',
	AC: 'Air Canada',
	HA: 'Hawaiian Airlines',
	// Europe
	BA: 'British Airways',
	LH: 'Lufthansa',
	AF: 'Air France',
	KL: 'KLM',
	AY: 'Finnair',
	LX: 'SWISS',
	OS: 'Austrian',
	SK: 'SAS',
	TK: 'Turkish Airlines',
	VS: 'Virgin Atlantic',
	// Middle East & Oceania
	EK: 'Emirates',
	QR: 'Qatar Airways',
	EY: 'Etihad Airways',
	QF: 'Qantas',
	NZ: 'Air New Zealand',
};

const FLIGHT_NUMBER_RE = /^([A-Z0-9]{2})\s*(\d{1,4})$/;

/**
 * Parse a title string as a flight number and return the airline name.
 * Returns null if the title does not look like a flight number.
 */
export function getAirlineName(title: string): string | null {
	const m = title.trim().toUpperCase().match(FLIGHT_NUMBER_RE);
	if (!m) return null;
	return AIRLINE_NAMES[m[1]] ?? null;
}
