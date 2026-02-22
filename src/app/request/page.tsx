"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";

export const dynamic = 'force-dynamic';

import { 
  CheckCircle, 
  Shield, 
  AlertCircle, 
  UploadCloud, 
  X, 
  Loader2, 
  ChevronRight,
  ChevronDown,
  Clock,
  DollarSign
} from "lucide-react";
import { 
  validateAddressFormatClient, 
  validateColoradoCityClient, 
  validateColoradoZipClient,
  validateEmailClient 
} from "@/lib/client-validation";
import { parsePhoneNumberFromString } from 'libphonenumber-js';

const SERVICES_OPTIONS = [
  "Sod Installation",
  "Hardscaping", 
  "One-Time Weed Pulling",
  "Decorative Rock",
  "Mulch Installation",
  "Spring/Fall Clean Up",
  "Snow Removal",
  "Custom Landscaping"
];

const BUDGET_OPTIONS = ["Under $1,000", "$1,000 - $5,000", "$5,000 - $10,000", "$10,000 - $20,000", "$20,000+"];
const TIMEFRAME_OPTIONS = ["As soon as possible", "Within 2 weeks", "Within a month", "Just planning"];

function RequestFormContent() {
  noStore();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Phone formatting state
  const [phoneValue, setPhoneValue] = useState("");
  const [phoneValid, setPhoneValid] = useState<boolean | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  
  // Email validation state
  const [emailValue, setEmailValue] = useState("");
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  
  // ZIP validation state
  const [zipValue, setZipValue] = useState("");
  const [zipValid, setZipValid] = useState<boolean | null>(null);
  const [zipLoading, setZipLoading] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);
  
  // File Upload State
  const [files, setFiles] = useState<File[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  // Email validation timeout
  const [emailValidationTimeout, setEmailValidationTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Scroll to top on mount
    window.scrollTo(0, 0);
  }, []);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneValue(value);
    
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) {
      setPhoneValid(null);
      setPhoneError(null);
      return;
    }
    
    try {
      const phoneNumber = parsePhoneNumberFromString(value, 'US');
      
      if (phoneNumber && phoneNumber.isValid()) {
        const nationalNumber = phoneNumber.nationalNumber;
        const areaCode = nationalNumber.substring(0, 3);
        
        const tollFreeAreaCodes = ['800', '888', '877', '866', '855', '844', '833', '822'];
        if (tollFreeAreaCodes.includes(areaCode)) {
          setPhoneValid(false);
          setPhoneError("Invalid phone number.");
          return;
        }
        
        if (areaCode === '555') {
          setPhoneValid(false);
          setPhoneError("Invalid phone number.");
          return;
        }
        
        const validAreaCodes = [
          '201', '202', '203', '205', '206', '207', '208', '209', '210', '212', '213', '214', '215', '216', '217', '218', '219', '220', '223', '224', '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254', '256', '260', '262', '267', '269', '270', '272', '274', '276', '279', '281', '283', '301', '302', '303', '304', '305', '307', '308', '309', '310', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '323', '325', '327', '330', '331', '332', '334', '336', '337', '339', '341', '346', '347', '350', '351', '352', '360', '361', '364', '380', '385', '386', '401', '402', '404', '405', '406', '407', '408', '409', '410', '412', '413', '414', '415', '417', '419', '423', '424', '425', '430', '432', '434', '435', '440', '442', '443', '445', '447', '458', '463', '464', '469', '470', '475', '478', '479', '480', '484', '501', '502', '503', '504', '505', '507', '508', '509', '510', '512', '513', '515', '516', '517', '518', '520', '521', '522', '523', '524', '525', '526', '527', '528', '529', '530', '531', '534', '539', '540', '541', '551', '557', '559', '561', '562', '563', '564', '567', '570', '571', '572', '573', '574', '575', '577', '579', '580', '582', '585', '586', '588', '601', '602', '603', '605', '606', '607', '608', '609', '610', '612', '614', '615', '616', '617', '618', '619', '620', '623', '626', '628', '629', '630', '631', '636', '640', '641', '646', '650', '651', '656', '657', '659', '660', '661', '662', '667', '669', '670', '671', '672', '678', '679', '680', '681', '682', '684', '689', '701', '702', '703', '704', '706', '707', '708', '710', '712', '713', '714', '715', '716', '717', '718', '719', '720', '721', '724', '725', '726', '727', '731', '732', '734', '737', '740', '743', '747', '754', '757', '760', '762', '763', '765', '769', '770', '772', '773', '774', '775', '779', '781', '785', '786', '787', '801', '802', '803', '804', '805', '806', '808', '810', '812', '813', '814', '815', '816', '817', '818', '820', '826', '828', '830', '831', '832', '835', '838', '843', '845', '847', '848', '850', '854', '856', '857', '858', '859', '860', '862', '863', '864', '865', '870', '872', '873', '878', '901', '903', '904', '906', '907', '908', '909', '910', '912', '913', '914', '915', '916', '917', '918', '919', '920', '925', '928', '929', '930', '931', '934', '936', '937', '938', '940', '941', '947', '949', '951', '952', '954', '956', '959', '970', '971', '972', '973', '975', '978', '979', '980', '984', '985', '986', '989'
        ];
        
        if (!validAreaCodes.includes(areaCode)) {
          setPhoneValid(false);
          setPhoneError("Invalid phone number.");
          return;
        }
        
        const formatted = phoneNumber.formatNational();
        setPhoneValue(formatted);
        setPhoneValid(true);
        setPhoneError(null);
      } else {
        setPhoneValid(false);
        setPhoneError("Invalid phone number.");
      }
    } catch {
      setPhoneValid(false);
      setPhoneError("Invalid phone number.");
    }
  };
  
  const validateEmail = (email: string): boolean => {
    const validation = validateEmailClient(email);
    if (!validation.valid) {
      setEmailValid(false);
      setEmailError(validation.error || "Invalid email address.");
      return false;
    }
    
    setEmailValid(true);
    setEmailError(null);
    return true;
  };
  
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmailValue(value);
    
    if (emailValidationTimeout) {
      clearTimeout(emailValidationTimeout);
    }
    
    const timeout = setTimeout(() => {
      validateEmail(value);
    }, 500);
    
    setEmailValidationTimeout(timeout);
  };

  const validateZipCode = async (zip: string): Promise<boolean> => {
    // Client-side static validation (fast & secure)
    const validation = validateColoradoZipClient(zip);
    if (!validation.valid) {
        setZipError(validation.error || "Invalid ZIP code.");
        return false;
    }
    setZipError(null);
    return true;
  };

  const handleZipChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setZipValue(value);
    
    const cleanZip = value.replace(/\D/g, '');
    if (cleanZip.length === 5) {
      const isValid = await validateZipCode(value);
      setZipValid(isValid);
    } else {
      setZipValid(null);
      setZipError(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFileError(null);
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      const validFiles: File[] = [];
      let currentTotalSize = files.reduce((acc, file) => acc + file.size, 0);
      const MAX_TOTAL_SIZE = 1024 * 1024 * 1024; // 1GB

      const ALLOWED_IMAGE_EXTENSIONS = ['jpg', 'jpeg', 'heic', 'heif'];
      const ALLOWED_VIDEO_EXTENSIONS = ['mp4', 'mov'];
      const ALLOWED_IMAGE_MIMES = ['image/jpeg', 'image/heic', 'image/heif'];
      const ALLOWED_VIDEO_MIMES = ['video/mp4', 'video/quicktime'];

      for (const file of selectedFiles) {
        const ext = file.name.split('.').pop()?.toLowerCase() || '';
        const mime = file.type.toLowerCase();
        
        const isImage = ALLOWED_IMAGE_EXTENSIONS.includes(ext) && ALLOWED_IMAGE_MIMES.includes(mime);
        const isVideo = ALLOWED_VIDEO_EXTENSIONS.includes(ext) && ALLOWED_VIDEO_MIMES.includes(mime);
        
        if (!isImage && !isVideo) {
          const allowedFormats = 'JPG, JPEG, HEIC, HEIF (fotos) ou MP4, MOV (vídeos)';
          setFileError(`Formato não suportado: .${ext}. Use ${allowedFormats}.`);
          continue;
        }
        
        if (isImage && file.size > 25 * 1024 * 1024) {
          setFileError(`Imagem ${file.name} muito grande (máx 25MB).`);
          continue;
        }
        
        if (isVideo && file.size > 1024 * 1024 * 1024) {
          setFileError(`Vídeo ${file.name} muito grande (máx 1GB).`);
          continue;
        }

        if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
          setFileError(`Tamanho total dos arquivos não pode exceder 1GB.`);
          continue;
        }

        currentTotalSize += file.size;
        validFiles.push(file);
      }

      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const address_line1 = formData.get("address_line1") as string;
    const city = formData.get("city") as string;
    const zip = formData.get("zip") as string;
    const state = formData.get("state") as string;

    let validationError = "";
    
    // Name validation
    if (!name.trim() || name.trim().length < 2) {
      validationError = "Please enter your full name (at least 2 characters).";
    }
    
    // Email validation
    if (!validationError && emailValid === false) {
      validationError = emailError || "Valid email address required.";
    } else if (!validationError && emailValid === null) {
      if (!validateEmail(email)) {
        validationError = emailError || "Valid email address required.";
      }
    }
    
    // Phone validation
    if (!validationError && phoneValid === false) {
      validationError = phoneError || "Valid US phone number required.";
    } else if (!validationError && phoneValid === null) {
      const phoneNumber = parsePhoneNumberFromString(phone, 'US');
      if (!phoneNumber || !phoneNumber.isValid()) {
        validationError = "Invalid phone number.";
      } else {
        const nationalNumber = phoneNumber.nationalNumber;
        const areaCode = nationalNumber.substring(0, 3);
        
        const tollFreeAreaCodes = ['800', '888', '877', '866', '855', '844', '833', '822'];
        if (tollFreeAreaCodes.includes(areaCode)) {
          validationError = "Invalid phone number.";
        }
        
        if (areaCode === '555') {
          validationError = "Invalid phone number.";
        }
        
        const validAreaCodes = [
          '201', '202', '203', '205', '206', '207', '208', '209', '210', '212', '213', '214', '215', '216', '217', '218', '219', '220', '223', '224', '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254', '256', '260', '262', '267', '269', '270', '272', '274', '276', '279', '281', '283', '301', '302', '303', '304', '305', '307', '308', '309', '310', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '323', '325', '327', '330', '331', '332', '334', '336', '337', '339', '341', '346', '347', '350', '351', '352', '360', '361', '364', '380', '385', '386', '401', '402', '404', '405', '406', '407', '408', '409', '410', '412', '413', '414', '415', '417', '419', '423', '424', '425', '430', '432', '434', '435', '440', '442', '443', '445', '447', '458', '463', '464', '469', '470', '475', '478', '479', '480', '484', '501', '502', '503', '504', '505', '507', '508', '509', '510', '512', '513', '515', '516', '517', '518', '520', '521', '522', '523', '524', '525', '526', '527', '528', '529', '530', '531', '534', '539', '540', '541', '551', '557', '559', '561', '562', '563', '564', '567', '570', '571', '572', '573', '574', '575', '577', '579', '580', '582', '585', '586', '588', '601', '602', '603', '605', '606', '607', '608', '609', '610', '612', '614', '615', '616', '617', '618', '619', '620', '623', '626', '628', '629', '630', '631', '636', '640', '641', '646', '650', '651', '656', '657', '659', '660', '661', '662', '667', '669', '670', '671', '672', '678', '679', '680', '681', '682', '684', '689', '701', '702', '703', '704', '706', '707', '708', '710', '712', '713', '714', '715', '716', '717', '718', '719', '720', '721', '724', '725', '726', '727', '731', '732', '734', '737', '740', '743', '747', '754', '757', '760', '762', '763', '765', '769', '770', '772', '773', '774', '775', '779', '781', '785', '786', '787', '801', '802', '803', '804', '805', '806', '808', '810', '812', '813', '814', '815', '816', '817', '818', '820', '826', '828', '830', '831', '832', '835', '838', '843', '845', '847', '848', '850', '854', '856', '857', '858', '859', '860', '862', '863', '864', '865', '870', '872', '873', '878', '901', '903', '904', '906', '907', '908', '909', '910', '912', '913', '914', '915', '916', '917', '918', '919', '920', '925', '928', '929', '930', '931', '934', '936', '937', '938', '940', '941', '947', '949', '951', '952', '954', '956', '959', '970', '971', '972', '973', '975', '978', '979', '980', '984', '985', '986', '989'
        ];
        
        if (!validAreaCodes.includes(areaCode)) {
          validationError = "Invalid phone number.";
        }
      }
    }
    
    // Address validation
    if (!validationError) {
      const address = address_line1.trim();
      const addrValidation = validateAddressFormatClient(address);
      if (!addrValidation.valid) {
        validationError = addrValidation.error || "Invalid address.";
      }
    }
    
    // City validation
    if (!validationError) {
      const cityName = city.trim();
      const cityValidation = validateColoradoCityClient(cityName);
      if (!cityValidation.valid) {
        validationError = cityValidation.error || "Invalid city.";
      }
    }
    
    // City validation
    if (!validationError) {
      const cityName = city.trim();
      if (!cityName || cityName.length < 2) {
        validationError = "Please enter a valid city name.";
      } else if (!/^[a-zA-Z\s\-']+$/.test(cityName)) {
        validationError = "City name can only contain letters, spaces, hyphens, and apostrophes.";
      } else if (/test|example|fake|dummy/i.test(cityName)) {
        validationError = "Invalid city.";
      }
    }
    
    // ZIP validation
    if (!validationError && zipValid === false) {
      validationError = zipError || "Invalid ZIP code.";
    } else if (!validationError && zipValid === null) {
      const isValid = await validateZipCode(zip);
      if (!isValid) {
        validationError = zipError || "Invalid ZIP code.";
      }
    }
    
    // State validation
    if (!validationError && state !== "CO") {
      validationError = "Invalid location.";
    }
    
    if (validationError) {
      setError(validationError);
      setIsSubmitting(false);
      return;
    }

    // Create new FormData with validated files
    const newFormData = new FormData();
    for (const [key, value] of formData.entries()) {
      if (key !== 'photos') {
        newFormData.append(key, value);
      }
    }
    files.forEach(file => newFormData.append('photos', file));

    // Capture UTM parameters from URL
    const utm_source = searchParams.get('utm_source') || 'direct';
    const utm_medium = searchParams.get('utm_medium') || (searchParams.get('utm_source') ? null : 'organic');
    const utm_campaign = searchParams.get('utm_campaign');
    const utm_term = searchParams.get('utm_term');
    const utm_content = searchParams.get('utm_content');

    newFormData.append('utm_source', utm_source);
    if (utm_medium) newFormData.append('utm_medium', utm_medium);
    if (utm_campaign) newFormData.append('utm_campaign', utm_campaign);
    if (utm_term) newFormData.append('utm_term', utm_term);
    if (utm_content) newFormData.append('utm_content', utm_content);

    const formElement = e.currentTarget;

    // Send via API endpoint for media processing (streaming upload)
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        body: newFormData,
        // Não setar Content-Type - o browser define automaticamente com boundary
      });

      const result = await response.json();
      console.log("Capture lead result:", result);
      setIsSubmitting(false);

      if (result.success) {
        setIsSuccess(true);
        // Reset TOTAL do formulário
        setFiles([]);
        setPhoneValue("");
        setEmailValue("");
        setZipValue("");
        setPhoneValid(null);
        setEmailValid(null);
        setZipValid(null);
        formElement.reset(); // Limpa inputs não controlados

        setTimeout(() => {
          setIsSuccess(false);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }, 5000);
      } else {
        setError(result.error || "Error sending. Try again.");
      }
    } catch (fetchError) {
      console.error("Fetch error:", fetchError);
      setIsSubmitting(false);
      setError("Network error. Please check your connection and try again.");
    }
  }

  return (
    <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
      <div className="p-6 md:p-8 pb-10 md:pb-8">
        {isSuccess ? (
          <div className="text-center py-16 animate-fade-up">
             <div className="w-20 h-20 bg-accent-accessible/10 text-accent-accessible rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Quote Requested</h3>
            <p className="text-slate-500 font-medium mb-4">Our team will contact you within 24 hours.</p>
            <p className="text-sm text-slate-400">You&apos;ll receive a confirmation email shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="mb-8">
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Get a Project Quote</h2>
              <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest italic">Complete this form for a free estimate</p>
            </div>

            {error && (
              <div className="p-4 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100">
                {error}
              </div>
            )}

            <div data-version="mobile-layout-2.0" className="hidden" />

            {/* Hidden Tracking Inputs (Backup if server needs them directly) */}
            <input type="hidden" name="utm_source" value={searchParams.get('utm_source') || ''} />
            <input type="hidden" name="utm_campaign" value={searchParams.get('utm_campaign') || ''} />

            {/* Contact Information */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1 md:col-span-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Full Name</label>
                  <input 
                    name="name" 
                    required 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm" 
                    placeholder="Your Name" 
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Phone</label>
                  <div className="relative">
                    <input 
                      name="phone" 
                      required 
                      type="tel" 
                      value={phoneValue}
                      onChange={handlePhoneChange}
                      className={`w-full px-4 py-3 rounded-xl bg-slate-50 border ${phoneValid === true ? 'border-green-500' : phoneValid === false ? 'border-red-500' : 'border-slate-100'} focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm`} 
                      placeholder="(000) 000-0000" 
                    />
                    {phoneValid === true && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                         <CheckCircle className="text-accent-accessible" size={16} />
                      </div>
                    )}
                    {phoneValid === false && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <X className="text-red-500" size={16} />
                      </div>
                    )}
                  </div>
                  {phoneError && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{phoneError}</p>}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Email</label>
                <div className="relative">
                  <input 
                    name="email" 
                    required 
                    type="email" 
                    value={emailValue}
                    onChange={handleEmailChange}
                    className={`w-full px-4 py-3 rounded-xl bg-slate-50 border ${emailValid === true ? 'border-green-500' : emailValid === false ? 'border-red-500' : 'border-slate-100'} focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm`} 
                    placeholder="email@domain.com" 
                  />
                  {emailValid === true && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                       <CheckCircle className="text-accent-accessible" size={16} />
                    </div>
                  )}
                  {emailValid === false && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <X className="text-red-500" size={16} />
                    </div>
                  )}
                </div>
                {emailError && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{emailError}</p>}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Street Address</label>
                  <input 
                    name="address_line1" 
                    required 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm" 
                    placeholder="Your Address" 
                  />
              </div>

              <div className="grid grid-cols-12 md:grid-cols-6 gap-2 md:gap-4">
                <div className="space-y-1 col-span-7 md:col-span-3">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">City</label>
                  <input 
                    name="city" 
                    required 
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm" 
                    placeholder="Denver" 
                  />
                </div>
                
                <div className="space-y-1 col-span-3 md:col-span-2">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">ZIP</label>
                  <div className="relative">
                    <input 
                      name="zip" 
                      required 
                      value={zipValue}
                      onChange={handleZipChange}
                      className={`w-full px-2 md:px-3 py-3 rounded-xl bg-slate-50 border ${zipValid === true ? 'border-green-500' : zipValid === false ? 'border-red-500' : 'border-slate-100'} focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm text-center md:text-left`} 
                      placeholder="00000" 
                    />
                    {zipLoading && (
                      <div className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="animate-spin text-slate-400" size={14} />
                      </div>
                    )}
                    {zipValid === true && !zipLoading && (
                      <div className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2">
                         <CheckCircle className="text-accent-accessible" size={14} />
                      </div>
                    )}
                    {zipValid === false && !zipLoading && (
                      <div className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2">
                        <X className="text-red-500" size={14} />
                      </div>
                    )}
                  </div>
                  {zipError && <p className="text-[10px] font-bold text-red-500 ml-1 mt-1">{zipError}</p>}
                </div>
                
                <div className="space-y-1 col-span-2 md:col-span-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">State</label>
                  <div className="w-full px-1 py-3 rounded-xl bg-slate-100 border border-slate-200 font-bold text-slate-700 text-sm flex items-center justify-center">
                    CO
                  </div>
                  <input type="hidden" name="state" value="CO" />
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="space-y-4 pt-6 border-t border-slate-200">
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter">Project Details</h3>
              
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Service Required *</label>
                <select 
                  name="service" 
                  required 
                  defaultValue=""
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm appearance-none cursor-pointer"
                >
                  <option value="" disabled>-- Select a service --</option>
                  {SERVICES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Project Description (Optional)</label>
                <textarea 
                  name="description" 
                  rows={3} 
                  className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm resize-none" 
                  placeholder="Please describe your project in detail..." 
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Timeframe *</label>
                  <select 
                    name="timeframe" 
                    required 
                    defaultValue=""
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled>-- Select timeframe --</option>
                    {TIMEFRAME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Budget *</label>
                  <select 
                    name="budget" 
                    required 
                    defaultValue=""
                    className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm appearance-none cursor-pointer"
                  >
                    <option value="" disabled>-- Select budget --</option>
                    {BUDGET_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Project Photos (Optional)</label>
                
                <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-accent transition-colors bg-slate-50 group cursor-pointer">
                  <input 
                    type="file" 
                    name="photos" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                    multiple 
                    accept=".jpg,.jpeg,.heic,.heif,.mp4,.mov,image/jpeg,image/heic,image/heif,video/mp4,video/quicktime"
                    onChange={handleFileChange}
                  />
                  <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                    <div className="p-3 bg-white rounded-full shadow-sm">
                      <UploadCloud className="text-accent" size={24} />
                    </div>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                      Click to upload photos/video<br/>
                      <span className="text-[8px] font-bold text-slate-300 normal-case">JPG, HEIC (fotos) • MP4, MOV (vídeos) • Max 1GB</span>
                    </span>
                  </div>
                </div>

                {fileError && <p className="text-[10px] font-bold text-red-500 ml-1">{fileError}</p>}

                {files.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    {files.map((file, idx) => (
                      <div key={idx} className="relative bg-slate-100 rounded-lg p-2 flex items-center justify-center aspect-square border border-slate-200">
                        <span className="text-[8px] font-bold text-slate-500 break-all text-center line-clamp-2">{file.name}</span>
                        <button 
                          type="button"
                          onClick={() => removeFile(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm hover:bg-red-600 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-accent text-white font-black py-4 md:py-5 rounded-2xl flex items-center justify-center gap-3 hover:bg-green-600 transition-all text-xs uppercase tracking-[0.2em] shadow-xl shadow-accent/20 disabled:opacity-50 mt-4 active:scale-[0.98]"
            >
              {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <>Get Free Estimate <ChevronRight size={18} /></>}
            </button>

            <div className="flex items-center justify-center gap-4 pt-4 opacity-30 grayscale">
              <Shield size={16} />
              <AlertCircle size={16} />
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function RequestServicePage() {
  return (
    <main className="min-h-dvh w-full relative">
      <Navbar onGetQuote={() => window.scrollTo({ top: document.getElementById('request-form')?.offsetTop || 0, behavior: 'smooth' })} />
      
      {/* Hero Section */}
      <section className="bg-gradient-to-b from-green-50 to-white pt-24 pb-16 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center"
          >
            <h1 className="text-4xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">
              Request a <span className="text-accent">Service Quote</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-8">
              Get a free, no-obligation estimate for your landscaping project. Our Colorado-certified team will contact you within 24 hours.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Clock size={24} />
                </div>
                <h3 className="font-black text-slate-900 mb-2 uppercase tracking-tighter text-sm">24-Hour Response</h3>
                <p className="text-slate-500 text-sm">We&apos;ll get back to you within one business day.</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4 mx-auto">
                  <DollarSign size={24} />
                </div>
                <h3 className="font-black text-slate-900 mb-2 uppercase tracking-tighter text-sm">Free Estimate</h3>
                <p className="text-slate-500 text-sm">No cost, no obligation—just professional pricing.</p>
              </div>
              
              <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                <div className="w-12 h-12 bg-accent/10 text-accent rounded-full flex items-center justify-center mb-4 mx-auto">
                  <Shield size={24} />
                </div>
                <h3 className="font-black text-slate-900 mb-2 uppercase tracking-tighter text-sm">Colorado Licensed</h3>
                <p className="text-slate-500 text-sm">Fully insured and certified for Colorado projects.</p>
              </div>
            </div>

            {/* Mobile Scroll Indicator */}
            <motion.button
              onClick={() => document.getElementById('request-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="md:hidden inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-full font-bold text-sm uppercase tracking-wider shadow-lg hover:bg-green-600 transition-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              Get Your Free Estimate
              <ChevronDown size={20} className="animate-bounce" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Form Section */}
      <section id="request-form" className="py-16 px-4 md:px-8 bg-slate-50 pb-64 md:pb-16 min-h-screen">
        <div className="max-w-4xl mx-auto">
          <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-accent" size={32} /></div>}>
            <RequestFormContent />
          </Suspense>
          
          {/* Additional Info */}
          <div className="mt-12 text-center text-slate-500 text-sm">
            <p>Questions? Call us at <strong>(720) 737-4607</strong> or email <strong>contact@socialbluepro.com</strong></p>
            <p className="mt-2">Our office hours are Monday-Friday, 8am-5pm MST.</p>
          </div>
        </div>
      </section>

      <Footer onGetQuote={() => window.scrollTo({ top: document.getElementById('request-form')?.offsetTop || 0, behavior: 'smooth' })} />
    </main>
  );
}