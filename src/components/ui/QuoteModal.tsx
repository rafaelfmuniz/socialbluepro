"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, Loader2, CheckCircle, Shield, ChevronRight, AlertCircle, UploadCloud } from "lucide-react";
import { captureLeadWithAttachments } from "@/actions/leads";
import { getRecaptchaConfig, RecaptchaConfig } from "@/actions/settings";
import { parsePhoneNumberFromString } from 'libphonenumber-js';
import ReCAPTCHA from "react-google-recaptcha";
import { Turnstile } from "@marsidev/react-turnstile";
import HCaptcha from "@hcaptcha/react-hcaptcha";
import { useToast } from "@/lib/toast";
import { 
  validateAddressFormatClient, 
  validateColoradoCityClient, 
  validateColoradoZipClient,
  validateEmailClient 
} from "@/lib/client-validation";

interface QuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialService?: string;
}

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

export default function QuoteModal({ isOpen, onClose, initialService }: QuoteModalProps) {
  const { addToast } = useToast();
  const searchParams = useSearchParams();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  
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
  
  // reCAPTCHA State
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null);
  const [recaptchaError, setRecaptchaError] = useState<string | null>(null);
  const [captchaConfig, setCaptchaConfig] = useState<RecaptchaConfig | null>(null);

  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    if (isOpen) {
      document.body.style.overflow = "hidden";
      // Fetch captcha config
      getRecaptchaConfig().then(config => {
        setCaptchaConfig(config);
      });
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhoneValue(value);
    
    // Clean digits for validation
    const digits = value.replace(/\D/g, '');
    
    if (digits.length === 0) {
      setPhoneValid(null);
      setPhoneError(null);
      return;
    }
    
    try {
      // Parse phone number with US country code
      const phoneNumber = parsePhoneNumberFromString(value, 'US');
      
      if (phoneNumber && phoneNumber.isValid()) {
        // Additional strict validation
        const nationalNumber = phoneNumber.nationalNumber;
        const areaCode = nationalNumber.substring(0, 3);
        
        // Reject toll-free and premium rate numbers
        const tollFreeAreaCodes = ['800', '888', '877', '866', '855', '844', '833', '822'];
        if (tollFreeAreaCodes.includes(areaCode)) {
          setPhoneValid(false);
          setPhoneError("Invalid phone number.");
          return;
        }
        
        // Reject test numbers (555 area code)
        if (areaCode === '555') {
          setPhoneValid(false);
          setPhoneError("Invalid phone number.");
          return;
        }
        
        // Reject invalid area codes (not exhaustive but covers major US area codes)
        const validAreaCodes = [
          '201', '202', '203', '205', '206', '207', '208', '209', '210', '212', '213', '214', '215', '216', '217', '218', '219', '220', '223', '224', '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254', '256', '260', '262', '267', '269', '270', '272', '274', '276', '279', '281', '283', '301', '302', '303', '304', '305', '307', '308', '309', '310', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '323', '325', '327', '330', '331', '332', '334', '336', '337', '339', '341', '346', '347', '350', '351', '352', '360', '361', '364', '380', '385', '386', '401', '402', '404', '405', '406', '407', '408', '409', '410', '412', '413', '414', '415', '417', '419', '423', '424', '425', '430', '432', '434', '435', '440', '442', '443', '445', '447', '458', '463', '464', '469', '470', '475', '478', '479', '480', '484', '501', '502', '503', '504', '505', '507', '508', '509', '510', '512', '513', '515', '516', '517', '518', '520', '521', '522', '523', '524', '525', '526', '527', '528', '529', '530', '531', '534', '539', '540', '541', '551', '557', '559', '561', '562', '563', '564', '567', '570', '571', '572', '573', '574', '575', '577', '579', '580', '582', '585', '586', '588', '601', '602', '603', '605', '606', '607', '608', '609', '610', '612', '614', '615', '616', '617', '618', '619', '620', '623', '626', '628', '629', '630', '631', '636', '640', '641', '646', '650', '651', '656', '657', '659', '660', '661', '662', '667', '669', '670', '671', '672', '678', '679', '680', '681', '682', '684', '689', '701', '702', '703', '704', '706', '707', '708', '710', '712', '713', '714', '715', '716', '717', '718', '719', '720', '721', '724', '725', '726', '727', '731', '732', '734', '737', '740', '743', '747', '754', '757', '760', '762', '763', '765', '769', '770', '772', '773', '774', '775', '779', '781', '785', '786', '787', '801', '802', '803', '804', '805', '806', '808', '810', '812', '813', '814', '815', '816', '817', '818', '820', '826', '828', '830', '831', '832', '835', '838', '839', '840', '843', '845', '847', '848', '850', '854', '856', '857', '858', '859', '860', '862', '863', '864', '865', '870', '872', '878', '901', '903', '904', '906', '907', '908', '909', '910', '912', '913', '914', '915', '916', '917', '918', '919', '920', '925', '927', '928', '929', '930', '931', '934', '936', '937', '938', '939', '940', '941', '943', '945', '947', '948', '949', '951', '952', '954', '956', '959', '970', '971', '972', '973', '975', '978', '979', '980', '983', '984', '985', '986', '989'
        ];
        
        if (!validAreaCodes.includes(areaCode)) {
          setPhoneValid(false);
          setPhoneError("Invalid phone number.");
          return;
        }
        
        // Format the number nicely
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
    
    // Debounce validation for better UX
    if (emailValidationTimeout) {
      clearTimeout(emailValidationTimeout);
    }
    
    const timeout = setTimeout(() => {
      validateEmail(value);
    }, 500);
    
    setEmailValidationTimeout(timeout);
  };

  const validateZipCode = async (zip: string): Promise<boolean> => {
    // Client-side static validation first (fast & secure)
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
    
    // Only validate if we have 5 digits
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
      
      for (const file of selectedFiles) {
        // Validate type (image/video only)
        if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
          setFileError("Only images and videos are allowed.");
          continue;
        }
        
        // Validate size (25MB images, 500MB videos)
        if (file.type.startsWith("image/")) {
          if (file.size > 25 * 1024 * 1024) {
            setFileError(`Image ${file.name} is too large (max 25MB).`);
            continue;
          }
        } else if (file.type.startsWith("video/")) {
          if (file.size > 500 * 1024 * 1024) {
            setFileError(`Video ${file.name} is too large (max 500MB).`);
            continue;
          }
        }

        // Check total size limit
        if (currentTotalSize + file.size > MAX_TOTAL_SIZE) {
          setFileError(`Total file size cannot exceed 1GB.`);
          continue;
        }

        currentTotalSize += file.size;
        validFiles.push(file);
      }
 
      setFiles(prev => [...prev, ...validFiles]);
    }
  };

  const handleRecaptchaChange = (token: string | null) => {
    setRecaptchaToken(token);
    if (token) {
      setRecaptchaError(null);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setIsSubmitting(true);
    setRecaptchaError(null);
 
    // Validate reCAPTCHA
    if (captchaConfig?.is_enabled && !recaptchaToken) {
      setRecaptchaError("Please complete the security check.");
      setIsSubmitting(false);
      return;
    }

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
    
    // Email validation (use client-side validation state)
    if (!validationError && emailValid === false) {
      validationError = emailError || "Valid email address required.";
    } else if (!validationError && emailValid === null) {
      // Validate email if not validated yet
      if (!validateEmail(email)) {
        validationError = emailError || "Valid email address required.";
      }
    }
    
    // Phone validation (use client-side validation state)
    if (!validationError && phoneValid === false) {
      validationError = phoneError || "Valid US phone number required.";
    } else if (!validationError && phoneValid === null) {
      // Validate phone if not validated yet
      const phoneNumber = parsePhoneNumberFromString(phone, 'US');
      if (!phoneNumber || !phoneNumber.isValid()) {
        validationError = "Invalid phone number.";
      } else {
        // Additional strict validation
        const nationalNumber = phoneNumber.nationalNumber;
        const areaCode = nationalNumber.substring(0, 3);
        
        // Reject toll-free and premium rate numbers
        const tollFreeAreaCodes = ['800', '888', '877', '866', '855', '844', '833', '822'];
        if (tollFreeAreaCodes.includes(areaCode)) {
          validationError = "Invalid phone number.";
        }
        
        // Reject test numbers (555 area code)
        if (areaCode === '555') {
          validationError = "Invalid phone number.";
        }
        
        // Reject invalid area codes (not exhaustive but covers major US area codes)
        const validAreaCodes = [
          '201', '202', '203', '205', '206', '207', '208', '209', '210', '212', '213', '214', '215', '216', '217', '218', '219', '220', '223', '224', '225', '228', '229', '231', '234', '239', '240', '248', '251', '252', '253', '254', '256', '260', '262', '267', '269', '270', '272', '274', '276', '279', '281', '283', '301', '302', '303', '304', '305', '307', '308', '309', '310', '312', '313', '314', '315', '316', '317', '318', '319', '320', '321', '323', '325', '327', '330', '331', '332', '334', '336', '337', '339', '341', '346', '347', '350', '351', '352', '360', '361', '364', '380', '385', '386', '401', '402', '404', '405', '406', '407', '408', '409', '410', '412', '413', '414', '415', '417', '419', '423', '424', '425', '430', '432', '434', '435', '440', '442', '443', '445', '447', '458', '463', '464', '469', '470', '475', '478', '479', '480', '484', '501', '502', '503', '504', '505', '507', '508', '509', '510', '512', '513', '515', '516', '517', '518', '520', '521', '522', '523', '524', '525', '526', '527', '528', '529', '530', '531', '534', '539', '540', '541', '551', '557', '559', '561', '562', '563', '564', '567', '570', '571', '572', '573', '574', '575', '577', '579', '580', '582', '585', '586', '588', '601', '602', '603', '605', '606', '607', '608', '609', '610', '612', '614', '615', '616', '617', '618', '619', '620', '623', '626', '628', '629', '630', '631', '636', '640', '641', '646', '650', '651', '656', '657', '659', '660', '661', '662', '667', '669', '670', '671', '672', '678', '679', '680', '681', '682', '684', '689', '701', '702', '703', '704', '706', '707', '708', '710', '712', '713', '714', '715', '716', '717', '718', '719', '720', '721', '724', '725', '726', '727', '731', '732', '734', '737', '740', '743', '747', '754', '757', '760', '762', '763', '765', '769', '770', '772', '773', '774', '775', '779', '781', '785', '786', '787', '801', '802', '803', '804', '805', '806', '808', '810', '812', '813', '814', '815', '816', '817', '818', '820', '826', '828', '830', '831', '832', '835', '838', '839', '840', '843', '845', '847', '848', '850', '854', '856', '857', '858', '859', '860', '862', '863', '864', '865', '870', '872', '878', '901', '903', '904', '906', '907', '908', '909', '910', '912', '913', '914', '915', '916', '917', '918', '919', '920', '925', '927', '928', '929', '930', '931', '934', '936', '937', '938', '939', '940', '941', '943', '945', '947', '948', '949', '951', '952', '954', '956', '959', '970', '971', '972', '973', '975', '978', '979', '980', '983', '984', '985', '986', '989'
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
    
    // ZIP validation (use client-side validation state)
    if (!validationError && zipValid === false) {
      validationError = zipError || "Valid Colorado ZIP code required.";
    } else if (!validationError && zipValid === null) {
      // ZIP not validated yet, validate now
      const isValid = await validateZipCode(zip);
      if (!isValid) {
        validationError = zipError || "Valid Colorado ZIP code required.";
      }
    }
    
    // State validation (should always be CO)
    if (!validationError && state !== "CO") {
      validationError = "Invalid location.";
    }
    
    if (validationError) {
      addToast(validationError, "error");
      setIsSubmitting(false);
      return;
    }

    // Create new FormData with validated files
    const newFormData = new FormData();
    // Copy all fields except 'photos'
    for (const [key, value] of formData.entries()) {
      if (key !== 'photos') {
        newFormData.append(key, value);
      }
    }
    // Append validated files from state (already filtered by size/type)
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

    const result = await captureLeadWithAttachments(newFormData);
    console.log("Capture lead result:", result);
    setIsSubmitting(false);

    if (result.success) {
      addToast("Quote request submitted successfully! We'll contact you within 24 hours.", "success");
      setIsSuccess(true);
      setTimeout(() => {
        onClose();
        setIsSuccess(false);
        setFiles([]);
      }, 2000);
    } else {
      addToast(result.error || "Error sending. Try again.", "error");
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-start justify-center pt-6 md:items-center p-2 md:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/90 backdrop-blur-sm"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden max-h-[95vh] flex flex-col"
          >
            <button
              onClick={onClose}
              className="absolute top-3 right-3 p-2 bg-slate-100 rounded-full text-slate-500 hover:text-slate-900 z-50 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="overflow-y-auto flex-1 p-5 md:p-8 pb-32 md:pb-8">
              {isSuccess ? (
                <div className="text-center py-16 animate-fade-up">
                   <div className="w-20 h-20 bg-accent-accessible/10 text-accent-accessible rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle size={40} />
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter">Quote Requested</h3>
                  <p className="text-slate-500 font-medium">Our team will contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="mb-6">
                     <h2 className="text-2xl md:text-3xl font-black text-slate-900 uppercase tracking-tighter">Get a Project Quote</h2>
                     <p className="text-slate-400 text-xs font-bold mt-1 uppercase tracking-widest italic">One-Time Premium Services</p>
                   </div>

                  <div className="space-y-4">
                    {/* Row 1: Full Name ----- Phone */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1 md:col-span-2">
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Full Name</label>
                        <input name="name" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm" placeholder="Your Name" />
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

                    {/* Row 2: Email */}
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

                    {/* Row 3: Address */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Street Address</label>
                        <input name="address_line1" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm" placeholder="Your Address" />
                    </div>

                    {/* Row 4: City Zip ----- Code ------ State */}
                    <div className="grid grid-cols-12 md:grid-cols-6 gap-2 md:gap-4">
                      <div className="space-y-1 col-span-7 md:col-span-3">
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-1">City</label>
                        <input name="city" required className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm" placeholder="Denver" />
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

                    {/* Row 5: Service Required */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Service Required</label>
                      <select name="service" required defaultValue={initialService || ""} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm appearance-none cursor-pointer">
                        <option value="" disabled>Select a service</option>
                        {SERVICES_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    </div>

                    {/* Row 6: Project Description (Optional) */}
                    <div className="space-y-1">
                      <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Project Description (Optional)</label>
                      <textarea name="description" rows={3} className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm resize-none" placeholder="Please describe your project in detail..."></textarea>
                    </div>

                    {/* Row 7: Timeframe ------ Budget */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Timeframe *</label>
                        <select name="timeframe" required defaultValue="" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm appearance-none cursor-pointer">
                          <option value="" disabled>-- Select timeframe --</option>
                          {TIMEFRAME_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Budget *</label>
                        <select name="budget" required defaultValue="" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-100 focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all font-bold text-slate-900 text-sm appearance-none cursor-pointer">
                          <option value="" disabled>-- Select budget --</option>
                          {BUDGET_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Row 8: Project Photos (Optional) */}
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-slate-400 ml-1">Project Photos (Optional)</label>
                      
                      <div className="relative border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center hover:border-accent transition-colors bg-slate-50 group cursor-pointer">
                        <input 
                          type="file" 
                          name="photos" 
                          className="absolute inset-0 opacity-0 cursor-pointer z-10" 
                          multiple 
                          accept="image/*,video/*"
                          onChange={handleFileChange}
                        />
                        <div className="flex flex-col items-center gap-2 group-hover:scale-105 transition-transform">
                          <div className="p-3 bg-white rounded-full shadow-sm">
                            <UploadCloud className="text-accent" size={24} />
                          </div>
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                            Click to upload photos/video<br/>
                            <span className="text-[8px] font-bold text-slate-300 normal-case">Max 25MB (Images) / 500MB (Videos) • Max 1GB Total</span>
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

                   {/* reCAPTCHA */}
                   {/* reCAPTCHA Dynamic Rendering */}
                   {captchaConfig?.is_enabled && (
                    <div className="mb-4 min-h-[78px]">
                      {(!captchaConfig.provider || captchaConfig.provider === 'google_v2') && (
                         <ReCAPTCHA
                           sitekey={captchaConfig.site_key || process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || "6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_M"}
                           onChange={handleRecaptchaChange}
                           onErrored={() => setRecaptchaError("Security check failed to load.")}
                         />
                      )}
                      
                      {captchaConfig.provider === 'google_v3' && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500 italic flex items-center gap-2">
                            <Shield size={14} className="text-accent-accessible" /> Protected by Google reCAPTCHA
                           <ReCAPTCHA
                             sitekey={captchaConfig.site_key}
                             size="invisible"
                             onChange={handleRecaptchaChange}
                           />
                        </div>
                      )}

                      {captchaConfig.provider === 'cloudflare_turnstile' && (
                         <Turnstile 
                           siteKey={captchaConfig.site_key} 
                           onSuccess={handleRecaptchaChange}
                           onError={() => setRecaptchaError("Security check failed.")}
                           className="cf-turnstile"
                         />
                      )}

                      {captchaConfig.provider === 'hcaptcha' && (
                         <HCaptcha 
                           sitekey={captchaConfig.site_key} 
                           onVerify={handleRecaptchaChange} 
                           onError={() => setRecaptchaError("Security check failed.")}
                         />
                      )}
                      
                      {recaptchaError && (
                        <p className="text-[10px] font-bold text-red-500 mt-2">{recaptchaError}</p>
                      )}
                    </div>
                   )}
 
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
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
