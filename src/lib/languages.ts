export type LangCode = "en" | "ar" | "ur" | "hi" | "bn" | "tl" | "fr" | "es";

export type UiStrings = {
  summary: string;
  fields: string;
  asks: string;
  example: string;
  risk: string;
  unclear: string;
  disclaimer: string;
  print: string;
  imageNote: string;
  notAForm: string;
  documents: string;
  terms: string;
  onlyRisky: string;
  showAll: string;
  writing: string;
  listen: string;
  stop: string;
  askTitle: string;
  askPlaceholder: string;
  ask: string;
  askNote: string;
};

export type Language = {
  code: LangCode;
  english: string;
  native: string;
  dir: "ltr" | "rtl";
  ui: UiStrings;
};

export const LANGUAGES: Language[] = [
  {
    code: "en",
    english: "English",
    native: "English",
    dir: "ltr",
    ui: {
      summary: "What this form is for",
      fields: "Field by field",
      asks: "What it is asking",
      example: "Example answer",
      risk: "Often causes rejections",
      unclear: "Could not read this clearly. Check the original form.",
      disclaimer:
        "This explains what each field asks for. It is not legal, medical or immigration advice, and it does not tell you what to write or whether to sign. If you are unsure, ask the office that gave you the form.",
      print: "Print",
      imageNote: "Note about the image",
      notAForm: "This does not look like a form",
      documents: "Documents you may need",
      terms: "Difficult words explained",
      onlyRisky: "Show only fields that often cause rejections",
      showAll: "Show all fields",
      writing: "Still writing…",
      listen: "Listen",
      stop: "Stop",
      askTitle: "Ask about this form",
      askPlaceholder: "For example: what does “guarantor” mean?",
      ask: "Ask",
      askNote: "Answers explain the form. They are not advice.",
    },
  },
  {
    code: "ar",
    english: "Arabic",
    native: "العربية",
    dir: "rtl",
    ui: {
      summary: "ما الغرض من هذا النموذج",
      fields: "شرح الحقول واحدًا تلو الآخر",
      asks: "ما المطلوب",
      example: "مثال على إجابة",
      risk: "يسبب الرفض كثيرًا",
      unclear: "تعذّرت قراءة هذا الجزء بوضوح. راجع النموذج الأصلي.",
      disclaimer:
        "يشرح هذا ما يطلبه كل حقل فقط. هذه ليست استشارة قانونية أو طبية أو استشارة هجرة، ولا تخبرك بما تكتب أو ما إذا كان عليك التوقيع. إذا لم تكن متأكدًا، فاسأل الجهة التي أعطتك النموذج.",
      print: "طباعة",
      imageNote: "ملاحظة حول الصورة",
      notAForm: "لا يبدو أن هذا نموذج",
      documents: "مستندات قد تحتاجها",
      terms: "شرح الكلمات الصعبة",
      onlyRisky: "اعرض فقط الحقول التي تسبب الرفض كثيرًا",
      showAll: "اعرض كل الحقول",
      writing: "ما زال يكتب…",
      listen: "استمع",
      stop: "إيقاف",
      askTitle: "اسأل عن هذا النموذج",
      askPlaceholder: "مثال: ماذا تعني كلمة «الضامن»؟",
      ask: "اسأل",
      askNote: "الإجابات تشرح النموذج فقط، وليست استشارة.",
    },
  },
  {
    code: "ur",
    english: "Urdu",
    native: "اردو",
    dir: "rtl",
    ui: {
      summary: "یہ فارم کس لیے ہے",
      fields: "ہر خانے کی وضاحت",
      asks: "یہ کیا پوچھ رہا ہے",
      example: "مثالی جواب",
      risk: "اکثر مسترد ہونے کی وجہ بنتا ہے",
      unclear: "یہ حصہ صاف نہیں پڑھا جا سکا۔ اصل فارم دیکھیں۔",
      disclaimer:
        "یہ صرف بتاتا ہے کہ ہر خانہ کیا پوچھ رہا ہے۔ یہ قانونی، طبی یا امیگریشن مشورہ نہیں ہے، اور یہ نہیں بتاتا کہ آپ کیا لکھیں یا دستخط کریں یا نہیں۔ اگر یقین نہ ہو تو اس دفتر سے پوچھیں جس نے آپ کو یہ فارم دیا ہے۔",
      print: "پرنٹ کریں",
      imageNote: "تصویر کے بارے میں نوٹ",
      notAForm: "یہ فارم نہیں لگتا",
      documents: "دستاویزات جن کی ضرورت ہو سکتی ہے",
      terms: "مشکل الفاظ کی وضاحت",
      onlyRisky: "صرف وہ خانے دکھائیں جو اکثر مسترد ہونے کی وجہ بنتے ہیں",
      showAll: "تمام خانے دکھائیں",
      writing: "ابھی لکھا جا رہا ہے…",
      listen: "سنیں",
      stop: "روکیں",
      askTitle: "اس فارم کے بارے میں پوچھیں",
      askPlaceholder: "مثال: «ضامن» کا کیا مطلب ہے؟",
      ask: "پوچھیں",
      askNote: "جوابات صرف فارم کی وضاحت کرتے ہیں، یہ مشورہ نہیں ہیں۔",
    },
  },
  {
    code: "hi",
    english: "Hindi",
    native: "हिन्दी",
    dir: "ltr",
    ui: {
      summary: "यह फ़ॉर्म किस लिए है",
      fields: "हर खाने की व्याख्या",
      asks: "यह क्या पूछ रहा है",
      example: "उदाहरण उत्तर",
      risk: "अक्सर अस्वीकृति का कारण बनता है",
      unclear: "यह हिस्सा साफ़ नहीं पढ़ा जा सका। मूल फ़ॉर्म देखें।",
      disclaimer:
        "यह केवल बताता है कि हर खाना क्या पूछ रहा है। यह कानूनी, चिकित्सा या आप्रवासन सलाह नहीं है, और यह नहीं बताता कि आप क्या लिखें या हस्ताक्षर करें या नहीं। अगर पक्का न हो, तो उस कार्यालय से पूछें जिसने आपको यह फ़ॉर्म दिया है।",
      print: "प्रिंट करें",
      imageNote: "तस्वीर के बारे में नोट",
      notAForm: "यह फ़ॉर्म नहीं लगता",
      documents: "ज़रूरी दस्तावेज़",
      terms: "कठिन शब्दों का अर्थ",
      onlyRisky: "केवल वे खाने दिखाएँ जिनसे अक्सर अस्वीकृति होती है",
      showAll: "सभी खाने दिखाएँ",
      writing: "अभी लिखा जा रहा है…",
      listen: "सुनें",
      stop: "रोकें",
      askTitle: "इस फ़ॉर्म के बारे में पूछें",
      askPlaceholder: "उदाहरण: “गारंटर” का क्या मतलब है?",
      ask: "पूछें",
      askNote: "जवाब सिर्फ़ फ़ॉर्म समझाते हैं, ये सलाह नहीं हैं।",
    },
  },
  {
    code: "bn",
    english: "Bengali",
    native: "বাংলা",
    dir: "ltr",
    ui: {
      summary: "এই ফর্মটি কীসের জন্য",
      fields: "প্রতিটি ঘরের ব্যাখ্যা",
      asks: "এটি কী জানতে চাইছে",
      example: "উদাহরণ উত্তর",
      risk: "প্রায়ই প্রত্যাখ্যানের কারণ হয়",
      unclear: "এই অংশটি পরিষ্কারভাবে পড়া যায়নি। মূল ফর্মটি দেখুন।",
      disclaimer:
        "এটি শুধু ব্যাখ্যা করে প্রতিটি ঘর কী জানতে চাইছে। এটি আইনি, চিকিৎসা বা অভিবাসন পরামর্শ নয়, এবং আপনি কী লিখবেন বা সই করবেন কিনা তা বলে না। নিশ্চিত না হলে, যে অফিস আপনাকে ফর্মটি দিয়েছে তাদের জিজ্ঞাসা করুন।",
      print: "প্রিন্ট করুন",
      imageNote: "ছবি সম্পর্কে নোট",
      notAForm: "এটি ফর্ম বলে মনে হচ্ছে না",
      documents: "যে কাগজপত্র লাগতে পারে",
      terms: "কঠিন শব্দের ব্যাখ্যা",
      onlyRisky: "শুধু যে ঘরগুলো প্রায়ই প্রত্যাখ্যানের কারণ হয় সেগুলো দেখান",
      showAll: "সব ঘর দেখান",
      writing: "এখনও লেখা হচ্ছে…",
      listen: "শুনুন",
      stop: "থামান",
      askTitle: "এই ফর্ম সম্পর্কে জিজ্ঞাসা করুন",
      askPlaceholder: "যেমন: “জামিনদার” মানে কী?",
      ask: "জিজ্ঞাসা করুন",
      askNote: "উত্তরগুলো শুধু ফর্মটি ব্যাখ্যা করে, এগুলো পরামর্শ নয়।",
    },
  },
  {
    code: "tl",
    english: "Tagalog",
    native: "Tagalog",
    dir: "ltr",
    ui: {
      summary: "Para saan ang form na ito",
      fields: "Paliwanag sa bawat field",
      asks: "Ano ang hinihingi",
      example: "Halimbawang sagot",
      risk: "Madalas na dahilan ng pagtanggi",
      unclear: "Hindi ito malinaw na mabasa. Tingnan ang orihinal na form.",
      disclaimer:
        "Ipinapaliwanag lamang nito kung ano ang hinihingi ng bawat field. Hindi ito legal, medikal, o immigration na payo, at hindi nito sinasabi kung ano ang isusulat mo o kung dapat kang pumirma. Kung hindi ka sigurado, magtanong sa opisinang nagbigay sa iyo ng form.",
      print: "I-print",
      imageNote: "Paalala tungkol sa larawan",
      notAForm: "Mukhang hindi ito isang form",
      documents: "Mga dokumentong maaaring kailanganin",
      terms: "Paliwanag sa mahihirap na salita",
      onlyRisky: "Ipakita lang ang mga field na madalas dahilan ng pagtanggi",
      showAll: "Ipakita lahat ng field",
      writing: "Isinusulat pa…",
      listen: "Pakinggan",
      stop: "Ihinto",
      askTitle: "Magtanong tungkol sa form na ito",
      askPlaceholder: "Halimbawa: ano ang ibig sabihin ng “guarantor”?",
      ask: "Itanong",
      askNote: "Ipinapaliwanag lang ng mga sagot ang form. Hindi ito payo.",
    },
  },
  {
    code: "fr",
    english: "French",
    native: "Français",
    dir: "ltr",
    ui: {
      summary: "À quoi sert ce formulaire",
      fields: "Explication champ par champ",
      asks: "Ce qui est demandé",
      example: "Exemple de réponse",
      risk: "Cause fréquente de refus",
      unclear: "Ce passage n’a pas pu être lu clairement. Vérifiez le formulaire original.",
      disclaimer:
        "Cet outil explique seulement ce que demande chaque champ. Ce n’est pas un conseil juridique, médical ou en matière d’immigration, et il ne vous dit pas quoi écrire ni s’il faut signer. En cas de doute, demandez au service qui vous a remis le formulaire.",
      print: "Imprimer",
      imageNote: "Remarque sur l’image",
      notAForm: "Cela ne ressemble pas à un formulaire",
      documents: "Documents dont vous pourriez avoir besoin",
      terms: "Mots difficiles expliqués",
      onlyRisky: "Afficher seulement les champs qui causent souvent un refus",
      showAll: "Afficher tous les champs",
      writing: "Rédaction en cours…",
      listen: "Écouter",
      stop: "Arrêter",
      askTitle: "Poser une question sur ce formulaire",
      askPlaceholder: "Par exemple : que veut dire « garant » ?",
      ask: "Demander",
      askNote: "Les réponses expliquent le formulaire. Ce ne sont pas des conseils.",
    },
  },
  {
    code: "es",
    english: "Spanish",
    native: "Español",
    dir: "ltr",
    ui: {
      summary: "Para qué sirve este formulario",
      fields: "Explicación campo por campo",
      asks: "Qué se pide",
      example: "Ejemplo de respuesta",
      risk: "Causa frecuente de rechazo",
      unclear: "No se pudo leer con claridad. Revise el formulario original.",
      disclaimer:
        "Esto solo explica qué pide cada campo. No es asesoramiento legal, médico ni migratorio, y no le dice qué escribir ni si debe firmar. Si tiene dudas, pregunte a la oficina que le entregó el formulario.",
      print: "Imprimir",
      imageNote: "Nota sobre la imagen",
      notAForm: "Esto no parece un formulario",
      documents: "Documentos que puede necesitar",
      terms: "Palabras difíciles explicadas",
      onlyRisky: "Mostrar solo los campos que suelen causar rechazos",
      showAll: "Mostrar todos los campos",
      writing: "Todavía escribiendo…",
      listen: "Escuchar",
      stop: "Detener",
      askTitle: "Preguntar sobre este formulario",
      askPlaceholder: "Por ejemplo: ¿qué significa «avalista»?",
      ask: "Preguntar",
      askNote: "Las respuestas explican el formulario. No son asesoramiento.",
    },
  },
];

export function getLanguage(code: string): Language | undefined {
  return LANGUAGES.find((l) => l.code === code);
}
