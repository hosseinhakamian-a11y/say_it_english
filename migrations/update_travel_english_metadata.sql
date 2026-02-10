-- Update the specific "Travel English" video seen in the screenshot with enhanced metadata
-- This will add pronunciation and English definitions to the existing vocabulary list.

UPDATE content
SET metadata = '{
  "vocabulary": [
    {
      "word": "Check-in counter",
      "pronunciation": "/ˈtʃek ɪn ˈkaʊntər/",
      "meaning": "باجه پذیرش",
      "definition": "The place at an airport where you report your arrival and drop off luggage.",
      "time": "00:45"
    },
    {
      "word": "Boarding pass",
      "pronunciation": "/ˈbɔːrdɪŋ pæs/",
      "meaning": "کارت پرواز",
      "definition": "A document provided by an airline during check-in, giving a passenger permission to board the airplane.",
      "time": "01:20"
    },
    {
      "word": "Baggage claim",
      "pronunciation": "/ˈbæɡɪdʒ kleɪm/",
      "meaning": "قسمت تحویل بار",
      "definition": "The area in an airport where arriving passengers collect luggage that has been transported in the hold of the aircraft.",
      "time": "02:10"
    },
    {
      "word": "Customs",
      "pronunciation": "/ˈkʌstəmz/",
      "meaning": "گمرک",
      "definition": "The place at a port, airport, or frontier where officials check incoming goods, travelers, or luggage.",
      "time": "03:00"
    },
    {
      "word": "Gate",
      "pronunciation": "/ɡeɪt/",
      "meaning": "گیت / دروازه خروجی",
      "definition": "An exit from an airport building to an aircraft.",
      "time": "03:45"
    },
    {
      "word": "Departure",
      "pronunciation": "/dɪˈpɑːrtʃər/",
      "meaning": "پرواز خروجی",
      "definition": "The action of leaving, typically to start a journey.",
      "time": "04:10"
    },
    {
      "word": "Itinerary",
      "pronunciation": "/faɪˈnæl.ə.ti/",
      "meaning": "برنامه سفر",
      "definition": "A planned route or journey.",
      "time": "05:00"
    }
  ],
  "quiz": [
    {
      "question": "Where do you go to get your boarding pass?",
      "options": [
        "Baggage claim",
        "Check-in counter",
        "Customs",
        "Security check"
      ],
      "answer": 1
    },
    {
      "question": "What document do you need to board the plane?",
      "options": [
        "Driver''s license",
        "Boarding pass",
        "Library card",
        "Credit card"
      ],
      "answer": 1
    },
    {
      "question": "Where do you pick up your suitcases after landing?",
      "options": [
        "Departure gate",
        "Check-in",
        "Baggage claim",
        "Duty-free shop"
      ],
      "answer": 2
    }
  ]
}'
WHERE title LIKE '%انگلیسی سفر - در فرودگاه و هتل%';
