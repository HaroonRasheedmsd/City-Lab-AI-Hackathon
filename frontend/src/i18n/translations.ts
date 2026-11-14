/**
 * UI Localization strings for English, Roman Urdu, and Urdu.
 */

import type { SupportedLanguage } from '../types';

export interface Translations {
  appTitle: string;
  appSubtitle: string;
  privacyLocked: string;
  noPatientSelected: string;
  selectPatient: string;
  customReportTab: string;
  choosePatientPrompt: string;
  age: string;
  sex: string;
  mrn: string;
  totalTests: string;
  attentionNeeded: string;
  normalResults: string;
  urgentAlert: string;
  disclaimerTitle: string;
  disclaimerBody: string;
  statusNormal: string;
  statusLow: string;
  statusHigh: string;
  statusUrgent: string;
  statusUnclassified: string;
  statusNeedsInfo: string;
  howWeChecked: string;
  referenceRange: string;
  reportedAs: string;
  sourceFile: string;
  conversionSteps: string;
  boundaryRule: string;
  missingDemographicsNotice: string;
  provideAgeSexPrompt: string;
  reAnalyzeButton: string;
  saveDemographics: string;
  doctorQuestionsTitle: string;
  doctorQuestionsSubtitle: string;
  copyQuestions: string;
  copied: string;
  addToSummary: string;
  chatTitle: string;
  chatSubtitle: string;
  chatPlaceholder: string;
  sendMessage: string;
  sourcesTitle: string;
  viewSources: string;
  close: string;
  printReport: string;
  listenExplanation: string;
  stopAudio: string;
  explainLikeIm10: string;
  standardExplanation: string;
  degradedNotice: string;
}

export const translations: Record<SupportedLanguage, Translations> = {
  en: {
    appTitle: 'CityLab Report Explainer',
    appSubtitle: 'Clinical Diagnostics Assistant',
    privacyLocked: 'Session locked to',
    noPatientSelected: 'No patient selected',
    selectPatient: 'Select Patient',
    customReportTab: 'Paste / Upload Report',
    choosePatientPrompt: 'Choose a patient from the CityLab roster or paste a report:',
    age: 'Age',
    sex: 'Sex',
    mrn: 'MRN',
    totalTests: 'Total Tests',
    attentionNeeded: 'Needs Attention',
    normalResults: 'Normal Range',
    urgentAlert: 'See a Doctor Today',
    disclaimerTitle: 'Important Medical Disclaimer',
    disclaimerBody:
      'This tool explains your laboratory numbers using CityLab clinical reference files. It does not provide medical diagnosis, treatment recommendations, or prescriptions. Always consult a qualified physician.',
    statusNormal: 'Normal',
    statusLow: 'Low',
    statusHigh: 'High',
    statusUrgent: 'Urgent',
    statusUnclassified: 'Cannot Classify',
    statusNeedsInfo: 'Needs Information',
    howWeChecked: 'How We Checked This',
    referenceRange: 'Normal Reference Range',
    reportedAs: 'Reported As',
    sourceFile: 'Source Reference',
    conversionSteps: 'Unit Conversion',
    boundaryRule: 'Boundary Evaluation',
    missingDemographicsNotice: 'Missing Patient Age or Sex',
    provideAgeSexPrompt:
      'Some tests have different normal ranges for males, females, or specific age brackets. Please provide the missing details to classify accurately:',
    reAnalyzeButton: 'Re-evaluate with Details',
    saveDemographics: 'Apply & Classify',
    doctorQuestionsTitle: 'Questions for Your Doctor',
    doctorQuestionsSubtitle: 'Targeted inquiries based on your out-of-range results',
    copyQuestions: 'Copy to Clipboard',
    copied: 'Copied!',
    addToSummary: 'Include in Printable Summary',
    chatTitle: 'Assistant Q&A',
    chatSubtitle: 'Answering questions strictly about this patient’s lab values',
    chatPlaceholder: 'Ask a question about your results (e.g. "What does my ALT mean?")...',
    sendMessage: 'Send',
    sourcesTitle: 'Lab Reference Sources',
    viewSources: 'Reference Sources',
    close: 'Close',
    printReport: 'Print / Export PDF',
    listenExplanation: 'Read Aloud',
    stopAudio: 'Stop',
    explainLikeIm10: 'Simple Mode (Age 10)',
    standardExplanation: 'Standard Clinical Summary',
    degradedNotice: 'Using CityLab deterministic template explanations (LLM offline).',
  },
  roman_urdu: {
    appTitle: 'CityLab Report Explainer',
    appSubtitle: 'Aapki Medical Report Ka Asaan Tarjuma',
    privacyLocked: 'Session mehfooz hai',
    noPatientSelected: 'Koi mareez muntakhib nahi',
    selectPatient: 'Mareez Chunein',
    customReportTab: 'Report Paste / Upload Karein',
    choosePatientPrompt: 'CityLab record se mareez chunein ya apni report paste karein:',
    age: 'Umar',
    sex: 'Jins',
    mrn: 'MRN Number',
    totalTests: 'Kul Tests',
    attentionNeeded: 'Tawajjah Talab',
    normalResults: 'Normal Nataij',
    urgentAlert: 'Aaj Hi Doctor Se Milein',
    disclaimerTitle: 'Zaroori Medical Wazahat',
    disclaimerBody:
      'Yeh tool sirf aapki lab report ke nataij ko samjhane ke liye hai. Yeh koi bimari tashkhees nahi karta aur na hi dawai tajweez karta hai. Hamesha certified doctor se mashwara karein.',
    statusNormal: 'Normal',
    statusLow: 'Kam (Low)',
    statusHigh: 'Zyada (High)',
    statusUrgent: 'Fauri Tawajjah (Urgent)',
    statusUnclassified: 'Files Mein Maujood Nahi',
    statusNeedsInfo: 'Maloomat Darkar Hai',
    howWeChecked: 'Humne Kaise Check Kiya',
    referenceRange: 'Normal Hudd (Reference Range)',
    reportedAs: 'Report Mein Naam',
    sourceFile: 'Reference File',
    conversionSteps: 'Unit Tabdeeli',
    boundaryRule: 'Hudd Ka Faisla',
    missingDemographicsNotice: 'Umar Ya Jins Ghayab Hai',
    provideAgeSexPrompt:
      'Kuch tests ki normal hudd mard, aurat ya umar ke mutabiq badalti hai. Sahi nataij ke liye darj karein:',
    reAnalyzeButton: 'Dobara Check Karein',
    saveDemographics: 'Apply Karein Aur Check Karein',
    doctorQuestionsTitle: 'Doctor Se Poochne Ke Sawalat',
    doctorQuestionsSubtitle: 'Ghair-normal nataij par mabni makhsoos sawalat',
    copyQuestions: 'Copy Karein',
    copied: 'Copy Ho Gaya!',
    addToSummary: 'Print Summary Mein Shamil Karein',
    chatTitle: 'Lab Assistant Se Sawal Poochein',
    chatSubtitle: 'Sirf is mareez ki report ke bare mein mehfooz guftagu',
    chatPlaceholder: 'Apne result ke bare mein sawal karein...',
    sendMessage: 'Bhejein',
    sourcesTitle: 'Lab Reference Files',
    viewSources: 'Reference Files Dekhein',
    close: 'Band Karein',
    printReport: 'Print / PDF Nikalein',
    listenExplanation: 'Sun kar Samjhein',
    stopAudio: 'Rokein',
    explainLikeIm10: 'Asaan Tareen Alfaaz',
    standardExplanation: 'Standard Wazahat',
    degradedNotice: 'CityLab standard templates istemal ho rahe hain.',
  },
  urdu: {
    appTitle: 'سٹی لیب رپورٹ گائیڈ',
    appSubtitle: 'طبی لیبارٹری رپورٹ کی آسان تفہیم',
    privacyLocked: 'محفوظ سیشن برائے',
    noPatientSelected: 'کوئی مریض منتخب نہیں',
    selectPatient: 'مریض منتخب کریں',
    customReportTab: 'رپورٹ پیسٹ یا اپلوڈ کریں',
    choosePatientPrompt: 'سٹی لیب ریکارڈ سے مریض منتخب کریں یا رپورٹ درج کریں:',
    age: 'عمر',
    sex: 'جنس',
    mrn: 'ایم آر این',
    totalTests: 'کل ٹیسٹ',
    attentionNeeded: 'توجہ طلب',
    normalResults: 'معمول کے مطابق',
    urgentAlert: 'آج ہی ڈاکٹر سے رجوع کریں',
    disclaimerTitle: 'اہم طبی انتباہ',
    disclaimerBody:
      'یہ نظام صرف آپ کی لیب رپورٹ کی وضاحت کے لیے ہے۔ یہ کسی بیماری کی تشخیص یا علاج تجویز نہیں کرتا۔ حتمی رائے کے لیے ڈاکٹر سے رجوع کریں۔',
    statusNormal: 'نارمل',
    statusLow: 'کم (Low)',
    statusHigh: 'زیادہ (High)',
    statusUrgent: 'فوری توجہ طلب',
    statusUnclassified: 'فائلوں میں موجود نہیں',
    statusNeedsInfo: 'معلومات درکار ہیں',
    howWeChecked: 'ہم نے کیسے تصدیق کی',
    referenceRange: 'نارمل حدود',
    reportedAs: 'رپورٹ میں نام',
    sourceFile: 'ماخذ فائل',
    conversionSteps: 'پیمائش کا تبادلہ',
    boundaryRule: 'حدود کا اصول',
    missingDemographicsNotice: 'عمر یا جنس کی کمی',
    provideAgeSexPrompt: 'صحیح نارمل حد جاننے کے لیے عمر اور جنس فراہم کریں:',
    reAnalyzeButton: 'دوبارہ جانچیں',
    saveDemographics: 'لاگو کریں اور جانچیں',
    doctorQuestionsTitle: 'ڈاکٹر کے لیے اہم سوالات',
    doctorQuestionsSubtitle: 'غیر معمولی نتائج پر مبنی سوالات',
    copyQuestions: 'کاپی کریں',
    copied: 'کاپی ہو گیا!',
    addToSummary: 'پرنٹ میں شامل کریں',
    chatTitle: 'لیب اسسٹنٹ چیٹ',
    chatSubtitle: 'صرف اس رپورٹ سے متعلق محفوظ رہنمائی',
    chatPlaceholder: 'اپنی رپورٹ کے بارے میں سوال پوچھیں...',
    sendMessage: 'بھیجیں',
    sourcesTitle: 'حوالہ جاتی دستاویزات',
    viewSources: 'دستاویزات دیکھیں',
    close: 'بند کریں',
    printReport: 'پرنٹ / پی ڈی ایف',
    listenExplanation: 'سنیں',
    stopAudio: 'روکیں',
    explainLikeIm10: 'سادہ ترین الفاظ (بچوں کے لیے)',
    standardExplanation: 'معیاری وضاحت',
    degradedNotice: 'سٹی لیب ٹیمپلیٹ استعمال ہو رہا ہے۔',
  },
};
